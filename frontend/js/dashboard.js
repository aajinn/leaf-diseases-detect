// Dashboard functionality
let selectedFile = null;
let lastAnalysisResult = null;

// Preview image split/rejoin animation during analysis
window._previewAnimation = window._previewAnimation || { running: false, pieces: [] };

function startPreviewAnimation() {
    try {
        const img = document.getElementById('previewImg');
        if (!img || !img.src || window._previewAnimation.running) return;

        const rect = img.getBoundingClientRect();
        const container = document.createElement('div');
        container.id = 'preview-animation-container';
        container.style.cssText = `
            position: fixed;
            left: ${rect.left}px;
            top: ${rect.top}px;
            width: ${rect.width}px;
            height: ${rect.height}px;
            pointer-events: none;
            z-index: 9999;
            border-radius: 12px;
            overflow: hidden;
            background: rgba(0,0,0,0.8);
        `;
        document.body.appendChild(container);

        // Morphing blob effect
        const blob = document.createElement('div');
        blob.style.cssText = `
            position: absolute;
            width: 60px;
            height: 60px;
            background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4);
            border-radius: 50%;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            animation: morphBlob 3s ease-in-out infinite;
            filter: blur(1px);
        `;
        container.appendChild(blob);

        // Orbiting elements
        for (let i = 0; i < 6; i++) {
            const orbit = document.createElement('div');
            orbit.style.cssText = `
                position: absolute;
                width: 8px;
                height: 8px;
                background: hsl(${i * 60}, 70%, 60%);
                border-radius: 50%;
                top: 50%;
                left: 50%;
                transform-origin: 0 0;
                animation: orbit${i} 2s linear infinite;
                box-shadow: 0 0 15px currentColor;
            `;
            container.appendChild(orbit);
        }

        // Ripple waves
        for (let i = 0; i < 4; i++) {
            const wave = document.createElement('div');
            wave.style.cssText = `
                position: absolute;
                border: 2px solid rgba(255,255,255,0.3);
                border-radius: 50%;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                animation: ripple 2s ease-out infinite;
                animation-delay: ${i * 0.5}s;
            `;
            container.appendChild(wave);
        }

        // Dynamic styles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes morphBlob {
                0%, 100% { 
                    border-radius: 50%;
                    transform: translate(-50%, -50%) scale(1) rotate(0deg);
                }
                25% { 
                    border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
                    transform: translate(-50%, -50%) scale(1.2) rotate(90deg);
                }
                50% { 
                    border-radius: 70% 30% 30% 70% / 70% 70% 30% 30%;
                    transform: translate(-50%, -50%) scale(0.8) rotate(180deg);
                }
                75% { 
                    border-radius: 40% 60% 60% 40% / 60% 40% 60% 40%;
                    transform: translate(-50%, -50%) scale(1.1) rotate(270deg);
                }
            }
            @keyframes orbit0 { 0% { transform: rotate(0deg) translateX(40px) rotate(0deg); } 100% { transform: rotate(360deg) translateX(40px) rotate(-360deg); } }
            @keyframes orbit1 { 0% { transform: rotate(60deg) translateX(35px) rotate(-60deg); } 100% { transform: rotate(420deg) translateX(35px) rotate(-420deg); } }
            @keyframes orbit2 { 0% { transform: rotate(120deg) translateX(45px) rotate(-120deg); } 100% { transform: rotate(480deg) translateX(45px) rotate(-480deg); } }
            @keyframes orbit3 { 0% { transform: rotate(180deg) translateX(38px) rotate(-180deg); } 100% { transform: rotate(540deg) translateX(38px) rotate(-540deg); } }
            @keyframes orbit4 { 0% { transform: rotate(240deg) translateX(42px) rotate(-240deg); } 100% { transform: rotate(600deg) translateX(42px) rotate(-600deg); } }
            @keyframes orbit5 { 0% { transform: rotate(300deg) translateX(36px) rotate(-300deg); } 100% { transform: rotate(660deg) translateX(36px) rotate(-660deg); } }
            @keyframes ripple {
                0% { width: 0; height: 0; opacity: 1; }
                100% { width: 200px; height: 200px; opacity: 0; }
            }
        `;
        document.head.appendChild(style);

        img.style.visibility = 'hidden';
        window._previewAnimation.running = true;
        window._previewAnimation.container = container;
        window._previewAnimation.style = style;

    } catch (e) {
        console.error('startPreviewAnimation error:', e);
    }
}

function stopPreviewAnimation() {
    try {
        const img = document.getElementById('previewImg');
        const container = document.getElementById('preview-animation-container');
        
        if (container) {
            container.style.transition = 'transform 600ms ease, opacity 600ms ease';
            container.style.transform = 'scale(0.8)';
            container.style.opacity = '0';
            
            setTimeout(() => {
                try {
                    container.remove();
                    if (window._previewAnimation.style) {
                        window._previewAnimation.style.remove();
                    }
                } catch (e) {}
            }, 600);
        }
        
        if (img) img.style.visibility = '';
        window._previewAnimation.running = false;
        
    } catch (e) {
        console.error('stopPreviewAnimation error:', e);
    }
}

// Toggle auto-crop feature
function toggleAutoCrop(enabled) {
    localStorage.setItem('autoCropEnabled', enabled ? 'true' : 'false');
    if (enabled) {
        showNotification('Auto-crop enabled - Leaf will be detected automatically', 'success');
    } else {
        showNotification('Auto-crop disabled - Full image will be used', 'info');
    }
}

// Initialize auto-crop toggle
function initializeAutoCropToggle() {
    const enabled = localStorage.getItem('autoCropEnabled') !== 'false';
    
    const toggle = document.getElementById('autoCropToggle');
    if (toggle) {
        toggle.checked = enabled;
    }
    
    const toggleMain = document.getElementById('autoCropToggleMain');
    if (toggleMain) {
        toggleMain.checked = enabled;
    }
}

// Toggle color theme feature
function toggleColorTheme(enabled) {
    localStorage.setItem('colorThemeEnabled', enabled ? 'true' : 'false');
    if (enabled) {
        showNotification('🎨 Adaptive color theme enabled - Page will match leaf colors', 'success');
        // Apply theme to current image if available
        if (selectedFile && typeof colorThemeManager !== 'undefined') {
            colorThemeManager.processImageAndApplyTheme(selectedFile);
        }
    } else {
        showNotification('🎨 Adaptive color theme disabled', 'info');
        // Reset theme
        if (typeof colorThemeManager !== 'undefined') {
            colorThemeManager.resetTheme();
        }
    }
}

// Initialize color theme toggle
function initializeColorThemeToggle() {
    const enabled = localStorage.getItem('colorThemeEnabled') !== 'false';
    
    const toggle = document.getElementById('colorThemeToggle');
    if (toggle) {
        toggle.checked = enabled;
    }
    
    const toggleMain = document.getElementById('colorThemeToggleMain');
    if (toggleMain) {
        toggleMain.checked = enabled;
    }
}

// Analyze image file (used by both file upload and camera capture)
async function analyzeImageFile(file) {
    // Auto-crop if enabled
    const autoCropEnabled = localStorage.getItem('autoCropEnabled') !== 'false';
    if (autoCropEnabled && typeof processImageWithAutoCrop === 'function') {
        file = await processImageWithAutoCrop(file);
    }
    
    selectedFile = file;
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('previewImg').src = e.target.result;
        document.getElementById('imagePreview').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
    
    // Auto-analyze
    await analyzeImage();
}

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Replay last analysis audio
function replayAnalysis() {
    if (lastAnalysisResult && typeof tts !== 'undefined') {
        tts.speakAnalysisResult(lastAnalysisResult);
    }
}

// Export current analysis to PDF
function exportCurrentAnalysis() {
    if (lastAnalysisResult && typeof exportAnalysisToPDF !== 'undefined') {
        const imageElement = document.getElementById('previewImg');
        exportAnalysisToPDF(lastAnalysisResult, imageElement);
    }
}

// Show cache information
function showCacheInfo() {
    if (typeof duplicateDetector === 'undefined') {
        showNotification('Cache system not available', 'error');
        return;
    }
    
    const stats = duplicateDetector.getCacheStats();
    const cacheSize = (stats.cacheSize / 1024).toFixed(2);
    
    let oldestDate = 'N/A';
    let newestDate = 'N/A';
    
    if (stats.oldestEntry) {
        oldestDate = new Date(stats.oldestEntry).toLocaleDateString();
    }
    if (stats.newestEntry) {
        newestDate = new Date(stats.newestEntry).toLocaleDateString();
    }
    
    showModal(
        'Cache Information',
        `
        <div class="space-y-4">
            <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <h4 class="font-bold text-blue-800 mb-2">
                    <i class="fas fa-info-circle mr-2"></i>About Duplicate Detection
                </h4>
                <p class="text-sm text-blue-700">
                    The system automatically detects duplicate images and reuses previous analysis results. 
                    This saves API calls and provides instant results!
                </p>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div class="bg-gray-50 p-4 rounded">
                    <p class="text-sm text-gray-600 mb-1">Cached Results</p>
                    <p class="text-2xl font-bold text-primary">${stats.totalEntries}</p>
                </div>
                <div class="bg-gray-50 p-4 rounded">
                    <p class="text-sm text-gray-600 mb-1">Cache Size</p>
                    <p class="text-2xl font-bold text-primary">${cacheSize} KB</p>
                </div>
                <div class="bg-gray-50 p-4 rounded">
                    <p class="text-sm text-gray-600 mb-1">Oldest Entry</p>
                    <p class="text-sm font-semibold text-gray-800">${oldestDate}</p>
                </div>
                <div class="bg-gray-50 p-4 rounded">
                    <p class="text-sm text-gray-600 mb-1">Newest Entry</p>
                    <p class="text-sm font-semibold text-gray-800">${newestDate}</p>
                </div>
            </div>
            
            <div class="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <h4 class="font-bold text-green-800 mb-2">
                    <i class="fas fa-check-circle mr-2"></i>Benefits
                </h4>
                <ul class="text-sm text-green-700 space-y-1">
                    <li><i class="fas fa-bolt mr-2"></i>Instant results for duplicate images</li>
                    <li><i class="fas fa-dollar-sign mr-2"></i>Saves API costs</li>
                    <li><i class="fas fa-leaf mr-2"></i>Reduces server load</li>
                    <li><i class="fas fa-clock mr-2"></i>Results cached for 7 days</li>
                </ul>
            </div>
            
            <button onclick="clearCacheConfirm()" class="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition">
                <i class="fas fa-trash mr-2"></i>Clear Cache
            </button>
        </div>
        `
    );
}

// Clear cache with confirmation
async function clearCacheConfirm() {
    let confirmed = false;
    try {
        if (typeof showConfirm === 'function') {
            confirmed = await showConfirm('Are you sure you want to clear the cache? This will remove all saved analysis results.', 'Confirm Action');
        } else {
            // Fallback to native confirm
            confirmed = confirm('Are you sure you want to clear the cache? This will remove all saved analysis results.');
        }
    } catch (e) {
        console.error('Confirmation dialog error:', e);
        // If confirmation dialog fails, do not proceed
        confirmed = false;
    }

    if (confirmed) {
        if (typeof duplicateDetector !== 'undefined') {
            duplicateDetector.clearCache();
            updateCacheCount();
            showNotification('Cache cleared successfully', 'success');
            // Close modal if open
            const modal = document.querySelector('.modal');
            if (modal) modal.remove();
        }
    }
}

// Update cache count display
function updateCacheCount() {
    try {
        if (typeof duplicateDetector !== 'undefined' && duplicateDetector) {
            const stats = duplicateDetector.getCacheStats();
            const countEl = document.getElementById('cachedCount');
            if (countEl) {
                countEl.textContent = stats.totalEntries;
            }
        }
    } catch (error) {
        console.error('Error updating cache count:', error);
    }
}

// Simple modal function
function showModal(title, content) {
    const modal = document.createElement('div');
    modal.className = 'modal fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-screen overflow-y-auto">
            <div class="p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-2xl font-bold">${title}</h3>
                    <button onclick="this.closest('.modal').remove()" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times text-2xl"></i>
                    </button>
                </div>
                ${content}
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Step-by-step guide
function showGuide() {
    const guideContent = `
        <div class="space-y-6">
            <div class="bg-blue-50 p-4 rounded-lg">
                <h4 class="font-bold text-blue-800 mb-2">🌿 How to Use Leaf Disease Detection</h4>
                <p class="text-blue-700 text-sm">Follow these simple steps to analyze your plant images</p>
            </div>
            
            <div class="space-y-4">
                <div class="flex items-start space-x-3">
                    <div class="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</div>
                    <div>
                        <h5 class="font-semibold">Upload Image</h5>
                        <p class="text-gray-600 text-sm">Click "Choose File" or drag & drop your leaf image. Supports JPG, PNG (max 10MB)</p>
                    </div>
                </div>
                
                <div class="flex items-start space-x-3">
                    <div class="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</div>
                    <div>
                        <h5 class="font-semibold">Preview & Analyze</h5>
                        <p class="text-gray-600 text-sm">Review your image preview, then click "🔍 Analyze Image" button</p>
                    </div>
                </div>
                
                <div class="flex items-start space-x-3">
                    <div class="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</div>
                    <div>
                        <h5 class="font-semibold">View Results</h5>
                        <p class="text-gray-600 text-sm">Get disease detection, confidence score, symptoms, and treatment recommendations</p>
                    </div>
                </div>
                
                <div class="flex items-start space-x-3">
                    <div class="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">4</div>
                    <div>
                        <h5 class="font-semibold">Export & Save</h5>
                        <p class="text-gray-600 text-sm">Export results as PDF or listen to audio summary. All analyses are saved in your history</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-yellow-50 p-4 rounded-lg">
                <h5 class="font-semibold text-yellow-800 mb-2">💡 Tips for Best Results</h5>
                <ul class="text-yellow-700 text-sm space-y-1">
                    <li>• Use clear, well-lit images</li>
                    <li>• Focus on affected leaf areas</li>
                    <li>• Avoid blurry or dark photos</li>
                    <li>• Include multiple symptoms if visible</li>
                </ul>
            </div>
        </div>
    `;
    
    showModal('📖 Step-by-Step Guide', guideContent);
}

// Notification system
async function loadNotifications() {
    try {
        const response = await authenticatedFetch(`${API_URL}/api/notifications/`);
        const notifications = await response.json();
        
        const countResponse = await authenticatedFetch(`${API_URL}/api/notifications/unread-count`);
        const countData = await countResponse.json();
        
        updateNotificationBadge(countData.count);
        displayNotifications(notifications);
    } catch (error) {
        console.error('Error loading notifications:', error);
    }
}

function updateNotificationBadge(count) {
    const badge = document.getElementById('notificationBadge');
    if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

function displayNotifications(notifications) {
    const list = document.getElementById('notificationList');
    
    if (notifications.length === 0) {
        list.innerHTML = '<p class="p-4 text-gray-500 text-sm text-center">No notifications</p>';
        return;
    }
    
    list.innerHTML = notifications.map(notification => `
        <div class="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${!notification.read ? 'bg-blue-50' : ''}" 
             onclick="openNotificationAnalysis('${notification.id}', '${notification.analysis_id}')">
            <div class="flex items-start space-x-3">
                <i class="fas fa-${getNotificationIcon(notification.type)} text-blue-500 mt-1"></i>
                <div class="flex-1">
                    <h4 class="font-semibold text-sm text-gray-800">${notification.title}</h4>
                    <p class="text-xs text-gray-600 mt-1">${notification.message}</p>
                    <p class="text-xs text-gray-400 mt-2">${new Date(notification.created_at).toLocaleString()}</p>
                </div>
                ${!notification.read ? '<div class="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>' : ''}
            </div>
        </div>
    `).join('');
}

async function openNotificationAnalysis(notificationId, analysisId) {
    // Mark notification as read
    await markNotificationRead(notificationId);
    // Store analysis ID and redirect to history
    sessionStorage.setItem('openAnalysisId', analysisId);
    window.location.href = '/history';
}

function getNotificationIcon(type) {
    switch (type) {
        case 'analysis_correction': return 'edit';
        case 'feedback_update': return 'comment';
        case 'system': return 'info-circle';
        default: return 'bell';
    }
}

function toggleNotifications() {
    showNotificationModal();
}

function showNotificationModal() {
    const modal = document.getElementById('notificationModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    loadNotifications();
}

function closeNotificationModal() {
    const modal = document.getElementById('notificationModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('notificationModal');
    if (e.target === modal) {
        closeNotificationModal();
    }
});

async function markNotificationRead(notificationId) {
    try {
        await authenticatedFetch(`${API_URL}/api/notifications/${notificationId}/read`, {
            method: 'PUT'
        });
        loadNotifications();
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

async function markAllRead() {
    try {
        await authenticatedFetch(`${API_URL}/api/notifications/mark-all-read`, {
            method: 'PUT'
        });
        loadNotifications();
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
    }
}

// Close notification dropdown when clicking outside
document.addEventListener('click', (e) => {
    // Modal handles its own click outside logic
});

// Test duplicate detector
function testDuplicateDetector() {
    console.log('=== Duplicate Detector Test ===');
    console.log('duplicateDetector exists:', typeof duplicateDetector !== 'undefined');
    if (typeof duplicateDetector !== 'undefined' && duplicateDetector) {
        console.log('duplicateDetector object:', duplicateDetector);
        console.log('Cache stats:', duplicateDetector.getCacheStats());
    } else {
        console.error('duplicateDetector is not available!');
    }
    console.log('=== End Test ===');
}

// Check subscription limits
async function checkSubscriptionLimits() {
    try {
        const response = await authenticatedFetch(`${API_URL}/api/subscriptions/check-usage`);
        const data = await response.json();
        
        if (!data.can_analyze) {
            showSubscriptionLimitModal(data);
            return false;
        }
        
        // Show warning if close to limit
        if (data.usage_percent > 80) {
            showNotification(`⚠️ You've used ${data.analyses_used}/${data.analyses_limit} analyses this month`, 'warning');
        }
        
        return true;
    } catch (error) {
        console.error('Error checking subscription limits:', error);
        return true; // Allow analysis if check fails
    }
}

