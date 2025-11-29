// Admin Panel JavaScript

let usageChart = null;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await checkAdminAccess();
    await loadUserInfo();
    await loadOverviewStats();
    await loadUsageChart();
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

async function loadUsageChart() {
    try {
        const response = await authenticatedFetch(`${API_URL}/admin/usage-chart?days=30`);
        if (response.ok) {
            const data = await response.json();
            
            const ctx = document.getElementById('usageChart').getContext('2d');
            
            if (usageChart) {
                usageChart.destroy();
            }
            
            usageChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.daily_data.map(d => d.date),
                    datasets: [
                        {
                            label: 'API Calls',
                            data: data.daily_data.map(d => d.api_calls),
                            borderColor: 'rgb(147, 51, 234)',
                            backgroundColor: 'rgba(147, 51, 234, 0.1)',
                            tension: 0.4
                        },
                        {
                            label: 'Analyses',
                            data: data.daily_data.map(d => d.analyses),
                            borderColor: 'rgb(59, 130, 246)',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            tension: 0.4
                        },
                        {
                            label: 'Cost ($)',
                            data: data.daily_data.map(d => d.cost),
                            borderColor: 'rgb(249, 115, 22)',
                            backgroundColor: 'rgba(249, 115, 22, 0.1)',
                            tension: 0.4,
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    scales: {
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            grid: {
                                drawOnChartArea: false,
                            },
                        },
                    }
                }
            });
        }
    } catch (error) {
        console.error('Error loading usage chart:', error);
    }
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

async function loadAPIUsage() {
    try {
        const apiType = document.getElementById('apiTypeFilter').value;
        const days = document.getElementById('daysFilter').value;
        
        let url = `${API_URL}/admin/api-usage?days=${days}`;
        if (apiType) {
            url += `&api_type=${apiType}`;
        }
        
        const response = await authenticatedFetch(url);
        if (response.ok) {
            const data = await response.json();
            displayAPIUsage(data);
        }
    } catch (error) {
        console.error('Error loading API usage:', error);
    }
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
    }
}
