import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBuckets() {
    console.log('Checking storage buckets...');
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
        console.log('❌ Error listing buckets:', error.message);
    } else {
        console.log('✅ Buckets:', data.map(b => b.name).join(', '));
    }
}

checkBuckets();
