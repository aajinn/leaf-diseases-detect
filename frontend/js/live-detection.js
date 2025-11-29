/**
 * Live Detection System
 * Continuous disease detection from camera feed
 */

let liveCamera = null;
let detectionMode = 'manual';
let detectionInterval = null;
let detectionHistory = [];
let sessionStats = {
    totalScans: 0,
    diseasesFound: 0,
    healthyScans: 0
};

// Toggle auto-crop for live detection
function toggleAutoCropLive(enabled) {
    localStorage.setItem('autoCropEnabled', enabled ? 'true' : 'false');
    if (typeof showNotification === 'function') {
        if (enabled) {
            showNotification('Auto-crop enabled', 'success');
        } else {
            showNotification('Auto-crop disabled', 'info');
        }
    }
}

// Initialize auto-crop toggle
function initializeAutoCropToggle() {
    const toggle = document.getElementById('autoCropToggleLive');
    if (toggle) {
        const enabled = localStorage.getItem('autoCropEnabled') !== 'false';
        toggle.checked = enabled;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    await loadUserInfo();
    initializeLiveDetection();
    initializeAutoCropToggle();
});

async function loadUserInfo() {
    const profile = await getUserProfile();
    if (profile) {
        document.getElementById('userInfo').textContent = `Hello, ${profile.full_name || profile.username}!`;
    } else {
        window.location.href = '/login?redirect=/live-detection';
    }
}

function initializeLiveDetection() {
    liveCamera = new CameraCapture();
    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('cameraCanvas');
    liveCamera.initialize(video, canvas);
}

async function startLiveDetection() {
    try {
        const startBtn = document.getElementById('startCameraBtn');
        const stopBtn = document.getElementById('stopCameraBtn');
        const switchBtn = document.getElementById('switchCameraBtn');
        const captureBtn = document.getElementById('captureNowBtn');
        const errorDiv = document.getElementById('cameraError');
        
        startBtn.disabled = true;
        startBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Starting...';
        
        await liveCamera.startCamera();
        
        // Update UI
        startBtn.classList.add('hidden');
        stopBtn.classList.remove('hidden');
        captureBtn.classList.remove('hidden');
        errorDiv.classList.add('hidden');
        
        // Check for multiple cameras
        const hasMultiple = await liveCamera.hasMultipleCameras();
        if (hasMultiple) {
            switchBtn.classList.remove('hidden');
        }
        
        // Update status
        updateStatus('active', 'Camera Active');
        
        // Start detection based on mode
        updateDetectionMode();
        
        showNotification('Camera started successfully', 'success');
        
    } catch (error) {
        console.error('Start camera error:', error);
        const errorDiv = document.getElementById('cameraError');
        errorDiv.querySelector('p').textContent = error.message;
        errorDiv.classList.remove('hidden');
        
        const startBtn = document.getElementById('startCameraBtn');
        startBtn.disabled = false;
        startBtn.innerHTML = '<i class="fas fa-play mr-2"></i>Start Camera';
        
        updateStatus('error', 'Camera Error');
    }
}

function stopLiveDetection() {
    if (liveCamera) {
        liveCamera.stopCamera();
    }
    
    // Stop detection interval
    if (detectionInterval) {
        clearInterval(detectionInterval);
        detectionInterval = null;
    }
    
    // Update UI
    const startBtn = document.getElementById('startCameraBtn');
    const stopBtn = document.getElementById('stopCameraBtn');
    const switchBtn = document.getElementById('switchCameraBtn');
    const captureBtn = document.getElementById('captureNowBtn');
    
    startBtn.classList.remove('hidden');
    stopBtn.classList.add('hidden');
    switchBtn.classList.add('hidden');
    captureBtn.classList.add('hidden');
    
    startBtn.disabled = false;
    startBtn.innerHTML = '<i class="fas fa-play mr-2"></i>Start Camera';
    
    updateStatus('inactive', 'Inactive');
    
    showNotification('Camera stopped', 'info');
}

async function switchCamera() {
    try {
        const btn = document.getElementById('switchCameraBtn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        await liveCamera.switchCamera();
        
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-camera-rotate"></i>';
        
        showNotification('Camera switched', 'success');
    } catch (error) {
        console.error('Switch camera error:', error);
        showNotification('Failed to switch camera', 'error');
    }
}

function updateDetectionMode() {
    const mode = document.querySelector('input[name="detectionMode"]:checked').value;
    detectionMode = mode;
    
    // Clear existing interval
    if (detectionInterval) {
        clearInterval(detectionInterval);
        detectionInterval = null;
    }
    
    if (!liveCamera || !liveCamera.isRunning()) {
        return;
    }
    
    switch (mode) {
        case 'manual':
            updateStatus('active', 'Manual Mode');
            break;
            
        case 'auto':
            updateStatus('detecting', 'Auto Mode - Scanning every 3s');
            detectionInterval = setInterval(() => {
                captureAndAnalyze();
            }, 3000);
            break;
            
        case 'realtime':
            updateStatus('detecting', 'Real-time Mode - Continuous');
            detectionInterval = setInterval(() => {
                captureAndAnalyze();
            }, 1000);
            break;
    }
}

async function captureNow() {
    await captureAndAnalyze();
}

async function captureAndAnalyze() {
    if (!liveCamera || !liveCamera.isRunning()) {
        return;
    }
    
    try {
        // Show analyzing badge
        const badge = document.getElementById('detectionBadge');
        badge.classList.remove('hidden');
        
        // Update frame guide
        const frameGuide = document.getElementById('frameGuide');
        frameGuide.classList.remove('border-green-500');
        frameGuide.classList.add('border-yellow-500');
        
        // Capture image
        let file = await liveCamera.captureImage();
        
        // Auto-crop leaf if enabled
        const autoCropEnabled = localStorage.getItem('autoCropEnabled') !== 'false';
        if (autoCropEnabled && typeof processImageWithAutoCrop === 'function') {
            file = await processImageWithAutoCrop(file);
        }
        
        // Show last capture
        const lastCapture = document.getElementById('lastCapture');
        const reader = new FileReader();
        reader.onload = (e) => {
            lastCapture.src = e.target.result;
            lastCapture.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
        
        // Analyze
        const result = await analyzeImage(file);
        
        // Update UI with result
        displayCurrentResult(result);
        addToHistory(result);
        updateStats(result);
        
        // Update frame guide based on result
        if (result.disease_detected) {
            frameGuide.classList.remove('border-yellow-500', 'border-green-500');
            frameGuide.classList.add('border-red-500');
        } else {
            frameGuide.classList.remove('border-yellow-500', 'border-red-500');
            frameGuide.classList.add('border-green-500');
        }
        
        // Hide badge after delay
        setTimeout(() => {
            badge.classList.add('hidden');
        }, 1000);
        
    } catch (error) {
        console.error('Capture and analyze error:', error);
        const badge = document.getElementById('detectionBadge');
        badge.classList.add('hidden');
    }
}

async function analyzeImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = sessionManager.getToken();
    if (!token) {
        throw new Error('Not authenticated');
    }
    
    const response = await fetch(`${API_URL}/api/disease-detection`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });
    
    if (!response.ok) {
        throw new Error('Analysis failed');
    }
    
    return await response.json();
}

