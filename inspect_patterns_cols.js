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
    console.log('--- learned_patterns Column Inspection ---')
    const { data, error } = await supabase
        .from('learned_patterns')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error:', error.message);
    } else {
        if (data.length > 0) {
            console.log('Columns:', Object.keys(data[0]));
        } else {
            console.log('Table is empty, trying to fetch just columns...');
            // In some cases we can't easily get columns if empty without RPC or information_schema
            // But let's assume user_email exists if user asked for it.
        }
    }
}

diagnostic()