// Show subscription limit modal
function showSubscriptionLimitModal(data) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div class="p-6">
                <div class="text-center mb-6">
                    <div class="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                        <i class="fas fa-exclamation-triangle text-yellow-600 text-2xl"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">
                        Monthly Limit Reached
                    </h3>
                    <p class="text-gray-600">
                        You've used all ${data.analyses_used} analyses in your ${data.plan_name} plan this month.
                    </p>
                </div>
                
                <div class="bg-blue-50 rounded-lg p-4 mb-6">
                    <h4 class="font-semibold text-blue-800 mb-2">Options:</h4>
                    <ul class="space-y-1 text-sm text-blue-700">
                        <li class="flex items-center"><i class="fas fa-arrow-up text-blue-600 mr-2"></i>Upgrade to a higher plan</li>
                        <li class="flex items-center"><i class="fas fa-calendar text-blue-600 mr-2"></i>Wait for next billing cycle</li>
                        <li class="flex items-center"><i class="fas fa-gift text-blue-600 mr-2"></i>Contact support for assistance</li>
                    </ul>
                </div>
                
                <div class="flex space-x-3">
                    <button onclick="window.location.href='/subscription'" class="flex-1 bg-primary text-white py-3 rounded-lg hover:bg-secondary transition font-semibold">
                        <i class="fas fa-crown mr-2"></i>Upgrade Plan
                    </button>
                    <button onclick="this.closest('.fixed').remove()" class="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                        Close
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Load subscription status
async function loadSubscriptionStatus() {
    try {
        const response = await authenticatedFetch(`${API_URL}/api/subscriptions/my-subscription`);
        const data = await response.json();
        
        displaySubscriptionStatus(data);
        
        // Show usage warning if close to limit
        if (data && data.usage && data.plan.analyses_limit !== -1) {
            const usagePercent = data.usage.usage_percent;
            if (usagePercent > 80) {
                const remaining = data.plan.analyses_limit - data.usage.analyses_used;
                showNotification(
                    `⚠️ You're running low on analyses! ${remaining} remaining this month.`,
                    'warning'
                );
            }
        }
    } catch (error) {
        console.error('Error loading subscription:', error);
        displaySubscriptionStatus(null);
    }
}

