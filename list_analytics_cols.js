import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function diagnostic() {
    console.log('--- Extension Analytics Columns ---')
    const { data, error } = await supabase
        .from('extension_analytics')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error:', error.message);
    } else if (data.length > 0) {
        const columns = Object.keys(data[0]);
        console.log('Total columns:', columns.length);
        console.log('\nColumn names:');
        columns.forEach((col, idx) => {
            console.log(`${idx + 1}. ${col}`);
        });
    }
}

diagnostic()
