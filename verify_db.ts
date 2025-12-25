import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
    const tables = ['seasons', 'season_chapters', 'chapter_tasks', 'seasons_registry', 'chapters_config', 'assets_queue'];
    console.log('Checking tables in Supabase...');

    for (const table of tables) {
        const { error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(`❌ Table '${table}': ${error.message} (Code: ${error.code})`);
        } else {
            console.log(`✅ Table '${table}': Exists`);
        }
    }
}

checkTables();
