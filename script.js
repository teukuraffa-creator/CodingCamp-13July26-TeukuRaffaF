document.addEventListener('DOMContentLoaded', () => {

  const KEYS = {
    theme: 'dashboard_theme',
    name: 'dashboard_username',
    tasks: 'dashboard_tasks',
    links: 'dashboard_links',
    duration: 'dashboard_timer_duration'
  };

  const themeToggle = document.getElementById('themeToggle');

  function applyTheme(theme) {
    document.body.classList.toggle('dark', theme === 'dark');
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  function initTheme() {
    const saved = localStorage.getItem(KEYS.theme) ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(saved);
  }

  themeToggle.addEventListener('click', () => {
    const next = document.body.classList.contains('dark') ? 'light' : 'dark';
    localStorage.setItem(KEYS.theme, next);
    applyTheme(next);
  });

  const clockEl = document.getElementById('clock');
  const dateEl = document.getElementById('date');
  const greetingEl = document.getElementById('greeting');
  const editNameBtn = document.getElementById('editNameBtn');
  const nameEditor = document.getElementById('nameEditor');
  const nameInput = document.getElementById('nameInput');
  const saveNameBtn = document.getElementById('saveNameBtn');

  function getGreetingWord(hour) {
    if (hour < 5) return 'Good Night';
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }

  function renderGreeting() {
    const name = localStorage.getItem(KEYS.name);
    const word = getGreetingWord(new Date().getHours());
    greetingEl.textContent = name ? `${word}, ${name}` : word;
  }

  function tick() {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString('en-US', { hour12: false });
    dateEl.textContent = now.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    renderGreeting();
  }

  editNameBtn.addEventListener('click', () => {
    nameEditor.classList.toggle('hidden');
    nameInput.value = localStorage.getItem(KEYS.name) || '';
    if (!nameEditor.classList.contains('hidden')) nameInput.focus();
  });

  saveNameBtn.addEventListener('click', saveName);
  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveName();
  });

  function saveName() {
    const value = nameInput.value.trim();
    if (value) {
      localStorage.setItem(KEYS.name, value);
    } else {
      localStorage.removeItem(KEYS.name);
    }
    nameEditor.classList.add('hidden');
    renderGreeting();
  }

  setInterval(tick, 1000);
  tick();

  const timerDisplay = document.getElementById('timerDisplay');
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const resetBtn = document.getElementById('resetBtn');
  const durationInput = document.getElementById('durationInput');
  const applyDurationBtn = document.getElementById('applyDurationBtn');

  let sessionMinutes = parseInt(localStorage.getItem(KEYS.duration), 10) || 25;
  let remainingSeconds = sessionMinutes * 60;
  let timerInterval = null;

  durationInput.value = sessionMinutes;

  function formatTime(totalSeconds) {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function renderTimer() {
    timerDisplay.textContent = formatTime(remainingSeconds);
  }

  function startTimer() {
    if (timerInterval) return;
    startBtn.disabled = true;
    timerInterval = setInterval(() => {
      if (remainingSeconds <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        startBtn.disabled = false;
        timerDisplay.textContent = "Time's up!";
        try {
          new Audio(
            'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA='
          ).play();
        } catch (e) { /* ignore audio errors */ }
        return;
      }
      remainingSeconds--;
      renderTimer();
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    startBtn.disabled = false;
  }

  function resetTimer() {
    stopTimer();
    remainingSeconds = sessionMinutes * 60;
    renderTimer();
  }

  applyDurationBtn.addEventListener('click', () => {
    let minutes = parseInt(durationInput.value, 10);
    if (!minutes || minutes < 1) minutes = 25;
    if (minutes > 120) minutes = 120;
    sessionMinutes = minutes;
    durationInput.value = minutes;
    localStorage.setItem(KEYS.duration, minutes);
    resetTimer();
  });

  startBtn.addEventListener('click', startTimer);
  stopBtn.addEventListener('click', stopTimer);
  resetBtn.addEventListener('click', resetTimer);

  renderTimer();

  const taskForm = document.getElementById('taskForm');
  const taskInput = document.getElementById('taskInput');
  const taskList = document.getElementById('taskList');
  const duplicateWarning = document.getElementById('duplicateWarning');
  const emptyState = document.getElementById('emptyState');
  const sortSelect = document.getElementById('sortSelect');

  function loadTasks() {
    try {
      return JSON.parse(localStorage.getItem(KEYS.tasks)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveTasks(tasks) {
    localStorage.setItem(KEYS.tasks, JSON.stringify(tasks));
  }

  let tasks = loadTasks();

  function getSortedTasks() {
    const mode = sortSelect.value;
    const copy = [...tasks];
    if (mode === 'alpha') {
      copy.sort((a, b) => a.text.localeCompare(b.text));
    } else if (mode === 'done') {
      copy.sort((a, b) => Number(a.done) - Number(b.done));
    }
    return copy;
  }

  function renderTasks() {
    taskList.innerHTML = '';
    const visible = getSortedTasks();
    emptyState.classList.toggle('hidden', visible.length > 0);

    visible.forEach((task) => {
      const li = document.createElement('li');
      li.className = 'task-item' + (task.done ? ' done' : '');
      li.dataset.id = task.id;

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'task-checkbox';
      checkbox.checked = task.done;
      checkbox.addEventListener('change', () => toggleDone(task.id));

      const text = document.createElement('span');
      text.className = 'task-text';
      text.textContent = task.text;
      text.contentEditable = 'true';
      text.spellcheck = false;
      text.addEventListener('blur', () => editTask(task.id, text.textContent));
      text.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          text.blur();
        }
      });

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'task-delete';
      deleteBtn.textContent = 'Delete';
      deleteBtn.addEventListener('click', () => deleteTask(task.id));

      li.appendChild(checkbox);
      li.appendChild(text);
      li.appendChild(deleteBtn);
      taskList.appendChild(li);
    });
  }

  function isDuplicate(text, ignoreId = null) {
    const normalized = text.trim().toLowerCase();
    return tasks.some((t) => t.id !== ignoreId && t.text.trim().toLowerCase() === normalized);
  }

  taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const value = taskInput.value.trim();
    if (!value) return;

    if (isDuplicate(value)) {
      duplicateWarning.classList.remove('hidden');
      return;
    }
    duplicateWarning.classList.add('hidden');

    tasks.push({ id: Date.now().toString(), text: value, done: false });
    saveTasks(tasks);
    taskInput.value = '';
    renderTasks();
  });

  taskInput.addEventListener('input', () => {
    duplicateWarning.classList.add('hidden');
  });

  function toggleDone(id) {
    tasks = tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
    saveTasks(tasks);
    renderTasks();
  }

  function editTask(id, newText) {
    const trimmed = newText.trim();
    const current = tasks.find((t) => t.id === id);
    if (!current) return;

    if (!trimmed) {
      // Editing to empty text deletes the task
      deleteTask(id);
      return;
    }
    if (isDuplicate(trimmed, id)) {
      duplicateWarning.classList.remove('hidden');
      renderTasks(); // revert visual text to stored value
      return;
    }
    tasks = tasks.map((t) => (t.id === id ? { ...t, text: trimmed } : t));
    saveTasks(tasks);
    renderTasks();
  }

  function deleteTask(id) {
    tasks = tasks.filter((t) => t.id !== id);
    saveTasks(tasks);
    renderTasks();
  }

  sortSelect.addEventListener('change', renderTasks);

  renderTasks();

  const linkForm = document.getElementById('linkForm');
  const linkNameInput = document.getElementById('linkNameInput');
  const linkUrlInput = document.getElementById('linkUrlInput');
  const linkList = document.getElementById('linkList');

  const DEFAULT_LINKS = [
    { id: 'default-google', name: 'Google', url: 'https://www.google.com' },
    { id: 'default-gmail', name: 'Gmail', url: 'https://mail.google.com' },
    { id: 'default-calendar', name: 'Calendar', url: 'https://calendar.google.com' }
  ];

  function loadLinks() {
    try {
      const stored = JSON.parse(localStorage.getItem(KEYS.links));
      return stored && stored.length ? stored : DEFAULT_LINKS;
    } catch (e) {
      return DEFAULT_LINKS;
    }
  }

  function saveLinks(links) {
    localStorage.setItem(KEYS.links, JSON.stringify(links));
  }

  let links = loadLinks();

  function normalizeUrl(url) {
    if (!/^https?:\/\//i.test(url)) {
      return `https://${url}`;
    }
    return url;
  }

  function renderLinks() {
    linkList.innerHTML = '';
    links.forEach((link) => {
      const a = document.createElement('a');
      a.className = 'link-chip';
      a.href = link.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';

      const label = document.createElement('span');
      label.textContent = link.name;

      const removeBtn = document.createElement('button');
      removeBtn.className = 'link-remove';
      removeBtn.textContent = '✕';
      removeBtn.title = 'Remove link';
      removeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        deleteLink(link.id);
      });

      a.appendChild(label);
      a.appendChild(removeBtn);
      linkList.appendChild(a);
    });
  }

  function deleteLink(id) {
    links = links.filter((l) => l.id !== id);
    saveLinks(links);
    renderLinks();
  }

  linkForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = linkNameInput.value.trim();
    const url = linkUrlInput.value.trim();
    if (!name || !url) return;

    links.push({ id: Date.now().toString(), name, url: normalizeUrl(url) });
    saveLinks(links);
    linkNameInput.value = '';
    linkUrlInput.value = '';
    renderLinks();
  });

  renderLinks();

  initTheme();
});