function displayCurrentResult(result) {
    const container = document.getElementById('currentResult');
    
    if (result.disease_detected) {
        container.innerHTML = `
            <div class="text-left">
                <div class="flex items-center justify-between mb-3">
                    <div class="flex items-center">
                        <i class="fas fa-virus text-red-500 text-2xl mr-3"></i>
                        <div>
                            <h4 class="font-bold text-red-800">${result.disease_name}</h4>
                            <p class="text-sm text-red-600">${result.disease_type}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-2xl font-bold text-red-600">${result.confidence}%</div>
                    </div>
                </div>
                <div class="bg-red-50 p-3 rounded text-sm">
                    <p class="font-semibold mb-1">Severity: ${result.severity}</p>
                    <p class="text-gray-700">${result.symptoms[0]}</p>
                </div>
            </div>
        `;
        
        // Set theme
        if (typeof window.setDiseaseStatus === 'function') {
            window.setDiseaseStatus('diseased');
        }
    } else {
        container.innerHTML = `
            <div class="text-center">
                <i class="fas fa-check-circle text-green-500 text-4xl mb-3"></i>
                <h4 class="font-bold text-green-800 text-lg">Healthy Leaf</h4>
                <p class="text-green-600 text-sm mt-2">${result.confidence}% confidence</p>
            </div>
        `;
        
        // Set theme
        if (typeof window.setDiseaseStatus === 'function') {
            window.setDiseaseStatus('healthy');
        }
    }
}

function addToHistory(result) {
    const timestamp = new Date();
    detectionHistory.unshift({
        result,
        timestamp
    });
    
    // Keep only last 10
    if (detectionHistory.length > 10) {
        detectionHistory = detectionHistory.slice(0, 10);
    }
    
    updateHistoryDisplay();
}

function updateHistoryDisplay() {
    const container = document.getElementById('detectionHistory');
    
    if (detectionHistory.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-sm text-center py-4">No detections yet</p>';
        return;
    }
    
    container.innerHTML = detectionHistory.map(item => {
        const { result, timestamp } = item;
        const timeStr = timestamp.toLocaleTimeString();
        
        if (result.disease_detected) {
            return `
                <div class="bg-red-50 border-l-4 border-red-500 p-3 rounded">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <i class="fas fa-virus text-red-500 mr-2"></i>
                            <div>
                                <p class="font-semibold text-sm">${result.disease_name}</p>
                                <p class="text-xs text-gray-600">${timeStr}</p>
                            </div>
                        </div>
                        <span class="text-sm font-bold text-red-600">${result.confidence}%</span>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="bg-green-50 border-l-4 border-green-500 p-3 rounded">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <i class="fas fa-check-circle text-green-500 mr-2"></i>
                            <div>
                                <p class="font-semibold text-sm">Healthy</p>
                                <p class="text-xs text-gray-600">${timeStr}</p>
                            </div>
                        </div>
                        <span class="text-sm font-bold text-green-600">${result.confidence}%</span>
                    </div>
                </div>
            `;
        }
    }).join('');
}

function updateStats(result) {
    sessionStats.totalScans++;
    
    if (result.disease_detected) {
        sessionStats.diseasesFound++;
    } else {
        sessionStats.healthyScans++;
    }
    
    document.getElementById('totalScans').textContent = sessionStats.totalScans;
    document.getElementById('diseasesFound').textContent = sessionStats.diseasesFound;
    document.getElementById('healthyScans').textContent = sessionStats.healthyScans;
}

function updateStatus(status, text) {
    const indicator = document.getElementById('statusIndicator');
    const dot = indicator.querySelector('div');
    const span = indicator.querySelector('span');
    
    dot.className = 'w-3 h-3 rounded-full';
    
    switch (status) {
        case 'active':
            dot.classList.add('bg-green-500', 'animate-pulse');
            break;
        case 'detecting':
            dot.classList.add('bg-yellow-500', 'animate-pulse');
            break;
        case 'error':
            dot.classList.add('bg-red-500');
            break;
        default:
            dot.classList.add('bg-gray-400');
    }
    
    span.textContent = text;
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    stopLiveDetection();
});
