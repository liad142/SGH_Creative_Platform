import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
    console.warn('Missing Google credentials');
}

export const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
