// API Configuration is now in config.js
// This file expects API_URL to be defined globally by config.js

// Session Management
class SessionManager {
    constructor() {
        this.TOKEN_KEY = 'token';
        this.USER_KEY = 'user_data';
        this.LOGIN_TIME_KEY = 'login_time';
        this.SESSION_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
    }

    setSession(token, userData) {
        localStorage.setItem(this.TOKEN_KEY, token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(userData));
        localStorage.setItem(this.LOGIN_TIME_KEY, Date.now().toString());
    }

    getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    getUserData() {
        const data = localStorage.getItem(this.USER_KEY);
        return data ? JSON.parse(data) : null;
    }

    isSessionValid() {
        const token = this.getToken();
        const loginTime = localStorage.getItem(this.LOGIN_TIME_KEY);
        
        if (!token || !loginTime) {
            return false;
        }

        const elapsed = Date.now() - parseInt(loginTime);
        return elapsed < this.SESSION_DURATION;
    }

    clearSession() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        localStorage.removeItem(this.LOGIN_TIME_KEY);
    }

    refreshSession() {
        if (this.getToken()) {
            localStorage.setItem(this.LOGIN_TIME_KEY, Date.now().toString());
        }
    }
}

const sessionManager = new SessionManager();

// Auto-refresh session on user activity
let activityTimeout;
function resetActivityTimer() {
    clearTimeout(activityTimeout);
    sessionManager.refreshSession();
    
    // Check session validity
    if (!sessionManager.isSessionValid() && isProtectedPage()) {
        handleSessionExpired();
    }
}

// Track user activity
['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, resetActivityTimer, true);
});

function isProtectedPage() {
    return window.location.pathname.includes('dashboard') || 
           window.location.pathname.includes('history');
}

async function handleSessionExpired() {
    sessionManager.clearSession();
    try {
        if (typeof showAlert === 'function') {
            await showAlert('Your session has expired. Please login again.', 'Session Expired', 'info');
        } else if (typeof notificationManager !== 'undefined' && typeof notificationManager.alert === 'function') {
            await notificationManager.alert('Your session has expired. Please login again.', 'Session Expired', 'info');
        } else {
            // Notification system not available — log warning and continue to redirect
            console.warn('Session expired but notification system unavailable. Redirecting to login.');
        }
    } catch (e) {
        console.error('Notification error:', e);
    }

    window.location.href = '/login';
}

// Authentication Functions
async function register(email, username, password, fullName) {
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                username: username,
                password: password,
                full_name: fullName
            })
        });

        const data = await response.json();

        if (response.ok) {
            return { success: true, data: data };
        } else {
            return { success: false, error: data.detail || 'Registration failed' };
        }
    } catch (error) {
        console.error('Registration error:', error);
        return { success: false, error: 'Network error. Please try again.' };
    }
}

async function login(username, password) {
    try {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            // Fetch user profile to get complete user data
            const profileResponse = await fetch(`${API_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${data.access_token}`
                }
            });

            if (profileResponse.ok) {
                const userData = await profileResponse.json();
                sessionManager.setSession(data.access_token, userData);
                return { success: true, data: userData };
            } else {
                // Fallback if profile fetch fails
                sessionManager.setSession(data.access_token, { username });
                return { success: true, data: { username } };
            }
        } else {
            return { success: false, error: data.detail || 'Login failed' };
        }
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: 'Network error. Please try again.' };
    }
}

async function getUserProfile() {
    // Check session validity first
    if (!sessionManager.isSessionValid()) {
        return null;
    }

    const token = sessionManager.getToken();
    if (!token) {
        return null;
    }

    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const userData = await response.json();
            // Update stored user data
            sessionManager.setSession(token, userData);
            return userData;
        } else if (response.status === 401) {
            // Token is invalid or expired
            sessionManager.clearSession();
            return null;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Get profile error:', error);
        return null;
    }
}

function logout() {
    sessionManager.clearSession();
    window.location.href = '/';
}

function isAuthenticated() {
    return sessionManager.getToken() !== null && sessionManager.isSessionValid();
}

async function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
        return false;
    }

    // Verify token is still valid with server
    const profile = await getUserProfile();
    if (!profile) {
        sessionManager.clearSession();
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
        return false;
    }

    return true;
}

function getAuthHeaders() {
    const token = sessionManager.getToken();
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

// Enhanced API call wrapper with session handling
async function authenticatedFetch(url, options = {}) {
    if (!isAuthenticated()) {
        throw new Error('Not authenticated');
    }

    const headers = {
        ...getAuthHeaders(),
        ...options.headers
    };

    try {
        const response = await fetch(url, { ...options, headers });

        if (response.status === 401) {
            // Token expired or invalid
            handleSessionExpired();
            throw new Error('Session expired');
        }

        return response;
    } catch (error) {
        console.error('Authenticated fetch error:', error);
        throw error;
    }
}

// Check authentication on protected pages
if (isProtectedPage()) {
    requireAuth();
}

// Redirect to dashboard if already logged in on auth pages
if ((window.location.pathname.includes('login') || window.location.pathname.includes('register')) && isAuthenticated()) {
    window.location.href = '/dashboard';
}
