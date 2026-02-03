// Admin Panel JavaScript

let usageChart = null;
let apiBreakdownChart = null;
let diseaseChart = null;
let userActivityChart = null;

// Pagination state
let currentAPIUsagePage = 1;
const apiUsagePageSize = 20;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await checkAdminAccess();
    await loadUserInfo();
    
    // Show loading states
    showOverviewLoading();
    
    // Load data with smooth animations
    await loadOverviewStats();
    await loadAnalyticsTrends();
    await loadPrescriptionAnalytics();
});

async function checkAdminAccess() {
    const profile = await getUserProfile();
    if (!profile || !profile.is_admin) {
        showNotification('Access denied. Admin privileges required.', 'error');
        setTimeout(() => {
            window.location.href = '/dashboard';
        }, 2000);
    }
}

async function loadUserInfo() {
    const profile = await getUserProfile();
    if (profile) {
        document.getElementById('userInfo').textContent = profile.full_name || profile.username;
    }
}

async function loadOverviewStats() {
    try {
        const data = await cachedFetch(`${API_URL}/admin/stats/overview`, {}, 'overview-stats');
        if (data) {
            
            // Update stats cards
            document.getElementById('totalUsers').textContent = data.users.total;
            document.getElementById('totalAnalyses').textContent = data.analyses.total;
            document.getElementById('totalAPICalls').textContent = data.api_usage.total_calls;
            document.getElementById('totalCost').textContent = `$${data.api_usage.total_cost.toFixed(4)}`;
            
            // Update revenue if available
            if (data.subscriptions) {
                document.getElementById('totalRevenue').textContent = `₹${data.subscriptions.total_revenue.toFixed(2)}`;
            }
            
            // Update breakdown
            document.getElementById('groqCost').textContent = `$${data.api_usage.groq_cost.toFixed(4)}`;
            document.getElementById('perplexityCost').textContent = `$${data.api_usage.perplexity_cost.toFixed(4)}`;
            document.getElementById('diseasesDetected').textContent = data.analyses.diseases_detected;
            document.getElementById('healthyPlants').textContent = data.analyses.healthy_plants;
        }
    } catch (error) {
        console.error('Error loading overview stats:', error);
    }
}

async function loadAnalyticsTrends() {
    try {
        const days = document.getElementById('trendsDaysFilter')?.value || 30;
        
        // Load main trends with caching
        const trends = await cachedFetch(
            `${API_URL}/admin/analytics/trends?days=${days}`, 
            { params: { days } }, 
            'analytics-trends'
        );
        if (trends) {
            
            // Check if there's any data
            if (!trends.summary.has_data) {
                showNoDataMessage();
                return;
            }
            
            // Update summary cards
            document.getElementById('avgAPICalls').textContent = trends.summary.avg_api_calls_per_day.toFixed(1);
            document.getElementById('avgAnalyses').textContent = trends.summary.avg_analyses_per_day.toFixed(1);
            document.getElementById('avgCost').textContent = `$${trends.summary.avg_cost_per_day.toFixed(4)}`;
            document.getElementById('totalTokens').textContent = trends.summary.total_tokens.toLocaleString();
            
            const growthRate = trends.summary.growth_rate_percent;
            const growthEl = document.getElementById('growthRate');
            growthEl.textContent = `${growthRate > 0 ? '+' : ''}${growthRate.toFixed(1)}% growth`;
            growthEl.className = `text-xs mt-1 ${growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`;
            
            // Update main usage chart
            renderUsageChart(trends.daily_trends);
            
            // Update API breakdown chart
            renderAPIBreakdownChart(trends.daily_trends);
            
            // Update disease detection chart
            renderDiseaseChart(trends.daily_trends);
        }
        
        // Load user activity with caching
        const activity = await cachedFetch(
            `${API_URL}/admin/analytics/user-activity?days=${days}`,
            { params: { days } },
            'user-activity'
        );
        if (activity) {
            renderUserActivityChart(activity.daily_active_users);
        }
        
    } catch (error) {
        console.error('Error loading analytics trends:', error);
    }
}

function showNoDataMessage() {
    const overviewContent = document.getElementById('content-overview');
    overviewContent.innerHTML = `
        <div class="text-center py-12">
            <div class="mb-6">
                <i class="fas fa-chart-line text-gray-300 text-6xl"></i>
            </div>
            <h3 class="text-2xl font-bold text-gray-700 mb-3">No Analytics Data Available</h3>
            <p class="text-gray-600 mb-6">There's no data to display yet. Start using the application to generate analytics.</p>
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto text-left">
                <h4 class="font-bold text-blue-900 mb-3">
                    <i class="fas fa-lightbulb mr-2"></i>Want to see sample data?
                </h4>
                <p class="text-blue-800 mb-4">Run the sample data generator to populate the dashboard with test data:</p>
                <div class="bg-white rounded p-4 font-mono text-sm mb-4">
                    <div class="text-gray-700 mb-2"># Windows:</div>
                    <div class="text-blue-600">add_sample_data.bat</div>
                    <div class="text-gray-700 mt-3 mb-2"># Or directly:</div>
                    <div class="text-blue-600">python scripts/add_sample_data.py</div>
                </div>
                <p class="text-sm text-blue-700">
                    <i class="fas fa-info-circle mr-1"></i>
                    This will create 30 days of sample analytics data for testing.
                </p>
            </div>
        </div>
    `;
}

