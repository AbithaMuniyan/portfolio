/* ============================================================
   CLIENT-SIDE ROUTER
   Switches visible page based on URL hash — no page reload
   ============================================================ */
const routes = ['home', 'about', 'projects', 'todo', 'weather', 'contact'];

function navigate(route) {
    if (!routes.includes(route)) route = 'home';

    // Hide all pages, show the target one
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById('page-' + route).classList.add('active');

    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    document.querySelector(`.nav-link[data-route="${route}"]`).classList.add('active');

    // Update the URL hash without reloading the page
    history.pushState(null, '', '#' + route);

    // Close mobile menu if open
    document.getElementById('main-nav').classList.remove('open');

    // Scroll to top on route change
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Handle nav link clicks
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        navigate(link.dataset.route);
    });
});

// Handle browser back/forward buttons
window.addEventListener('popstate', () => {
    const route = window.location.hash.replace('#', '') || 'home';
    navigate(route);
});

// Handle initial page load — check if URL already has a hash
window.addEventListener('DOMContentLoaded', () => {
    const route = window.location.hash.replace('#', '') || 'home';
    navigate(route);
});

// Mobile hamburger menu toggle
document.getElementById('hamburger').addEventListener('click', () => {
    document.getElementById('main-nav').classList.toggle('open');
});


/* ============================================================
   THEME TOGGLE (persisted via localStorage)
   ============================================================ */
if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light-mode');
}
updateThemeLabel();

function toggleTheme() {
    document.body.classList.toggle('light-mode');
    localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
    updateThemeLabel();
}

function updateThemeLabel() {
    const btn = document.getElementById('theme-btn');
    btn.textContent = document.body.classList.contains('light-mode') ? '🌙 Dark' : '☀️ Light';
}


/* ============================================================
   TO-DO APP MODULE
   ============================================================ */
(function todoModule() {
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all';

    const form = document.getElementById('todo-form');
    const input = document.getElementById('task-input');
    const list = document.getElementById('todo-list');
    const itemsLeft = document.getElementById('items-left');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const clearCompletedBtn = document.getElementById('clear-completed');

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function renderTasks() {
        list.innerHTML = '';
        let filtered = tasks;
        if (currentFilter === 'active') filtered = tasks.filter(t => !t.completed);
        else if (currentFilter === 'completed') filtered = tasks.filter(t => t.completed);

        if (filtered.length === 0) {
            const p = document.createElement('p');
            p.className = 'empty-message';
            p.textContent = 'No tasks here. Add one above!';
            list.appendChild(p);
        }

        filtered.forEach(task => {
            const li = document.createElement('li');
            li.className = 'todo-item' + (task.completed ? ' completed' : '');
            li.dataset.id = task.id;
            li.innerHTML = `
                <input type="checkbox" class="todo-checkbox" ${task.completed ? 'checked' : ''} aria-label="Mark task complete">
                <span class="todo-text">${escapeHTML(task.text)}</span>
                <div class="todo-actions">
                    <button class="edit-btn">Edit</button>
                    <button class="delete-btn">Delete</button>
                </div>`;
            list.appendChild(li);
        });

        const activeCount = tasks.filter(t => !t.completed).length;
        itemsLeft.textContent = `${activeCount} item${activeCount === 1 ? '' : 's'} left`;
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;
        tasks.push({ id: Date.now(), text, completed: false });
        input.value = '';
        saveTasks();
        renderTasks();
    });

    list.addEventListener('click', (e) => {
        const li = e.target.closest('.todo-item');
        if (!li) return;
        const id = Number(li.dataset.id);
        const task = tasks.find(t => t.id === id);

        if (e.target.classList.contains('delete-btn')) {
            tasks = tasks.filter(t => t.id !== id);
            saveTasks(); renderTasks(); return;
        }
        if (e.target.classList.contains('todo-checkbox')) {
            task.completed = e.target.checked;
            saveTasks(); renderTasks(); return;
        }
        if (e.target.classList.contains('edit-btn')) {
            const span = li.querySelector('.todo-text');
            const editInput = document.createElement('input');
            editInput.type = 'text';
            editInput.className = 'todo-edit-input';
            editInput.value = task.text;
            const saveBtn = document.createElement('button');
            saveBtn.className = 'save-btn';
            saveBtn.textContent = 'Save';
            const actions = li.querySelector('.todo-actions');
            span.replaceWith(editInput);
            actions.innerHTML = '';
            actions.appendChild(saveBtn);
            editInput.focus();
            return;
        }
        if (e.target.classList.contains('save-btn')) {
            const editInput = li.querySelector('.todo-edit-input');
            const newText = editInput.value.trim();
            if (newText) { task.text = newText; saveTasks(); }
            renderTasks();
        }
    });

    list.addEventListener('keydown', (e) => {
        if (e.target.classList.contains('todo-edit-input') && e.key === 'Enter') {
            const li = e.target.closest('.todo-item');
            const id = Number(li.dataset.id);
            const task = tasks.find(t => t.id === id);
            const newText = e.target.value.trim();
            if (newText) { task.text = newText; saveTasks(); }
            renderTasks();
        }
    });

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });

    clearCompletedBtn.addEventListener('click', () => {
        tasks = tasks.filter(t => !t.completed);
        saveTasks(); renderTasks();
    });

    renderTasks();
})();


