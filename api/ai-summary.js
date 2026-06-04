export default async function handler(req, res) {
    // CORS Header
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-pin-auth');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Verify PIN (Optional, but good for security)
    const SECRET_PIN = '1321';
    const pin = req.headers['x-pin-auth'];
    if (pin !== SECRET_PIN) {
        return res.status(401).json({ error: 'Unauthorized. PIN tidak valid.' });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { tasks } = req.body;
    if (!tasks || !Array.isArray(tasks)) {
        return res.status(400).json({ error: 'Tasks data is required' });
    }

    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY tidak ditemukan di environment variables.' });
    }
    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    // Buat rangkuman string dari tasks untuk dikirim ke AI
    const tasksDataString = tasks.map(t => {
        let subtasksText = '';
        if (t.subtasks && t.subtasks.length > 0) {
            subtasksText = 'Subtasks: ' + t.subtasks.map(st => `[${st.is_done ? 'x' : ' '}] ${st.text}`).join(', ');
        }
        return `ID: ${t.id} | Judul: ${t.title} | Status Saat Ini: ${t.status} | Target: ${t.target_date} | Catatan: ${t.summary || '-'} | ${subtasksText}`;
    }).join('\n');

    const promptText = `
Anda adalah AI Project Manager. Berikut adalah daftar tugas yang sedang saya kerjakan:

${tasksDataString}

Tugas Anda:
Buatkan sebuah tabel HTML murni yang merangkum semua tugas ini. 
Tabel harus memiliki header (th) dan isi (td) dengan kolom berikut:
1. Nama Tugas
2. Resume / Analisis (Beri ringkasan pekerjaan berdasarkan catatan & subtasks)
3. Skala Prioritas AI (Beri label warna menggunakan span: <span style="color:red">High</span>, <span style="color:orange">Med</span>, atau <span style="color:green">Low</span>)
4. Alasan Prioritas (Jelaskan secara logis kenapa Anda memberi prioritas tersebut)

Aturan ketat:
- Hasil HARUS murni HTML <table>...</table>.
- JANGAN sertakan markdown backticks (\`\`\`html) atau teks tambahan apa pun selain tag HTML.
- Gunakan style CSS inline sederhana pada table jika perlu (seperti border-collapse: collapse; width: 100%; color: white; text-align: left;), dan tambahkan border 1px solid #333 pada th dan td beserta padding 8px.
`;

    try {
        const aiResponse = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: promptText }]
                }],
                generationConfig: {
                    temperature: 0.2, // Low temperature for consistent formatting
                }
            })
        });

        const aiData = await aiResponse.json();

        if (!aiResponse.ok) {
            throw new Error(aiData.error?.message || 'Gagal menghubungi Gemini API');
        }

        let htmlTable = aiData.candidates[0].content.parts[0].text;
        
        // Bersihkan markdown backticks jika AI masih ngeyel
        htmlTable = htmlTable.replace(/```html/g, '').replace(/```/g, '').trim();

        return res.status(200).json({ html: htmlTable });

    } catch (error) {
        console.error('AI Summary Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
