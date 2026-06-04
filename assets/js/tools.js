// PIN Security Logic
const CORRECT_PIN = '1321'; // Ganti dengan PIN rahasia Anda nanti
let currentPin = '';

const pinDots = document.querySelectorAll('.pin-dot');
const lockMsg = document.getElementById('lock-msg');
const lockscreen = document.getElementById('lockscreen');
const dashboard = document.getElementById('dashboard');

// Session Check
const savedPin = sessionStorage.getItem('ardyan_tools_pin');
if (savedPin === CORRECT_PIN) {
    currentPin = savedPin;
    lockscreen.style.display = 'none';
    document.body.style.overflow = 'auto';
    dashboard.style.display = 'block';
    dashboard.style.opacity = '1';
    setTimeout(() => {
        loadTasks();
    }, 100);
}

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
        sessionStorage.setItem('ardyan_tools_pin', currentPin);
        
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
        if (currentPin.length < 4) {
            currentPin += btn.getAttribute('data-key');
            updatePinDots();
            if (currentPin.length === 4) {
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
            if (currentPin.length < 4) {
                currentPin += e.key;
                
                // Visual feedback on keypad
                const btn = document.querySelector(`.key-btn[data-key="${e.key}"]`);
                if (btn) {
                    btn.classList.add('active');
                    setTimeout(() => btn.classList.remove('active'), 100);
                }

                updatePinDots();
                if (currentPin.length === 4) {
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
        renderCalendar();
        renderAiBrief();
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
        
        let statusColor = 'var(--text-muted)';
        if (task.status === 'Selesai') statusColor = '#22c55e';
        else if (task.status === 'Testing') statusColor = '#3b82f6';
        else if (task.status === 'Development') statusColor = '#eab308';
        else if (task.status === 'Progres Awal') statusColor = '#f97316';

        // Subtasks Progress Calculation
        let subtasksHTML = '';
        let progressPercent = 0;
        let progressText = '0/0';
        
        if (task.subtasks && task.subtasks.length > 0) {
            const total = task.subtasks.length;
            const doneCount = task.subtasks.filter(st => st.is_done).length;
            progressPercent = Math.round((doneCount / total) * 100);
            progressText = `${doneCount}/${total} (${progressPercent}%)`;
            
            subtasksHTML = '<div class="subtasks-list">';
            task.subtasks.forEach((st, index) => {
                subtasksHTML += `
                    <label class="subtask-item ${st.is_done ? 'done' : ''}">
                        <input type="checkbox" disabled ${st.is_done ? 'checked' : ''}>
                        <span>${st.text}</span>
                    </label>
                `;
            });
            subtasksHTML += '</div>';
        }

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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 5px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                ${dateStr} &bull; <span style="color: ${statusColor}; font-weight: 500; margin-left: 5px;">${task.status}</span>
            </div>

            ${task.subtasks && task.subtasks.length > 0 ? `
                <div class="progress-text">${progressText} Selesai</div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${progressPercent}%; background-color: ${progressPercent === 100 ? '#22c55e' : 'var(--accent)'}"></div>
                </div>
            ` : ''}

            ${subtasksHTML}

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

// ==========================================
// CALENDAR LOGIC
// ==========================================
let currentDate = new Date(); // Start with current month

const calMonthYear = document.getElementById('calendar-month-year');
const calGrid = document.getElementById('calendar-grid');

document.getElementById('prev-month').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});

document.getElementById('next-month').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});

