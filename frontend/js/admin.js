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
        document.getElementById('userInfo').textContent = `Admin: ${profile.full_name || profile.username}`;
    }
}

async function loadOverviewStats() {
    try {
        const response = await authenticatedFetch(`${API_URL}/admin/stats/overview`);
        if (response.ok) {
            const data = await response.json();
            
            // Update stats cards
            document.getElementById('totalUsers').textContent = data.users.total;
            document.getElementById('totalAnalyses').textContent = data.analyses.total;
            document.getElementById('totalAPICalls').textContent = data.api_usage.total_calls;
            document.getElementById('totalCost').textContent = `$${data.api_usage.total_cost.toFixed(4)}`;
            
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
        
        // Load main trends
        const trendsResponse = await authenticatedFetch(`${API_URL}/admin/analytics/trends?days=${days}`);
        if (trendsResponse.ok) {
            const trends = await trendsResponse.json();
            
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
        
        // Load user activity
        const activityResponse = await authenticatedFetch(`${API_URL}/admin/analytics/user-activity?days=${days}`);
        if (activityResponse.ok) {
            const activity = await activityResponse.json();
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
        const response = await authenticatedFetch(`${API_URL}/admin/users`);
        if (response.ok) {
            const data = await response.json();
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
        
        const response = await authenticatedFetch(url);
        if (response.ok) {
            const data = await response.json();
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
        const response = await authenticatedFetch(`${API_URL}/admin/api-config`);
        if (response.ok) {
            const data = await response.json();
            
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
