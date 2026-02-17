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
    const { data } = await supabase
        .from('feedbacks')
        .select('screenshot_url')
        .not('screenshot_url', 'is', null)
        .limit(1);

    if (data && data[0]) {
        console.log(JSON.stringify(data[0], null, 2));
    }
}

diagnostic()
