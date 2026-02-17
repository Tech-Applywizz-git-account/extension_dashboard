import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Manually parse .env
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function diagnostic() {
    console.log('--- Supabase Diagnostic ---')
    console.log('URL:', supabaseUrl)

    // 1. Check user_profiles
    console.log('\nChecking user_profiles table...')
    const { data, error, count } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact' })

    if (error) {
        console.error('Error fetching user_profiles:', error.message)
        console.error('Code:', error.code)
    } else {
        console.log('Success!')
        console.log('Total count:', count)
        console.log('Sample Data (first 2):', JSON.stringify(data.slice(0, 2), null, 2))

        if (data.length > 0) {
            console.log('\nAnalyzing columns in first row:')
            console.log(Object.keys(data[0]))
        }
    }

    // 2. Check other tables
    console.log('\nChecking extension_analytics table...')
    const { count: aCount, error: aError } = await supabase
        .from('extension_analytics')
        .select('*', { count: 'exact', head: true })

    if (aError) {
        console.error('Error fetching extension_analytics:', aError.message)
    } else {
        console.log('extension_analytics count:', aCount)
    }
}

diagnostic()
