import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
}

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Simple Authentication Check (Authorization: Bearer 1321)
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== 'Bearer 1321') {
        return res.status(401).json({ error: 'Unauthorized. Access code required.' });
    }

    // Check if Supabase client is initialized
    if (!supabase) {
        return res.status(503).json({ 
            error: 'Supabase configuration missing on server', 
            useLocalStorage: true 
        });
    }

    const { id } = req.query;

    try {
        if (req.method === 'GET') {
            const { data, error } = await supabase
                .from('job_applications')
                .select('*')
                .order('id', { ascending: true });

            if (error) throw error;
            return res.status(200).json(data || []);
        }

        if (req.method === 'POST') {
            const { 
                company_name, web_link, linkedin_link, jobstreet_link, 
                glints_link, indeed_link, deall_link, kalibrr_link, 
                techinasia_link, glassdoor_link, location, 
                applied_date, person_linkedin, notes, status, openings 
            } = req.body;

            if (!company_name) {
                return res.status(400).json({ error: 'Company name is required.' });
            }

            const { data, error } = await supabase
                .from('job_applications')
                .insert({ 
                    company_name, web_link, linkedin_link, jobstreet_link, 
                    glints_link, indeed_link, deall_link, kalibrr_link, 
                    techinasia_link, glassdoor_link, location, 
                    applied_date: applied_date || new Date().toISOString().split('T')[0], 
                    person_linkedin, notes, status: status || 'Applied', 
                    openings: openings || []
                })
                .select()
                .single();

            if (error) throw error;
            return res.status(201).json(data);
        }

        if (req.method === 'PUT') {
            if (!id) return res.status(400).json({ error: 'Application ID is required for update.' });

            const { 
                company_name, web_link, linkedin_link, jobstreet_link, 
                glints_link, indeed_link, deall_link, kalibrr_link, 
                techinasia_link, glassdoor_link, location, 
                applied_date, person_linkedin, notes, status, openings 
            } = req.body;

            const { data, error } = await supabase
                .from('job_applications')
                .update({ 
                    company_name, web_link, linkedin_link, jobstreet_link, 
                    glints_link, indeed_link, deall_link, kalibrr_link, 
                    techinasia_link, glassdoor_link, location, 
                    applied_date, person_linkedin, notes, status, openings 
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return res.status(200).json(data);
        }

        if (req.method === 'DELETE') {
            if (!id) return res.status(400).json({ error: 'Application ID is required for deletion.' });

            const { error } = await supabase
                .from('job_applications')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return res.status(200).json({ success: true, message: 'Application deleted successfully.' });
        }

        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });

    } catch (error) {
        console.error('API Applications Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
