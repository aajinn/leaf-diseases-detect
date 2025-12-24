// Dark Mode Toggle
function initializeDarkMode() {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
        document.documentElement.classList.add('dark');
    }
    updateDarkModeButton();
}

function toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', isDark);
    updateDarkModeButton();
}

function updateDarkModeButton() {
    const button = document.getElementById('darkModeBtn');
    const icon = document.getElementById('darkModeIcon');
    
    if (button && icon) {
        const isDark = document.documentElement.classList.contains('dark');
        icon.className = isDark ? 'fas fa-sun text-xs' : 'fas fa-moon text-xs';
        button.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', initializeDarkMode);