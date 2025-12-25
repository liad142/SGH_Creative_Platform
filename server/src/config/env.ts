import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root if needed, or server root. 
// Assuming .env is in server root for now as per standard, or I should check if user has a root .env.
// Architecture says "Enforce Environment Variables in .env". Usually in monorepo, it's at root or per package.
// For now, I'll assume server/.env or root .env.
dotenv.config({ path: path.join(process.cwd(), '../.env') });

export const config = {
    port: process.env.PORT || 3000,
    supabase: {
        url: process.env.SUPABASE_URL || '',
        serviceKey: process.env.SERVICE_ROLE_KEY || '',
    },
    google: {
        apiKey: process.env.GOOGLE_API_KEY || '',
    },
    replicate: {
        apiToken: process.env.REPLICATE_API_TOKEN || '',
    },
};

// Validate config
if (!config.supabase.url || !config.supabase.serviceKey) {
    console.warn('Missing Supabase credentials in .env');
}
if (!config.google.apiKey) {
    console.warn('Missing Google API Key in .env');
}
if (!config.replicate.apiToken) {
    console.warn('Missing Replicate API Token in .env');
}
