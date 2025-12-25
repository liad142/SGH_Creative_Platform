import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const apiKey = process.env.GOOGLE_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

async function testImageGenModel() {
    const modelName = 'gemini-2.0-flash-exp-image-generation';
    console.log(`Checking ${modelName}...`);
    try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('ping');
        console.log(`✅ ${modelName} is working.`);
    } catch (e: any) {
        console.log(`❌ ${modelName}: ${e.message}`);
    }
}

testImageGenModel();