function renderUsageChart(dailyTrends) {
    const ctx = document.getElementById('usageChart').getContext('2d');
    
    if (usageChart) {
        usageChart.destroy();
    }
    
    usageChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dailyTrends.map(d => d.date),
            datasets: [
                {
                    label: 'API Calls',
                    data: dailyTrends.map(d => d.api_calls),
                    borderColor: 'rgb(147, 51, 234)',
                    backgroundColor: 'rgba(147, 51, 234, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Analyses',
                    data: dailyTrends.map(d => d.analyses),
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Cost ($)',
                    data: dailyTrends.map(d => d.cost),
                    borderColor: 'rgb(249, 115, 22)',
                    backgroundColor: 'rgba(249, 115, 22, 0.1)',
                    tension: 0.4,
                    yAxisID: 'y1',
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.dataset.label === 'Cost ($)') {
                                label += '$' + context.parsed.y.toFixed(4);
                            } else {
                                label += context.parsed.y;
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Count'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Cost ($)'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                },
            }
        }
    });
}

function renderAPIBreakdownChart(dailyTrends) {
    const ctx = document.getElementById('apiBreakdownChart').getContext('2d');
    
    if (apiBreakdownChart) {
        apiBreakdownChart.destroy();
    }
    
    apiBreakdownChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dailyTrends.map(d => d.date),
            datasets: [
                {
                    label: 'Groq API',
                    data: dailyTrends.map(d => d.groq_calls),
                    backgroundColor: 'rgba(16, 185, 129, 0.7)',
                    borderColor: 'rgb(16, 185, 129)',
                    borderWidth: 1
                },
                {
                    label: 'Perplexity API',
                    data: dailyTrends.map(d => d.perplexity_calls),
                    backgroundColor: 'rgba(59, 130, 246, 0.7)',
                    borderColor: 'rgb(59, 130, 246)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                x: {
                    stacked: true,
                },
                y: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'API Calls'
                    }
                }
            }
        }
    });
}

function renderDiseaseChart(dailyTrends) {
    const ctx = document.getElementById('diseaseChart').getContext('2d');
    
    if (diseaseChart) {
        diseaseChart.destroy();
    }
    
    diseaseChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dailyTrends.map(d => d.date),
            datasets: [
                {
                    label: 'Diseases Detected',
                    data: dailyTrends.map(d => d.diseases_detected),
                    borderColor: 'rgb(239, 68, 68)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Healthy Plants',
                    data: dailyTrends.map(d => d.healthy_plants),
                    borderColor: 'rgb(34, 197, 94)',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'top',
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Count'
                    }
                }
            }
        }
    });
}