function displaySubscriptionStatus(subscription) {
    const content = document.getElementById('subscriptionContent');
    const card = document.getElementById('subscriptionCard');
    
    if (!subscription) {
        // No subscription - show free plan
        card.className = 'bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-lg p-6 border border-gray-200';
        content.innerHTML = `
            <div class="text-center">
                <div class="text-lg font-bold text-gray-800 mb-1">Free Plan</div>
                <div class="text-sm text-gray-600 mb-3">₹0/month</div>
                <div class="text-xs text-gray-500 mb-4">5 analyses/month</div>
                <button onclick="window.location.href='/subscription'" 
                    class="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-secondary transition text-sm font-semibold">
                    <i class="fas fa-arrow-up mr-1"></i>Upgrade
                </button>
            </div>
        `;
        return;
    }
    
    const plan = subscription.plan;
    const usage = subscription.usage || { analyses_used: 0 };
    const usagePercent = Math.min((usage.analyses_used / plan.analyses_limit) * 100, 100);
    
    // Set card style based on plan
    let cardClass, planColor, planIcon;
    switch(plan.name.toLowerCase()) {
        case 'premium':
            cardClass = 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200';
            planColor = 'text-purple-900';
            planIcon = 'fa-star';
            break;
        case 'enterprise':
            cardClass = 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200';
            planColor = 'text-yellow-900';
            planIcon = 'fa-crown';
            break;
        default: // basic
            cardClass = 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200';
            planColor = 'text-blue-900';
            planIcon = 'fa-gem';
    }
    
    card.className = `${cardClass} rounded-xl shadow-lg p-6 border`;
    
    const nextBilling = subscription.next_billing_date 
        ? new Date(subscription.next_billing_date).toLocaleDateString()
        : 'N/A';
    
    content.innerHTML = `
        <div class="text-center">
            <div class="flex items-center justify-center mb-2">
                <i class="fas ${planIcon} text-yellow-500 mr-2"></i>
                <div class="text-lg font-bold ${planColor}">${plan.name}</div>
            </div>
            <div class="text-sm text-gray-600 mb-3">₹${plan.price}/${plan.billing_cycle}</div>
            
            <!-- Usage Progress -->
            <div class="mb-4">
                <div class="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Analyses Used</span>
                    <span>${usage.analyses_used}/${plan.analyses_limit === -1 ? '∞' : plan.analyses_limit}</span>
                </div>
                ${plan.analyses_limit !== -1 ? `
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="bg-primary h-2 rounded-full transition-all" style="width: ${usagePercent}%"></div>
                    </div>
                ` : '<div class="text-xs text-green-600 font-semibold">Unlimited</div>'}
            </div>
            
            <div class="text-xs text-gray-500 mb-3">Next billing: ${nextBilling}</div>
            
            <button onclick="window.location.href='/subscription'" 
                class="w-full bg-white text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition text-sm font-semibold border">
                <i class="fas fa-cog mr-1"></i>Manage
            </button>
        </div>
    `;
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
    await loadUserInfo();
    await loadSubscriptionStatus();
    await loadStats();
    await loadNotifications();
    setupFileUpload();
    initializeTTS();
    initializeAutoCropToggle();
    initializeColorThemeToggle();
    checkPendingAnalysis();
    updateCacheCount();
    
    // Test duplicate detector after a short delay
    setTimeout(() => {
        testDuplicateDetector();
    }, 1000);
    
    // Refresh notifications every 30 seconds
    setInterval(loadNotifications, 30000);
});

