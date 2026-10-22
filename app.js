// --- TAB NAVIGATION ---
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    const target = document.getElementById(`tab-${tabId}`);
    if (target) target.classList.remove('hidden');

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
    if (tabId === 'setup') renderDegreeSemesterManagement();
    refreshIcons();
}

// --- INITIALIZATION ON DOM READY ---
window.addEventListener('DOMContentLoaded', () => {
    loadState();
    displayCurrentUser();
    updateTopBarContext();
    initDateInput();
    renderModuleCards();
    renderHistoryModuleFilter();
    renderDegreeSemesterManagement();
    updateKwDisplay();
    switchTab('quicktrack');
    refreshIcons();
});