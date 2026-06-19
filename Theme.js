// Apply saved theme on page load
if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light-mode');
    updateBtnLabel();
}

function toggleDarkMode() {
    document.body.classList.toggle('light-mode');
    if (document.body.classList.contains('light-mode')) {
        localStorage.setItem('theme', 'light');
    } else {
        localStorage.setItem('theme', 'dark');
    }
    updateBtnLabel();
}

function updateBtnLabel() {
    const btn = document.getElementById('theme-btn');
    if (!btn) return;
    btn.textContent = document.body.classList.contains('light-mode') ? '🌙 Dark Mode' : '☀️ Light Mode';
}