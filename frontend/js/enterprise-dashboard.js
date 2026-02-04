// Enterprise Dashboard JavaScript

let usageTrendsChart = null;
let accessTypeChart = null;
const historyState = {
    limit: 20,
    offset: 0,
    total: 0
};

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Enterprise Dashboard loading...');
    
    // Check authentication
    if (!isAuthenticated()) {
        window.location.href = '/login?redirect=/enterprise-dashboard';
        return;
    }
    
    // Load user info
    await loadUserInfo();
    
    // Check enterprise access
    const hasAccess = await checkEnterpriseAccess();
    if (!hasAccess) {
        showError('Enterprise subscription required to access this dashboard.');
        setTimeout(() => {
            window.location.href = '/subscription';
        }, 3000);
        return;
    }
    
    // Load dashboard data
    await loadDashboardData();
    
    // Setup event listeners
    setupEventListeners();
    
    // Show dashboard
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('dashboardContent').classList.remove('hidden');
    
    console.log('✅ Enterprise Dashboard loaded successfully');
});

// Load user information
async function loadUserInfo() {
    try {
        const response = await authenticatedFetch(`${API_URL}/auth/me`);
        const user = await response.json();
        
        document.getElementById('userInfo').textContent = `${user.full_name || user.username}`;
    } catch (error) {
        console.error('Error loading user info:', error);
    }
}

// Check enterprise access
async function checkEnterpriseAccess() {
    try {
        const response = await authenticatedFetch(`${API_URL}/api/enterprise/status`);
        return response.ok;
    } catch (error) {
        console.error('Error checking enterprise access:', error);
        return false;
    }
}

// Load all dashboard data
async function loadDashboardData() {
    try {
        await Promise.all([
            loadEnterpriseStatus(),
            loadApiKeys(),
            loadUsageAnalytics(),
            loadRecentActivity()
        ]);
        initQuickStartGuide();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showError('Failed to load dashboard data');
    }
}

// Load enterprise status and overview stats
async function loadEnterpriseStatus() {
    try {
        const response = await authenticatedFetch(`${API_URL}/api/enterprise/status`);
        const data = await response.json();
        
        // Update overview cards
        document.getElementById('rateLimit').textContent = data.plan.api_rate_limit_per_minute ?? '-';
        
        // Load API usage stats for totals
        const usageResponse = await authenticatedFetch(`${API_URL}/api/enterprise/usage-stats?days=60`);
        const usageStats = await usageResponse.json();
        const totalApiCalls = usageStats.total_api_requests ?? usageStats.total_analyses ?? 0;
        document.getElementById('totalApiCalls').textContent = totalApiCalls.toLocaleString();
        
        // Calculate monthly calls from daily stats
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyTotal = (usageStats.daily_stats || []).reduce((sum, day) => {
            const trendDate = new Date(day.date);
            if (trendDate.getMonth() === currentMonth && trendDate.getFullYear() === currentYear) {
                return sum + (day.total_analyses || 0);
            }
            return sum;
        }, 0);
        document.getElementById('monthlyApiCalls').textContent = monthlyTotal.toLocaleString();
        
    } catch (error) {
        console.error('Error loading enterprise status:', error);
    }
}

// Load API keys
async function loadApiKeys() {
    try {
        const response = await authenticatedFetch(`${API_URL}/api/enterprise/api-keys`);
        const data = await response.json();
        
        // Update active keys count
        const activeKeys = data.api_keys.filter(key => key.is_active);
        document.getElementById('activeApiKeys').textContent = activeKeys.length;
        
        // Render API keys table
        renderApiKeysTable(data.api_keys);
        
    } catch (error) {
        console.error('Error loading API keys:', error);
    }
}

