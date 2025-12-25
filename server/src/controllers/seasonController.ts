import { Request, Response } from 'express';
import { supabase } from '../services/supabase.js';
import { generateImage, generateText } from '../services/gemini.js';
import { generate3DAsset } from '../services/replicate.js';
import sharp from 'sharp';
import crypto from 'crypto';

export const listSeasons = async (req: Request, res: Response) => {
    try {
        const { data, error } = await supabase
            .from('seasons')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error: any) {
        console.error('List Seasons Error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};

export const initSeason = async (req: Request, res: Response) => {
    const { theme } = req.body;

    if (!theme) {
        return res.status(400).json({ error: 'Theme is required' });
    }

    try {
        // 1. Parallel Generation: Text Brainstorm + Map Image
        const systemPrompt = `
        ROLE: Senior Level Designer for "Solitaire Grand Harvest".
        GOAL: Create a content plan for a 12-Chapter Season based on theme: "${theme}".
        RULES:
        - Output JSON only.
        - JSON Schema: { "chapters": [ { "title": string, "tasks": string[] } ] }
        - Exactly 12 Chapters.
        - Each Chapter must have exactly 6 'tasks'.
        - Tasks must be physical, buildable game assets (Structures, Props, Nature).
        - Style: Cute, inviting, farm-logic.
        - Example Task Names: "Crystal Barn", "Rocket Mailbox", "Alien Cactus".
        `;

        const mapPrompt = `Generate a high-quality, top-down isometric game map for a casual mobile game. Theme: '${theme}'. The map must be shaped like a large diamond (rhombus) and visually divided into 12 distinct regions. Style: 3D clay/plastocene render, glossy finish, vibrant colors. No text, no UI overlays, pure gameplay environment on a white background.`;

        // Run text and image generation in parallel
        const [brainstormRaw, mapImageBuffer] = await Promise.all([
            generateText(systemPrompt),
            generateImage(mapPrompt)
        ]);

        console.log('Brainstorm Result:', JSON.stringify(brainstormRaw, null, 2));

        let chapters = [];
        if (Array.isArray(brainstormRaw)) {
            chapters = brainstormRaw;
        } else if (brainstormRaw && Array.isArray(brainstormRaw.chapters)) {
            chapters = brainstormRaw.chapters;
        }

        if (chapters.length === 0) {
            throw new Error('Brainstorming failed to return a valid chapters array. Result was: ' + JSON.stringify(brainstormRaw));
        }

        const brainstormResult = { chapters };

        // 2. Upload Map to Storage (sgh-assets bucket)
        const mapFilename = `maps/${crypto.randomUUID()}_map.png`;
        const { error: mapUploadError } = await supabase.storage
            .from('sgh-assets')
            .upload(mapFilename, mapImageBuffer, { contentType: 'image/png' });

        if (mapUploadError) {
            console.error('Map Upload Error:', mapUploadError);
            throw new Error(`Failed to upload map: ${mapUploadError.message}`);
        }

        // Get public URL for the map
        const { data: mapUrlData } = supabase.storage.from('sgh-assets').getPublicUrl(mapFilename);
        const mapBackgroundUrl = mapUrlData.publicUrl;
        console.log('Generated Map URL:', mapBackgroundUrl);

        // 3. Insert Season with map_background_url
        const { data: season, error: seasonError } = await supabase
            .from('seasons')
            .insert({
                theme_name: theme,
                status: 'pending',
                map_background_url: mapBackgroundUrl
            })
            .select()
            .single();

        if (seasonError) throw seasonError;
        const seasonId = season.id;

        // Update map filename with actual seasonId for better organization
        // (Optional: rename file in storage or just keep the UUID-based name)

        // 4. Insert Chapters and Tasks
        for (let i = 0; i < brainstormResult.chapters.length; i++) {
            const ch = brainstormResult.chapters[i];
            const { data: chapter, error: chapterError } = await supabase
                .from('season_chapters')
                .insert({
                    season_id: seasonId,
                    chapter_index: i + 1,
                    chapter_title: ch.title
                })
                .select()
                .single();

            if (chapterError) throw chapterError;

            // Insert Tasks
            if (Array.isArray(ch.tasks)) {
                const tasksToInsert = ch.tasks.map((taskName: string) => ({
                    chapter_id: chapter.id,
                    task_name: taskName,
                    status: 'pending'
                }));

                const { error: taskError } = await supabase
                    .from('chapter_tasks')
                    .insert(tasksToInsert);

                if (taskError) console.error(`Failed to insert tasks for chapter ${ch.title}:`, taskError);
            }
        }

        res.status(201).json({
            success: true,
            seasonId: seasonId,
            mapBackgroundUrl: mapBackgroundUrl,
            chapters: brainstormResult.chapters
        });

    } catch (error: any) {
        console.error('Season Init Error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};


export const generateTaskFull = async (req: Request, res: Response) => {
    const { taskId } = req.params;

    try {
        // 1. Fetch task details with context
        const { data: task, error: taskError } = await supabase
            .from('chapter_tasks')
            .select(`
                task_name,
                chapter:season_chapters (
                    chapter_title,
                    season:seasons (
                        theme_name
                    )
                )
            `)
            .eq('id', taskId)
            .single();

        if (taskError || !task) throw new Error('Task not found');

        const taskName = task.task_name;
        const chapterTitle = (task.chapter as any).chapter_title;
        const themeName = (task.chapter as any).season.theme_name;

        // 2. Check for custom prompt from request body, otherwise construct one
        let prompt: string;

        if (req.body?.customPrompt) {
            // Use custom prompt from user
            prompt = req.body.customPrompt;
            console.log('Using custom prompt:', prompt.substring(0, 100) + '...');
        } else {
            // Construct default prompt (The Sandwich Method)
            prompt = `
            Subject: Isometric game asset of "${taskName}".
            Context: A level named "${chapterTitle}" in a "${themeName}" casual game.
            Style Constraints (CRITICAL):
            - 3D Clay Render / Plastocene texture.
            - "Chibi" proportions (chunky, rounded, cute).
            - High glossy finish, soft daylight.
            - Isometric 30-degree projection.
            - On pure white background.
            `;
        }

        // 3. AI Call (Nano Banana)
        const imageBuffer = await generateImage(prompt);

        // 4. Upload and DB Action
        const filename = `tasks/${taskId}/full_${crypto.randomUUID()}.png`;
        const { error: uploadError } = await supabase.storage.from('sgh-generated').upload(filename, imageBuffer, { contentType: 'image/png' });

        if (uploadError) {
            console.error('Upload Error:', uploadError);
            throw new Error(`Failed to upload image: ${uploadError.message}`);
        }

        // Use PUBLIC URL instead of signed URL (permanent, never expires)
        // Format: {supabase_url}/storage/v1/object/public/{bucket}/{path}
        const { data: publicUrlData } = supabase.storage.from('sgh-generated').getPublicUrl(filename);
        const fullAssetUrl = publicUrlData.publicUrl;

        console.log('Generated Public URL:', fullAssetUrl);

        // Store both the URL and the storage path (for future reference)
        const { error: updateError } = await supabase
            .from('chapter_tasks')
            .update({
                full_asset_url: fullAssetUrl,
                storage_path: filename,
                prompt_used: prompt,
                status: 'generated'
            })
            .eq('id', taskId);

        if (updateError) {
            console.error('Database Update Error:', updateError);
            throw new Error(`Failed to update task in database: ${updateError.message}`);
        }

        console.log('Successfully updated task:', taskId);
        res.status(200).json({ success: true, url: fullAssetUrl, prompt: prompt });

    } catch (error: any) {
        console.error('Generate Task Full Error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};


export const decomposeTask = async (req: Request, res: Response) => {
    const { taskId } = req.params;

    try {
        // 1. Fetch task details
        const { data: task, error: taskError } = await supabase
            .from('chapter_tasks')
            .select('task_name, full_asset_url')
            .eq('id', taskId)
            .single();

        if (taskError || !task) throw new Error('Task not found');
        if (!task.full_asset_url) throw new Error('Full asset must be generated first');

        // 2. AI Call: Generate "Knolling sprite sheet of 3 parts"
        const prompt = `Create a knolling sprite sheet of 3 isolated components that would build the object "${task.task_name}". Each component must be a solid, separate object on white background. Style matches original 3D clay aesthetic.`;

        // Pass full_asset_url as context/reference if supported by generateImage
        const imageBuffer = await generateImage(prompt, `Context Reference: ${task.full_asset_url}`);

        // 3. Sharp: Crop the result into 3 separate buffers
        const image = sharp(imageBuffer);
        const { width, height } = await image.metadata();
        const w = width || 1024;
        const h = height || 1024;
        const partWidth = Math.floor(w / 3);

        const partResults: any = {};
        for (let i = 1; i <= 3; i++) {
            const cropBuffer = await sharp(imageBuffer)
                .extract({ left: (i - 1) * partWidth, top: 0, width: partWidth, height: h })
                .toBuffer();

            const filename = `tasks/${taskId}/part_${i}_${crypto.randomUUID()}.png`;
            await supabase.storage.from('sgh-generated').upload(filename, cropBuffer, { contentType: 'image/png' });
            const { data: signedUrl } = await supabase.storage.from('sgh-generated').createSignedUrl(filename, 60 * 60 * 24 * 365);
            partResults[`part_${i}_url`] = signedUrl?.signedUrl;
        }

        // 4. DB Action
        await supabase
            .from('chapter_tasks')
            .update({
                ...partResults,
                status: 'completed'
            })
            .eq('id', taskId);

        res.status(200).json({ success: true, ...partResults });

    } catch (error: any) {
        console.error('Decompose Task Error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};


export const getChapters = async (req: Request, res: Response) => {
    try {
        let seasonId = req.query.seasonId as string;

        if (!seasonId) {
            const { data: season, error: seasonError } = await supabase
                .from('seasons')
                .select('id')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (seasonError || !season) return res.json([]);
            seasonId = season.id;
        }

        const { data: chapters, error: chapterError } = await supabase
            .from('season_chapters')
            .select('*, chapter_tasks(*)')
            .eq('season_id', seasonId)
            .order('chapter_index', { ascending: true });

        if (chapterError) throw chapterError;

        res.json(chapters.map(c => ({
            ...c,
            title: c.chapter_title,
            tasks: (c as any).chapter_tasks
        })));
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const generateSeason = async (req: Request, res: Response) => {
    res.status(501).json({ error: 'Use the new split flow endpoints.' });
};

export const updateTaskPosition = async (req: Request, res: Response) => {
    const { taskId } = req.params;
    const { grid_x, grid_y, grid_z } = req.body;

    // Validate that inputs are numbers (allowing 0)
    if (typeof grid_x !== 'number' || typeof grid_y !== 'number') {
        return res.status(400).json({ error: 'grid_x and grid_y must be numbers' });
    }

    try {
        const { data, error } = await supabase
            .from('chapter_tasks')
            .update({
                grid_x: Math.floor(grid_x),
                grid_y: Math.floor(grid_y),
                grid_z: Math.floor(grid_z || 0)
            })
            .eq('id', taskId)
            .select()
            .single();

        if (error) throw error;

        res.status(200).json({ success: true, task: data });

    } catch (error: any) {
        console.error('Update Task Position Error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};

export const make3DTask = async (req: Request, res: Response) => {
    const { taskId } = req.params;

    try {
        // 1. Fetch task with full_asset_url
        const { data: task, error: taskError } = await supabase
            .from('chapter_tasks')
            .select('full_asset_url, task_name')
            .eq('id', taskId)
            .single();

        if (taskError || !task) throw new Error('Task not found');
        if (!task.full_asset_url) throw new Error('Full asset must be generated first');

        console.log(`Starting 3D conversion for task: ${task.task_name}`);

        // 2. Call Replicate's Trellis model (handles download + upload internally)
        const modelUrl = await generate3DAsset(task.full_asset_url, taskId);

        console.log('3D Model URL:', modelUrl);

        // 3. Update DB with the permanent model URL
        const { error: updateError } = await supabase
            .from('chapter_tasks')
            .update({
                asset_model_url: modelUrl
            })
            .eq('id', taskId);

        if (updateError) throw updateError;

        res.status(200).json({
            success: true,
            modelUrl
        });

    } catch (error: any) {
        console.error('Make 3D Task Error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};
