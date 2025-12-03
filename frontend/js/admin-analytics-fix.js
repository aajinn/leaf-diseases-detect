// Analytics Fix - Add this to test if elements are being found
// Add to admin.html: <script src="js/admin-analytics-fix.js"></script>

// Override the loadAnalyticsTrends function with better error handling
window.loadAnalyticsTrendsFixed = async function() {
    console.log('=== Loading Analytics Trends (Fixed Version) ===');
    
    try {
        const days = document.getElementById('trendsDaysFilter')?.value || 30;
        console.log('Days:', days);
        
        // Check if elements exist
        console.log('Checking elements...');
        console.log('avgAPICalls exists:', !!document.getElementById('avgAPICalls'));
        console.log('avgAnalyses exists:', !!document.getElementById('avgAnalyses'));
        console.log('avgCost exists:', !!document.getElementById('avgCost'));
        console.log('totalTokens exists:', !!document.getElementById('totalTokens'));
        
        // Load main trends
        const url = `${API_URL}/admin/analytics/trends?days=${days}`;
        console.log('Fetching:', url);
        
        const trendsResponse = await authenticatedFetch(url);
        console.log('Response status:', trendsResponse.status);
        
        if (!trendsResponse.ok) {
            console.error('Response not OK:', trendsResponse.statusText);
            const errorText = await trendsResponse.text();
            console.error('Error details:', errorText);
            return;
        }
        
        const trends = await trendsResponse.json();
        console.log('Trends data:', trends);
        console.log('Summary:', trends.summary);
        
        // Check if there's any data
        if (!trends.summary.has_data) {
            console.log('No data available');
            showNoDataMessage();
            return;
        }
        
        // Update summary cards with null checks
        console.log('Updating summary cards...');
        
        const avgAPICallsEl = document.getElementById('avgAPICalls');
        if (avgAPICallsEl) {
            const value = trends.summary.avg_api_calls_per_day.toFixed(1);
            console.log('Setting avgAPICalls to:', value);
            avgAPICallsEl.textContent = value;
        } else {
            console.error('avgAPICalls element not found!');
        }
        
        const avgAnalysesEl = document.getElementById('avgAnalyses');
        if (avgAnalysesEl) {
            const value = trends.summary.avg_analyses_per_day.toFixed(1);
            console.log('Setting avgAnalyses to:', value);
            avgAnalysesEl.textContent = value;
        } else {
            console.error('avgAnalyses element not found!');
        }
        
        const avgCostEl = document.getElementById('avgCost');
        if (avgCostEl) {
            const value = `$${trends.summary.avg_cost_per_day.toFixed(4)}`;
            console.log('Setting avgCost to:', value);
            avgCostEl.textContent = value;
        } else {
            console.error('avgCost element not found!');
        }
        
        const totalTokensEl = document.getElementById('totalTokens');
        if (totalTokensEl) {
            const value = trends.summary.total_tokens.toLocaleString();
            console.log('Setting totalTokens to:', value);
            totalTokensEl.textContent = value;
        } else {
            console.error('totalTokens element not found!');
        }
        
        const growthRate = trends.summary.growth_rate_percent;
        const growthEl = document.getElementById('growthRate');
        if (growthEl) {
            growthEl.textContent = `${growthRate > 0 ? '+' : ''}${growthRate.toFixed(1)}% growth`;
            growthEl.className = `text-xs mt-1 ${growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`;
            console.log('Growth rate set:', growthRate);
        }
        
        console.log('Summary cards updated successfully!');
        
        // Update charts
        if (typeof renderUsageChart === 'function') {
            renderUsageChart(trends.daily_trends);
        }
        if (typeof renderAPIBreakdownChart === 'function') {
            renderAPIBreakdownChart(trends.daily_trends);
        }
        if (typeof renderDiseaseChart === 'function') {
            renderDiseaseChart(trends.daily_trends);
        }
        
        // Load user activity
        const activityResponse = await authenticatedFetch(`${API_URL}/admin/analytics/user-activity?days=${days}`);
        if (activityResponse.ok) {
            const activity = await activityResponse.json();
            if (typeof renderUserActivityChart === 'function') {
                renderUserActivityChart(activity.daily_active_users);
            }
        }
        
        console.log('=== Analytics Trends Loaded Successfully ===');
        
    } catch (error) {
        console.error('=== Error loading analytics trends ===');
        console.error(error);
        console.error('Stack:', error.stack);
    }
};

// Call it on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            console.log('Running fixed analytics loader...');
            window.loadAnalyticsTrendsFixed();
        }, 1000);
    });
} else {
    setTimeout(() => {
        console.log('Running fixed analytics loader...');
        window.loadAnalyticsTrendsFixed();
    }, 1000);
}
