import { createClient } from '@supabase/supabase-js';

// Vercel otomatis menyuntikkan env variables ini berkat integrasi tadi
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Pastikan Supabase Key ada, jika tidak, Vercel akan error
if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase Environment Variables!");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    // CORS headers agar bisa dipanggil dari frontend dengan aman
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const { action } = req.query; // Menangkap query parameter '?action='

        if (req.method === 'POST') {
            // Kita fetch dulu nilai saat ini
            const { data: current, error: fetchErr } = await supabase
                .from('site_stats')
                .select('views, likes')
                .eq('id', 1)
                .single();

            if (fetchErr) throw fetchErr;

            let updatePayload = {};

            if (action === 'view') {
                updatePayload = { views: current.views + 1 };
            } else if (action === 'like') {
                updatePayload = { likes: current.likes + 1 };
            } else {
                return res.status(400).json({ error: 'Invalid action' });
            }

            // Update ke database
            const { data: updated, error: updateErr } = await supabase
                .from('site_stats')
                .update(updatePayload)
                .eq('id', 1)
                .select()
                .single();

            if (updateErr) throw updateErr;
            return res.status(200).json(updated);
        }

        // Kalau request GET biasa (hanya mengambil data)
        const { data, error } = await supabase
            .from('site_stats')
            .select('views, likes')
            .eq('id', 1)
            .single();

        if (error) throw error;
        return res.status(200).json(data);

    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