function renderCalendar() {
    calGrid.innerHTML = '';
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    calMonthYear.textContent = `${monthNames[month]} ${year}`;

    const daysOfWeek = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    daysOfWeek.forEach(day => {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day-header';
        dayDiv.textContent = day;
        calGrid.appendChild(dayDiv);
    });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const today = new Date();
    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;

    // Fill empty cells before 1st day
    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'calendar-cell empty';
        calGrid.appendChild(emptyCell);
    }

    // Fill days
    for (let i = 1; i <= daysInMonth; i++) {
        const cell = document.createElement('div');
        cell.className = 'calendar-cell';
        if (isCurrentMonth && i === today.getDate()) {
            cell.classList.add('today');
        }

        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        
        // Find tasks for this day
        const dayTasks = tasks.filter(t => t.target_date.startsWith(dateString));
        
        let dotsHTML = '';
        if (dayTasks.length > 0) {
            cell.classList.add('has-task');
            dayTasks.forEach(t => {
                let color = 'var(--text-muted)';
                if (t.status === 'Selesai') color = '#22c55e';
                else if (t.status === 'Testing') color = '#3b82f6';
                else if (t.status === 'Development') color = '#eab308';
                else if (t.status === 'Progres Awal') color = '#f97316';
                
                if (t.priority === 'High') color = '#ef4444'; // Override with priority color if we want, or stick to status color. Let's use status color.
                
                dotsHTML += `<div class="task-dot" style="background-color: ${color};" title="${t.title}"></div>`;
            });
        }

        cell.innerHTML = `
            <div>${i}</div>
            <div class="calendar-dots">${dotsHTML}</div>
        `;
        
        calGrid.appendChild(cell);
    }
}

// Modal & Subtask Logic
const modal = document.getElementById('task-modal');
const form = document.getElementById('task-form');
const addBtn = document.getElementById('add-task-btn');
const closeBtn = document.getElementById('close-modal-btn');
const subtasksContainer = document.getElementById('subtasks-container');
const btnAddSubtask = document.getElementById('btn-add-subtask');

let currentSubtasks = [];

function renderSubtaskInputs() {
    subtasksContainer.innerHTML = '';
    currentSubtasks.forEach((st, index) => {
        const div = document.createElement('div');
        div.className = 'subtask-input-group';
        div.innerHTML = `
            <input type="checkbox" style="width: 20px;" ${st.is_done ? 'checked' : ''} onchange="toggleSubtask(${index}, this.checked)">
            <input type="text" value="${st.text}" placeholder="Deskripsi pekerjaan..." oninput="updateSubtaskText(${index}, this.value)" required>
            <button type="button" class="btn-remove-subtask" onclick="removeSubtask(${index})">×</button>
        `;
        subtasksContainer.appendChild(div);
    });
}

window.toggleSubtask = function(index, checked) { currentSubtasks[index].is_done = checked; }
window.updateSubtaskText = function(index, text) { currentSubtasks[index].text = text; }
window.removeSubtask = function(index) {
    currentSubtasks.splice(index, 1);
    renderSubtaskInputs();
}

btnAddSubtask.addEventListener('click', () => {
    currentSubtasks.push({ text: '', is_done: false });
    renderSubtaskInputs();
});

