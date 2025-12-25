import { Request, Response } from 'express';
import { generateImage } from '../services/gemini.js';
import { supabase } from '../services/supabase.js';
import crypto from 'crypto';

export const generateAsset = async (req: Request, res: Response) => {

    const { prompt, context } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    try {
        // 1. Generate Image
        const imageBuffer = await generateImage(prompt, context);

        // 2. Upload to Supabase Storage
        const filename = `${crypto.randomUUID()}.png`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('sgh-generated')
            .upload(filename, imageBuffer, {
                contentType: 'image/png',
                upsert: false
            });

        if (uploadError) {
            throw new Error(`Upload failed: ${uploadError.message}`);
        }

        // 3. Get Public URL (or private signed url if bucket is private)
        // User said "sgh-generated (private)".
        // So I should probably store the path or generated signed URL?
        // Usually for permanent access I might need a signed URL or just the path if the frontend generates signed urls.
        // I'll store the path/key.
        // However, if I need a URL to display:
        // "Updates the assets_queue table with the new URL".
        // A private bucket doesn't have a public URL. 
        // I can generate a signed URL with a long expiry, or just store the path and let frontend request a signed URL.
        // But "Updates ... with the new URL" implies a full URL.
        // I will generate a signed URL for now (e.g. 1 hour) or store the path.
        // I'll assume Signed URL is what's needed or just the internal path.
        // Let's generate a signed URL for immediate use.

        // Actually, if it's "sgh-generated", maybe I storing the storage path is better.
        // But to satisfy "new URL", I'll create a signed URL.
        const { data: signedUrlData } = await supabase.storage
            .from('sgh-generated')
            .createSignedUrl(filename, 60 * 60 * 24 * 365); // 1 year? Or just short term.

        const assetUrl = signedUrlData?.signedUrl || uploadData.path;

        // 4. Update assets_queue
        const { error: dbError } = await supabase
            .from('assets_queue')
            .insert({
                prompt,
                context,
                status: 'completed',
                url: assetUrl,
                storage_path: uploadData.path,
                created_at: new Date().toISOString()
            });

        if (dbError) {
            throw new Error(`Database insert failed: ${dbError.message}`);
        }

        res.status(200).json({ success: true, url: assetUrl });

    } catch (error: any) {
        console.error('Asset Generation Error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
};
