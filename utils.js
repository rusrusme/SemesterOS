// --- ISO WEEK CALCULATOR ---
function getISOWeek(dateObj = new Date()) {
    const d = new Date(Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function getCurrentISOWeek() {
    return getISOWeek(new Date());
}

function initDateInput() {
    const today = new Date().toISOString().split('T')[0];
    const el = document.getElementById('sessionDate');
    if (el) {
        el.value = today;
        el.addEventListener('click', () => {
            try {
                el.showPicker();
            } catch (e) {
                // Fallback for older browsers
            }
        });
    }
}

function updateKwDisplay() {
    const el = document.getElementById('sessionDate');
    if (el && el.value) {
        const week = getISOWeek(new Date(el.value));
        const badge = document.getElementById('kwBadge');
        if (badge) badge.innerText = `Week ${week}`;
    }
}

function refreshIcons() {
    if (window.lucide && typeof lucide.createIcons === 'function') {
        lucide.createIcons();
    }
}

function toggleTheme() {
    document.documentElement.classList.toggle('dark');
}

function openModal(id) { document.getElementById(id)?.classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id)?.classList.add('hidden'); }

// --- TOAST NOTIFICATIONS ---
function showToast(message, type = "info") {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    let bg = "bg-slate-800 text-slate-100 border-slate-700";
    if (type === "success") bg = "bg-emerald-900 text-emerald-100 border-emerald-700";
    if (type === "error") bg = "bg-red-900 text-red-100 border-red-700";

    toast.className = `p-3 rounded-xl border shadow-lg text-xs font-semibold transform transition-all duration-300 opacity-0 translate-y-2 ${bg}`;
    toast.innerText = message;

    container.appendChild(toast);

    setTimeout(() => { toast.classList.remove('opacity-0', 'translate-y-2'); }, 10);
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// --- USER MANAGEMENT & LOGOUT ---
function logout() {
    localStorage.removeItem('studytrack_current_user');
    window.location.href = 'index.html';
}

function displayCurrentUser() {
    const user = localStorage.getItem('studytrack_current_user');
    const el = document.getElementById('currentUserDisplay');
    if (el && user) {
        el.innerText = user;
    }
}