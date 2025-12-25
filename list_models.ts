import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const apiKey = process.env.GOOGLE_API_KEY || '';

async function listGeminiModels() {
    try {
        let url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        let allModels: any[] = [];

        while (url) {
            const response = await fetch(url);
            const data: any = await response.json();
            if (data.models) {
                allModels = allModels.concat(data.models);
            }
            if (data.nextPageToken) {
                url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageToken=${data.nextPageToken}`;
            } else {
                url = '';
            }
        }

        const geminiModels = allModels.filter(m => m.name.includes('gemini'));
        console.log('Available Gemini Models:');
        geminiModels.forEach(m => console.log(`- ${m.name} (${m.supportedGenerationMethods.join(', ')})`));

        const imagenModels = allModels.filter(m => m.name.includes('imagen'));
        console.log('\nAvailable Imagen Models:');
        imagenModels.forEach(m => console.log(`- ${m.name} (${m.supportedGenerationMethods.join(', ')})`));

    } catch (error: any) {
        console.error('Error:', error.message);
    }
}

listGeminiModels();
