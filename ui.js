let chartModulesInstance = null;
let chartCategoriesInstance = null;

// --- MODULE TOUCH CARDS ---
function renderModuleCards() {
    const container = document.getElementById('moduleCardsContainer');
    if (!container) return;

    const modules = getActiveModules();

    if (modules.length === 0) {
        container.innerHTML = `
            <div class="col-span-2 sm:col-span-3 p-4 bg-slate-900 border border-slate-800 rounded-xl text-center space-y-2">
                <p class="text-xs text-slate-400">No modules found for your current selection.</p>
                <button onclick="switchTab('setup')" class="px-3 py-1.5 bg-blue-600 text-white font-semibold text-xs rounded-lg hover:bg-blue-500 transition-colors">
                    Go to Setup & Add Modules
                </button>
            </div>
        `;
        return;
    }

    if (!modules.some(m => m.id === state.selectedModuleId)) {
        state.selectedModuleId = modules[0].id;
    }

    container.innerHTML = modules.map(m => {
        const isSelected = m.id === state.selectedModuleId;
        return `
  <button type="button" onclick="selectModule('${m.id}')" 
    class="module-card p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${isSelected
                ? 'bg-blue-950/60 border-blue-500 ring-1 ring-blue-500 shadow-md shadow-blue-500/10'
                : 'bg-slate-900 border-slate-800 hover:bg-slate-800/80'
            }">
    <div class="flex justify-between items-start">
      <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${m.color || '#3b82f6'}"></span>
      <span class="text-[10px] font-semibold text-slate-400">${m.ects} ECTS (${m.sws || 0} SWS)</span>
    </div>
    <div class="mt-2">
      <h4 class="font-bold text-xs text-slate-200 truncate">${m.name}</h4>
      <p class="text-[10px] text-slate-400 mt-0.5">${m.targetWeekly} hrs/week</p>
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
    if (disp) disp.innerText = `${val.toFixed(1)} hrs`;

    document.querySelectorAll('.duration-btn').forEach(btn => {
        btn.classList.remove('bg-blue-600', 'border-blue-500', 'text-white', 'shadow');
        btn.classList.add('bg-slate-900', 'border-slate-800', 'text-slate-300');
    });
    if (window.event && window.event.currentTarget) {
        window.event.currentTarget.classList.remove('bg-slate-900', 'border-slate-800', 'text-slate-300');
        window.event.currentTarget.classList.add('bg-blue-600', 'border-blue-500', 'text-white', 'shadow');
    }
}

function updateDurationFromRange(val) {
    state.selectedDuration = parseFloat(val);
    const disp = document.getElementById('durationDisplay');
    if (disp) disp.innerText = `${state.selectedDuration.toFixed(1)} hrs`;
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
    if (!state.selectedModuleId) {
        showToast("Please select a module first or create one in Setup.", "error");
        return;
    }

    const dateInput = document.getElementById('sessionDate');
    if (!dateInput || !dateInput.value) {
        showToast("Please select a date.", "error");
        return;
    }

    const kw = getISOWeek(new Date(dateInput.value));
    const noteVal = (document.getElementById('sessionNote')?.value || '').trim();

    const newSession = {
        id: Date.now().toString(),
        moduleId: state.selectedModuleId,
        duration: state.selectedDuration,
        category: state.selectedCategory,
        date: dateInput.value,
        kw: kw,
        note: noteVal
    };

    state.sessions.unshift(newSession);
    saveState();

    const modules = getActiveModules();
    const mod = modules.find(m => m.id === state.selectedModuleId);
    showToast(`Saved ${newSession.duration}h for ${mod ? mod.name : 'Module'}!`, "success");

    const noteInput = document.getElementById('sessionNote');
    if (noteInput) noteInput.value = '';
}

// --- WEEKLY DASHBOARD ---
function changeKw(delta) {
    state.currentKw = Math.max(1, Math.min(53, state.currentKw + delta));
    renderWeeklyDashboard();
}

function renderWeeklyDashboard() {
    const title = document.getElementById('weeklyKwTitle');
    if (title) title.innerText = `Calendar Week ${state.currentKw}`;

    const modules = getActiveModules();
    const kwSessions = state.sessions.filter(s => s.kw === state.currentKw);
    const totalIst = kwSessions.reduce((sum, s) => sum + s.duration, 0);
    const totalSoll = modules.reduce((sum, m) => sum + m.targetWeekly, 0) || 0;
    const pct = totalSoll > 0 ? Math.min(100, Math.round((totalIst / totalSoll) * 100)) : 0;

    const totalIstDisp = document.getElementById('weeklyTotalIst');
    const totalSollDisp = document.getElementById('weeklyTotalSoll');
    const totalBar = document.getElementById('weeklyTotalBar');
    if (totalIstDisp) totalIstDisp.innerText = `${totalIst.toFixed(1)} h`;
    if (totalSollDisp) totalSollDisp.innerText = `/ ${totalSoll.toFixed(1)} h`;
    if (totalBar) totalBar.style.width = `${pct}%`;

    const badge = document.getElementById('weeklyStatusBadge');
    if (badge) {
        if (totalSoll === 0) {
            badge.innerText = "No Target Set";
            badge.className = "px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400";
        } else if (pct >= 100) {
            badge.innerText = "Target Reached!";
            badge.className = "px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800/50";
        } else if (pct >= 70) {
            badge.innerText = "On Track";
            badge.className = "px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-950 text-blue-400 border border-blue-800/50";
        } else {
            badge.innerText = "Behind Schedule";
            badge.className = "px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-950 text-amber-400 border border-amber-800/50";
        }
    }

    const listContainer = document.getElementById('weeklyModuleList');
    if (listContainer) {
        if (modules.length === 0) {
            listContainer.innerHTML = `<p class="text-xs text-slate-500 py-2">No modules available in this semester.</p>`;
            return;
        }

        listContainer.innerHTML = modules.map(m => {
            const modSessions = kwSessions.filter(s => s.moduleId === m.id);
            const modIst = modSessions.reduce((sum, s) => sum + s.duration, 0);
            const modPct = m.targetWeekly > 0 ? Math.min(100, Math.round((modIst / m.targetWeekly) * 100)) : 0;

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

// --- STATS & CHARTS ---
function renderSemesterStats() {
    const modules = getActiveModules();
    const totalIst = state.sessions.reduce((sum, s) => sum + s.duration, 0);
    const totalEcts = modules.reduce((sum, m) => sum + m.ects, 0) || 0;
    const totalSoll = totalEcts * 30;
    const pct = totalSoll > 0 ? Math.min(100, Math.round((totalIst / totalSoll) * 100)) : 0;

    const bar = document.getElementById('semProgressBar');
    const barLabel = document.getElementById('semProgressBarLabel');

    if (bar) bar.style.width = `${pct}%`;
    if (barLabel) barLabel.innerText = `${pct}% (${totalIst.toFixed(1)} / ${totalSoll} h)`;

    renderCharts();
}

function renderCharts() {
    const modules = getActiveModules();
    const moduleTotals = modules.map(m => {
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
                labels: modules.length > 0 ? modules.map(m => m.name) : ['No Modules'],
                datasets: [{
                    data: modules.length > 0 ? moduleTotals : [1],
                    backgroundColor: modules.length > 0 ? modules.map(m => m.color || '#3b82f6') : ['#334155'],
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

    const categories = ['Self-Study', 'Attendance', 'Preparation'];
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

// --- HISTORY LOGS ---
function renderHistoryModuleFilter() {
    const select = document.getElementById('historyModuleFilter');
    if (!select) return;

    const modules = getActiveModules();
    select.innerHTML = `<option value="ALL">All Modules</option>` +
        modules.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
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
        listContainer.innerHTML = `<p class="text-xs text-slate-500 text-center py-8">No study sessions logged yet.</p>`;
        return;
    }

    const modules = getActiveModules();
    listContainer.innerHTML = filtered.map(s => {
        const mod = modules.find(m => m.id === s.moduleId) || { name: 'Unknown', color: '#64748b' };
        return `
  <div class="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between space-x-3">
    <div class="flex items-center space-x-3 min-w-0">
      <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" style="background-color: ${mod.color || '#3b82f6'}"></span>
      <div class="min-w-0">
        <div class="flex items-center space-x-2">
          <h5 class="text-xs font-bold text-slate-200 truncate">${mod.name}</h5>
          <span class="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">CW ${s.kw}</span>
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
    if (confirm("Delete this study session?")) {
        state.sessions = state.sessions.filter(s => s.id !== id);
        saveState();
        renderHistory();
        showToast("Session deleted.", "info");
    }
}

// --- SETUP TAB (DEGREE -> SEMESTER -> MODULE HIERARCHY) ---
function renderDegreeSemesterManagement() {
    const container = document.getElementById('degreeSemesterManagementContainer');
    if (!container) return;

    const activeDeg = getActiveDegree();
    const activeSem = getActiveSemester();

    container.innerHTML = `
        <!-- 1. DEGREE SELECTION & CREATION -->
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 class="font-bold text-sm text-slate-100 flex items-center space-x-2">
                <i data-lucide="award" class="w-4 h-4 text-blue-500"></i>
                <span>1. Degree Program</span>
            </h3>

            ${state.degrees.length > 0 ? `
            <div class="flex gap-2">
                <select id="degreeSelect" onchange="switchDegree(this.value)" class="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500">
                    ${state.degrees.map(d => `<option value="${d.id}" ${d.id === state.activeDegreeId ? 'selected' : ''}>${d.name}</option>`).join('')}
                </select>
            </div>
            ` : `<p class="text-xs text-slate-400">No degree program created yet. Add one below to get started.</p>`}

            <div class="flex gap-2 pt-2 border-t border-slate-800/80">
                <input type="text" id="newDegreeName" placeholder="Degree Name (e.g. Computer Science)" class="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200">
                <button onclick="addCustomDegree()" class="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold">Add Degree</button>
            </div>
        </div>

        <!-- 2. SEMESTER SELECTION & CREATION -->
        ${activeDeg ? `
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 class="font-bold text-sm text-slate-100 flex items-center space-x-2">
                <i data-lucide="calendar" class="w-4 h-4 text-indigo-500"></i>
                <span>2. Semesters in ${activeDeg.name}</span>
            </h3>

            ${activeDeg.semesters && activeDeg.semesters.length > 0 ? `
            <div class="flex gap-2">
                <select id="semesterSelect" onchange="switchSemester(this.value)" class="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500">
                    ${activeDeg.semesters.map(s => `<option value="${s.id}" ${s.id === state.activeSemesterId ? 'selected' : ''}>${s.name}</option>`).join('')}
                </select>
            </div>
            ` : `<p class="text-xs text-slate-400">No semesters in this degree yet. Add your first semester below.</p>`}

            <div class="flex gap-2 pt-2 border-t border-slate-800/80">
                <input type="text" id="newSemesterName" placeholder="Semester Name (e.g. 1st Semester)" class="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200">
                <button onclick="addCustomSemester()" class="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold">Add Semester</button>
            </div>
        </div>
        ` : ''}

        <!-- 3. MODULES MANAGEMENT -->
        ${activeSem ? `
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 class="font-bold text-sm text-slate-100 flex items-center space-x-2">
                <i data-lucide="book-open" class="w-4 h-4 text-emerald-500"></i>
                <span>3. Modules in ${activeSem.name}</span>
            </h3>

            <!-- MODULE LIST WITH CLICKABLE COLOR DOTS -->
            <div id="settingsModuleList" class="space-y-2">
                ${activeSem.modules && activeSem.modules.length > 0 ? activeSem.modules.map(m => `
                    <div class="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-3">
                                <!-- CLICKABLE COLOR CIRCLE -->
                                <button type="button" onclick="toggleModuleColorPicker('${m.id}')"
                                    class="w-4 h-4 rounded-full border border-slate-700 hover:scale-125 transition-transform flex-shrink-0 relative group"
                                    style="background-color: ${m.color || '#3b82f6'}" title="Click to change color">
                                </button>
                                <div>
                                    <p class="text-xs font-bold text-slate-200">${m.name}</p>
                                    <p class="text-[10px] text-slate-400">${m.ects} ECTS • ${m.sws || 0} SWS • ${m.targetWeekly} hrs/week</p>
                                </div>
                            </div>
                            <button onclick="deleteCustomModule('${m.id}')" class="p-1.5 text-slate-500 hover:text-red-400 transition-colors">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        </div>

                        <!-- INLINE COLOR PALETTE FOR THIS MODULE -->
                        ${state.editingColorModuleId === m.id ? `
                            <div class="flex items-center gap-2 pt-2 border-t border-slate-800/80 flex-wrap">
                                <span class="text-[10px] text-slate-400 font-medium">Select Color:</span>
                                ${PRESET_COLORS.map(c => `
                                    <button type="button" onclick="changeModuleColor('${m.id}', '${c}')"
                                        class="w-5 h-5 rounded-full border ${m.color === c ? 'border-white ring-2 ring-blue-500/50 scale-110' : 'border-transparent hover:scale-110 opacity-80'}"
                                        style="background-color: ${c}">
                                    </button>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                `).join('') : `<p class="text-xs text-slate-500 py-2">No modules added to this semester yet.</p>`}
            </div>

            <!-- ADD NEW MODULE (BOTTOM PALETTE REMOVED) -->
            <div class="pt-3 border-t border-slate-800/80 space-y-3">
                <h4 class="text-xs font-semibold text-slate-400">Add New Module</h4>
                <div class="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <input type="text" id="newModName" placeholder="Module Name" class="sm:col-span-2 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200">
                    <input type="number" id="newModEcts" placeholder="ECTS (e.g. 6)" class="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200">
                    <input type="number" id="newModWeekly" placeholder="Hrs/Week" class="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200">
                </div>
                <button onclick="addCustomModule()" class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center space-x-1.5">
                    <i data-lucide="plus" class="w-4 h-4"></i>
                    <span>Save Module</span>
                </button>
            </div>
        </div>
        ` : ''}
    `;

    refreshIcons();
}

function selectNewModuleColor(color) {
    state.selectedModuleColor = color;
    renderDegreeSemesterManagement();
}

function switchDegree(degId) {
    state.activeDegreeId = degId;
    const deg = getActiveDegree();
    if (deg && deg.semesters && deg.semesters.length > 0) {
        state.activeSemesterId = deg.semesters[0].id;
    } else {
        state.activeSemesterId = null;
    }
    saveState();
    updateTopBarContext();
    renderDegreeSemesterManagement();
    renderModuleCards();
}

function switchSemester(semId) {
    state.activeSemesterId = semId;
    saveState();
    updateTopBarContext();
    renderDegreeSemesterManagement();
    renderModuleCards();
}

function addCustomDegree() {
    const input = document.getElementById('newDegreeName');
    const name = input ? input.value.trim() : '';
    if (!name) return;

    const newDeg = {
        id: 'deg_' + Date.now(),
        name: name,
        semesters: []
    };

    state.degrees.push(newDeg);
    state.activeDegreeId = newDeg.id;
    state.activeSemesterId = null;
    saveState();

    input.value = '';
    renderDegreeSemesterManagement();
    updateTopBarContext();
    renderModuleCards();
    showToast(`Degree "${name}" created!`, "success");
}

function addCustomSemester() {
    const deg = getActiveDegree();
    if (!deg) return;

    const input = document.getElementById('newSemesterName');
    const name = input ? input.value.trim() : '';
    if (!name) return;

    if (!deg.semesters) deg.semesters = [];

    const newSem = {
        id: 'sem_' + Date.now(),
        name: name,
        modules: []
    };

    deg.semesters.push(newSem);
    state.activeSemesterId = newSem.id;
    saveState();

    input.value = '';
    renderDegreeSemesterManagement();
    updateTopBarContext();
    renderModuleCards();
    showToast(`Semester "${name}" created!`, "success");
}

function addCustomModule() {
    const sem = getActiveSemester();
    if (!sem) return;

    const nameInput = document.getElementById('newModName');
    const ectsInput = document.getElementById('newModEcts');
    const weeklyInput = document.getElementById('newModWeekly');

    const name = nameInput ? nameInput.value.trim() : '';
    const ects = parseFloat(ectsInput?.value) || 5;
    const weekly = parseFloat(weeklyInput?.value) || 5;

    if (!name) {
        showToast("Module name required.", "error");
        return;
    }

    if (!sem.modules) sem.modules = [];

    const newModule = {
        id: 'mod_' + Date.now(),
        name: name,
        ects: ects,
        sws: Math.round(ects * 0.75),
        targetWeekly: weekly,
        color: state.selectedModuleColor || PRESET_COLORS[0]
    };

    sem.modules.push(newModule);
    saveState();

    // Auto-cycle active selected color for convenience
    const currentIdx = PRESET_COLORS.indexOf(state.selectedModuleColor);
    state.selectedModuleColor = PRESET_COLORS[(currentIdx + 1) % PRESET_COLORS.length];

    nameInput.value = '';
    renderDegreeSemesterManagement();
    renderModuleCards();
    showToast(`Module "${name}" added!`, "success");
}

function deleteCustomModule(id) {
    const sem = getActiveSemester();
    if (!sem || !sem.modules) return;

    if (confirm("Delete this module?")) {
        sem.modules = sem.modules.filter(m => m.id !== id);
        state.sessions = state.sessions.filter(s => s.moduleId !== id);
        saveState();
        renderDegreeSemesterManagement();
        renderModuleCards();
        showToast("Module removed.", "info");
    }
}

// --- EXPORT & IMPORT ---
function exportCSV() {
    let csv = "ID;Date;CalendarWeek;Module;Category;Duration_Hrs;Notes\n";
    const modules = getActiveModules();
    state.sessions.forEach(s => {
        const mod = modules.find(m => m.id === s.moduleId);
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
                showToast("Backup restored successfully!", "success");
                switchTab('quicktrack');
            }
        } catch (err) {
            showToast("Invalid JSON file.", "error");
        }
    };
    reader.readAsText(file);
}

function resetData() {
    if (confirm("Are you sure you want to reset all profile data?")) {
        state.degrees = [];
        state.sessions = [];
        state.activeDegreeId = null;
        state.activeSemesterId = null;
        saveState();
        closeModal('backupModal');
        showToast("Profile data reset.", "info");
        switchTab('setup');
    }
}

function toggleModuleColorPicker(id) {
    state.editingColorModuleId = state.editingColorModuleId === id ? null : id;
    renderDegreeSemesterManagement();
}

function changeModuleColor(id, newColor) {
    const sem = getActiveSemester();
    if (!sem || !sem.modules) return;

    const mod = sem.modules.find(m => m.id === id);
    if (mod) {
        mod.color = newColor;
        saveState();
        state.editingColorModuleId = null;
        renderDegreeSemesterManagement();
        renderModuleCards();
        renderWeeklyDashboard();
        showToast(`Updated color for "${mod.name}"`, "success");
    }
}

function addCustomModule() {
    const sem = getActiveSemester();
    if (!sem) return;

    const nameInput = document.getElementById('newModName');
    const ectsInput = document.getElementById('newModEcts');
    const weeklyInput = document.getElementById('newModWeekly');

    const name = nameInput ? nameInput.value.trim() : '';
    const ects = parseFloat(ectsInput?.value) || 5;
    const weekly = parseFloat(weeklyInput?.value) || 5;

    if (!name) {
        showToast("Module name required.", "error");
        return;
    }

    if (!sem.modules) sem.modules = [];

    // Auto-assign a unique color from PRESET_COLORS based on current module count
    const assignedColor = PRESET_COLORS[sem.modules.length % PRESET_COLORS.length];

    const newModule = {
        id: 'mod_' + Date.now(),
        name: name,
        ects: ects,
        sws: Math.round(ects * 0.75),
        targetWeekly: weekly,
        color: assignedColor
    };

    sem.modules.push(newModule);
    saveState();

    nameInput.value = '';
    renderDegreeSemesterManagement();
    renderModuleCards();
    showToast(`Module "${name}" added!`, "success");
}