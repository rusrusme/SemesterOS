// --- TAILWIND CONFIGURATION ---
tailwind.config = {
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                brand: {
                    50: '#f0f6ff',
                    100: '#e0edff',
                    500: '#3b82f6',
                    600: '#2563eb',
                    700: '#1d4ed8',
                    900: '#1e3a8a',
                }
            }
        }
    }
};

// --- MODULE CONFIGURATION ---
const MODULES = [
    { id: 'analysis', name: 'Analysis', ects: 8, targetWeekly: 11.0, vl: 4, tu: 2, self: 5, color: '#3b82f6', icon: 'calculator' },
    { id: 'gdb', name: 'GDB (Datenbanken)', ects: 6, targetWeekly: 8.5, vl: 3, tu: 2, self: 3.5, color: '#10b981', icon: 'database' },
    { id: 'gbs', name: 'GBS (Betriebssysteme)', ects: 5, targetWeekly: 7.0, vl: 3, tu: 2, self: 2, color: '#f59e0b', icon: 'cpu' },
    { id: 'security', name: 'IT-Security', ects: 5, targetWeekly: 6.5, vl: 2, tu: 2, self: 2.5, color: '#ec4899', icon: 'shield-check' },
    { id: 'signal', name: 'Signaltheorie', ects: 5, targetWeekly: 9.0, vl: 5, tu: 2, self: 2, color: '#8b5cf6', icon: 'activity' }
];

// --- GLOBAL STATE ---
let state = {
    sessions: [],
    selectedModuleId: 'analysis',
    selectedDuration: 1.5,
    selectedCategory: 'Selbststudium',
    currentKw: getCurrentISOWeek(),
    timerRunning: false,
    timerSeconds: 0,
    timerInterval: null
};

// --- INITIALIZATION ---
window.addEventListener('DOMContentLoaded', () => {
    loadState();
    initDateInput();
    renderModuleCards();
    renderHistoryModuleFilter();
    updateKwDisplay();
    switchTab('quicktrack');

    // Initialize Lucide Icons
    lucide.createIcons();
});

// --- HELPER: ISO WEEK CALCULATOR ---
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
    document.getElementById('sessionDate').value = today;
}

function updateKwDisplay() {
    const dateVal = document.getElementById('sessionDate').value;
    if (dateVal) {
        const kw = getISOWeek(new Date(dateVal));
        document.getElementById('kwBadge').innerText = `KW ${kw}`;
    }
}

// --- LOCAL STORAGE ---
function loadState() {
    const saved = localStorage.getItem('studytrack_cs_data');
    if (saved) {
        try {
            state.sessions = JSON.parse(saved);
        } catch (e) {
            console.error("Failed to parse localStorage data", e);
        }
    } else {
        // Seed initial sample session for demonstration
        state.sessions = [
            { id: '1', moduleId: 'analysis', duration: 1.5, category: 'Selbststudium', date: new Date().toISOString().split('T')[0], kw: getCurrentISOWeek(), note: 'Übungsblatt Start' }
        ];
        saveState();
    }
}

function saveState() {
    localStorage.setItem('studytrack_cs_data', JSON.stringify(state.sessions));
}

// --- TAB SWITCHING ---
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById(`tab-${tabId}`).classList.remove('hidden');

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('text-blue-500');
        btn.classList.add('text-slate-400');
    });
    const activeNav = document.getElementById(`nav-${tabId}`);
    if (activeNav) {
        activeNav.classList.remove('text-slate-400');
        activeNav.classList.add('text-blue-500');
    }

    if (tabId === 'weekly') renderWeeklyDashboard();
    if (tabId === 'semester') renderSemesterStats();
    if (tabId === 'history') renderHistory();
}

// --- RENDER MODULE SELECTION CARDS ---
function renderModuleCards() {
    const container = document.getElementById('moduleCardsContainer');
    container.innerHTML = MODULES.map(m => {
        const isSelected = m.id === state.selectedModuleId;
        return `
  <button type="button" onclick="selectModule('${m.id}')" 
    class="module-card p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${isSelected
                ? 'bg-blue-950/60 border-blue-500 ring-1 ring-blue-500 shadow-md shadow-blue-500/10'
                : 'bg-slate-900 border-slate-800 hover:bg-slate-800/80'
            }">
    <div class="flex justify-between items-start">
      <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${m.color}"></span>
      <span class="text-[10px] font-semibold text-slate-400">${m.ects} ECTS</span>
    </div>
    <div class="mt-2">
      <h4 class="font-bold text-xs text-slate-200 truncate">${m.name}</h4>
      <p class="text-[10px] text-slate-400 mt-0.5">${m.targetWeekly} h/Woche</p>
    </div>
  </button>
`;
    }).join('');
}

function selectModule(id) {
    state.selectedModuleId = id;
    renderModuleCards();
}

