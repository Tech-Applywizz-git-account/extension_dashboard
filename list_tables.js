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
    console.log('--- Supabase Table List ---')

    // This might not work with anon key depending on permissions, 
    // but many supabase setups allow querying this for diagnostic info
    const { data, error } = await supabase.rpc('get_tables'); // Custom RPC if exists

    if (error) {
        console.log('RPC get_tables failed, trying direct queries on likely names...')
        const tables = ['user_profiles', 'profiles', 'users', 'extension_analytics', 'learned_patterns', 'analytics'];
        for (const t of tables) {
            const { count, error: te } = await supabase.from(t).select('*', { count: 'exact', head: true });
            if (!te) console.log(`Table '${t}': ${count} records`);
            else console.log(`Table '${t}': Error/Forbidden (${te.message})`);
        }
    } else {
        console.log('Tables:', data);
    }
}

diagnostic()
