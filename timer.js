function switchTrackerMode(mode) {
    const quickContainer = document.getElementById('quick-track-container');
    const timerContainer = document.getElementById('timer-container');
    const quickBtn = document.getElementById('mode-quick-btn');
    const timerBtn = document.getElementById('mode-timer-btn');

    if (mode === 'quick') {
        quickContainer?.classList.remove('hidden');
        timerContainer?.classList.add('hidden');
        quickBtn?.classList.add('bg-blue-600', 'text-white');
        quickBtn?.classList.remove('text-slate-400');
        timerBtn?.classList.remove('bg-blue-600', 'text-white');
        timerBtn?.classList.add('text-slate-400');
    } else {
        quickContainer?.classList.add('hidden');
        timerContainer?.classList.remove('hidden');
        timerBtn?.classList.add('bg-blue-600', 'text-white');
        timerBtn?.classList.remove('text-slate-400');
        quickBtn?.classList.remove('bg-blue-600', 'text-white');
        quickBtn?.classList.add('text-slate-400');
    }
}

function toggleTimer() {
    const startBtn = document.getElementById('startTimerBtn');
    if (!state.timerRunning) {
        state.timerRunning = true;
        if (startBtn) {
            startBtn.innerHTML = `<i data-lucide="pause" class="w-5 h-5"></i><span>Pause</span>`;
            startBtn.classList.remove('bg-emerald-600', 'hover:bg-emerald-500');
            startBtn.classList.add('bg-amber-600', 'hover:bg-amber-500');
        }

        state.timerInterval = setInterval(() => {
            state.timerSeconds++;
            updateTimerDisplay();
        }, 1000);
    } else {
        state.timerRunning = false;
        clearInterval(state.timerInterval);
        if (startBtn) {
            startBtn.innerHTML = `<i data-lucide="play" class="w-5 h-5"></i><span>Weiter</span>`;
            startBtn.classList.remove('bg-amber-600', 'hover:bg-amber-500');
            startBtn.classList.add('bg-emerald-600', 'hover:bg-emerald-500');
        }

        const hours = (state.timerSeconds / 3600).toFixed(2);
        if (parseFloat(hours) > 0) {
            updateDurationFromRange(hours);
            showToast(`Timer gestoppt: ${hours} Stunden eingetragen.`, "info");
        }
    }
    refreshIcons();
}

function resetTimer() {
    state.timerRunning = false;
    clearInterval(state.timerInterval);
    state.timerSeconds = 0;
    updateTimerDisplay();
    const startBtn = document.getElementById('startTimerBtn');
    if (startBtn) {
        startBtn.innerHTML = `<i data-lucide="play" class="w-5 h-5"></i><span>Start</span>`;
        startBtn.classList.remove('bg-amber-600');
        startBtn.classList.add('bg-emerald-600');
    }
    refreshIcons();
}

function updateTimerDisplay() {
    const hrs = Math.floor(state.timerSeconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((state.timerSeconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (state.timerSeconds % 60).toString().padStart(2, '0');
    const disp = document.getElementById('timerDisplay');
    if (disp) disp.innerText = `${hrs}:${mins}:${secs}`;
}