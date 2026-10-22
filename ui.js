let chartModulesInstance = null;
let chartCategoriesInstance = null;

// --- MODUL CARDS ---
function renderModuleCards() {
    const container = document.getElementById('moduleCardsContainer');
    if (!container) return;

    if (state.modules.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-500 col-span-3 py-4 text-center">Keine Module vorhanden. Lege welche im Setup an.</p>`;
        return;
    }

    container.innerHTML = state.modules.map(m => {
        const isSelected = m.id === state.selectedModuleId;
        return `
  <button type="button" onclick="selectModule('${m.id}')" 
    class="module-card p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${isSelected
                ? 'bg-blue-950/60 border-blue-500 ring-1 ring-blue-500 shadow-md shadow-blue-500/10'
                : 'bg-slate-900 border-slate-800 hover:bg-slate-800/80'
            }">
    <div class="flex justify-between items-start">
      <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${m.color || '#3b82f6'}"></span>
      <span class="text-[10px] font-semibold text-slate-400">${m.ects} ECTS</span>
    </div>
    <div class="mt-2">
      <h4 class="font-bold text-xs text-slate-200 truncate">${m.name}</h4>
      <p class="text-[10px] text-slate-400 mt-0.5">${m.targetWeekly} h/Week</p>
    </div>
  </button>`;
    }).join('');
}

function selectModule(id) {
    state.selectedModuleId = id;
    renderModuleCards();
}

function setQuickDuration(val) {
    state.selectedDuration = val;
    const range = document.getElementById('durationRange');
    const disp = document.getElementById('durationDisplay');
    if (range) range.value = val;
    if (disp) disp.innerText = `${val.toFixed(1)} Std.`;

    document.querySelectorAll('.duration-btn').forEach(btn => {
        btn.classList.remove('bg-blue-600', 'border-blue-500', 'text-white', 'shadow');
        btn.classList.add('bg-slate-900', 'border-slate-800', 'text-slate-300');
    });
    if (event && event.currentTarget) {
        event.currentTarget.classList.remove('bg-slate-900', 'border-slate-800', 'text-slate-300');
        event.currentTarget.classList.add('bg-blue-600', 'border-blue-500', 'text-white', 'shadow');
    }
}

