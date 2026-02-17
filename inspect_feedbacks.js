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
    console.log('--- Feedbacks Table Inspection ---')
    const { data, error, count } = await supabase
        .from('feedbacks')
        .select('*', { count: 'exact' })
        .limit(1);

    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('Total count:', count);
        if (data.length > 0) {
            console.log('Columns:', Object.keys(data[0]));
            console.log('Sample:', JSON.stringify(data[0], null, 2));
        }
    }
}

diagnostic()
