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
    console.log('--- profile_data Content Inspection ---')
    const { data, error } = await supabase
        .from('user_profiles')
        .select('profile_data, email')
        .limit(5);

    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log(`Found ${data.length} records:`);
        data.forEach((r, i) => {
            console.log(`\nRecord ${i + 1}:`);
            console.log(`Email: ${r.email}`);
            console.log(`Profile Data:`, JSON.stringify(r.profile_data, null, 2));
        });
    }
}

diagnostic()
