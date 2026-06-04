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
Analisis seluruh tugas saya tersebut dan berikan tanggapan terstruktur dalam format HTML murni. Tanggapan Anda HARUS terdiri dari dua bagian utama:

1. Rencana Eksekusi Prioritas (Action Plan) dibungkus dalam div dengan class "ai-action-plan". 
Di dalamnya harus ada:
   - Judul: "<h3>📋 Rencana Eksekusi Prioritas</h3>"
   - Penjelasan singkat pembuka.
   - Daftar langkah kerja menggunakan container dengan class "ai-steps". Setiap langkah diwakili oleh div dengan class "ai-step-card". Di dalam "ai-step-card", buat:
     - Nomor langkah: <div class="step-num">Langkah X</div> (X adalah angka urut 1, 2, dst)
     - Isi langkah: <div class="step-content"><strong>[Nama Tugas]</strong> (Deadline: [Tanggal])<span>[Penjelasan singkat alasan kenapa harus dikerjakan dalam urutan ini dan apa yang perlu dilakukan pertama kali]</span></div>
Urutkan langkah berdasarkan kepentingan: prioritaskan tugas dengan Skala Prioritas Tinggi (High) yang memiliki deadline terdekat, atau tugas yang menjadi prasyarat/kritis untuk operasional.

2. Detail Analisis Tugas dibungkus dalam div dengan class "ai-table-container".
Di dalamnya harus ada:
   - Judul: "<h3>📊 Detail Analisis Tugas</h3>"
   - Sebuah tabel HTML murni (<table>...</table>) yang merangkum semua tugas. Tabel harus memiliki th dan td dengan kolom berikut:
     - Nama Tugas
     - Resume / Analisis (Beri ringkasan pekerjaan berdasarkan catatan & subtasks)
     - Skala Prioritas AI (Beri label warna menggunakan span: <span style="color:#ef4444; font-weight:600;">High</span>, <span style="color:#eab308; font-weight:600;">Med</span>, atau <span style="color:#3b82f6; font-weight:600;">Low</span>)
     - Alasan Prioritas (Jelaskan secara logis kenapa Anda memberi prioritas tersebut)

Aturan ketat:
- Hasil HARUS murni HTML. JANGAN sertakan markdown backticks (\`\`\`html) atau teks tambahan apa pun di luar tag HTML pembungkus utama.
- JANGAN sertakan inline style CSS untuk background putih atau teks hitam pada table, tr, th, dan td agar tabel otomatis menyatu dengan dark mode halaman kami.
`;

    try {
        // Auto-discover models
        const modelsRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const modelsData = await modelsRes.json();
        
        if (!modelsRes.ok) {
            throw new Error('Gagal meload daftar model AI: ' + (modelsData.error?.message || 'Unknown error'));
        }

        // Find a model that supports generateContent (prefer gemini-1.5-flash or gemini-1.0-pro)
        const availableModels = modelsData.models || [];
        let selectedModel = availableModels.find(m => m.name.includes('gemini-1.5-flash') && m.supportedGenerationMethods.includes('generateContent'));
        
        if (!selectedModel) {
            selectedModel = availableModels.find(m => m.name.includes('gemini-1.0-pro') && m.supportedGenerationMethods.includes('generateContent'));
        }
        if (!selectedModel) {
            selectedModel = availableModels.find(m => m.name.includes('gemini') && m.supportedGenerationMethods.includes('generateContent'));
        }

        if (!selectedModel) {
            throw new Error('Tidak ada model Gemini yang mendukung generateContent untuk API Key ini.');
        }

        const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/${selectedModel.name}:generateContent?key=${API_KEY}`;

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
