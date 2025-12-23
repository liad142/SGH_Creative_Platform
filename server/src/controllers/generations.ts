import { Request, Response } from 'express';
import { genAI } from '../config/gemini.js';
import { supabase } from '../config/supabase.js';

export const generateImage = async (req: Request, res: Response) => {
    try {
        const { prompt } = req.body;
        // Implementation delegated to Backend Agent
        res.json({ message: 'Generation started', prompt });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
