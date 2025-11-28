// Session Status Indicator
class SessionIndicator {
    constructor() {
        this.warningThreshold = 5 * 60 * 1000; // 5 minutes
        this.checkInterval = 60 * 1000; // Check every minute
        this.intervalId = null;
    }

    init() {
        if (!isProtectedPage()) return;

        this.createIndicator();
        this.startMonitoring();
    }

    createIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'sessionIndicator';
        indicator.className = 'fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 hidden z-50 border-l-4';
        indicator.innerHTML = `
            <div class="flex items-center space-x-3">
                <i class="fas fa-clock text-yellow-500"></i>
                <div>
                    <p class="font-semibold text-sm">Session Expiring Soon</p>
                    <p class="text-xs text-gray-600">Your session will expire in <span id="timeRemaining"></span></p>
                </div>
                <button onclick="sessionIndicator.extendSession()" class="bg-primary text-white px-3 py-1 rounded text-xs hover:bg-secondary">
                    Extend
                </button>
            </div>
        `;
        document.body.appendChild(indicator);
    }

    startMonitoring() {
        this.intervalId = setInterval(() => {
            this.checkSession();
        }, this.checkInterval);

        // Check immediately
        this.checkSession();
    }

    checkSession() {
        const loginTime = localStorage.getItem('login_time');
        if (!loginTime) return;

        const elapsed = Date.now() - parseInt(loginTime);
        const remaining = sessionManager.SESSION_DURATION - elapsed;

        if (remaining <= 0) {
            this.handleExpired();
        } else if (remaining <= this.warningThreshold) {
            this.showWarning(remaining);
        } else {
            this.hideWarning();
        }
    }

    showWarning(remaining) {
        const indicator = document.getElementById('sessionIndicator');
        const timeSpan = document.getElementById('timeRemaining');
        
        if (indicator && timeSpan) {
            const minutes = Math.floor(remaining / 60000);
            const seconds = Math.floor((remaining % 60000) / 1000);
            timeSpan.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            indicator.classList.remove('hidden');
            indicator.classList.add('border-yellow-500');
        }
    }

    hideWarning() {
        const indicator = document.getElementById('sessionIndicator');
        if (indicator) {
            indicator.classList.add('hidden');
        }
    }

    handleExpired() {
        clearInterval(this.intervalId);
        handleSessionExpired();
    }

    async extendSession() {
        // Verify session with server
        const profile = await getUserProfile();
        if (profile) {
            sessionManager.refreshSession();
            this.hideWarning();
            this.showSuccessMessage();
        } else {
            this.handleExpired();
        }
    }

    showSuccessMessage() {
        const indicator = document.getElementById('sessionIndicator');
        if (indicator) {
            indicator.innerHTML = `
                <div class="flex items-center space-x-3">
                    <i class="fas fa-check-circle text-green-500"></i>
                    <p class="font-semibold text-sm">Session Extended</p>
                </div>
            `;
            indicator.classList.remove('border-yellow-500');
            indicator.classList.add('border-green-500');
            
            setTimeout(() => {
                this.hideWarning();
                this.createIndicator(); // Recreate original indicator
            }, 3000);
        }
    }

    destroy() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        const indicator = document.getElementById('sessionIndicator');
        if (indicator) {
            indicator.remove();
        }
    }
}

// Initialize session indicator
const sessionIndicator = new SessionIndicator();

// Auto-initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        sessionIndicator.init();
    });
} else {
    sessionIndicator.init();
}