// --- QUICK DURATION & CATEGORY SELECTORS ---
function setQuickDuration(val) {
    state.selectedDuration = val;
    document.getElementById('durationRange').value = val;
    document.getElementById('durationDisplay').innerText = `${val.toFixed(1)} Std.`;

    document.querySelectorAll('.duration-btn').forEach(btn => {
        btn.classList.remove('bg-blue-600', 'border-blue-500', 'text-white', 'shadow');
        btn.classList.add('bg-slate-900', 'border-slate-800', 'text-slate-300');
    });
    event.currentTarget.classList.remove('bg-slate-900', 'border-slate-800', 'text-slate-300');
    event.currentTarget.classList.add('bg-blue-600', 'border-blue-500', 'text-white', 'shadow');
}

function updateDurationFromRange(val) {
    state.selectedDuration = parseFloat(val);
    document.getElementById('durationDisplay').innerText = `${state.selectedDuration.toFixed(1)} Std.`;
}

function selectCategory(cat) {
    state.selectedCategory = cat;
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.classList.remove('bg-blue-600', 'border-blue-500', 'text-white');
        btn.classList.add('bg-slate-900', 'border-slate-800', 'text-slate-300');
    });
    const selectedBtn = document.getElementById(`cat-${cat}`);
    if (selectedBtn) {
        selectedBtn.classList.remove('bg-slate-900', 'border-slate-800', 'text-slate-300');
        selectedBtn.classList.add('bg-blue-600', 'border-blue-500', 'text-white');
    }
}

// --- SAVE SESSION ---
function saveSession() {
    const dateVal = document.getElementById('sessionDate').value;
    if (!dateVal) {
        showToast("Bitte wähle ein Datum aus.", "error");
        return;
    }

    const kw = getISOWeek(new Date(dateVal));
    const noteVal = document.getElementById('sessionNote').value.trim();

    const newSession = {
        id: Date.now().toString(),
        moduleId: state.selectedModuleId,
        duration: state.selectedDuration,
        category: state.selectedCategory,
        date: dateVal,
        kw: kw,
        note: noteVal
    };

    state.sessions.unshift(newSession);
    saveState();

    const mod = MODULES.find(m => m.id === state.selectedModuleId);
    showToast(`${newSession.duration}h für ${mod ? mod.name : ''} gespeichert!`, "success");

    // Reset form fields
    document.getElementById('sessionNote').value = '';
}

// --- TRACKER MODE SWITCHING & TIMER ---
function switchTrackerMode(mode) {
    const quickContainer = document.getElementById('quick-track-container');
    const timerContainer = document.getElementById('timer-container');
    const quickBtn = document.getElementById('mode-quick-btn');
    const timerBtn = document.getElementById('mode-timer-btn');

    if (mode === 'quick') {
        quickContainer.classList.remove('hidden');
        timerContainer.classList.add('hidden');
        quickBtn.classList.add('bg-blue-600', 'text-white');
        quickBtn.classList.remove('text-slate-400');
        timerBtn.classList.remove('bg-blue-600', 'text-white');
        timerBtn.classList.add('text-slate-400');
    } else {
        quickContainer.classList.add('hidden');
        timerContainer.classList.remove('hidden');
        timerBtn.classList.add('bg-blue-600', 'text-white');
        timerBtn.classList.remove('text-slate-400');
        quickBtn.classList.remove('bg-blue-600', 'text-white');
        quickBtn.classList.add('text-slate-400');
    }
}

function toggleTimer() {
    const startBtn = document.getElementById('startTimerBtn');
    if (!state.timerRunning) {
        state.timerRunning = true;
        startBtn.innerHTML = `<i data-lucide="pause" class="w-5 h-5"></i><span>Pause</span>`;
        startBtn.classList.remove('bg-emerald-600', 'hover:bg-emerald-500');
        startBtn.classList.add('bg-amber-600', 'hover:bg-amber-500');

        state.timerInterval = setInterval(() => {
            state.timerSeconds++;
            updateTimerDisplay();
        }, 1000);
    } else {
        state.timerRunning = false;
        clearInterval(state.timerInterval);
        startBtn.innerHTML = `<i data-lucide="play" class="w-5 h-5"></i><span>Weiter</span>`;
        startBtn.classList.remove('bg-amber-600', 'hover:bg-amber-500');
        startBtn.classList.add('bg-emerald-600', 'hover:bg-emerald-500');

        // Transfer logged hours to quick track input automatically
        const hours = (state.timerSeconds / 3600).toFixed(2);
        if (parseFloat(hours) > 0) {
            updateDurationFromRange(hours);
            showToast(`Timer gestoppt: ${hours} Stunden eingetragen.`, "info");
        }
    }
    lucide.createIcons();
}