// Check for pending analysis from live detection
function checkPendingAnalysis() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('showResult') === 'true') {
        const pendingAnalysis = sessionStorage.getItem('pendingAnalysis');
        if (pendingAnalysis) {
            try {
                const result = JSON.parse(pendingAnalysis);
                sessionStorage.removeItem('pendingAnalysis');
                
                // Display full results
                displayResults(result);
                lastAnalysisResult = result;
                
                // Show action buttons
                const replayBtn = document.getElementById('replayTTS');
                const exportBtn = document.getElementById('exportPDF');
                if (replayBtn) replayBtn.classList.remove('hidden');
                if (exportBtn) exportBtn.classList.remove('hidden');
                
                // Scroll to results
                document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
                
                showNotification('Full analysis loaded from live detection', 'success');
            } catch (error) {
                console.error('Error loading pending analysis:', error);
            }
        }
    }
}

function initializeTTS() {
    if (typeof tts !== 'undefined') {
        const icon = document.getElementById('ttsIcon');
        const button = document.getElementById('ttsButton');
        
        if (icon && button) {
            const enabled = tts.isEnabled();
            icon.classList.remove('fa-volume-up', 'fa-volume-mute');
            icon.classList.add(enabled ? 'fa-volume-up' : 'fa-volume-mute');
            button.classList.remove('bg-primary', 'bg-gray-400');
            button.classList.add(enabled ? 'bg-primary' : 'bg-gray-400');
            button.title = enabled ? 'Disable voice announcements' : 'Enable voice announcements';
        }
    }
}

async function loadUserInfo() {
    const profile = await getUserProfile();
    if (profile) {
        document.getElementById('userInfo').textContent = `Hello, ${profile.full_name || profile.username}!`;
        
        // Show admin link if user is admin
        if (profile.is_admin) {
            const adminLink = document.getElementById('adminLink');
            if (adminLink) adminLink.classList.remove('hidden');
        }
        
        // Show medical link if user is medical member
        if (profile.is_medical) {
            const medicalLink = document.getElementById('medicalLink');
            if (medicalLink) medicalLink.classList.remove('hidden');
        } else {
            // Show apply for medical team button for non-medical users
            const applyMedicalLink = document.getElementById('applyMedicalLink');
            if (applyMedicalLink) applyMedicalLink.classList.remove('hidden');
        }
    } else {
        // Session invalid, redirect to login
        window.location.href = '/login?redirect=/dashboard';
    }
}

async function loadStats() {
    try {
        console.log('Loading stats from API...');
        const response = await authenticatedFetch(`${API_URL}/api/my-analyses`);
        const data = await response.json();
        
        console.log('API response:', data);
        const records = data.records || [];
        console.log('Records found:', records.length);
        
        document.getElementById('totalAnalyses').textContent = records.length;
        
        const diseased = records.filter(r => r.disease_detected).length;
        const healthy = records.length - diseased;
        
        document.getElementById('diseasesFound').textContent = diseased;
        document.getElementById('healthyPlants').textContent = healthy;
        
        // Show recent activity
        displayRecentActivity(records.slice(0, 5));
    } catch (error) {
        console.error('Error loading stats:', error);
        // Show fallback message
        document.getElementById('recentActivity').innerHTML = '<p class="text-gray-500 text-sm">Unable to load recent activity</p>';
    }
}

