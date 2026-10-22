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
    { id: 'gbs', name: 'GBS (Betriebssysteme)', ects: 5, targetWeekly: 7.0, color: '#f59e0b' },
    { id: 'security', name: 'IT-Security', ects: 5, targetWeekly: 6.5, color: '#ec4899' },
    { id: 'signal', name: 'Signaltheorie', ects: 5, targetWeekly: 9.0, color: '#8b5cf6' }
];

// --- GLOBAL STATE ---
let state = {
    config: {
        semesterName: "SemesterOS",
        creditTarget: 30,
        weeksLecturePhase: 15,
        weeksExamPhase: 6
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

// --- LOCAL STORAGE LOGIC ---
function loadState() {
    const savedConfig = localStorage.getItem('studytrack_config');
    const savedModules = localStorage.getItem('studytrack_modules');
    const savedSessions = localStorage.getItem('studytrack_sessions');

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
    localStorage.setItem('studytrack_config', JSON.stringify(state.config));
    localStorage.setItem('studytrack_modules', JSON.stringify(state.modules));
    localStorage.setItem('studytrack_sessions', JSON.stringify(state.sessions));
}