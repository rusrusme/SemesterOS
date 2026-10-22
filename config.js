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

// --- PREDEFINED VIBRANT MODULE COLORS ---
const PRESET_COLORS = [
    '#3b82f6', // Blue
    '#10b981', // Emerald Green
    '#f59e0b', // Amber Orange
    '#ec4899', // Pink
    '#8b5cf6', // Purple
    '#ef4444', // Red
    '#06b6d4', // Cyan
    '#84cc16', // Lime
    '#f97316'  // Bright Orange
];

// --- GLOBAL STATE ---
let state = {
    currentUser: localStorage.getItem('studytrack_current_user') || null,
    degrees: [],
    activeDegreeId: null,
    activeSemesterId: null,
    editingColorModuleId: null, // Tracks which module's color picker is open
    sessions: [],
    selectedModuleId: null,
    selectedDuration: 1.5,
    selectedCategory: 'Self-Study',
    currentKw: 1,
    timerRunning: false,
    timerSeconds: 0,
    timerInterval: null
};

// --- HIERARCHY HELPERS (NULL-SAFE) ---
function getActiveDegree() {
    if (!state.degrees || state.degrees.length === 0) return null;
    return state.degrees.find(d => d.id === state.activeDegreeId) || state.degrees[0] || null;
}

function getActiveSemester() {
    const deg = getActiveDegree();
    if (!deg || !deg.semesters || deg.semesters.length === 0) return null;
    return deg.semesters.find(s => s.id === state.activeSemesterId) || deg.semesters[0] || null;
}

function getActiveModules() {
    const sem = getActiveSemester();
    return sem && sem.modules ? sem.modules : [];
}

// --- LOCAL STORAGE WITH USER SCOPE ---
function loadState() {
    state.currentUser = localStorage.getItem('studytrack_current_user');
    if (!state.currentUser) return;

    const prefix = `studytrack_${state.currentUser}_`;
    const savedDegrees = localStorage.getItem(prefix + 'degrees');
    const savedSessions = localStorage.getItem(prefix + 'sessions');
    const savedActiveDeg = localStorage.getItem(prefix + 'activeDegreeId');
    const savedActiveSem = localStorage.getItem(prefix + 'activeSemesterId');

    if (savedDegrees) {
        try { state.degrees = JSON.parse(savedDegrees); } catch (e) { state.degrees = []; }
    } else {
        state.degrees = [];
        saveState();
    }

    if (savedSessions) {
        try { state.sessions = JSON.parse(savedSessions); } catch (e) { state.sessions = []; }
    }

    state.activeDegreeId = savedActiveDeg || (state.degrees[0] ? state.degrees[0].id : null);
    const activeDeg = getActiveDegree();
    state.activeSemesterId = savedActiveSem || (activeDeg && activeDeg.semesters && activeDeg.semesters[0] ? activeDeg.semesters[0].id : null);

    const activeMods = getActiveModules();
    state.selectedModuleId = activeMods.length > 0 ? activeMods[0].id : null;

    state.currentKw = getCurrentISOWeek();
}

function saveState() {
    if (!state.currentUser) return;
    const prefix = `studytrack_${state.currentUser}_`;

    localStorage.setItem(prefix + 'degrees', JSON.stringify(state.degrees));
    localStorage.setItem(prefix + 'sessions', JSON.stringify(state.sessions));
    if (state.activeDegreeId) localStorage.setItem(prefix + 'activeDegreeId', state.activeDegreeId);
    if (state.activeSemesterId) localStorage.setItem(prefix + 'activeSemesterId', state.activeSemesterId);
}