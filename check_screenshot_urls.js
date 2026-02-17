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
    console.log('--- Feedback Screenshot URL Format ---')
    const { data, error } = await supabase
        .from('feedbacks')
        .select('id, email, screenshot_url')
        .not('screenshot_url', 'is', null)
        .limit(3);

    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('Found', data.length, 'feedbacks with screenshots');
        data.forEach((feedback, idx) => {
            console.log(`\n${idx + 1}. Email: ${feedback.email}`);
            console.log(`   Screenshot URL: ${feedback.screenshot_url}`);
        });

        // Test generating public URL
        if (data.length > 0 && data[0].screenshot_url) {
            const publicUrl = supabase.storage.from('feedback_screenshots').getPublicUrl(data[0].screenshot_url);
            console.log('\n--- Testing Public URL Generation ---');
            console.log('Input:', data[0].screenshot_url);
            console.log('Generated URL:', publicUrl.data.publicUrl);
        }
    }
}

diagnostic()
