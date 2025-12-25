/**
 * Replicate AI Service
 * Uses the firtoz/trellis model for Image-to-3D generation
 * https://replicate.com/firtoz/trellis
 */

import Replicate from 'replicate';
import { supabase } from './supabase.js';
import { config } from '../config/env.js';

// Initialize Replicate client
const replicate = new Replicate({
    auth: config.replicate.apiToken,
});

// Model configuration - using the full version identifier
const TRELLIS_MODEL = 'firtoz/trellis:e8f6c45206993f297372f5436b90350817bd9b4a0d52d2a76df50c1c8afa2b3c' as const;

export interface Generate3DResult {
    modelUrl: string;
    taskId: string;
}

/**
 * Generate a 3D GLB model from a 2D image using Replicate's Trellis model
 * 
 * @param imageUrl - Publicly accessible URL to the source image
 * @param taskId - Task ID for naming the output file
 * @returns Permanent Supabase URL to the GLB model
 */
export const generate3DAsset = async (imageUrl: string, taskId: string): Promise<string> => {
    console.log(`[Replicate] Starting Trellis generation for task: ${taskId}`);
    console.log(`[Replicate] Input image: ${imageUrl}`);

    if (!config.replicate.apiToken) {
        throw new Error('REPLICATE_API_TOKEN is not configured');
    }

    // Step 1: Run the Trellis Model
    console.log('[Replicate] Calling firtoz/trellis model...');

    const output = await replicate.run(
        TRELLIS_MODEL,
        {
            input: {
                images: [imageUrl],  // NOTE: Trellis expects 'images' as an array
                generate_model: true,
                generate_color: true,
                generate_normal: true,
                texture_size: 1024,
                mesh_simplify: 0.95,
                ss_sampling_steps: 12,
                slat_sampling_steps: 12,
                ss_guidance_strength: 7.5,
                slat_guidance_strength: 3,
                randomize_seed: true
            }
        }
    );

    // Log the output structure for debugging
    console.log('[Replicate] Raw output:', JSON.stringify(output, null, 2));

    // Extract the GLB URL from output
    // Trellis returns an object with model_file, color_video, normal_video
    let tempGlbUrl: string;

    if (typeof output === 'string') {
        tempGlbUrl = output;
    } else if (Array.isArray(output) && output.length > 0) {
        // Sometimes models return an array of URLs
        tempGlbUrl = String(output[0]);
    } else if (output && typeof output === 'object') {
        // Trellis typically returns: { model_file: "url", color_video: "url", normal_video: "url" }
        const outputObj = output as Record<string, unknown>;
        tempGlbUrl = String(outputObj.model_file || outputObj.glb || outputObj.model || outputObj.output || '');
        if (!tempGlbUrl || tempGlbUrl === 'undefined') {
            // If model_file not found, try to find any URL in the output
            const keys = Object.keys(outputObj);
            for (const key of keys) {
                const val = String(outputObj[key]);
                if (val.includes('.glb') || val.includes('replicate.delivery')) {
                    tempGlbUrl = val;
                    break;
                }
            }
        }
    } else {
        throw new Error(`Unexpected Replicate output format: ${typeof output}`);
    }

    if (!tempGlbUrl || tempGlbUrl === 'undefined' || tempGlbUrl === '[object Object]') {
        console.error('[Replicate] Could not extract GLB URL from output:', output);
        throw new Error('Could not extract GLB URL from Trellis output');
    }

    console.log(`[Replicate] Temporary GLB URL: ${tempGlbUrl}`);

    // Step 2: Download the generated GLB file
    console.log('[Replicate] Downloading GLB file...');

    const response = await fetch(tempGlbUrl);
    if (!response.ok) {
        throw new Error(`Failed to download GLB from Replicate: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log(`[Replicate] Downloaded ${buffer.length} bytes`);

    // Step 3: Upload to Supabase Storage (Persistent)
    const filePath = `models/${taskId}.glb`;
    console.log(`[Replicate] Uploading to Supabase: ${filePath}`);

    const { error: uploadError } = await supabase.storage
        .from('sgh-assets')
        .upload(filePath, buffer, {
            contentType: 'model/gltf-binary',
            upsert: true // Overwrite if exists
        });

    if (uploadError) {
        console.error('[Replicate] Upload error:', uploadError);
        throw new Error(`Failed to upload GLB to Supabase: ${uploadError.message}`);
    }

    // Step 4: Get the permanent public URL
    const { data: publicUrlData } = supabase.storage
        .from('sgh-assets')
        .getPublicUrl(filePath);

    const permanentUrl = publicUrlData.publicUrl;
    console.log(`[Replicate] ✅ 3D Model ready: ${permanentUrl}`);

    return permanentUrl;
};

export default {
    generate3DAsset
};