function displayRecentActivity(records) {
    const container = document.getElementById('recentActivity');
    
    if (records.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-sm">No recent activity</p>';
        return;
    }
    
    container.innerHTML = records.map(record => `
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors" 
             onclick="openAnalysisInHistory('${record.id || record._id}')">
            <div class="flex items-center">
                <i class="fas fa-${record.disease_detected ? 'exclamation-circle text-red-500' : 'check-circle text-green-500'} mr-3"></i>
                <div>
                    <p class="font-semibold text-sm">${record.disease_name || 'Healthy'}</p>
                    <p class="text-xs text-gray-500">${new Date(record.analysis_timestamp).toLocaleDateString()}</p>
                    ${record.disease_detected ? `
                        <button onclick="event.stopPropagation(); openPrescriptionFromAnalysis('${record.id || record._id}')" 
                                class="text-xs text-blue-600 hover:text-blue-800 mt-1">
                            <i class="fas fa-prescription mr-1"></i>View Prescription
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

function openAnalysisInHistory(analysisId) {
    console.log('Opening analysis in history:', analysisId);
    // Store the analysis ID to open in history page
    sessionStorage.setItem('openAnalysisId', analysisId);
    // Redirect to history page
    window.location.href = '/history';
}

// Open prescription from analysis ID
async function openPrescriptionFromAnalysis(analysisId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showNotification('Please login to view prescriptions', 'error');
            return;
        }

        // Find prescription by analysis ID
        const response = await fetch(`/api/prescriptions/my-prescriptions`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            const prescription = data.prescriptions?.find(p => p.analysis_id === analysisId);
            
            if (prescription) {
                // Store prescription ID and redirect
                sessionStorage.setItem('openPrescriptionId', prescription.prescription_id);
                window.location.href = '/prescriptions';
            } else {
                showNotification('No prescription found for this analysis', 'info');
            }
        } else {
            showNotification('Failed to load prescriptions', 'error');
        }
    } catch (error) {
        console.error('Error opening prescription:', error);
        showNotification('Error loading prescription', 'error');
    }
}

function setupFileUpload() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = document.getElementById('previewImg');
    const analyzeBtn = document.getElementById('analyzeBtn');

    // File input change
    fileInput.addEventListener('change', (e) => {
        handleFile(e.target.files[0]);
    });

    // Drag and drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('border-primary', 'bg-green-50');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('border-primary', 'bg-green-50');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-primary', 'bg-green-50');
        handleFile(e.dataTransfer.files[0]);
    });

    // Analyze button
    analyzeBtn.addEventListener('click', analyzeImage);
}

async function handleFile(file) {
    const validation = validateImageFile(file);
    
    if (!validation.valid) {
        showNotification(validation.message, 'error');
        return;
    }

    // Auto-crop leaf if enabled
    const autoCropEnabled = localStorage.getItem('autoCropEnabled') !== 'false';
    if (autoCropEnabled && typeof processImageWithAutoCrop === 'function') {
        file = await processImageWithAutoCrop(file);
    }

    selectedFile = file;
    
    // Reset disease status when new image is selected
    if (typeof window.setDiseaseStatus === 'function') {
        window.diseaseStatus = null;
        // Return to normal user/guest theme
        if (typeof window.updateBackgroundTheme === 'function') {
            const isLoggedIn = !!localStorage.getItem('token');
            window.updateBackgroundTheme(isLoggedIn ? 'user' : 'guest');
        }
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('previewImg').src = e.target.result;
        document.getElementById('imagePreview').classList.remove('hidden');
        document.getElementById('results').classList.add('hidden');
    };
    reader.readAsDataURL(file);
    
    // Apply color theme if enabled
    const colorThemeEnabled = localStorage.getItem('colorThemeEnabled') !== 'false';
    if (colorThemeEnabled && typeof colorThemeManager !== 'undefined') {
        await colorThemeManager.processImageAndApplyTheme(file);
    }
}