function resetTimer() {
    state.timerRunning = false;
    clearInterval(state.timerInterval);
    state.timerSeconds = 0;
    updateTimerDisplay();
    const startBtn = document.getElementById('startTimerBtn');
    startBtn.innerHTML = `<i data-lucide="play" class="w-5 h-5"></i><span>Start</span>`;
    startBtn.classList.remove('bg-amber-600');
    startBtn.classList.add('bg-emerald-600');
    lucide.createIcons();
}

function updateTimerDisplay() {
    const hrs = Math.floor(state.timerSeconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((state.timerSeconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (state.timerSeconds % 60).toString().padStart(2, '0');
    document.getElementById('timerDisplay').innerText = `${hrs}:${mins}:${secs}`;
}

// --- TAB 2: WEEKLY DASHBOARD ---
function changeKw(delta) {
    state.currentKw = Math.max(1, Math.min(53, state.currentKw + delta));
    renderWeeklyDashboard();
}

function renderWeeklyDashboard() {
    document.getElementById('weeklyKwTitle').innerText = `Kalenderwoche ${state.currentKw}`;

    // Filter sessions for current KW
    const kwSessions = state.sessions.filter(s => s.kw === state.currentKw);

    // Total weekly stats
    const totalIst = kwSessions.reduce((sum, s) => sum + s.duration, 0);
    const totalSoll = 42.0;
    const pct = Math.min(100, Math.round((totalIst / totalSoll) * 100));

    document.getElementById('weeklyTotalIst').innerText = `${totalIst.toFixed(1)} h`;
    document.getElementById('weeklyTotalBar').style.width = `${pct}%`;

    const badge = document.getElementById('weeklyStatusBadge');
    if (pct >= 100) {
        badge.innerText = "Ziel Erreicht!";
        badge.className = "px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/50";
    } else if (pct >= 70) {
        badge.innerText = "Auf Kurs";
        badge.className = "px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-950 text-blue-400 border border-blue-800/50";
    } else {
        badge.innerText = "Rückstand";
        badge.className = "px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950 text-amber-400 border border-amber-800/50";
    }

    // Render per module breakdown
    const listContainer = document.getElementById('weeklyModuleList');
    listContainer.innerHTML = MODULES.map(m => {
        const modSessions = kwSessions.filter(s => s.moduleId === m.id);
        const modIst = modSessions.reduce((sum, s) => sum + s.duration, 0);
        const modPct = Math.min(100, Math.round((modIst / m.targetWeekly) * 100));

        let colorClass = "bg-amber-500";
        if (modPct >= 100) colorClass = "bg-emerald-500";
        else if (modPct >= 70) colorClass = "bg-blue-500";

        return `
  <div class="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2">
    <div class="flex justify-between items-center text-xs">
      <div class="flex items-center space-x-2">
        <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${m.color}"></span>
        <span class="font-bold text-slate-200">${m.name}</span>
      </div>
      <div class="text-right">
        <span class="font-bold text-slate-100">${modIst.toFixed(1)} h</span>
        <span class="text-slate-400">/ ${m.targetWeekly} h</span>
      </div>
    </div>
    
    <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
      <div class="h-full ${colorClass} rounded-full transition-all duration-300" style="width: ${modPct}%"></div>
    </div>
  </div>
`;
    }).join('');
}

// --- TAB 3: SEMESTER STATS & CHARTS ---
let chartModulesInstance = null;
let chartCategoriesInstance = null;

function renderSemesterStats() {
    const totalIst = state.sessions.reduce((sum, s) => sum + s.duration, 0);
    const totalSoll = 870.0;
    const pct = Math.min(100, Math.round((totalIst / totalSoll) * 100));

    document.getElementById('semIstTotal').innerText = `${totalIst.toFixed(1)} h`;
    document.getElementById('semIstPercent').innerText = `${pct}% erreicht`;
    document.getElementById('semProgressBar').style.width = `${pct}%`;
    document.getElementById('semProgressBarLabel').innerText = `${pct}%`;

    // Render Charts
    renderCharts();
}

function renderCharts() {
    // 1. Data by Module
    const moduleTotals = MODULES.map(m => {
        return state.sessions
            .filter(s => s.moduleId === m.id)
            .reduce((sum, s) => sum + s.duration, 0);
    });

    const ctxModules = document.getElementById('chartModules').getContext('2d');
    if (chartModulesInstance) chartModulesInstance.destroy();

    chartModulesInstance = new Chart(ctxModules, {
        type: 'doughnut',
        data: {
            labels: MODULES.map(m => m.name),
            datasets: [{
                data: moduleTotals,
                backgroundColor: MODULES.map(m => m.color),
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 } } }
            }
        }
    });

    // 2. Data by Category
    const categories = ['Selbststudium', 'Präsenzzeit', 'Nachbereitung'];
    const catColors = ['#3b82f6', '#10b981', '#f59e0b'];
    const categoryTotals = categories.map(cat => {
        return state.sessions
            .filter(s => s.category === cat)
            .reduce((sum, s) => sum + s.duration, 0);
    });

    const ctxCategories = document.getElementById('chartCategories').getContext('2d');
    if (chartCategoriesInstance) chartCategoriesInstance.destroy();

    chartCategoriesInstance = new Chart(ctxCategories, {
        type: 'pie',
        data: {
            labels: categories,
            datasets: [{
                data: categoryTotals,
                backgroundColor: catColors,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 } } }
            }
        }
    });
}

