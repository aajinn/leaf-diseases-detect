// Admin Panel Loading Animations

// Show loading skeleton for overview stats
function showOverviewLoading() {
    const statCards = document.querySelectorAll('.grid.md\\:grid-cols-4.gap-6.mb-8 > div');
    statCards.forEach(card => {
        card.classList.add('pulse');
    });
}

// Hide loading and show with animation
function hideOverviewLoading() {
    const statCards = document.querySelectorAll('.grid.md\\:grid-cols-4.gap-6.mb-8 > div');
    statCards.forEach((card, index) => {
        card.classList.remove('pulse');
        card.classList.add('scale-in');
        card.style.animationDelay = `${index * 0.1}s`;
    });
}

// Animate number counting
function animateValue(id, start, end, duration, isCurrency = false) {
    const element = document.getElementById(id);
    if (!element) return;
    
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        
        if (isCurrency) {
            element.textContent = `INR ${current.toFixed(4)}`;
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

function setInrText(id, value) {
    const element = document.getElementById(id);
    if (!element) return;
    const numericValue = Number.isFinite(value) ? value : 0;
    element.textContent = `INR ${numericValue.toFixed(2)}`;
}

// Show loading for charts
function showChartLoading(chartId) {
    const canvas = document.getElementById(chartId);
    if (!canvas) return;
    
    const container = canvas.parentElement;
    container.classList.add('chart-loading');
    canvas.style.opacity = '0.3';
}

// Hide chart loading
function hideChartLoading(chartId) {
    const canvas = document.getElementById(chartId);
    if (!canvas) return;
    
    const container = canvas.parentElement;
    container.classList.remove('chart-loading');
    canvas.style.opacity = '1';
    canvas.classList.add('fade-in');
}

// Show loading for analytics section
function showAnalyticsLoading() {
    // Show loading for summary cards
    const summaryCards = document.querySelectorAll('.grid.md\\:grid-cols-4.gap-4.mb-6 > div');
    summaryCards.forEach(card => {
        card.classList.add('pulse');
    });
    
    // Show loading for charts
    showChartLoading('usageChart');
    showChartLoading('apiBreakdownChart');
    showChartLoading('diseaseChart');
    showChartLoading('userActivityChart');
}

// Hide analytics loading
function hideAnalyticsLoading() {
    // Hide loading for summary cards
    const summaryCards = document.querySelectorAll('.grid.md\\:grid-cols-4.gap-4.mb-6 > div');
    summaryCards.forEach((card, index) => {
        card.classList.remove('pulse');
        card.classList.add('slide-up');
        card.style.animationDelay = `${index * 0.1}s`;
    });
    
    // Hide loading for charts with stagger
    setTimeout(() => hideChartLoading('usageChart'), 200);
    setTimeout(() => hideChartLoading('apiBreakdownChart'), 400);
    setTimeout(() => hideChartLoading('diseaseChart'), 600);
    setTimeout(() => hideChartLoading('userActivityChart'), 800);
}

// Show loading for users table
function showUsersLoading() {
    const container = document.getElementById('usersTable');
    container.innerHTML = `
        <div class="table-skeleton">
            ${Array(5).fill(0).map(() => `
                <div class="table-skeleton-row">
                    <div class="table-skeleton-cell"></div>
                    <div class="table-skeleton-cell"></div>
                    <div class="table-skeleton-cell"></div>
                    <div class="table-skeleton-cell"></div>
                    <div class="table-skeleton-cell"></div>
                    <div class="table-skeleton-cell"></div>
                </div>
            `).join('')}
        </div>
    `;
}

// Show loading for API usage table
function showAPIUsageLoading() {
    const container = document.getElementById('apiUsageTable');
    container.innerHTML = `
        <div class="mb-4 p-4 bg-gray-50 rounded-lg">
            <div class="grid grid-cols-4 gap-4">
                ${Array(4).fill(0).map(() => `
                    <div class="text-center">
                        <div class="skeleton skeleton-text mx-auto mb-2" style="width: 80px;"></div>
                        <div class="skeleton skeleton-title mx-auto" style="width: 60px; height: 2rem;"></div>
                    </div>
                `).join('')}
            </div>
        </div>
        <div class="table-skeleton">
            ${Array(8).fill(0).map(() => `
                <div class="table-skeleton-row">
                    <div class="table-skeleton-cell"></div>
                    <div class="table-skeleton-cell"></div>
                    <div class="table-skeleton-cell"></div>
                    <div class="table-skeleton-cell"></div>
                    <div class="table-skeleton-cell"></div>
                    <div class="table-skeleton-cell"></div>
                </div>
            `).join('')}
        </div>
    `;
}

// Show loading for prescription analytics
function showPrescriptionLoading() {
    // Show loading for stat cards
    const prescCards = document.querySelectorAll('#content-prescriptions .grid.grid-cols-1.md\\:grid-cols-4 > div');
    prescCards.forEach(card => {
        card.classList.add('pulse');
    });
    
    // Show loading for charts
    const chartContainers = ['prescByPriority', 'prescByDisease', 'prescDailyTrend', 'prescTopUsers'];
    chartContainers.forEach(id => {
        const container = document.getElementById(id);
        if (container) {
            container.innerHTML = `
                <div class="flex items-center justify-center py-8">
                    <div class="spinner"></div>
                </div>
            `;
        }
    });
}

// Hide prescription loading
function hidePrescriptionLoading() {
    const prescCards = document.querySelectorAll('#content-prescriptions .grid.grid-cols-1.md\\:grid-cols-4 > div');
    prescCards.forEach((card, index) => {
        card.classList.remove('pulse');
        card.classList.add('scale-in');
        card.style.animationDelay = `${index * 0.1}s`;
    });
}

// Enhanced loadOverviewStats with animations
async function loadOverviewStatsEnhanced() {
    showOverviewLoading();
    
    try {
        const data = await cachedFetch(`${API_URL}/admin/stats/overview`, {}, 'overview-stats');
        if (data) {
            
            // Animate number changes
            animateValue('totalUsers', 0, data.users.total, 800);
            animateValue('totalAnalyses', 0, data.analyses.total, 800);
            animateValue('totalAPICalls', 0, data.api_usage.total_calls, 800);
            animateValue('totalCost', 0, data.api_usage.total_cost, 800, true);
            
            if (data.prescriptions) {
                animateValue('totalPrescriptions', 0, data.prescriptions.total || 0, 800);
            }

            if (data.subscriptions) {
                setInrText('totalRevenue', data.subscriptions.total_revenue);
            }
            
            // Update breakdown with delay for smooth effect
            setTimeout(() => {
                animateValue('groqCost', 0, data.api_usage.groq_cost, 600, true);
                animateValue('perplexityCost', 0, data.api_usage.perplexity_cost, 600, true);
                animateValue('diseasesDetected', 0, data.analyses.diseases_detected, 600);
                animateValue('healthyPlants', 0, data.analyses.healthy_plants, 600);
            }, 300);
            
            hideOverviewLoading();
        }
    } catch (error) {
        console.error('Error loading overview stats:', error);
        hideOverviewLoading();
    }
}

// Enhanced loadAnalyticsTrends with animations
async function loadAnalyticsTrendsEnhanced() {
    showAnalyticsLoading();
    
    try {
        const days = document.getElementById('trendsDaysFilter')?.value || 30;
        
        // Load main trends with caching
        const trends = await cachedFetch(
            `${API_URL}/admin/analytics/trends?days=${days}`,
            { params: { days } },
            'analytics-trends'
        );
        if (trends) {
            
            if (!trends.summary.has_data) {
                hideAnalyticsLoading();
                showNoDataMessage();
                return;
            }
            
            // Update summary cards with animation
            animateValue('avgAPICalls', 0, trends.summary.avg_api_calls_per_day, 600);
            animateValue('avgAnalyses', 0, trends.summary.avg_analyses_per_day, 600);
            animateValue('avgCost', 0, trends.summary.avg_cost_per_day, 600, true);
            animateValue('totalTokens', 0, trends.summary.total_tokens, 600);
            
            const growthRate = trends.summary.growth_rate_percent;
            const growthEl = document.getElementById('growthRate');
            growthEl.textContent = `${growthRate > 0 ? '+' : ''}${growthRate.toFixed(1)}% growth`;
            growthEl.className = `text-xs mt-1 ${growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`;
            
            // Render charts with delay
            setTimeout(() => renderUsageChart(trends.daily_trends), 300);
            setTimeout(() => renderAPIBreakdownChart(trends.daily_trends), 500);
            setTimeout(() => renderDiseaseChart(trends.daily_trends), 700);
        }
        
        // Load user activity with caching
        const activity = await cachedFetch(
            `${API_URL}/admin/analytics/user-activity?days=${days}`,
            { params: { days } },
            'user-activity'
        );
        if (activity) {
            setTimeout(() => renderUserActivityChart(activity.daily_active_users), 900);
        }
        
        hideAnalyticsLoading();
        
    } catch (error) {
        console.error('Error loading analytics trends:', error);
        hideAnalyticsLoading();
    }
}

// Enhanced loadPrescriptionAnalytics with animations
async function loadPrescriptionAnalyticsEnhanced() {
    showPrescriptionLoading();
    
    try {
        const response = await authenticatedFetch(`${API_URL}/admin/analytics/prescriptions?days=30`);
        const data = await response.json();
        
        if (data.success) {
            const stats = data.stats;
            
            // Animate stat cards
            animateValue('prescTotal', 0, stats.total_prescriptions || 0, 800);
            animateValue('totalPrescriptions', 0, stats.total_prescriptions || 0, 800);
            
            const urgentCount = stats.by_priority.find(p => p._id === 'urgent')?.count || 0;
            animateValue('prescUrgent', 0, urgentCount, 800);
            
            const activeCount = stats.by_status.find(s => s._id === 'active')?.count || 0;
            const completedCount = stats.by_status.find(s => s._id === 'completed')?.count || 0;
            animateValue('prescActive', 0, activeCount, 800);
            animateValue('prescCompleted', 0, completedCount, 800);
            
            // Display charts with delay
            setTimeout(() => displayPrescriptionsByPriority(stats.by_priority), 300);
            setTimeout(() => displayPrescriptionsByDisease(stats.by_disease), 500);
            setTimeout(() => displayPrescriptionDailyTrend(stats.daily_trend), 700);
            setTimeout(() => displayPrescriptionTopUsers(stats.top_users), 900);
            
            hidePrescriptionLoading();
        }
    } catch (error) {
        console.error('Error loading prescription analytics:', error);
        hidePrescriptionLoading();
    }
}

// Enhanced loadUsers with loading state
async function loadUsersEnhanced() {
    showUsersLoading();
    
    try {
        const response = await authenticatedFetch(`${API_URL}/admin/users`);
        if (response.ok) {
            const data = await response.json();
            
            // Small delay for smooth transition
            setTimeout(() => {
                displayUsers(data.users);
                
                // Add fade-in animation to table
                const table = document.querySelector('#usersTable table');
                if (table) {
                    table.classList.add('fade-in');
                }
            }, 300);
        }
    } catch (error) {
        console.error('Error loading users:', error);
        document.getElementById('usersTable').innerHTML = '<p class="text-red-500">Error loading users</p>';
    }
}

// Enhanced loadAPIUsage with loading state
async function loadAPIUsageEnhanced(page = 1) {
    showAPIUsageLoading();
    
    try {
        const apiType = document.getElementById('apiTypeFilter').value;
        const days = document.getElementById('daysFilter').value;
        const pageSize = 20;
        
        let url = `${API_URL}/admin/api-usage?days=${days}&page=${page}&page_size=${pageSize}`;
        if (apiType) {
            url += `&api_type=${apiType}`;
        }
        
        console.log('🌐 Fetching API Usage:', url);
        
        const response = await authenticatedFetch(url);
        if (response.ok) {
            const data = await response.json();
            
            console.log('📦 API Response:', data);
            console.log('📄 Has pagination?', !!data.pagination);
            
            // Small delay for smooth transition
            setTimeout(() => {
                displayAPIUsage(data);
                
                // Add fade-in animation
                const container = document.getElementById('apiUsageTable');
                container.classList.add('fade-in');
            }, 300);
        } else {
            console.error('❌ API Error:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('Error loading API usage:', error);
        document.getElementById('apiUsageTable').innerHTML = '<p class="text-red-500">Error loading API usage</p>';
    }
}
