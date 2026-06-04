// PIN Security Logic
const CORRECT_PIN = '123456'; // Ganti dengan PIN rahasia Anda nanti
let currentPin = '';

const pinDots = document.querySelectorAll('.pin-dot');
const lockMsg = document.getElementById('lock-msg');
const lockscreen = document.getElementById('lockscreen');
const dashboard = document.getElementById('dashboard');

// Update UI Dots based on PIN length
function updatePinDots() {
    pinDots.forEach((dot, index) => {
        if (index < currentPin.length) {
            dot.classList.add('filled');
        } else {
            dot.classList.remove('filled');
            dot.classList.remove('error');
        }
    });
}

// Handle Error Animation
function showError() {
    pinDots.forEach(dot => {
        dot.classList.add('error');
    });
    lockMsg.textContent = 'PIN Salah! Coba lagi.';
    lockMsg.style.color = '#ef4444';
    
    // Shake animation
    const pinDisplay = document.getElementById('pin-display');
    pinDisplay.style.transform = 'translateX(-10px)';
    setTimeout(() => pinDisplay.style.transform = 'translateX(10px)', 50);
    setTimeout(() => pinDisplay.style.transform = 'translateX(-10px)', 100);
    setTimeout(() => pinDisplay.style.transform = 'translateX(10px)', 150);
    setTimeout(() => pinDisplay.style.transform = 'translateX(0)', 200);

    setTimeout(() => {
        currentPin = '';
        updatePinDots();
        lockMsg.textContent = 'Akses Terbatas';
        lockMsg.style.color = 'var(--text-muted)';
    }, 500);
}

// Check PIN
function checkPin() {
    if (currentPin === CORRECT_PIN) {
        // Success
        pinDots.forEach(dot => {
            dot.style.backgroundColor = '#22c55e'; // Green
            dot.style.borderColor = '#22c55e';
            dot.style.boxShadow = '0 0 10px #22c55e';
        });
        lockMsg.textContent = 'Akses Diberikan. Membuka...';
        lockMsg.style.color = '#22c55e';
        
        setTimeout(() => {
            lockscreen.style.opacity = '0';
            setTimeout(() => {
                lockscreen.style.visibility = 'hidden';
                document.body.style.overflow = 'auto'; // Enable scroll
                dashboard.style.display = 'block';
                setTimeout(() => dashboard.style.opacity = '1', 50);
                loadTasks(); // Load data after unlock
            }, 500);
        }, 600);
    } else {
        showError();
    }
}

// Input Handling (Click)
document.querySelectorAll('.key-btn[data-key]').forEach(btn => {
    btn.addEventListener('click', () => {
        if (currentPin.length < 6) {
            currentPin += btn.getAttribute('data-key');
            updatePinDots();
            if (currentPin.length === 6) {
                checkPin();
            }
        }
    });
});

document.getElementById('btn-delete').addEventListener('click', () => {
    if (currentPin.length > 0) {
        currentPin = currentPin.slice(0, -1);
        updatePinDots();
    }
});

document.getElementById('btn-cancel').addEventListener('click', () => {
    window.location.href = '/';
});

// Input Handling (Keyboard)
document.addEventListener('keydown', (e) => {
    // Only listen if lockscreen is active
    if (lockscreen.style.visibility !== 'hidden') {
        if (e.key >= '0' && e.key <= '9') {
            if (currentPin.length < 6) {
                currentPin += e.key;
                
                // Visual feedback on keypad
                const btn = document.querySelector(`.key-btn[data-key="${e.key}"]`);
                if (btn) {
                    btn.classList.add('active');
                    setTimeout(() => btn.classList.remove('active'), 100);
                }

                updatePinDots();
                if (currentPin.length === 6) {
                    checkPin();
                }
            }
        } else if (e.key === 'Backspace') {
            if (currentPin.length > 0) {
                currentPin = currentPin.slice(0, -1);
                updatePinDots();
                
                const btn = document.getElementById('btn-delete');
                btn.classList.add('active');
                setTimeout(() => btn.classList.remove('active'), 100);
            }
        }
    }
});


// ==========================================
// DASHBOARD & CRUD LOGIC
// ==========================================
let tasks = [];
const taskList = document.getElementById('task-list');
const spinner = document.getElementById('loading-spinner');

// API Configuration
const API_URL = '/api/tasks';
const getHeaders = () => ({
    'Content-Type': 'application/json',
    'x-pin-auth': currentPin // Kirim PIN ke backend untuk validasi ganda
});