// Render API keys table
function renderApiKeysTable(apiKeys) {
    const container = document.getElementById('apiKeysTable');
    
    if (apiKeys.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-key text-gray-400 text-4xl mb-4"></i>
                <p class="text-gray-600 dark:text-gray-300">No API keys created yet</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">Create your first API key to get started</p>
            </div>
        `;
        return;
    }
    
    const table = `
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
                <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Created</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Expires</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Usage</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                ${apiKeys.map(key => `
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div>
                                <div class="text-sm font-medium text-gray-900 dark:text-white">${key.name}</div>
                                ${key.description ? `<div class="text-sm text-gray-500 dark:text-gray-400">${key.description}</div>` : ''}
                            </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                key.is_active 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            }">
                                ${key.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            ${formatDate(key.created_at)}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            ${formatDate(key.expires_at)}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            ${key.usage_count || 0} calls
                            ${key.last_used ? `<br><span class="text-xs">Last: ${formatDate(key.last_used)}</span>` : ''}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button onclick="revokeApiKey('${key.key_id}')" 
                                    class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                                <i class="fas fa-trash mr-1"></i>Revoke
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = table;
}

// Load usage analytics and render charts
async function loadUsageAnalytics() {
    try {
        // Load usage statistics
        const statsResponse = await authenticatedFetch(`${API_URL}/api/enterprise/usage-stats?days=30`);
        const statsData = await statsResponse.json();
        const dailyStats = statsData.daily_stats || [];
        
        // Render usage trends chart with real data
        renderUsageTrendsChart(dailyStats);
        
        // Render access type chart (API vs Web)
        const totals = dailyStats.reduce(
            (acc, stat) => ({
                api: acc.api + (stat.api_calls || 0),
                web: acc.web + (stat.web_calls || 0)
            }),
            { api: 0, web: 0 }
        );
        renderAccessTypeChart({
            "API Calls": totals.api,
            "Web App": totals.web
        });
        
    } catch (error) {
        console.error('Error loading usage analytics:', error);
    }
}

// Render usage trends chart
function renderUsageTrendsChart(dailyStats) {
    const ctx = document.getElementById('usageTrendsChart').getContext('2d');
    
    // Prepare data for last 30 days
    const last30Days = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        last30Days.push(date.toISOString().split('T')[0]);
    }
    
    const safeStats = Array.isArray(dailyStats) ? dailyStats : [];
    
    const chartData = last30Days.map(date => {
        const stat = safeStats.find(s => s.date === date);
        return stat ? stat.total_analyses : 0;
    });
    
    const apiCallsData = last30Days.map(date => {
        const stat = safeStats.find(s => s.date === date);
        return stat ? stat.api_calls : 0;
    });
    
    if (usageTrendsChart) {
        usageTrendsChart.destroy();
    }
    
    usageTrendsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: last30Days.map(date => new Date(date).toLocaleDateString()),
            datasets: [
                {
                    label: 'Total Analyses',
                    data: chartData,
                    borderColor: 'rgb(34, 197, 94)',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'API Calls',
                    data: apiCallsData,
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(156, 163, 175, 0.1)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(156, 163, 175, 0.1)'
                    }
                }
            }
        }
    });
}

// Render access type chart
function renderAccessTypeChart(accessData) {
    const ctx = document.getElementById('accessTypeChart').getContext('2d');
    
    if (accessTypeChart) {
        accessTypeChart.destroy();
    }
    
    accessTypeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(accessData),
            datasets: [{
                data: Object.values(accessData),
                backgroundColor: [
                    'rgb(34, 197, 94)',
                    'rgb(59, 130, 246)',
                    'rgb(168, 85, 247)'
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            cutout: '60%'
        }
    });
}

// Load recent analysis history
async function loadRecentActivity() {
    try {
        const response = await authenticatedFetch(`${API_URL}/api/enterprise/analysis-history?limit=10&offset=0`);
        const data = await response.json();
        renderRecentActivity(data.records || []);
    } catch (error) {
        console.error('Error loading recent activity:', error);
    }
}

// Render recent activity
function renderRecentActivity(activities) {
    const container = document.getElementById('recentActivity');
    
    if (activities.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-clock text-gray-400 text-4xl mb-4"></i>
                <p class="text-gray-600 dark:text-gray-300">No recent API activity</p>
            </div>
        `;
        return;
    }
    
    const activityHtml = activities.map(activity => `
        <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div class="flex items-center space-x-4">
                <div class="p-2 rounded-full ${getStatusColor(activity.status)}">
                    <i class="fas fa-${getMethodIcon(activity.method)} text-white text-sm"></i>
                </div>
                <div>
                    <div class="font-medium text-gray-900 dark:text-white">
                        ${activity.method} ${activity.endpoint}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                        ${activity.api_key_name} • ${formatTimeAgo(activity.timestamp)}
                    </div>
                </div>
            </div>
            <div class="text-right">
                <div class="text-sm font-medium text-gray-900 dark:text-white">
                    ${activity.status}
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                    ${activity.response_time}s
                </div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = activityHtml;
}

// Override recent activity renderer with analysis history cards
function renderRecentActivity(activities) {
    const container = document.getElementById('recentActivity');
    
    if (!activities || activities.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-clock text-gray-400 text-4xl mb-4"></i>
                <p class="text-gray-600 dark:text-gray-300">No recent analyses</p>
            </div>
        `;
        return;
    }
    
    const activityHtml = activities.map(activity => `
        <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div class="flex items-center space-x-4">
                <div class="p-2 rounded-full ${activity.disease_detected ? 'bg-green-500' : 'bg-gray-500'}">
                    <i class="fas fa-leaf text-white text-sm"></i>
                </div>
                <div>
                    <div class="font-medium text-gray-900 dark:text-white">
                        ${activity.disease_detected ? activity.disease_name || 'Disease detected' : 'Healthy leaf'}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400">
                        ${activity.image_filename} • ${activity.api_access ? 'API' : 'Web'} • ${formatTimeAgo(new Date(activity.analysis_timestamp))}
                    </div>
                </div>
            </div>
            <div class="text-right">
                <div class="text-sm font-medium text-gray-900 dark:text-white">
                    ${activity.severity || 'unknown'}
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">
                    ${activity.confidence != null ? `${activity.confidence}%` : '—'}
                </div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = activityHtml;
}

// Setup event listeners
function setupEventListeners() {
    // Create API Key button
    document.getElementById('createApiKeyBtn').addEventListener('click', () => {
        document.getElementById('createApiKeyModal').classList.remove('hidden');
    });

    // Quick guide CTA
    const quickCreateBtn = document.getElementById('quickCreateApiKeyBtn');
    if (quickCreateBtn) {
        quickCreateBtn.addEventListener('click', () => {
            document.getElementById('createApiKeyModal').classList.remove('hidden');
        });
    }
    
    // Close modal buttons
    document.getElementById('closeModalBtn').addEventListener('click', closeCreateApiKeyModal);
    document.getElementById('cancelModalBtn').addEventListener('click', closeCreateApiKeyModal);
    
    // Create API Key form
    document.getElementById('createApiKeyForm').addEventListener('submit', handleCreateApiKey);
    
    // API Key created modal
    document.getElementById('closeApiKeyModalBtn').addEventListener('click', () => {
        document.getElementById('apiKeyCreatedModal').classList.add('hidden');
        loadApiKeys(); // Refresh the API keys list
    });
    
    // Copy API key button
    document.getElementById('copyApiKeyBtn').addEventListener('click', copyApiKey);

    // Copy quickstart curl
    const copyQuickCurlBtn = document.getElementById('copyQuickCurlBtn');
    if (copyQuickCurlBtn) {
        copyQuickCurlBtn.addEventListener('click', copyQuickStartCurl);
    }

    // History modal
    const viewAllHistoryBtn = document.getElementById('viewAllHistoryBtn');
    if (viewAllHistoryBtn) {
        viewAllHistoryBtn.addEventListener('click', openHistoryModal);
    }
    const closeHistoryModalBtn = document.getElementById('closeHistoryModalBtn');
    if (closeHistoryModalBtn) {
        closeHistoryModalBtn.addEventListener('click', closeHistoryModal);
    }
    const historyPrevBtn = document.getElementById('historyPrevBtn');
    if (historyPrevBtn) {
        historyPrevBtn.addEventListener('click', () => loadHistoryPage(historyState.offset - historyState.limit));
    }
    const historyNextBtn = document.getElementById('historyNextBtn');
    if (historyNextBtn) {
        historyNextBtn.addEventListener('click', () => loadHistoryPage(historyState.offset + historyState.limit));
    }
}

// Close create API key modal
function closeCreateApiKeyModal() {
    document.getElementById('createApiKeyModal').classList.add('hidden');
    document.getElementById('createApiKeyForm').reset();
}

// Handle create API key form submission
async function handleCreateApiKey(event) {
    event.preventDefault();
    
    const formData = {
        name: document.getElementById('keyName').value,
        description: document.getElementById('keyDescription').value,
        expires_in_days: parseInt(document.getElementById('keyExpiry').value)
    };
    
    try {
        const response = await authenticatedFetch(`${API_URL}/api/enterprise/api-keys`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to create API key');
        }
        
        const data = await response.json();
        
        // Show the created API key
        document.getElementById('newApiKey').textContent = data.api_key;
        document.getElementById('createApiKeyModal').classList.add('hidden');
        document.getElementById('apiKeyCreatedModal').classList.remove('hidden');
        setQuickStartKey(data.api_key);
        
    } catch (error) {
        console.error('Error creating API key:', error);
        showError('Failed to create API key');
    }
}

// Copy API key to clipboard
async function copyApiKey() {
    const apiKey = document.getElementById('newApiKey').textContent;
    
    try {
        await navigator.clipboard.writeText(apiKey);
        
        // Show success feedback
        const button = document.getElementById('copyApiKeyBtn');
        const originalIcon = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i>';
        button.classList.add('text-green-600');
        
        setTimeout(() => {
            button.innerHTML = originalIcon;
            button.classList.remove('text-green-600');
        }, 2000);
        
    } catch (error) {
        console.error('Error copying to clipboard:', error);
        showError('Failed to copy API key');
    }
}

// Revoke API key
async function revokeApiKey(keyId) {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await authenticatedFetch(`${API_URL}/api/enterprise/api-keys/${keyId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to revoke API key');
        }
        
        showSuccess('API key revoked successfully');
        loadApiKeys(); // Refresh the list
        
    } catch (error) {
        console.error('Error revoking API key:', error);
        showError('Failed to revoke API key');
    }
}

// Utility functions
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
}

function formatTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
}

