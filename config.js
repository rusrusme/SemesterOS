// --- TAILWIND CONFIGURATION ---
tailwind.config = {
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                brand: {
                    50: '#f0f6ff', 100: '#e0edff', 500: '#3b82f6',
                    600: '#2563eb', 700: '#1d4ed8', 900: '#1e3a8a',
                }
            }
        }
    }
};

// --- DEFAULT MODULES ---
const DEFAULT_MODULES = [
    { id: 'analysis', name: 'Analysis', ects: 8, targetWeekly: 11.0, color: '#3b82f6' },
    { id: 'gdb', name: 'GDB (Datenbanken)', ects: 6, targetWeekly: 8.5, color: '#10b981' },
    { id: 'gbs', name: 'GBS (Betriebssysteme)', ects: 5, targetWeekly: 7.0, color: '#f59e0b' }
];

// --- GLOBAL STATE ---
let state = {
    currentUser: localStorage.getItem('studytrack_current_user') || null,
    config: {
        semesterName: "SemesterOS",
        creditTarget: 30
    },
    modules: [],
    sessions: [],
    selectedModuleId: null,
    selectedDuration: 1.5,
    selectedCategory: 'Selbststudium',
    currentKw: 1,
    timerRunning: false,
    timerSeconds: 0,
    timerInterval: null
};

// --- LOCAL STORAGE LOGIC WITH USER SCOPE ---
function loadState() {
    state.currentUser = localStorage.getItem('studytrack_current_user');
    if (!state.currentUser) return;

    const userPrefix = `studytrack_${state.currentUser}_`;

    const savedConfig = localStorage.getItem(userPrefix + 'config');
    const savedModules = localStorage.getItem(userPrefix + 'modules');
    const savedSessions = localStorage.getItem(userPrefix + 'sessions');

    if (savedConfig) {
        try { state.config = JSON.parse(savedConfig); } catch (e) { }
    }
    if (savedSessions) {
        try { state.sessions = JSON.parse(savedSessions); } catch (e) { state.sessions = []; }
    }

    if (savedModules) {
        try { state.modules = JSON.parse(savedModules); } catch (e) { state.modules = DEFAULT_MODULES; }
    } else {
        state.modules = DEFAULT_MODULES;
        saveState();
    }

    if (state.modules.length > 0) {
        state.selectedModuleId = state.modules[0].id;
    }

    state.currentKw = getCurrentISOWeek();
}

function saveState() {
    if (!state.currentUser) return;
    const userPrefix = `studytrack_${state.currentUser}_`;

    localStorage.setItem(userPrefix + 'config', JSON.stringify(state.config));
    localStorage.setItem(userPrefix + 'modules', JSON.stringify(state.modules));
    localStorage.setItem(userPrefix + 'sessions', JSON.stringify(state.sessions));
}