async function loadTasks() {
    spinner.style.display = 'block';
    taskList.innerHTML = '';
    try {
        const res = await fetch(API_URL, { headers: getHeaders() });
        if (!res.ok) throw new Error('Gagal memuat data. PIN mungkin tidak valid di server.');
        tasks = await res.json();
        renderTasks();
    } catch (error) {
        console.error(error);
        taskList.innerHTML = `<p style="color: #ef4444; grid-column: 1/-1; text-align: center;">Error: ${error.message}</p>`;
    } finally {
        spinner.style.display = 'none';
    }
}

function renderTasks() {
    taskList.innerHTML = '';
    
    if (tasks.length === 0) {
        taskList.innerHTML = `<p style="color: var(--text-muted); grid-column: 1/-1; text-align: center; padding: 40px;">Belum ada jadwal. Klik tombol + untuk menambahkan.</p>`;
        return;
    }

    // Sort by date ascending (closest deadline first)
    tasks.sort((a, b) => new Date(a.target_date) - new Date(b.target_date));

    tasks.forEach(task => {
        // Format Date
        const dateObj = new Date(task.target_date);
        const dateStr = dateObj.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });

        const badgeClass = task.priority === 'High' ? 'high' : (task.priority === 'Med' ? 'med' : 'low');
        
        const card = document.createElement('div');
        card.className = 'task-card';
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <span class="badge ${badgeClass}">${task.priority} Priority</span>
                <div style="display:flex; gap: 8px;">
                    <button class="btn-edit" data-id="${task.id}" style="background:none; border:none; color:var(--text-muted); cursor:pointer;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button class="btn-delete" data-id="${task.id}" style="background:none; border:none; color:#ef4444; cursor:pointer;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            </div>
            <div class="task-title">${task.title}</div>
            <div class="task-date">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                ${dateStr} &bull; <span style="color: ${task.status === 'Completed' ? '#22c55e' : (task.status === 'In Progress' ? '#eab308' : 'var(--text-muted)')}">${task.status}</span>
            </div>
            ${task.summary ? `<div class="task-summary">${task.summary}</div>` : ''}
        `;
        taskList.appendChild(card);
    });

    // Attach Edit/Delete Listeners
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            openEditModal(id);
        });
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if(confirm('Yakin ingin menghapus jadwal ini?')) {
                const id = e.currentTarget.getAttribute('data-id');
                deleteTask(id);
            }
        });
    });
}

// Modal Logic
const modal = document.getElementById('task-modal');
const form = document.getElementById('task-form');
const addBtn = document.getElementById('add-task-btn');
const closeBtn = document.getElementById('close-modal-btn');

addBtn.addEventListener('click', () => {
    form.reset();
    document.getElementById('task-id').value = '';
    document.getElementById('modal-title').textContent = 'Tambah Jadwal / Tugas';
    modal.style.display = 'flex';
});

closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

function openEditModal(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    document.getElementById('task-id').value = task.id;
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-date').value = task.target_date.split('T')[0];
    document.getElementById('task-priority').value = task.priority;
    document.getElementById('task-status').value = task.status;
    document.getElementById('task-summary').value = task.summary || '';
    
    document.getElementById('modal-title').textContent = 'Edit Jadwal / Aktual';
    modal.style.display = 'flex';
}

// Save Task (Create / Update)
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('task-id').value;
    const taskData = {
        title: document.getElementById('task-title').value,
        target_date: document.getElementById('task-date').value,
        priority: document.getElementById('task-priority').value,
        status: document.getElementById('task-status').value,
        summary: document.getElementById('task-summary').value
    };

    const method = id ? 'PUT' : 'POST';
    if (id) taskData.id = id;

    try {
        const res = await fetch(API_URL, {
            method,
            headers: getHeaders(),
            body: JSON.stringify(taskData)
        });
        
        if (!res.ok) throw new Error('Gagal menyimpan.');
        
        modal.style.display = 'none';
        loadTasks(); // Reload from server
    } catch (error) {
        alert(error.message);
    }
});

// Delete Task
async function deleteTask(id) {
    try {
        const res = await fetch(`${API_URL}?id=${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        
        if (!res.ok) throw new Error('Gagal menghapus.');
        loadTasks();
    } catch (error) {
        alert(error.message);
    }
}