function getStatusColor(status) {
    if (status >= 200 && status < 300) return 'bg-green-500';
    if (status >= 400 && status < 500) return 'bg-yellow-500';
    if (status >= 500) return 'bg-red-500';
    return 'bg-gray-500';
}

function getMethodIcon(method) {
    switch (method) {
        case 'GET': return 'download';
        case 'POST': return 'upload';
        case 'PUT': return 'edit';
        case 'DELETE': return 'trash';
        default: return 'globe';
    }
}

function showError(message) {
    // Simple error notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-exclamation-circle mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

function showSuccess(message) {
    // Simple success notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas fa-check-circle mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// History modal helpers
function openHistoryModal() {
    document.getElementById('historyModal').classList.remove('hidden');
    loadHistoryPage(0);
}

function closeHistoryModal() {
    document.getElementById('historyModal').classList.add('hidden');
}

async function loadHistoryPage(offset) {
    const nextOffset = Math.max(0, offset);
    try {
        const response = await authenticatedFetch(`${API_URL}/api/enterprise/analysis-history?limit=${historyState.limit}&offset=${nextOffset}`);
        const data = await response.json();
        historyState.offset = data.offset || nextOffset;
        historyState.total = data.total_count || 0;
        renderHistoryTable(data.records || []);
        updateHistoryPagination();
    } catch (error) {
        console.error('Error loading history page:', error);
        showError('Failed to load analysis history');
    }
}

function updateHistoryPagination() {
    const start = historyState.total === 0 ? 0 : historyState.offset + 1;
    const end = Math.min(historyState.offset + historyState.limit, historyState.total);
    const info = `${start}-${end} of ${historyState.total}`;
    document.getElementById('historyPaginationInfo').textContent = info;
    document.getElementById('historyPrevBtn').disabled = historyState.offset === 0;
    document.getElementById('historyNextBtn').disabled = historyState.offset + historyState.limit >= historyState.total;
}

function renderHistoryTable(records) {
    const container = document.getElementById('historyTableContainer');
    if (!records || records.length === 0) {
        container.innerHTML = `<div class="text-sm text-gray-500 dark:text-gray-400">No analyses found.</div>`;
        return;
    }
    
    const rows = records.map(record => `
        <tr class="border-b border-gray-200 dark:border-gray-700">
            <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                ${record.disease_detected ? (record.disease_name || 'Disease detected') : 'Healthy leaf'}
            </td>
            <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">${record.severity || 'unknown'}</td>
            <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">${record.confidence != null ? `${record.confidence}%` : '—'}</td>
            <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">${record.api_access ? 'API' : 'Web'}</td>
            <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">${record.image_filename || '-'}</td>
            <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">${formatDate(record.analysis_timestamp)}</td>
            <td class="px-4 py-3 text-sm">
                <button class="text-green-600 hover:text-green-700" onclick="toggleHistoryDetails('${record.id}')">
                    Details
                </button>
            </td>
        </tr>
        <tr id="history-details-${record.id}" class="hidden bg-gray-50 dark:bg-gray-900">
            <td colspan="7" class="px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <div class="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Disease Type</div>
                        <div>${record.disease_type || 'unknown'}</div>
                    </div>
                    <div>
                        <div class="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Symptoms</div>
                        <div>${(record.symptoms || []).join(', ') || '—'}</div>
                    </div>
                    <div>
                        <div class="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Treatment</div>
                        <div>${(record.treatment || []).join(', ') || '—'}</div>
                    </div>
                    <div class="md:col-span-3">
                        <div class="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">Description</div>
                        <div>${record.description || '—'}</div>
                    </div>
                </div>
            </td>
        </tr>
    `).join('');
    
    container.innerHTML = `
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
                <tr>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Result</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Severity</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Confidence</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Source</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Image</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800">
                ${rows}
            </tbody>
        </table>
    `;
}

function toggleHistoryDetails(recordId) {
    const row = document.getElementById(`history-details-${recordId}`);
    if (!row) return;
    row.classList.toggle('hidden');
}

// Quick start guide helpers
function initQuickStartGuide() {
    const apiBaseUrl = `${API_URL}/api/v1`;
    const defaultKey = 'ent_your_api_key_here';
    
    document.getElementById('quickStartCurl').textContent = [
        `curl -X POST "${apiBaseUrl}/analyze" \\`,
        `  -H "Authorization: Bearer ${defaultKey}" \\`,
        `  -F "file=@leaf_sample.jpg"`
    ].join('\n');
    
    document.getElementById('quickStartResponse').textContent = JSON.stringify({
        analysis_id: "65f0c2b5f2e7a12345678901",
        disease_detected: true,
        disease_name: "Brown Spot Disease",
        disease_type: "fungal",
        severity: "moderate",
        confidence: 87.5,
        symptoms: ["brown spots on leaves", "yellowing"],
        possible_causes: ["high humidity", "poor air circulation"],
        treatment: ["apply fungicide", "improve ventilation"],
        description: "Detailed analysis description",
        analysis_timestamp: "2026-02-04T12:00:00Z",
        metadata: null
    }, null, 2);
}

function setQuickStartKey(apiKey) {
    if (!apiKey) {
        return;
    }
    const apiBaseUrl = `${API_URL}/api/v1`;
    document.getElementById('quickStartCurl').textContent = [
        `curl -X POST "${apiBaseUrl}/analyze" \\`,
        `  -H "Authorization: Bearer ${apiKey}" \\`,
        `  -F "file=@leaf_sample.jpg"`
    ].join('\n');
}

async function copyQuickStartCurl() {
    const snippet = document.getElementById('quickStartCurl').textContent;
    try {
        await navigator.clipboard.writeText(snippet);
        showSuccess('Quickstart cURL copied');
    } catch (error) {
        console.error('Error copying quickstart curl:', error);
        showError('Failed to copy quickstart cURL');
    }
}