addBtn.addEventListener('click', () => {
    form.reset();
    document.getElementById('task-id').value = '';
    document.getElementById('modal-title').textContent = 'Tambah Jadwal / Tugas';
    currentSubtasks = [];
    renderSubtaskInputs();
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
    
    currentSubtasks = task.subtasks ? JSON.parse(JSON.stringify(task.subtasks)) : [];
    renderSubtaskInputs();

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
        summary: document.getElementById('task-summary').value,
        subtasks: currentSubtasks
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

// ==========================================
// AI INSIGHT LOGIC
// ==========================================
// ==========================================
// AI INSIGHT LOGIC (CACHED & WIDGET SUPPORT)
// ==========================================
const btnAiInsight = document.getElementById('btn-ai-insight');
const aiModal = document.getElementById('ai-modal');
const closeAiBtn = document.getElementById('close-ai-btn');
const aiLoading = document.getElementById('ai-loading');
const aiResult = document.getElementById('ai-result');
const btnRefreshAi = document.getElementById('btn-refresh-ai');
const aiTimestamp = document.getElementById('ai-timestamp');

// Sidebar Widget Elements
const aiBriefCard = document.getElementById('ai-brief-card');
const aiBriefTime = document.getElementById('ai-brief-time');
const aiBriefContent = document.getElementById('ai-brief-content');
const btnViewFullAi = document.getElementById('btn-view-full-ai');

// Function to render AI Action Plan brief on the dashboard
function renderAiBrief() {
    const cachedHtml = localStorage.getItem('lastAiInsight');
    const cachedTime = localStorage.getItem('lastAiInsightTime');

    if (cachedHtml && cachedTime) {
        aiBriefTime.textContent = cachedTime;
        
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(cachedHtml, 'text/html');
            const actionPlan = doc.querySelector('.ai-action-plan');
            
            if (actionPlan) {
                const clonedPlan = actionPlan.cloneNode(true);
                // Remove header and intro text from brief card to keep it clean
                const h3 = clonedPlan.querySelector('h3');
                if (h3) h3.remove();
                const intro = clonedPlan.querySelector('p');
                if (intro) intro.remove();
                
                aiBriefContent.innerHTML = clonedPlan.innerHTML;
            } else {
                // Fallback: display the first 250 characters if structure doesn't match
                aiBriefContent.innerHTML = cachedHtml;
            }
            aiBriefCard.style.display = 'block';
        } catch (e) {
            console.error("Error parsing cached AI data: ", e);
            aiBriefCard.style.display = 'none';
        }
    } else {
        aiBriefCard.style.display = 'none';
    }
}

// Function to trigger live Gemini API analysis
async function fetchAiSummary() {
    if (tasks.length === 0) {
        alert('Belum ada tugas untuk dianalisis oleh AI.');
        aiModal.style.display = 'none';
        return;
    }

    aiLoading.style.display = 'block';
    aiResult.innerHTML = '';
    aiTimestamp.textContent = 'Menganalisis...';

    try {
        const res = await fetch('/api/ai-summary', {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ tasks })
        });

        const data = await res.json();
        
        if (!res.ok) {
            throw new Error(data.error || 'Gagal menghubungi AI');
        }

        const now = new Date();
        const formattedTime = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) + ' ' + 
                            now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

        // Save to cache
        localStorage.setItem('lastAiInsight', data.html);
        localStorage.setItem('lastAiInsightTime', formattedTime);

        // Display results
        aiLoading.style.display = 'none';
        aiResult.innerHTML = data.html;
        aiTimestamp.textContent = formattedTime;

        // Refresh main page sidebar brief widget
        renderAiBrief();
    } catch (error) {
        aiLoading.style.display = 'none';
        aiResult.innerHTML = `<p style="color: #ef4444; padding: 20px 0;">Error: ${error.message}</p>`;
        aiTimestamp.textContent = 'Gagal';
    }
}

// Function to open AI Modal and load cached data if present
function openAiModal() {
    aiModal.style.display = 'flex';
    
    const cachedHtml = localStorage.getItem('lastAiInsight');
    const cachedTime = localStorage.getItem('lastAiInsightTime');

    if (cachedHtml && cachedTime) {
        aiLoading.style.display = 'none';
        aiResult.innerHTML = cachedHtml;
        aiTimestamp.textContent = cachedTime;
    } else {
        // If no cache, automatically fetch from Gemini
        fetchAiSummary();
    }
}

// Event Listeners
btnAiInsight.addEventListener('click', openAiModal);
if (btnViewFullAi) {
    btnViewFullAi.addEventListener('click', openAiModal);
}
btnRefreshAi.addEventListener('click', fetchAiSummary);

closeAiBtn.addEventListener('click', () => {
    aiModal.style.display = 'none';
});

// Clear session on Exit
const btnExit = document.getElementById('btn-exit');
if (btnExit) {
    btnExit.addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.removeItem('ardyan_tools_pin');
        window.location.href = '/';
    });
}
