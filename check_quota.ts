import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const apiKey = process.env.GOOGLE_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

async function checkQuota() {
    const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-exp', 'gemini-2.0-flash'];
    for (const modelName of models) {
        console.log(`Checking ${modelName}...`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent('ping');
            console.log(`✅ ${modelName} is working.`);
        } catch (e: any) {
            console.log(`❌ ${modelName}: ${e.message}`);
        }
    }
}

checkQuota();