function renderUserActivityChart(dailyActiveUsers) {
    const ctx = document.getElementById('userActivityChart').getContext('2d');
    
    if (userActivityChart) {
        userActivityChart.destroy();
    }
    
    userActivityChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dailyActiveUsers.map(d => d.date),
            datasets: [
                {
                    label: 'Active Users',
                    data: dailyActiveUsers.map(d => d.active_users),
                    backgroundColor: 'rgba(139, 92, 246, 0.7)',
                    borderColor: 'rgb(139, 92, 246)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Users'
                    },
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

async function loadUsers() {
    try {
        const data = await cachedFetch(`${API_URL}/admin/users`, {}, 'admin-users');
        if (data) {
            displayUsers(data.users);
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

function displayUsers(users) {
    const container = document.getElementById('usersTable');
    
    if (users.length === 0) {
        container.innerHTML = '<p class="text-gray-500">No users found</p>';
        return;
    }
    
    container.innerHTML = `
        <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Analyses</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">API Cost</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
                ${users.map(user => `
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="flex items-center">
                                <div>
                                    <div class="text-sm font-medium text-gray-900">${user.username}</div>
                                    <div class="text-sm text-gray-500">${user.full_name || '-'}</div>
                                </div>
                                ${user.is_admin ? '<span class="ml-2 px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">Admin</span>' : ''}
                            </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.email}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${user.total_analyses}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$${user.total_api_cost.toFixed(4)}</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 text-xs rounded ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                ${user.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                            <button onclick="toggleUserStatus('${user.username}')" class="text-primary hover:text-secondary">
                                ${user.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function toggleUserStatus(username) {
    const confirmed = await showConfirm(
        `Are you sure you want to toggle status for ${username}?`,
        'Toggle User Status'
    );
    
    if (!confirmed) {
        return;
    }
    
    try {
        const response = await authenticatedFetch(`${API_URL}/admin/users/${username}/toggle-active`, {
            method: 'PATCH'
        });
        
        if (response.ok) {
            showNotification('User status updated successfully', 'success');
            // Invalidate users cache
            apiCache.invalidate('users');
            await loadUsers();
        } else {
            showNotification('Failed to update user status', 'error');
        }
    } catch (error) {
        console.error('Error toggling user status:', error);
        showNotification('Error updating user status', 'error');
    }
}

async function loadAPIUsage(page = 1) {
    try {
        const apiType = document.getElementById('apiTypeFilter').value;
        const days = document.getElementById('daysFilter').value;
        
        let url = `${API_URL}/admin/api-usage?days=${days}&page=${page}&page_size=${apiUsagePageSize}`;
        if (apiType) {
            url += `&api_type=${apiType}`;
        }
        
        const data = await cachedFetch(
            url,
            { params: { days, page, page_size: apiUsagePageSize, api_type: apiType } },
            'api-usage'
        );
        if (data) {
            currentAPIUsagePage = page;
            displayAPIUsage(data);
        }
    } catch (error) {
        console.error('Error loading API usage:', error);
    }
}

function changeAPIUsagePage(page) {
    loadAPIUsage(page);
    // Scroll to top of table
    document.getElementById('apiUsageTable').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function displayAPIUsage(data) {
    const container = document.getElementById('apiUsageTable');
    
    if (data.records.length === 0) {
        container.innerHTML = '<p class="text-gray-500">No API usage records found</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="mb-4 p-4 bg-gray-50 rounded-lg">
            <div class="grid grid-cols-4 gap-4 text-center">
                <div>
                    <p class="text-sm text-gray-600">Total Requests</p>
                    <p class="text-2xl font-bold">${data.stats.total_requests}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-600">Successful</p>
                    <p class="text-2xl font-bold text-green-600">${data.stats.successful}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-600">Total Tokens</p>
                    <p class="text-2xl font-bold text-blue-600">${data.stats.total_tokens.toLocaleString()}</p>
                </div>
                <div>
                    <p class="text-sm text-gray-600">Total Cost</p>
                    <p class="text-2xl font-bold text-orange-600">$${data.stats.total_cost.toFixed(4)}</p>
                </div>
            </div>
        </div>
        
        <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
                <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">API</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Endpoint</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tokens</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
                ${data.records.map(record => `
                    <tr>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${record.username}</td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 text-xs rounded ${record.api_type === 'groq' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}">
                                ${record.api_type}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${record.endpoint}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${record.tokens_used.toLocaleString()}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">$${record.estimated_cost.toFixed(4)}</td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(record.timestamp).toLocaleString()}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function loadAPIConfig() {
    try {
        const data = await cachedFetch(`${API_URL}/admin/api-config`, {}, 'api-config');
        if (data) {
            
            // Update Groq config
            document.getElementById('groqModel').value = data.groq.model;
            document.getElementById('groqStatus').textContent = data.groq.is_active ? 'Active' : 'Inactive';
            document.getElementById('groqStatus').className = `px-3 py-1 rounded-full text-sm font-semibold ${data.groq.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`;
            
            // Update Perplexity config
            document.getElementById('perplexityModel').value = data.perplexity.model;
            document.getElementById('perplexityStatus').textContent = data.perplexity.is_active ? 'Active' : 'Inactive';
            document.getElementById('perplexityStatus').className = `px-3 py-1 rounded-full text-sm font-semibold ${data.perplexity.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`;
        }
    } catch (error) {
        console.error('Error loading API config:', error);
    }
}

async function updateAPIKey(apiType) {
    const apiKey = document.getElementById(`${apiType}ApiKey`).value;
    
    if (!apiKey) {
        showNotification('Please enter an API key', 'warning');
        return;
    }
    
    const confirmed = await showConfirm(
        `Are you sure you want to update the ${apiType} API key?`,
        'Update API Key'
    );
    
    if (!confirmed) {
        return;
    }
    
    try {
        const response = await authenticatedFetch(`${API_URL}/admin/api-config?api_type=${apiType}&api_key=${encodeURIComponent(apiKey)}`, {
            method: 'PUT'
        });
        
        if (response.ok) {
            showNotification(`${apiType.charAt(0).toUpperCase() + apiType.slice(1)} API key updated successfully`, 'success');
            document.getElementById(`${apiType}ApiKey`).value = '';
            // Invalidate API config cache
            apiCache.clearPattern('api-config');
            await loadAPIConfig();
        } else {
            const error = await response.json();
            showNotification(`Failed to update API key: ${error.detail}`, 'error');
        }
    } catch (error) {
        console.error('Error updating API key:', error);
        showNotification('Error updating API key', 'error');
    }
}

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active', 'border-primary', 'text-gray-900');
        btn.classList.add('border-transparent', 'text-gray-500');
    });
    document.getElementById(`tab-${tabName}`).classList.add('active', 'border-primary', 'text-gray-900');
    document.getElementById(`tab-${tabName}`).classList.remove('border-transparent', 'text-gray-500');
    
    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    document.getElementById(`content-${tabName}`).classList.remove('hidden');
    
    // Load data for the tab
    if (tabName === 'users') {
        loadUsers();
    } else if (tabName === 'api-usage') {
        loadAPIUsage();
    } else if (tabName === 'api-config') {
        loadAPIConfig();
    } else if (tabName === 'prescriptions') {
        loadPrescriptionAnalytics();
    } else if (tabName === 'feedback') {
        loadFeedback();
    } else if (tabName === 'subscriptions') {
        console.log('Switching to subscriptions tab');
        loadSubscriptionStats();
    }
}

// Refresh current tab with cache bypass
function refreshCurrentTab() {
    // Clear all cache
    apiCache.clear();
    
    // Show notification
    showNotification('Refreshing data...', 'info');
    
    // Reload current tab data
    const activeTab = document.querySelector('.tab-button.active');
    if (activeTab) {
        const tabName = activeTab.id.replace('tab-', '');
        
        if (tabName === 'overview') {
            loadOverviewStats();
            loadAnalyticsTrends();
        } else if (tabName === 'users') {
            loadUsers();
        } else if (tabName === 'api-usage') {
            loadAPIUsage();
        } else if (tabName === 'api-config') {
            loadAPIConfig();
        } else if (tabName === 'prescriptions') {
            loadPrescriptionAnalytics();
        } else if (tabName === 'feedback') {
            loadFeedback();
        } else if (tabName === 'subscriptions') {
            console.log('Refreshing subscriptions tab');
            loadSubscriptionStats();
        }
    }
}

// Load feedback
async function loadFeedback() {
    try {
        console.log('Loading feedback...');
        const status = document.getElementById('feedbackStatusFilter').value;
        let url = `${API_URL}/api/feedback/admin`;
        if (status) {
            url += `?status=${status}`;
        }
        
        console.log('Fetching feedback from:', url);
        const response = await authenticatedFetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const feedback = await response.json();
        console.log('Feedback loaded:', feedback);
        
        displayFeedback(feedback);
    } catch (error) {
        console.error('Error loading feedback:', error);
        document.getElementById('feedbackTable').innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                <p class="text-red-600 font-semibold">Error loading feedback</p>
                <p class="text-gray-600 text-sm">${error.message}</p>
            </div>
        `;
    }
}

function displayFeedback(feedbackList) {
    const container = document.getElementById('feedbackTable');
    
    // Store feedback data globally for editing
    window.currentFeedbackList = feedbackList;
    
    console.log('Displaying feedback list:', feedbackList);
    
    if (feedbackList.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-8">No feedback found</p>';
        return;
    }
    
    container.innerHTML = feedbackList.map(feedback => {
        const statusColors = {
            'pending': 'bg-yellow-100 text-yellow-800',
            'reviewed': 'bg-blue-100 text-blue-800',
            'resolved': 'bg-green-100 text-green-800'
        };
        
        const typeColors = {
            'incorrect': 'bg-red-100 text-red-800',
            'incomplete': 'bg-orange-100 text-orange-800',
            'other': 'bg-gray-100 text-gray-800'
        };
        
        return `
            <div class="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex items-center space-x-3">
                        <span class="px-2 py-1 text-xs rounded-full ${statusColors[feedback.status] || 'bg-gray-100 text-gray-800'}">
                            ${feedback.status}
                        </span>
                        <span class="px-2 py-1 text-xs rounded-full ${typeColors[feedback.feedback_type] || 'bg-gray-100 text-gray-800'}">
                            ${feedback.feedback_type}
                        </span>
                        <span class="text-sm text-gray-500">
                            by ${feedback.username} • ${new Date(feedback.created_at).toLocaleDateString()}
                        </span>
                    </div>
                    <button onclick="editFeedback('${feedback.id || feedback._id}')" class="text-primary hover:text-secondary text-sm">
                        <i class="fas fa-edit mr-1"></i>Edit
                    </button>
                </div>
                
                <div class="mb-4">
                    <p class="text-gray-800 mb-2">${feedback.message}</p>
                    ${feedback.correct_disease ? `<p class="text-sm text-gray-600"><strong>Suggested Disease:</strong> ${feedback.correct_disease}</p>` : ''}
                    ${feedback.correct_treatment ? `<p class="text-sm text-gray-600"><strong>Suggested Treatment:</strong> ${feedback.correct_treatment}</p>` : ''}
                </div>
                
                ${feedback.analysis ? `
                    <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                        <h5 class="font-bold text-sm mb-3">Original Analysis:</h5>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <img src="/images/${feedback.analysis.username}/${feedback.analysis.image_filename}" 
                                     alt="Analysis Image" 
                                     class="w-full h-32 object-cover rounded-lg border border-gray-300"
                                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDIwMCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTI4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04NSA2NEw5NSA1NEwxMDUgNjRMOTUgNzRMODUgNjRaIiBmaWxsPSIjOUI5QjlCIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iODQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5QjlCOUIiIGZvbnQtc2l6ZT0iMTIiPkltYWdlIG5vdCBmb3VuZDwvdGV4dD4KPC9zdmc+'">
                                <p class="text-xs text-gray-500 mt-1">${feedback.analysis.image_filename}</p>
                            </div>
                            <div class="text-sm space-y-1">
                                <div><strong>Disease:</strong> ${feedback.analysis.disease_name || 'None detected'}</div>
                                <div><strong>Confidence:</strong> ${feedback.analysis.confidence}%</div>
                                <div><strong>Type:</strong> ${feedback.analysis.disease_type}</div>
                                <div><strong>Severity:</strong> ${feedback.analysis.severity}</div>
                                <div><strong>Date:</strong> ${new Date(feedback.analysis.analysis_timestamp).toLocaleDateString()}</div>
                                ${feedback.analysis.description ? `<div class="col-span-2"><strong>Description:</strong> ${feedback.analysis.description}</div>` : ''}
                            </div>
                        </div>
                        ${feedback.analysis.treatment && feedback.analysis.treatment.length > 0 ? `
                            <div class="mt-3">
                                <strong class="text-sm">Treatment:</strong>
                                <ul class="list-disc list-inside text-sm text-gray-600 mt-1">
                                    ${feedback.analysis.treatment.slice(0, 2).map(t => `<li>${t}</li>`).join('')}
                                    ${feedback.analysis.treatment.length > 2 ? `<li class="text-gray-500">... and ${feedback.analysis.treatment.length - 2} more</li>` : ''}
                                </ul>
                            </div>
                        ` : ''}
                        ${feedback.analysis.youtube_videos && feedback.analysis.youtube_videos.length > 0 ? `
                            <div class="mt-3">
                                <strong class="text-sm">YouTube Videos:</strong>
                                <div class="mt-1 space-y-1">
                                    ${feedback.analysis.youtube_videos.slice(0, 2).map(video => `
                                        <div class="flex items-center space-x-2">
                                            <i class="fab fa-youtube text-red-500 text-sm"></i>
                                            <a href="${video.url}" target="_blank" class="text-xs text-blue-600 hover:underline truncate">${video.title}</a>
                                        </div>
                                    `).join('')}
                                    ${feedback.analysis.youtube_videos.length > 2 ? `<p class="text-xs text-gray-500">... and ${feedback.analysis.youtube_videos.length - 2} more videos</p>` : ''}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
                
                ${feedback.admin_notes ? `
                    <div class="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                        <p class="text-sm text-blue-800"><strong>Admin Notes:</strong> ${feedback.admin_notes}</p>
                    </div>
                ` : ''}
                
                <div class="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                    <span class="text-sm text-gray-500">Analysis ID: ${feedback.analysis_id}</span>
                    <div class="space-x-2">
                        ${feedback.status === 'pending' ? `
                            <button onclick="updateFeedbackStatus('${feedback.id || feedback._id}', 'reviewed')" class="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">
                                Mark Reviewed
                            </button>
                        ` : ''}
                        ${feedback.status !== 'resolved' ? `
                            <button onclick="updateFeedbackStatus('${feedback.id || feedback._id}', 'resolved')" class="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600">
                                Mark Resolved
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Edit feedback modal
function editFeedback(feedbackId) {
    // Find the feedback data
    const feedbackData = window.currentFeedbackList?.find(f => f.id === feedbackId || f._id === feedbackId);
    console.log('Edit feedback called with ID:', feedbackId);
    console.log('Found feedback data:', feedbackData);
    console.log('Available feedback list:', window.currentFeedbackList);
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-screen overflow-y-auto">
            <div class="p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold">Edit Analysis & Feedback</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                ${feedbackData?.analysis ? `
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <h4 class="font-semibold text-blue-800 mb-3">Current Full Analysis</h4>
                        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div class="lg:col-span-1">
                                <img src="/images/${feedbackData.analysis.username}/${feedbackData.analysis.image_filename}" 
                                     alt="Analysis Image" 
                                     class="w-full h-48 object-cover rounded-lg border border-blue-300"
                                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDIwMCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTI4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik04NSA2NEw5NSA1NEwxMDUgNjRMOTUgNzRMODUgNjRaIiBmaWxsPSIjOUI5QjlCIi8+Cjx0ZXh0IHg9IjEwMCIgeT0iODQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5QjlCOUIiIGZvbnQtc2l6ZT0iMTIiPkltYWdlIG5vdCBmb3VuZDwvdGV4dD4KPC9zdmc+'">
                                <p class="text-xs text-gray-500 mt-1">${feedbackData.analysis.image_filename}</p>
                            </div>
                            <div class="lg:col-span-2 space-y-3">
                                <div class="grid grid-cols-2 gap-4 text-sm">
                                    <div><strong>Disease:</strong> ${feedbackData.analysis.disease_name || 'None detected'}</div>
                                    <div><strong>Confidence:</strong> ${feedbackData.analysis.confidence}%</div>
                                    <div><strong>Type:</strong> ${feedbackData.analysis.disease_type}</div>
                                    <div><strong>Severity:</strong> ${feedbackData.analysis.severity}</div>
                                    <div><strong>Date:</strong> ${new Date(feedbackData.analysis.analysis_timestamp).toLocaleDateString()}</div>
                                    <div><strong>Detection:</strong> ${feedbackData.analysis.disease_detected ? 'Yes' : 'No'}</div>
                                </div>
                                
                                ${feedbackData.analysis.symptoms && feedbackData.analysis.symptoms.length > 0 ? `
                                    <div>
                                        <strong class="text-sm">Symptoms:</strong>
                                        <ul class="list-disc list-inside text-sm text-gray-600 mt-1">
                                            ${feedbackData.analysis.symptoms.map(s => `<li>${s}</li>`).join('')}
                                        </ul>
                                    </div>
                                ` : ''}
                                
                                ${feedbackData.analysis.possible_causes && feedbackData.analysis.possible_causes.length > 0 ? `
                                    <div>
                                        <strong class="text-sm">Possible Causes:</strong>
                                        <ul class="list-disc list-inside text-sm text-gray-600 mt-1">
                                            ${feedbackData.analysis.possible_causes.map(c => `<li>${c}</li>`).join('')}
                                        </ul>
                                    </div>
                                ` : ''}
                                
                                ${feedbackData.analysis.treatment && feedbackData.analysis.treatment.length > 0 ? `
                                    <div>
                                        <strong class="text-sm">Treatment:</strong>
                                        <ul class="list-disc list-inside text-sm text-gray-600 mt-1">
                                            ${feedbackData.analysis.treatment.map(t => `<li>${t}</li>`).join('')}
                                        </ul>
                                    </div>
                                ` : ''}
                                
                                ${feedbackData.analysis.description ? `
                                    <div>
                                        <strong class="text-sm">Description:</strong>
                                        <p class="text-sm text-gray-600 mt-1">${feedbackData.analysis.description}</p>
                                    </div>
                                ` : ''}
                                
                                ${feedbackData.analysis.youtube_videos && feedbackData.analysis.youtube_videos.length > 0 ? `
                                    <div>
                                        <strong class="text-sm">YouTube Videos:</strong>
                                        <div class="mt-2 space-y-2">
                                            ${feedbackData.analysis.youtube_videos.map(video => `
                                                <div class="flex items-center space-x-3 p-2 bg-white rounded border">
                                                    <img src="${video.thumbnail}" alt="Video thumbnail" class="w-16 h-12 object-cover rounded">
                                                    <div class="flex-1">
                                                        <p class="text-sm font-medium">${video.title}</p>
                                                        <a href="${video.url}" target="_blank" class="text-xs text-blue-600 hover:underline">${video.url}</a>
                                                    </div>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                ` : ''}
                
                <form id="editFeedbackForm" class="space-y-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Admin Notes</label>
                        <textarea id="adminNotes" rows="3" class="w-full p-3 border border-gray-300 rounded-lg" placeholder="Add your notes..."></textarea>
                    </div>
                    
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <h4 class="font-semibold mb-3">Update Original Analysis (Optional)</h4>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Disease Name</label>
                                <input type="text" id="updatedDiseaseName" class="w-full p-2 border rounded-lg" placeholder="Corrected disease name">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Confidence</label>
                                <input type="number" id="updatedConfidence" min="0" max="100" class="w-full p-2 border rounded-lg" placeholder="0-100">
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-4 mt-3">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Disease Type</label>
                                <select id="updatedDiseaseType" class="w-full p-2 border rounded-lg">
                                    <option value="">Select type</option>
                                    <option value="fungal" ${feedbackData?.analysis?.disease_type === 'fungal' ? 'selected' : ''}>Fungal</option>
                                    <option value="bacterial" ${feedbackData?.analysis?.disease_type === 'bacterial' ? 'selected' : ''}>Bacterial</option>
                                    <option value="viral" ${feedbackData?.analysis?.disease_type === 'viral' ? 'selected' : ''}>Viral</option>
                                    <option value="pest" ${feedbackData?.analysis?.disease_type === 'pest' ? 'selected' : ''}>Pest</option>
                                    <option value="nutrient" ${feedbackData?.analysis?.disease_type === 'nutrient' ? 'selected' : ''}>Nutrient</option>
                                    <option value="healthy" ${feedbackData?.analysis?.disease_type === 'healthy' ? 'selected' : ''}>Healthy</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                                <select id="updatedSeverity" class="w-full p-2 border rounded-lg">
                                    <option value="">Select severity</option>
                                    <option value="none" ${feedbackData?.analysis?.severity === 'none' ? 'selected' : ''}>None</option>
                                    <option value="mild" ${feedbackData?.analysis?.severity === 'mild' ? 'selected' : ''}>Mild</option>
                                    <option value="moderate" ${feedbackData?.analysis?.severity === 'moderate' ? 'selected' : ''}>Moderate</option>
                                    <option value="severe" ${feedbackData?.analysis?.severity === 'severe' ? 'selected' : ''}>Severe</option>
                                </select>
                            </div>
                        </div>
                        <div class="mt-3">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea id="updatedDescription" rows="2" class="w-full p-2 border rounded-lg" placeholder="Analysis description"></textarea>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Symptoms (one per line)</label>
                                <textarea id="updatedSymptoms" rows="3" class="w-full p-2 border rounded-lg" placeholder="Enter symptoms, one per line"></textarea>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-1">Possible Causes (one per line)</label>
                                <textarea id="updatedCauses" rows="3" class="w-full p-2 border rounded-lg" placeholder="Enter causes, one per line"></textarea>
                            </div>
                        </div>
                        <div class="mt-3">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Treatment (one per line)</label>
                            <textarea id="updatedTreatment" rows="3" class="w-full p-2 border rounded-lg" placeholder="Enter treatments, one per line"></textarea>
                        </div>
                        <div class="mt-3">
                            <label class="block text-sm font-medium text-gray-700 mb-1">YouTube Video URLs (one per line)</label>
                            <textarea id="updatedYouTubeVideos" rows="2" class="w-full p-2 border rounded-lg" placeholder="Enter YouTube URLs, one per line"></textarea>
                            <p class="text-xs text-gray-500 mt-1">Note: Only URLs will be updated. Titles and thumbnails will be fetched automatically.</p>
                        </div>
                    </div>
                    
                    <div class="flex space-x-3 pt-4">
                        <button type="button" onclick="saveFeedbackChanges('${feedbackId}')" class="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-secondary transition font-semibold">
                            <i class="fas fa-save mr-2"></i>Save Changes
                        </button>
                        <button type="button" onclick="this.closest('.fixed').remove()" class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Populate form fields after modal is added to DOM
    if (feedbackData) {
        setTimeout(() => {
            // Admin notes
            document.getElementById('adminNotes').value = feedbackData.admin_notes || '';
            
            // Analysis fields
            if (feedbackData.analysis) {
                document.getElementById('updatedDiseaseName').value = feedbackData.analysis.disease_name || '';
                document.getElementById('updatedConfidence').value = feedbackData.analysis.confidence || '';
                document.getElementById('updatedDiseaseType').value = feedbackData.analysis.disease_type || '';
                document.getElementById('updatedSeverity').value = feedbackData.analysis.severity || '';
                document.getElementById('updatedDescription').value = feedbackData.analysis.description || '';
                document.getElementById('updatedSymptoms').value = (feedbackData.analysis.symptoms || []).join('\n');
                document.getElementById('updatedCauses').value = (feedbackData.analysis.possible_causes || []).join('\n');
                document.getElementById('updatedTreatment').value = (feedbackData.analysis.treatment || []).join('\n');
                document.getElementById('updatedYouTubeVideos').value = (feedbackData.analysis.youtube_videos || []).map(v => v.url || '').join('\n');
            }
        }, 100);
    }
}

// Save feedback changes
async function saveFeedbackChanges(feedbackId) {
    try {
        const adminNotes = document.getElementById('adminNotes').value.trim();
        const updatedDiseaseName = document.getElementById('updatedDiseaseName').value.trim();
        const updatedConfidence = document.getElementById('updatedConfidence').value;
        const updatedDiseaseType = document.getElementById('updatedDiseaseType').value;
        const updatedSeverity = document.getElementById('updatedSeverity').value;
        const updatedDescription = document.getElementById('updatedDescription').value.trim();
        const updatedSymptoms = document.getElementById('updatedSymptoms').value.trim();
        const updatedCauses = document.getElementById('updatedCauses').value.trim();
        const updatedTreatment = document.getElementById('updatedTreatment').value.trim();
        const updatedYouTubeVideos = document.getElementById('updatedYouTubeVideos').value.trim();
        
        const updateData = {
            status: 'reviewed',
            admin_notes: adminNotes || null
        };
        
        // Add updated analysis if any field is provided
        if (updatedDiseaseName || updatedConfidence || updatedDiseaseType || updatedSeverity || 
            updatedDescription || updatedSymptoms || updatedCauses || updatedTreatment || updatedYouTubeVideos) {
            updateData.updated_analysis = {};
            
            if (updatedDiseaseName) {
                updateData.updated_analysis.disease_name = updatedDiseaseName;
                updateData.updated_analysis.disease_detected = updatedDiseaseName !== '' && updatedDiseaseName.toLowerCase() !== 'none';
            }
            
            if (updatedConfidence) {
                updateData.updated_analysis.confidence = parseFloat(updatedConfidence);
            }
            
            if (updatedDiseaseType) {
                updateData.updated_analysis.disease_type = updatedDiseaseType;
            }
            
            if (updatedSeverity) {
                updateData.updated_analysis.severity = updatedSeverity;
            }
            
            if (updatedDescription) {
                updateData.updated_analysis.description = updatedDescription;
            }
            
            if (updatedSymptoms) {
                updateData.updated_analysis.symptoms = updatedSymptoms.split('\n').filter(s => s.trim());
            }
            
            if (updatedCauses) {
                updateData.updated_analysis.possible_causes = updatedCauses.split('\n').filter(c => c.trim());
            }
            
            if (updatedTreatment) {
                updateData.updated_analysis.treatment = updatedTreatment.split('\n').filter(t => t.trim());
            }
            
            if (updatedYouTubeVideos) {
                const videoUrls = updatedYouTubeVideos.split('\n').filter(url => url.trim());
                updateData.updated_analysis.youtube_video_urls = videoUrls;
            }
        }
        
        const response = await authenticatedFetch(`${API_URL}/api/feedback/admin/${feedbackId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
        });
        
        if (response.ok) {
            showNotification('Feedback updated successfully', 'success');
            document.querySelector('.fixed').remove();
            loadFeedback();
        } else {
            const error = await response.json();
            showNotification(error.detail || 'Failed to update feedback', 'error');
        }
    } catch (error) {
        console.error('Error saving feedback changes:', error);
        showNotification('Error saving changes', 'error');
    }
}

// Update feedback status
async function updateFeedbackStatus(feedbackId, status) {
    try {
        console.log('updateFeedbackStatus called with:', feedbackId, status);
        
        if (!feedbackId || feedbackId === 'undefined') {
            console.error('Invalid feedback ID:', feedbackId);
            showNotification('Invalid feedback ID', 'error');
            return;
        }
        
        const response = await authenticatedFetch(`${API_URL}/api/feedback/admin/${feedbackId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });
        
        if (response.ok) {
            showNotification(`Feedback marked as ${status}`, 'success');
            loadFeedback();
        } else {
            const error = await response.json();
            showNotification(error.detail || 'Failed to update status', 'error');
        }
    } catch (error) {
        console.error('Error updating feedback status:', error);
        showNotification('Error updating status', 'error');
    }
}


// Load prescription analytics
async function loadPrescriptionAnalytics() {
    try {
        const response = await authenticatedFetch(`${API_URL}/admin/analytics/prescriptions?days=30`);
        const data = await response.json();
        
        if (data.success) {
            const stats = data.stats;
            
            // Update summary cards
            document.getElementById('prescTotal').textContent = stats.total_prescriptions || 0;
            document.getElementById('totalPrescriptions').textContent = stats.total_prescriptions || 0;
            
            // Count by priority
            const urgentCount = stats.by_priority.find(p => p._id === 'urgent')?.count || 0;
            document.getElementById('prescUrgent').textContent = urgentCount;
            
            // Count by status
            const activeCount = stats.by_status.find(s => s._id === 'active')?.count || 0;
            const completedCount = stats.by_status.find(s => s._id === 'completed')?.count || 0;
            document.getElementById('prescActive').textContent = activeCount;
            document.getElementById('prescCompleted').textContent = completedCount;
            
            // Display by priority
            displayPrescriptionsByPriority(stats.by_priority);
            
            // Display by disease
            displayPrescriptionsByDisease(stats.by_disease);
            
            // Display daily trend
            displayPrescriptionDailyTrend(stats.daily_trend);
            
            // Display top users
            displayPrescriptionTopUsers(stats.top_users);
        }
    } catch (error) {
        console.error('Error loading prescription analytics:', error);
    }
}

function displayPrescriptionsByPriority(data) {
    const container = document.getElementById('prescByPriority');
    if (!data || data.length === 0) {
        container.innerHTML = '<p class="text-gray-500">No data available</p>';
        return;
    }
    
    const priorityColors = {
        'urgent': 'bg-red-500',
        'high': 'bg-orange-500',
        'moderate': 'bg-yellow-500',
        'low': 'bg-green-500'
    };
    
    const total = data.reduce((sum, item) => sum + item.count, 0);
    
    container.innerHTML = data.map(item => {
        const percentage = ((item.count / total) * 100).toFixed(1);
        const color = priorityColors[item._id] || 'bg-gray-500';
        
        return `
            <div>
                <div class="flex justify-between items-center mb-1">
                    <span class="text-sm font-medium capitalize">${item._id}</span>
                    <span class="text-sm text-gray-600">${item.count} (${percentage}%)</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="${color} h-2 rounded-full" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

function displayPrescriptionsByDisease(data) {
    const container = document.getElementById('prescByDisease');
    if (!data || data.length === 0) {
        container.innerHTML = '<p class="text-gray-500">No data available</p>';
        return;
    }
    
    const total = data.reduce((sum, item) => sum + item.count, 0);
    
    container.innerHTML = data.map((item, index) => {
        const percentage = ((item.count / total) * 100).toFixed(1);
        const colors = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'];
        const color = colors[index % colors.length];
        
        return `
            <div>
                <div class="flex justify-between items-center mb-1">
                    <span class="text-sm font-medium">${item._id}</span>
                    <span class="text-sm text-gray-600">${item.count} (${percentage}%)</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="${color} h-2 rounded-full" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

function displayPrescriptionDailyTrend(data) {
    const container = document.getElementById('prescDailyTrend');
    if (!data || data.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-8">No data available</p>';
        return;
    }
    
    // Simple bar chart
    const maxCount = Math.max(...data.map(d => d.count));
    
    container.innerHTML = `
        <div class="flex items-end justify-between h-full space-x-1">
            ${data.map(item => {
                const height = (item.count / maxCount) * 100;
                return `
                    <div class="flex-1 flex flex-col items-center">
                        <div class="w-full bg-green-500 rounded-t hover:bg-green-600 transition" 
                             style="height: ${height}%"
                             title="${item._id}: ${item.count} prescriptions"></div>
                        <span class="text-xs text-gray-500 mt-2 transform -rotate-45 origin-top-left">${item._id.slice(5)}</span>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function displayPrescriptionTopUsers(data) {
    const container = document.getElementById('prescTopUsers');
    if (!data || data.length === 0) {
        container.innerHTML = '<p class="text-gray-500">No data available</p>';
        return;
    }
    
    container.innerHTML = data.map((item, index) => {
        const medals = ['🥇', '🥈', '🥉'];
        const medal = medals[index] || '🏅';
        
        return `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div class="flex items-center space-x-3">
                    <span class="text-2xl">${medal}</span>
                    <span class="font-medium">${item._id}</span>
                </div>
                <span class="text-lg font-bold text-green-600">${item.count}</span>
            </div>
        `;
    }).join('');
}

// Load subscription statistics
let revenueChart = null;

async function loadSubscriptionStats() {
    try {
        console.log('Loading subscription stats...');
        const data = await cachedFetch(`${API_URL}/admin/subscription-stats`, {}, 'subscription-stats');
        console.log('Subscription stats data:', data);
        console.log('Data type:', typeof data);
        console.log('Data keys:', data ? Object.keys(data) : 'no data');
        if (data) {
            // Update overview cards
            document.getElementById('subTotal').textContent = data.overview.total_subscriptions;
            document.getElementById('subActive').textContent = data.overview.active_subscriptions;
            document.getElementById('subMonthlyRevenue').textContent = `₹${data.overview.monthly_revenue || 0}`;
            document.getElementById('subChurnRate').textContent = `${data.overview.churn_rate_30d}%`;
            
            // Update recent activity
            document.getElementById('recentSubs30d').textContent = data.overview.recent_subscriptions_30d;
            document.getElementById('cancelledSubs30d').textContent = data.overview.cancelled_subscriptions || 0;
            document.getElementById('expiredSubs').textContent = data.overview.expired_subscriptions || 0;
            
            // Display plan distribution
            displayPlanDistribution(data.plan_distribution);
            
            // Display usage statistics
            displayUsageStatistics(data.usage_stats);
            
            // Render revenue chart
            renderRevenueChart(data.monthly_revenue_trend);
        }
    } catch (error) {
        console.error('Error loading subscription stats:', error);
        showNotification('Failed to load subscription statistics', 'error');
    }
}

function displayPlanDistribution(planData) {
    const container = document.getElementById('planDistribution');
    if (!planData || planData.length === 0) {
        container.innerHTML = '<p class="text-gray-500">No subscription data available</p>';
        return;
    }
    
    const planColors = {
        'free': 'bg-gray-500',
        'basic': 'bg-blue-500',
        'premium': 'bg-purple-500',
        'enterprise': 'bg-green-500'
    };
    
    const total = planData.reduce((sum, plan) => sum + plan.active_subscriptions, 0);
    
    container.innerHTML = planData.map(plan => {
        const percentage = total > 0 ? ((plan.active_subscriptions / total) * 100).toFixed(1) : 0;
        const color = planColors[plan.plan_type] || 'bg-gray-500';
        
        return `
            <div>
                <div class="flex justify-between items-center mb-1">
                    <span class="text-sm font-medium capitalize">${plan.plan_type}</span>
                    <span class="text-sm text-gray-600">${plan.active_subscriptions} (₹${plan.total_revenue.toFixed(2)})</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="${color} h-2 rounded-full" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    }).join('');
}

function displayUsageStatistics(usageStats) {
    document.getElementById('usageAnalysesUsed').textContent = usageStats.total_analyses_used_this_month || 0;
    document.getElementById('usageAnalysesLimit').textContent = usageStats.total_analyses_limit || 0;
    document.getElementById('usagePercentage').textContent = `${usageStats.usage_percentage || 0}%`;
    document.getElementById('usageActiveUsers').textContent = usageStats.active_users_this_month || 0;
}

function renderRevenueChart(revenueData) {
    const ctx = document.getElementById('revenueChart').getContext('2d');
    
    if (revenueChart) {
        revenueChart.destroy();
    }
    
    if (!revenueData || revenueData.length === 0) {
        ctx.fillText('No revenue data available', 10, 50);
        return;
    }
    
    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: revenueData.map(d => d.month),
            datasets: [{
                label: 'Revenue (₹)',
                data: revenueData.map(d => d.revenue),
                borderColor: 'rgb(16, 185, 129)',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Revenue: ₹${context.parsed.y.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Revenue (₹)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '₹' + value.toFixed(0);
                        }
                    }
                }
            }
        }
    });
}