async function analyzeImage() {
    if (!selectedFile) return;

    // Check subscription limits first
    const canAnalyze = await checkSubscriptionLimits();
    if (!canAnalyze) {
        return;
    }

    const analyzeBtn = document.getElementById('analyzeBtn');
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Checking for duplicates...';

    // Check for duplicate image
    if (typeof duplicateDetector !== 'undefined') {
        try {
            console.log('Checking for duplicate image...');
            const duplicateCheck = await duplicateDetector.checkDuplicate(selectedFile);
            console.log('Duplicate check result:', duplicateCheck);
            
            if (duplicateCheck.isDuplicate) {
            // Use cached result
            console.log('Duplicate image detected, using cached result');
            
            analyzeBtn.innerHTML = '<i class="fas fa-check mr-2"></i>Using cached result...';
            
            // Show notification with cache info
            showNotification('✨ Duplicate image detected! Using previous analysis (instant result, no API call)', 'success');
            
            // Display cached result
            const result = duplicateCheck.result;
            lastAnalysisResult = result;
            
            // Set disease status
            if (typeof window.setDiseaseStatus === 'function') {
                const status = result.disease_detected ? 'diseased' : 'healthy';
                window.setDiseaseStatus(status);
            }
            
            displayResults(result);
            
            // Show action buttons
            const replayBtn = document.getElementById('replayTTS');
            const exportBtn = document.getElementById('exportPDF');
            if (replayBtn) replayBtn.classList.remove('hidden');
            if (exportBtn) exportBtn.classList.remove('hidden');
            
            // Speak results if TTS enabled
            if (typeof tts !== 'undefined') {
                tts.speakAnalysisResult(result);
            }
            
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = '<i class="fas fa-microscope mr-2"></i>Analyze Image';
            
            await loadStats(); // Refresh stats
            
            return;
        } else {
            console.log('No duplicate found, proceeding with analysis');
        }
        } catch (error) {
            console.error('Error checking for duplicates:', error);
            // Continue with normal analysis if duplicate check fails
        }
    } else {
        console.warn('duplicateDetector not available');
    }

    analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Analyzing...';

    // Start preview animation
    startPreviewAnimation();

    // Set analyzing state for background animation
    if (typeof window.setAnalyzingState === 'function') {
        window.setAnalyzingState(true);
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    
    let analysisSuccessful = false;
    let imageHash = null;

    // Generate hash for caching
    if (typeof duplicateDetector !== 'undefined') {
        imageHash = await duplicateDetector.generateImageHash(selectedFile);
    }

    try {
        const token = sessionManager.getToken();
        
        if (!token) {
            showNotification('Please login to analyze images', 'warning');
            setTimeout(() => {
                window.location.href = '/login?redirect=/dashboard';
            }, 1500);
            return;
        }

        console.log('Uploading file:', selectedFile.name, 'Size:', selectedFile.size, 'Type:', selectedFile.type);
        console.log('Token present:', !!token);

        const response = await fetch(`${API_URL}/api/disease-detection`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        console.log('Response status:', response.status, response.statusText);

        if (response.ok) {
            const result = await response.json();
            console.log('Analysis result:', result);
            console.log('Description:', result.description);
            console.log('Description exists:', !!result.description);
            console.log('Description length:', result.description ? result.description.length : 0);
            console.log('YouTube videos in response:', result.youtube_videos);
            console.log('Number of videos:', result.youtube_videos ? result.youtube_videos.length : 0);
            
            // Store result for replay
            lastAnalysisResult = result;
            analysisSuccessful = true;
            
            // Cache the result for future duplicate detection (only valid images)
            if (typeof duplicateDetector !== 'undefined' && imageHash) {
                // Only cache if it's a valid plant image (not invalid_image type)
                if (result.disease_type !== 'invalid_image') {
                    duplicateDetector.saveCachedResult(imageHash, result);
                    console.log('Valid analysis result cached for duplicate detection');
                } else {
                    console.log('Invalid image - not caching result');
                }
            }
            
            displayResults(result);
            
            // Stop preview animation
            stopPreviewAnimation();

            // Reset analyzing state first, then set disease status after a brief delay
            if (typeof window.setAnalyzingState === 'function') {
                window.setAnalyzingState(false);
            }
            
            // Set disease status for background animation after a brief delay
            setTimeout(() => {
                if (typeof window.setDiseaseStatus === 'function') {
                    const status = result.disease_detected ? 'diseased' : 'healthy';
                    console.log('Setting disease status to:', status);
                    window.setDiseaseStatus(status);
                }
            }, 300);
            
            // Show action buttons
            const replayBtn = document.getElementById('replayTTS');
            const exportBtn = document.getElementById('exportPDF');
            if (replayBtn) {
                replayBtn.classList.remove('hidden');
            }
            if (exportBtn) {
                exportBtn.classList.remove('hidden');
            }
            
            // Speak the results
            if (typeof tts !== 'undefined') {
                tts.speakAnalysisResult(result);
            }
            
            // Invalidate cache after new analysis
            if (typeof apiCache !== 'undefined') {
                apiCache.invalidate('history');
                apiCache.clearPattern(/dashboard-stats/);
            }
            
            await loadStats(); // Refresh stats
        } else if (response.status === 401) {
            handleSessionExpired();
        } else {
            let errorMessage = 'Analysis failed. Please try again.';
            let fullError = null;
            try {
                const errorData = await response.json();
                console.error('Full error response:', JSON.stringify(errorData, null, 2));
                fullError = errorData;
                
                // Handle different error formats
                if (typeof errorData === 'string') {
                    errorMessage = errorData;
                } else if (errorData.detail) {
                    // FastAPI validation errors have detail as array or string
                    if (Array.isArray(errorData.detail)) {
                        errorMessage = errorData.detail.map(err => 
                            `${err.loc ? err.loc.join('.') + ': ' : ''}${err.msg}`
                        ).join(', ');
                    } else {
                        errorMessage = typeof errorData.detail === 'string' 
                            ? errorData.detail 
                            : JSON.stringify(errorData.detail);
                    }
                } else if (errorData.message) {
                    errorMessage = errorData.message;
                } else if (errorData.error) {
                    errorMessage = errorData.error;
                }
            } catch (e) {
                console.error('Error parsing error response:', e);
                errorMessage = `Server error (${response.status}): ${response.statusText}`;
            }
            showErrorMessage(errorMessage, fullError);
        }
    } catch (error) {
        console.error('Analysis error:', error);
        if (error.message !== 'Session expired') {
            let errorMsg = 'Network error. Please check your connection and try again.';
            if (error.message && error.message !== 'Failed to fetch') {
                errorMsg = error.message;
            }
            showErrorMessage(errorMsg);
        }
    } finally {
        // Stop animation and reset analyzing state if analysis failed
        if (!analysisSuccessful) {
            stopPreviewAnimation();
            if (typeof window.setAnalyzingState === 'function') {
                window.setAnalyzingState(false);
                // Also clear any previous disease status
                window.diseaseStatus = null;
            }
        }
        
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = '<i class="fas fa-microscope mr-2"></i>Analyze Image';
    }
}

function showErrorMessage(message, fullError = null) {
    const resultsDiv = document.getElementById('results');
    const resultsContent = document.getElementById('resultsContent');
    
    let debugInfo = '';
    if (fullError) {
        debugInfo = `
            <details class="mt-4">
                <summary class="cursor-pointer text-sm font-semibold text-gray-700 hover:text-gray-900">
                    Technical Details (for debugging)
                </summary>
                <pre class="mt-2 p-3 bg-gray-100 rounded text-xs overflow-auto">${JSON.stringify(fullError, null, 2)}</pre>
            </details>
        `;
    }
    
    resultsContent.innerHTML = `
        <div class="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
            <div class="flex items-center mb-4">
                <i class="fas fa-exclamation-circle text-red-500 text-3xl mr-4"></i>
                <h4 class="text-xl font-bold text-red-800">Analysis Failed</h4>
            </div>
            <p class="text-red-700 mb-4">${message}</p>
            <div class="bg-white p-4 rounded">
                <p class="font-semibold mb-2">Troubleshooting:</p>
                <ul class="list-disc list-inside space-y-1 text-sm">
                    <li>Make sure the image is a clear photo of a plant leaf</li>
                    <li>Check that the file is a valid image format (JPG, PNG, WebP)</li>
                    <li>Ensure the image file is not corrupted</li>
                    <li>Try uploading a different image</li>
                    <li>Check your internet connection</li>
                    <li>Check the browser console (F12) for more details</li>
                </ul>
            </div>
            ${debugInfo}
        </div>
    `;
    
    resultsDiv.classList.remove('hidden');
    resultsDiv.scrollIntoView({ behavior: 'smooth' });
}

function displayResults(result) {
    const resultsDiv = document.getElementById('results');
    const resultsContent = document.getElementById('resultsContent');

    console.log('Displaying results for:', result);
    console.log('Disease detected:', result.disease_detected);
    console.log('Analysis ID:', result.id);

    let html = '';

    if (result.disease_type === 'invalid_image') {
        html = `
            <div class="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-lg">
                <div class="flex items-center mb-4">
                    <i class="fas fa-exclamation-triangle text-yellow-500 text-3xl mr-4"></i>
                    <h4 class="text-xl font-bold text-yellow-800">Invalid Image</h4>
                </div>
                <p class="text-yellow-700 mb-4">${result.symptoms[0]}</p>
                <div class="bg-white p-4 rounded">
                    <p class="font-semibold mb-2">What to do:</p>
                    <ul class="list-disc list-inside space-y-1">
                        ${result.treatment.map(t => `<li>${t}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `;
    } else if (result.disease_detected) {
        html = `
            <div class="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg mb-6">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center">
                        <i class="fas fa-virus text-red-500 text-3xl mr-4"></i>
                        <div>
                            <h4 class="text-2xl font-bold text-red-800">${result.original_disease_name || result.disease_name}</h4>
                            ${result.disease_name && result.original_disease_name && result.disease_name !== result.original_disease_name ? `<p class="text-xs text-gray-500 font-mono mb-1">ID: ${result.disease_name.split('#')[1] || 'N/A'}</p>` : ''}
                            <p class="text-red-600">Type: ${result.disease_type} | Severity: ${result.severity}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-3xl font-bold text-red-600">${result.confidence}%</div>
                        <div class="text-sm text-red-500">Confidence</div>
                    </div>
                </div>
                ${result.description && result.description.trim() ? `
                <div class="mt-4 p-4 bg-white rounded-lg border-l-4 border-blue-500">
                    <h5 class="font-bold text-sm text-gray-700 mb-2 flex items-center">
                        <i class="fas fa-info-circle text-blue-500 mr-2"></i>
                        About This Disease
                    </h5>
                    <p class="text-gray-700 text-sm leading-relaxed">${escapeHtml(result.description)}</p>
                </div>
                ` : ''}
            </div>

            <!-- Prescription Actions -->
            <div class="bg-white border-2 border-blue-500 rounded-lg p-6 mb-6">
                <h5 class="font-bold text-lg mb-4 flex items-center text-blue-700">
                    <i class="fas fa-prescription-bottle-medical text-blue-500 mr-2"></i>
                    Treatment Prescription
                </h5>
                <p class="text-gray-600 mb-4">Generate a comprehensive treatment plan with product recommendations and step-by-step instructions.</p>
                <div class="flex flex-wrap gap-3">
                    <button onclick="generatePrescription('${result.id}')" class="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition font-semibold flex items-center shadow-md">
                        <i class="fas fa-prescription mr-2"></i>
                        Generate Treatment Prescription
                    </button>
                    <button onclick="window.location.href='/prescriptions'" class="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition font-semibold flex items-center shadow-md">
                        <i class="fas fa-list mr-2"></i>
                        View All Prescriptions
                    </button>
                </div>
            </div>

            <div class="grid md:grid-cols-3 gap-6">
                <div class="bg-white border border-gray-200 rounded-lg p-6">
                    <h5 class="font-bold text-lg mb-3 flex items-center">
                        <i class="fas fa-stethoscope text-primary mr-2"></i>
                        Symptoms
                    </h5>
                    <ul class="space-y-2">
                        ${result.symptoms.map(s => `<li class="flex items-start"><i class="fas fa-circle text-xs text-primary mr-2 mt-1"></i><span class="text-gray-700">${s}</span></li>`).join('')}
                    </ul>
                </div>

                <div class="bg-white border border-gray-200 rounded-lg p-6">
                    <h5 class="font-bold text-lg mb-3 flex items-center">
                        <i class="fas fa-search text-primary mr-2"></i>
                        Possible Causes
                    </h5>
                    <ul class="space-y-2">
                        ${result.possible_causes.map(c => `<li class="flex items-start"><i class="fas fa-circle text-xs text-primary mr-2 mt-1"></i><span class="text-gray-700">${c}</span></li>`).join('')}
                    </ul>
                </div>

                <div class="bg-white border border-gray-200 rounded-lg p-6">
                    <h5 class="font-bold text-lg mb-3 flex items-center">
                        <i class="fas fa-prescription-bottle text-primary mr-2"></i>
                        Treatment
                    </h5>
                    <ul class="space-y-2">
                        ${result.treatment.map(t => `<li class="flex items-start"><i class="fas fa-circle text-xs text-primary mr-2 mt-1"></i><span class="text-gray-700">${t}</span></li>`).join('')}
                    </ul>
                </div>
            </div>

            ${displayYouTubeVideos(result.youtube_videos, false)}
            
            <!-- Feedback Section -->
            <div class="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h5 class="font-bold text-sm mb-3 flex items-center text-gray-700">
                    <i class="fas fa-comment-alt text-gray-500 mr-2"></i>
                    Was this analysis helpful?
                </h5>
                <button onclick="showFeedbackModal('${result.id}')" class="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition text-sm">
                    <i class="fas fa-flag mr-2"></i>Report Issue / Provide Feedback
                </button>
            </div>
        `;
    } else {
        html = `
            <div class="bg-green-50 border-l-4 border-green-500 p-6 rounded-lg">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center">
                        <i class="fas fa-check-circle text-green-500 text-4xl mr-4"></i>
                        <div>
                            <h4 class="text-2xl font-bold text-green-800">Healthy Leaf!</h4>
                            <p class="text-green-600">No disease detected in this plant</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-3xl font-bold text-green-600">${result.confidence}%</div>
                        <div class="text-sm text-green-500">Confidence</div>
                    </div>
                </div>
                ${result.description && result.description.trim() ? `
                <div class="mt-4 p-4 bg-white rounded-lg border-l-4 border-green-500">
                    <h5 class="font-bold text-sm text-gray-700 mb-2 flex items-center">
                        <i class="fas fa-leaf text-green-500 mr-2"></i>
                        Plant Health Information
                    </h5>
                    <p class="text-gray-700 text-sm leading-relaxed">${escapeHtml(result.description)}</p>
                </div>
                ` : ''}
            </div>

            ${displayYouTubeVideos(result.youtube_videos, true)}
            
            <!-- Feedback Section -->
            <div class="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h5 class="font-bold text-sm mb-3 flex items-center text-gray-700">
                    <i class="fas fa-comment-alt text-gray-500 mr-2"></i>
                    Was this analysis helpful?
                </h5>
                <button onclick="showFeedbackModal('${result.id}')" class="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition text-sm">
                    <i class="fas fa-flag mr-2"></i>Report Issue / Provide Feedback
                </button>
            </div>
        `;
    }

    resultsContent.innerHTML = html;
    resultsDiv.classList.remove('hidden');
    resultsDiv.scrollIntoView({ behavior: 'smooth' });
}

function displayYouTubeVideos(videos, isHealthy = false) {
    console.log('displayYouTubeVideos called with:', videos, 'isHealthy:', isHealthy);
    
    if (!videos || videos.length === 0) {
        console.log('No videos to display');
        return '';
    }

    const title = isHealthy ? 'Plant Care & Maintenance Tips' : 'Recommended Treatment Videos';
    const icon = isHealthy ? 'fa-seedling' : 'fa-prescription-bottle-medical';
    const iconColor = isHealthy ? 'text-green-600' : 'text-red-600';
    const bgColor = isHealthy ? 'bg-green-50' : 'bg-red-50';
    const borderColor = isHealthy ? 'border-green-200' : 'border-red-200';

    console.log(`Displaying ${videos.length} YouTube videos`);
    return `
        <div class="mt-8 ${bgColor} border-2 ${borderColor} rounded-xl p-6 shadow-lg">
            <div class="flex items-center justify-between mb-6">
                <h5 class="font-bold text-2xl flex items-center">
                    <i class="fas ${icon} ${iconColor} mr-3 text-3xl"></i>
                    ${title}
                </h5>
                <span class="text-sm text-gray-600 bg-white px-3 py-1 rounded-full">
                    ${videos.length} video${videos.length > 1 ? 's' : ''}
                </span>
            </div>
            <div class="grid ${videos.length === 1 ? 'grid-cols-1 max-w-1 mx-auto' : videos.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-1'} gap-6">
                ${videos.map(video => `
                    <div class="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                        <div class="relative pb-[56.25%] bg-gray-900">
                            <iframe 
                                class="absolute top-0 left-0 w-full h-full"
                                src="https://www.youtube.com/embed/${video.video_id}?rel=0&modestbranding=1" 
                                title="${video.title}"
                                frameborder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                allowfullscreen
                                loading="lazy">
                            </iframe>
                        </div>
                        <div class="p-5">
                            <h6 class="font-bold text-base text-gray-900 mb-3 line-clamp-2 min-h-[3rem]">${video.title}</h6>
                            <div class="flex items-center justify-between">
                                <a href="${video.url}" target="_blank" rel="noopener noreferrer" 
                                   class="inline-flex items-center text-primary hover:text-secondary font-semibold text-sm transition-colors">
                                    <i class="fas fa-external-link-alt mr-2"></i>
                                    Watch on YouTube
                                </a>
                                <button onclick="window.open('${video.url}', '_blank')" 
                                        class="text-gray-400 hover:text-primary transition-colors"
                                        title="Open in new tab">
                                    <i class="fas fa-expand text-lg"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="mt-6 text-center">
                <p class="text-sm text-gray-600">
                    <i class="fas fa-info-circle mr-2"></i>
                    Click on any video to watch, or open in YouTube for full experience
                </p>
            </div>
        </div>
    `;
}


// Show feedback modal
function showFeedbackModal(analysisId) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div class="p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-bold text-gray-800">Provide Feedback</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <form id="feedbackForm" class="space-y-4">
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Issue Type</label>
                        <select id="feedbackType" class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                            <option value="incorrect">Incorrect Disease Detection</option>
                            <option value="incomplete">Incomplete Information</option>
                            <option value="other">Other Issue</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Your Message</label>
                        <textarea id="feedbackMessage" rows="4" class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Please describe the issue or provide your feedback..."></textarea>
                    </div>
                    
                    <div id="correctDiseaseDiv" class="hidden">
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Correct Disease (if known)</label>
                        <input type="text" id="correctDisease" class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Enter the correct disease name">
                    </div>
                    
                    <div id="correctTreatmentDiv" class="hidden">
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Correct Treatment (if known)</label>
                        <textarea id="correctTreatment" rows="2" class="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" placeholder="Enter the correct treatment"></textarea>
                    </div>
                    
                    <div class="flex space-x-3 pt-4">
                        <button type="button" onclick="submitFeedback('${analysisId}')" class="flex-1 bg-primary text-white py-2 rounded-lg hover:bg-secondary transition font-semibold">
                            <i class="fas fa-paper-plane mr-2"></i>Submit Feedback
                        </button>
                        <button type="button" onclick="this.closest('.fixed').remove()" class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Show/hide additional fields based on feedback type
    document.getElementById('feedbackType').addEventListener('change', (e) => {
        const correctDiseaseDiv = document.getElementById('correctDiseaseDiv');
        const correctTreatmentDiv = document.getElementById('correctTreatmentDiv');
        
        if (e.target.value === 'incorrect') {
            correctDiseaseDiv.classList.remove('hidden');
            correctTreatmentDiv.classList.remove('hidden');
        } else {
            correctDiseaseDiv.classList.add('hidden');
            correctTreatmentDiv.classList.add('hidden');
        }
    });
}

// Submit feedback
async function submitFeedback(analysisId) {
    try {
        const feedbackType = document.getElementById('feedbackType').value;
        const message = document.getElementById('feedbackMessage').value.trim();
        const correctDisease = document.getElementById('correctDisease').value.trim();
        const correctTreatment = document.getElementById('correctTreatment').value.trim();
        
        if (!message) {
            showNotification('Please provide a message', 'error');
            return;
        }
        
        const token = sessionManager.getToken();
        if (!token) {
            showNotification('Please login to submit feedback', 'error');
            return;
        }
        
        const feedbackData = {
            analysis_id: analysisId,
            feedback_type: feedbackType,
            message: message,
            correct_disease: correctDisease || null,
            correct_treatment: correctTreatment || null
        };
        
        const response = await fetch(`${API_URL}/api/feedback/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(feedbackData)
        });
        
        if (response.ok) {
            const result = await response.json();
            showNotification('Thank you for your feedback! Our team will review it.', 'success');
            // Close the feedback modal
            const modal = document.querySelector('.fixed.inset-0.bg-black.bg-opacity-50');
            if (modal) {
                modal.remove();
            }
        } else {
            const error = await response.json();
            showNotification(error.detail || 'Failed to submit feedback', 'error');
        }
    } catch (error) {
        console.error('Error submitting feedback:', error);
        showNotification('Error submitting feedback', 'error');
    }
}

// Generate prescription for analysis
async function generatePrescription(analysisId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showNotification('Please login to generate prescription', 'error');
            return;
        }

        // Show loading notification
        showNotification('Generating prescription...', 'info');

        // Get the analysis result
        const result = lastAnalysisResult;
        if (!result || result.id !== analysisId) {
            showNotification('Analysis data not found', 'error');
            return;
        }

        const requestData = {
            analysis_id: analysisId,
            disease_name: result.disease_name,
            disease_type: result.disease_type,
            severity: result.severity,
            confidence: result.confidence / 100
        };

        console.log('Generating prescription with data:', requestData);

        // Generate prescription
        const response = await fetch('/api/prescriptions/generate', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        console.log('Prescription response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Server error:', errorData);
            throw new Error(errorData.detail || 'Server error');
        }

        const data = await response.json();
        console.log('Prescription response data:', data);

        if (data.success) {
            // Check if it's a new prescription or existing one
            const isExisting = data.message && data.message.includes('already exists');
            const message = isExisting 
                ? 'A prescription already exists for this analysis!' 
                : 'Prescription generated successfully!';
            
            showNotification(message, 'success');
            
            // Invalidate prescriptions cache
            if (typeof apiCache !== 'undefined') {
                apiCache.invalidate('prescriptions');
            }
            
            // Show beautiful confirmation modal
            const viewPrescription = await showPrescriptionConfirm(isExisting, data.prescription?.prescription_id);
            if (viewPrescription) {
                // Store prescription ID to open it directly
                if (data.prescription?.prescription_id) {
                    sessionStorage.setItem('openPrescriptionId', data.prescription.prescription_id);
                }
                window.location.href = '/prescriptions';
            }
        } else {
            throw new Error(data.message || 'Unknown error');
        }
    } catch (error) {
        console.error('Error generating prescription:', error);
        showNotification('Error: ' + error.message, 'error');
    }
}

// Show prescription confirmation modal
async function showPrescriptionConfirm(isExisting = false, prescriptionId = null) {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-xl shadow-2xl max-w-md w-full">
                <div class="p-6">
                    <div class="text-center mb-6">
                        <div class="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <i class="fas fa-prescription-bottle-medical text-green-600 text-2xl"></i>
                        </div>
                        <h3 class="text-xl font-bold text-gray-800 mb-2">
                            ${isExisting ? 'Prescription Found!' : 'Prescription Generated!'}
                        </h3>
                        <p class="text-gray-600">
                            ${isExisting 
                                ? 'A treatment prescription already exists for this analysis.' 
                                : 'Your comprehensive treatment plan is ready with product recommendations and step-by-step instructions.'}
                        </p>
                    </div>
                    
                    <div class="flex space-x-3">
                        <button onclick="handlePrescriptionChoice(true)" class="flex-1 bg-primary text-white py-3 rounded-lg hover:bg-secondary transition font-semibold">
                            <i class="fas fa-eye mr-2"></i>View Prescription
                        </button>
                        <button onclick="handlePrescriptionChoice(false)" class="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                            Later
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Handle choice
        window.handlePrescriptionChoice = (viewNow) => {
            modal.remove();
            delete window.handlePrescriptionChoice;
            resolve(viewNow);
        };
    });
}
