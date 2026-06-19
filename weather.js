// ============================================================
// WEATHER DASHBOARD — Async JavaScript & RESTful API
// Uses Open-Meteo (free, no API key needed) + Geocoding API
// ============================================================

// ---------- DOM ELEMENTS ----------
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const errorBox = document.getElementById('error-box');
const errorMsg = document.getElementById('error-msg');
const loading = document.getElementById('loading');
const weatherDisplay = document.getElementById('weather-display');
const defaultMsg = document.getElementById('default-msg');

// ---------- SHOW / HIDE HELPERS ----------
function showLoading() {
    loading.classList.remove('hidden');
    errorBox.classList.add('hidden');
    weatherDisplay.classList.add('hidden');
    defaultMsg.classList.add('hidden');
}

function showError(message) {
    loading.classList.add('hidden');
    weatherDisplay.classList.add('hidden');
    defaultMsg.classList.add('hidden');
    errorBox.classList.remove('hidden');
    errorMsg.textContent = message;
}

function showWeather() {
    loading.classList.add('hidden');
    errorBox.classList.add('hidden');
    defaultMsg.classList.add('hidden');
    weatherDisplay.classList.remove('hidden');
}

// ---------- FORMAT HELPERS ----------
function formatTime(unixTimestamp, timezoneOffset) {
    const date = new Date((unixTimestamp + timezoneOffset) * 1000);
    let hours = date.getUTCHours();
    let minutes = date.getUTCMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutes} ${ampm}`;
}

function formatDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return now.toLocaleDateString('en-US', options);
}

// ---------- RENDER WEATHER DATA ----------
function renderWeather(data) {
    // Parse nested JSON objects from API response
    const main = data.main;
    const weather = data.weather[0];
    const wind = data.wind;
    const sys = data.sys;

    // Main info
    document.getElementById('city-name').textContent =
        `${data.name}, ${sys.country}`;
    document.getElementById('weather-date').textContent = formatDate();
    document.getElementById('weather-desc').textContent = weather.description;
    document.getElementById('weather-icon').src =
        `https://openweathermap.org/img/wn/${weather.icon}@2x.png`;
    document.getElementById('weather-icon').alt = weather.description;

    // Temperature
    document.getElementById('temp-main').textContent =
        `${Math.round(main.temp)}°C`;
    document.getElementById('feels-like').textContent =
        Math.round(main.feels_like);

    // Stats
    document.getElementById('humidity').textContent = `${main.humidity}%`;
    document.getElementById('wind-speed').textContent =
        `${Math.round(wind.speed * 3.6)} km/h`;
    document.getElementById('visibility').textContent =
        `${(data.visibility / 1000).toFixed(1)} km`;
    document.getElementById('pressure').textContent = `${main.pressure} hPa`;
    document.getElementById('sunrise').textContent =
        formatTime(sys.sunrise, data.timezone);
    document.getElementById('sunset').textContent =
        formatTime(sys.sunset, data.timezone);

    showWeather();
}

// ---------- FETCH WEATHER (async/await + error handling) ----------
async function fetchWeather(city) {
    showLoading();

    // API key — free tier from OpenWeatherMap
    const API_KEY = 'bd5e378503939ddaee76f12ad7a97608';
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;

    try {
        // Fetch API call
        const response = await fetch(url);

        // Parse the JSON response (nested JSON object)
        const data = await response.json();

        // Handle API-level errors (city not found, etc.)
        if (!response.ok) {
            if (response.status === 404) {
                showError(`City "${city}" not found. Please check the spelling and try again.`);
            } else if (response.status === 401) {
                showError('API key error. Please try again later.');
            } else {
                showError(`Error ${response.status}: Something went wrong. Please try again.`);
            }
            return;
        }

        // Render the weather data
        renderWeather(data);

    } catch (error) {
        // Handle network failures
        if (error.name === 'TypeError') {
            showError('Network error — please check your internet connection and try again.');
        } else {
            showError('Something went wrong. Please try again.');
        }
    }
}

// ---------- SEARCH EVENTS ----------
// Button click
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city === '') {
        showError('Please enter a city name.');
        return;
    }
    fetchWeather(city);
});

// Enter key press
cityInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city === '') {
            showError('Please enter a city name.');
            return;
        }
        fetchWeather(city);
    }
});

// ---------- LOAD DEFAULT CITY ----------
// Show Chennai weather on page load
fetchWeather('Chennai');