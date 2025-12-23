import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const apiKey = process.env.GOOGLE_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

async function testGemini() {
    console.log('Testing gemini-flash-latest...');
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
        const result = await model.generateContent('Say hello');
        console.log(`✅ Text: ${result.response.text()}`);
    } catch (e: any) {
        console.log(`❌ Text: ${e.message}`);
    }

    console.log('Testing image generation if supported...');
    try {
        // Many newer Gemini models support image generation via the same generateContent call if prompted
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const result = await model.generateContent('Generate a small icon of a red apple');
        // If it returns image data, it should be in candidates
        const response = await result.response;
        console.log(`✅ Image Response status: ${response.candidates?.[0]?.finishReason}`);
    } catch (e: any) {
        console.log(`❌ Image: ${e.message}`);
    }
}

testGemini();
