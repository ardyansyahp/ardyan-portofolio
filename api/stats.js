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
            // Kita fetch dulu nilai saat ini (atau gunakan null jika data kosong)
            const { data: current, error: fetchErr } = await supabase
                .from('site_stats')
                .select('views, likes')
                .eq('id', 1)
                .maybeSingle();

            if (fetchErr) throw fetchErr;

            let views = 0;
            let likes = 0;
            let exists = false;

            if (current) {
                views = current.views;
                likes = current.likes;
                exists = true;
            }

            if (action === 'view') {
                views += 1;
            } else if (action === 'like') {
                likes += 1;
            } else {
                return res.status(400).json({ error: 'Invalid action' });
            }

            let result;
            if (!exists) {
                // Inisialisasi row pertama kali
                const { data: inserted, error: insertErr } = await supabase
                    .from('site_stats')
                    .insert({ id: 1, views, likes })
                    .select('views, likes')
                    .single();
                if (insertErr) throw insertErr;
                result = inserted;
            } else {
                // Update row yang sudah ada
                const { data: updated, error: updateErr } = await supabase
                    .from('site_stats')
                    .update({ views, likes })
                    .eq('id', 1)
                    .select('views, likes')
                    .single();
                if (updateErr) throw updateErr;
                result = updated;
            }

            return res.status(200).json(result);
        }

        // Kalau request GET biasa (hanya mengambil data)
        let { data, error } = await supabase
            .from('site_stats')
            .select('views, likes')
            .eq('id', 1)
            .maybeSingle();

        if (error) throw error;

        if (!data) {
            // Jika row belum ada, kita inisialisasi dengan 0 views dan 0 likes
            const { data: inserted, error: insertErr } = await supabase
                .from('site_stats')
                .insert({ id: 1, views: 0, likes: 0 })
                .select('views, likes')
                .single();
            
            // Jika terjadi error (misalnya terhambat RLS), return data default virtual
            if (insertErr) {
                console.warn('Gagal insert default row (mungkin RLS aktif):', insertErr.message);
                return res.status(200).json({ views: 0, likes: 0 });
            }
            data = inserted;
        }

        return res.status(200).json(data);

    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