// --- TAB 4: HISTORY ---
function renderHistoryModuleFilter() {
    const select = document.getElementById('historyModuleFilter');
    select.innerHTML = `<option value="ALL">Alle Module</option>` +
        MODULES.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
}

function renderHistory() {
    const searchTerm = document.getElementById('historySearch').value.toLowerCase();
    const selectedModule = document.getElementById('historyModuleFilter').value;

    let filtered = state.sessions.filter(s => {
        const matchesModule = selectedModule === 'ALL' || s.moduleId === selectedModule;
        const matchesSearch = !searchTerm || (s.note && s.note.toLowerCase().includes(searchTerm));
        return matchesModule && matchesSearch;
    });

    const listContainer = document.getElementById('historyList');

    if (filtered.length === 0) {
        listContainer.innerHTML = `<p class="text-xs text-slate-500 text-center py-8">Keine Lerneinheiten gefunden.</p>`;
        return;
    }

    listContainer.innerHTML = filtered.map(s => {
        const mod = MODULES.find(m => m.id === s.moduleId) || { name: 'Unbekannt', color: '#64748b' };
        return `
  <div class="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between space-x-3">
    <div class="flex items-center space-x-3 min-w-0">
      <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background-color: ${mod.color}"></span>
      <div class="min-w-0">
        <div class="flex items-center space-x-2">
          <h5 class="text-xs font-bold text-slate-200 truncate">${mod.name}</h5>
          <span class="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">KW ${s.kw}</span>
        </div>
        <p class="text-[11px] text-slate-400 truncate mt-0.5">${s.date} • ${s.category}${s.note ? ' • ' + s.note : ''}</p>
      </div>
    </div>

    <div class="flex items-center space-x-3 flex-shrink-0">
      <span class="font-bold text-xs text-blue-400">${s.duration} h</span>
      <button onclick="deleteSession('${s.id}')" class="p-1 text-slate-500 hover:text-red-400 transition-colors">
        <i data-lucide="trash-2" class="w-4 h-4"></i>
      </button>
    </div>
  </div>
`;
    }).join('');

    lucide.createIcons();
}

function deleteSession(id) {
    if (confirm("Lerneinheit wirklich löschen?")) {
        state.sessions = state.sessions.filter(s => s.id !== id);
        saveState();
        renderHistory();
        showToast("Lerneinheit gelöscht.", "info");
    }
}

// --- MODALS & EXPORT/IMPORT ---
function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

function exportCSV() {
    let csv = "ID;Datum;Kalenderwoche;Modul;Kategorie;Dauer_Std;Notiz\n";
    state.sessions.forEach(s => {
        const mod = MODULES.find(m => m.id === s.moduleId);
        csv += `"${s.id}";"${s.date}";${s.kw};"${mod ? mod.name : s.moduleId}";"${s.category}";${s.duration};"${s.note || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `StudyTrack_Export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
}

function exportJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.sessions, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `StudyTrack_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
}

function importJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (Array.isArray(imported)) {
                state.sessions = imported;
                saveState();
                closeModal('backupModal');
                showToast("Backup erfolgreich geladen!", "success");
                switchTab('quicktrack');
            }
        } catch (err) {
            showToast("Ungültige JSON-Datei.", "error");
        }
    };
    reader.readAsText(file);
}

function resetData() {
    if (confirm("Wirklich ALLE gespeicherten Lerneinheiten unwiderruflich löschen?")) {
        state.sessions = [];
        saveState();
        closeModal('backupModal');
        showToast("Alle Daten zurückgesetzt.", "info");
        switchTab('quicktrack');
    }
}

// --- THEME TOGGLE ---
function toggleTheme() {
    document.documentElement.classList.toggle('dark');
}

// --- TOAST SYSTEM ---
function showToast(message, type = "info") {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');

    let bg = "bg-slate-800 text-slate-100 border-slate-700";
    if (type === "success") bg = "bg-emerald-900 text-emerald-100 border-emerald-700";
    if (type === "error") bg = "bg-red-900 text-red-100 border-red-700";

    toast.className = `p-3 rounded-xl border shadow-lg text-xs font-semibold transform transition-all duration-300 opacity-0 translate-y-2 ${bg}`;
    toast.innerText = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove('opacity-0', 'translate-y-2');
    }, 10);

    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}