import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const SECRET_PIN = '1321'; // PIN hardcoded untuk verifikasi API

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    // CORS Header
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-pin-auth');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // VERIFIKASI PIN
    const pin = req.headers['x-pin-auth'];
    if (pin !== SECRET_PIN) {
        return res.status(401).json({ error: 'Unauthorized. PIN tidak valid.' });
    }

    try {
        if (req.method === 'GET') {
            const { data, error } = await supabase
                .from('ardyan_tasks')
                .select('*')
                .order('target_date', { ascending: true });

            if (error) throw error;
            return res.status(200).json(data);
        }

        if (req.method === 'POST') {
            const { title, target_date, priority, status, summary, subtasks } = req.body;
            const { data, error } = await supabase
                .from('ardyan_tasks')
                .insert([{ title, target_date, priority, status, summary, subtasks }])
                .select()
                .single();

            if (error) throw error;
            return res.status(201).json(data);
        }

        if (req.method === 'PUT') {
            const { id, title, target_date, priority, status, summary, subtasks } = req.body;
            if (!id) return res.status(400).json({ error: 'ID is required' });

            const { data, error } = await supabase
                .from('ardyan_tasks')
                .update({ title, target_date, priority, status, summary, subtasks })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return res.status(200).json(data);
        }

        if (req.method === 'DELETE') {
            const { id } = req.query;
            if (!id) return res.status(400).json({ error: 'ID is required' });

            const { data, error } = await supabase
                .from('ardyan_tasks')
                .delete()
                .eq('id', id)
                .select();

            if (error) throw error;
            return res.status(200).json(data);
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('API Tasks Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