function updateDurationFromRange(val) {
    state.selectedDuration = parseFloat(val);
    const disp = document.getElementById('durationDisplay');
    if (disp) disp.innerText = `${state.selectedDuration.toFixed(1)} Std.`;
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

function saveSession() {
    const dateInput = document.getElementById('sessionDate');
    if (!dateInput || !dateInput.value) {
        showToast("Bitte wähle ein Datum aus.", "error");
        return;
    }

    const week = getISOWeek(new Date(dateInput.value));
    const noteVal = (document.getElementById('sessionNote')?.value || '').trim();

    const newSession = {
        id: Date.now().toString(),
        moduleId: state.selectedModuleId,
        duration: state.selectedDuration,
        category: state.selectedCategory,
        date: dateInput.value,
        week: week,
        note: noteVal
    };

    state.sessions.unshift(newSession);
    saveState();

    const mod = state.modules.find(m => m.id === state.selectedModuleId);
    showToast(`${newSession.duration}h für ${mod ? mod.name : ''} gespeichert!`, "success");

    const noteInput = document.getElementById('sessionNote');
    if (noteInput) noteInput.value = '';
}

// --- WOCHEN DASHBOARD ---
function changeKw(delta) {
    state.currentKw = Math.max(1, Math.min(53, state.currentKw + delta));
    renderWeeklyDashboard();
}

function renderWeeklyDashboard() {
    const title = document.getElementById('weeklyKwTitle');
    if (title) title.innerText = `Kalenderwoche ${state.currentKw}`;

    const kwSessions = state.sessions.filter(s => s.week === state.currentKw);
    const totalIst = kwSessions.reduce((sum, s) => sum + s.duration, 0);
    const totalSoll = state.modules.reduce((sum, m) => sum + m.targetWeekly, 0) || 42.0;
    const pct = Math.min(100, Math.round((totalIst / totalSoll) * 100));

    const totalIstDisp = document.getElementById('weeklyTotalIst');
    const totalBar = document.getElementById('weeklyTotalBar');
    if (totalIstDisp) totalIstDisp.innerText = `${totalIst.toFixed(1)} h`;
    if (totalBar) totalBar.style.width = `${pct}%`;

    const badge = document.getElementById('weeklyStatusBadge');
    if (badge) {
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
    }

    const listContainer = document.getElementById('weeklyModuleList');
    if (listContainer) {
        listContainer.innerHTML = state.modules.map(m => {
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
        <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${m.color || '#3b82f6'}"></span>
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
  </div>`;
        }).join('');
    }
}

// --- STATISTIKEN & CHARTS ---
function renderSemesterStats() {
    const totalIst = state.sessions.reduce((sum, s) => sum + s.duration, 0);
    const totalEcts = state.modules.reduce((sum, m) => sum + m.ects, 0) || 30;
    const totalSoll = totalEcts * 30;
    const pct = Math.min(100, Math.round((totalIst / totalSoll) * 100));

    const totalDisp = document.getElementById('semIstTotal');
    const percentDisp = document.getElementById('semIstPercent');
    const bar = document.getElementById('semProgressBar');
    const barLabel = document.getElementById('semProgressBarLabel');

    if (totalDisp) totalDisp.innerText = `${totalIst.toFixed(1)} h`;
    if (percentDisp) percentDisp.innerText = `${pct}% erreicht`;
    if (bar) bar.style.width = `${pct}%`;
    if (barLabel) barLabel.innerText = `${pct}%`;

    renderCharts();
}

function renderCharts() {
    const moduleTotals = state.modules.map(m => {
        return state.sessions
            .filter(s => s.moduleId === m.id)
            .reduce((sum, s) => sum + s.duration, 0);
    });

    const canvasMod = document.getElementById('chartModules');
    if (canvasMod) {
        const ctxModules = canvasMod.getContext('2d');
        if (chartModulesInstance) chartModulesInstance.destroy();

        chartModulesInstance = new Chart(ctxModules, {
            type: 'doughnut',
            data: {
                labels: state.modules.map(m => m.name),
                datasets: [{
                    data: moduleTotals,
                    backgroundColor: state.modules.map(m => m.color || '#3b82f6'),
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 } } } }
            }
        });
    }

    const categories = ['Selbststudium', 'Präsenzzeit', 'Nachbereitung'];
    const catColors = ['#3b82f6', '#10b981', '#f59e0b'];
    const categoryTotals = categories.map(cat => {
        return state.sessions
            .filter(s => s.category === cat)
            .reduce((sum, s) => sum + s.duration, 0);
    });

    const canvasCat = document.getElementById('chartCategories');
    if (canvasCat) {
        const ctxCategories = canvasCat.getContext('2d');
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
                plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 10 } } } }
            }
        });
    }
}

// --- VERLAUF & HISTORIE ---
function renderHistoryModuleFilter() {
    const select = document.getElementById('historyModuleFilter');
    if (!select) return;
    select.innerHTML = `<option value="ALL">Alle Module</option>` +
        state.modules.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
}

function renderHistory() {
    const searchInput = document.getElementById('historySearch');
    const filterSelect = document.getElementById('historyModuleFilter');
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const selectedModule = filterSelect ? filterSelect.value : 'ALL';

    let filtered = state.sessions.filter(s => {
        const matchesModule = selectedModule === 'ALL' || s.moduleId === selectedModule;
        const matchesSearch = !searchTerm || (s.note && s.note.toLowerCase().includes(searchTerm));
        return matchesModule && matchesSearch;
    });

    const listContainer = document.getElementById('historyList');
    if (!listContainer) return;

    if (filtered.length === 0) {
        listContainer.innerHTML = `<p class="text-xs text-slate-500 text-center py-8">Keine Lerneinheiten gefunden.</p>`;
        return;
    }

    listContainer.innerHTML = filtered.map(s => {
        const mod = state.modules.find(m => m.id === s.moduleId) || { name: 'Unbekannt', color: '#64748b' };
        return `
  <div class="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between space-x-3">
    <div class="flex items-center space-x-3 min-w-0">
      <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background-color: ${mod.color || '#3b82f6'}"></span>
      <div class="min-w-0">
        <div class="flex items-center space-x-2">
          <h5 class="text-xs font-bold text-slate-200 truncate">${mod.name}</h5>
          <span class="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">Week ${s.week}</span>
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
  </div>`;
    }).join('');

    refreshIcons();
}

function deleteSession(id) {
    if (confirm("Lerneinheit wirklich löschen?")) {
        state.sessions = state.sessions.filter(s => s.id !== id);
        saveState();
        renderHistory();
        showToast("Lerneinheit gelöscht.", "info");
    }
}

// --- MODUL-VERWALTUNG (SETUP) ---
function addCustomModule() {
    const nameInput = document.getElementById('newModName');
    const ectsInput = document.getElementById('newModEcts');
    const weeklyInput = document.getElementById('newModWeekly');
    const colorInput = document.getElementById('newModColor');

    const name = nameInput ? nameInput.value.trim() : '';
    const ects = parseFloat(ectsInput?.value) || 5;
    const weekly = parseFloat(weeklyInput?.value) || 5;
    const color = colorInput?.value || '#3b82f6';

    if (!name) {
        showToast("Bitte gib einen Modulnamen ein.", "error");
        return;
    }

    const newModule = {
        id: 'mod_' + Date.now(),
        name: name,
        ects: ects,
        targetWeekly: weekly,
        color: color
    };

    state.modules.push(newModule);
    saveState();

    if (nameInput) nameInput.value = '';
    renderModuleCards();
    renderHistoryModuleFilter();
    renderSettingsModuleList();
    showToast(`Modul "${name}" hinzugefügt!`, "success");
}

function deleteCustomModule(id) {
    if (confirm("Modul und alle zugehörigen Einträge wirklich löschen?")) {
        state.modules = state.modules.filter(m => m.id !== id);
        state.sessions = state.sessions.filter(s => s.moduleId !== id);
        saveState();

        if (state.selectedModuleId === id && state.modules.length > 0) {
            state.selectedModuleId = state.modules[0].id;
        }

        renderModuleCards();
        renderHistoryModuleFilter();
        renderSettingsModuleList();
        showToast("Modul entfernt.", "info");
    }
}

function renderSettingsModuleList() {
    const container = document.getElementById('settingsModuleList');
    if (!container) return;

    if (state.modules.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-500 py-2">Keine Module vorhanden.</p>`;
        return;
    }

    container.innerHTML = state.modules.map(m => `
        <div class="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl">
            <div class="flex items-center space-x-3">
                <span class="w-3 h-3 rounded-full" style="background-color: ${m.color || '#3b82f6'}"></span>
                <div>
                    <p class="text-xs font-bold text-slate-200">${m.name}</p>
                    <p class="text-[10px] text-slate-400">${m.ects} ECTS • ${m.targetWeekly} h/Week</p>
                </div>
            </div>
            <button onclick="deleteCustomModule('${m.id}')" class="p-1.5 text-slate-500 hover:text-red-400 transition-colors">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
        </div>
    `).join('');

    refreshIcons();
}

// --- EXPORT & IMPORT ---
function exportCSV() {
    let csv = "ID;Datum;Kalenderwoche;Modul;Kategorie;Dauer_Std;Notiz\n";
    state.sessions.forEach(s => {
        const mod = state.modules.find(m => m.id === s.moduleId);
        csv += `"${s.id}";"${s.date}";${s.week};"${mod ? mod.name : s.moduleId}";"${s.category}";${s.duration};"${s.note || ''}"\n`;
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