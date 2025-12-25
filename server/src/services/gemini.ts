import { GoogleGenAI } from '@google/genai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env.js';

// New Google GenAI client (for Nano Banana image generation)
const genAI = new GoogleGenAI({ apiKey: config.google.apiKey });

// Legacy Gemini client (for text generation with JSON mode)
const legacyGenAI = new GoogleGenerativeAI(config.google.apiKey);
const textModel = legacyGenAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: { responseMimeType: 'application/json' }
});

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateImage = async (prompt: string, context?: string, retries = 3): Promise<Buffer> => {
    try {
        const fullPrompt = context ? `${context}\n\n${prompt}` : prompt;

        // Use Nano Banana (Gemini 2.5 Flash Image) for image generation
        const response = await genAI.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: fullPrompt,
            config: {
                responseModalities: ['IMAGE', 'TEXT'],
            },
        });

        // Extract image from response - check multiple possible locations
        const candidates = response.candidates;
        if (candidates && candidates.length > 0) {
            const parts = candidates[0].content?.parts;
            if (parts) {
                for (const part of parts) {
                    // Check for inlineData (base64 image)
                    if (part.inlineData?.data) {
                        console.log('Found image in inlineData, mimeType:', part.inlineData.mimeType);
                        return Buffer.from(part.inlineData.data, 'base64');
                    }
                    // Check for image property directly
                    if ((part as any).image?.imageBytes) {
                        console.log('Found image in part.image');
                        return Buffer.from((part as any).image.imageBytes, 'base64');
                    }
                }
            }
        }

        // Check for generatedImages (Imagen-style response)
        if ((response as any).generatedImages) {
            const images = (response as any).generatedImages;
            if (images.length > 0 && images[0].image?.imageBytes) {
                console.log('Found image in generatedImages');
                return Buffer.from(images[0].image.imageBytes, 'base64');
            }
        }

        throw new Error('No image data found in Nano Banana response. Check console for response structure.');
    } catch (error: any) {
        if ((error.status === 429 || error.status === 503) && retries > 0) {
            console.warn(`Nano Banana ${error.status} hit. Retrying in 5s... (${retries} retries left)`);
            await sleep(5000);
            return generateImage(prompt, context, retries - 1);
        }
        console.error('Nano Banana Image Generation Error:', error);
        throw error;
    }
};

export const generateText = async (prompt: string): Promise<any> => {
    try {
        const result = await textModel.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log('Gemini raw text response:', text);
        return JSON.parse(text);
    } catch (error) {
        console.error('Gemini Text Generation Error:', error);
        throw error;
    }
};