/* ============================================================
   WEATHER DASHBOARD MODULE (async/await + Fetch API)
   ============================================================ */
(function weatherModule() {
    const cityInput = document.getElementById('city-input');
    const searchBtn = document.getElementById('search-btn');
    const errorBox = document.getElementById('error-box');
    const loading = document.getElementById('loading');
    const weatherDisplay = document.getElementById('weather-display');
    const defaultMsg = document.getElementById('default-msg');

    function showLoading() {
        loading.classList.remove('hidden');
        errorBox.classList.add('hidden');
        weatherDisplay.classList.add('hidden');
        defaultMsg.classList.add('hidden');
    }
    function showError(msg) {
        loading.classList.add('hidden');
        weatherDisplay.classList.add('hidden');
        defaultMsg.classList.add('hidden');
        errorBox.classList.remove('hidden');
        errorBox.textContent = msg;
    }
    function showWeather() {
        loading.classList.add('hidden');
        errorBox.classList.add('hidden');
        defaultMsg.classList.add('hidden');
        weatherDisplay.classList.remove('hidden');
    }
    function formatTime(unix, tz) {
        const d = new Date((unix + tz) * 1000);
        let h = d.getUTCHours(), m = d.getUTCMinutes();
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        m = m < 10 ? '0' + m : m;
        return `${h}:${m} ${ampm}`;
    }
    function formatDate() {
        return new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }

    function renderWeather(data) {
        const { main, weather, wind, sys } = data;
        const w = weather[0];
        document.getElementById('city-name').textContent = `${data.name}, ${sys.country}`;
        document.getElementById('weather-date').textContent = formatDate();
        document.getElementById('weather-desc').textContent = w.description;
        document.getElementById('weather-icon').src = `https://openweathermap.org/img/wn/${w.icon}@2x.png`;
        document.getElementById('weather-icon').alt = w.description;
        document.getElementById('temp-main').textContent = `${Math.round(main.temp)}°C`;
        document.getElementById('feels-like').textContent = Math.round(main.feels_like);
        document.getElementById('humidity').textContent = `${main.humidity}%`;
        document.getElementById('wind-speed').textContent = `${Math.round(wind.speed * 3.6)} km/h`;
        document.getElementById('visibility').textContent = `${(data.visibility / 1000).toFixed(1)} km`;
        document.getElementById('pressure').textContent = `${main.pressure} hPa`;
        document.getElementById('sunrise').textContent = formatTime(sys.sunrise, data.timezone);
        document.getElementById('sunset').textContent = formatTime(sys.sunset, data.timezone);
        showWeather();
    }

    async function fetchWeather(city) {
        showLoading();
        const API_KEY = 'bd5e378503939ddaee76f12ad7a97608';
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            if (!response.ok) {
                if (response.status === 404) showError(`City "${city}" not found. Please check the spelling.`);
                else showError(`Error ${response.status}: Something went wrong.`);
                return;
            }
            renderWeather(data);
        } catch (err) {
            showError('Network error — please check your internet connection.');
        }
    }

    searchBtn.addEventListener('click', () => {
        const city = cityInput.value.trim();
        if (!city) { showError('Please enter a city name.'); return; }
        fetchWeather(city);
    });
    cityInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const city = cityInput.value.trim();
            if (!city) { showError('Please enter a city name.'); return; }
            fetchWeather(city);
        }
    });

    // Load default city once
    fetchWeather('Chennai');
})();