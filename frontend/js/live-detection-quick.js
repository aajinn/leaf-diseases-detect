/**
 * Live Detection Quick Analysis
 * Full-screen live detection with minimal UI
 */

let liveCamera = null;
let isScanning = false;
let scanInterval = null;
let scanCount = 0;
let lastResult = null;
let isAnalyzing = false; // Prevent concurrent API calls
let lastScanTime = 0;
let scanIntervalTime = 5000; // Default 5 seconds (configurable)

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    await checkAuth();
    initializeCamera();
});

async function checkAuth() {
    const profile = await getUserProfile();
    if (!profile) {
        window.location.href = '/login?redirect=/live-detection';
    }
}

function initializeCamera() {
    liveCamera = new CameraCapture();
    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('cameraCanvas');
    liveCamera.initialize(video, canvas);
}

async function startScanning() {
    try {
        // Start camera
        await liveCamera.startCamera();
        
        // Update UI
        document.getElementById('startBtn').classList.add('hidden');
        document.getElementById('stopBtn').classList.remove('hidden');
        document.getElementById('captureBtn').classList.remove('hidden');
        document.getElementById('intervalBtn').classList.remove('hidden');
        document.getElementById('centerInstructions').classList.add('hidden');
        
        // Check for multiple cameras
        const hasMultiple = await liveCamera.hasMultipleCameras();
        if (hasMultiple) {
            document.getElementById('switchCameraBtn').classList.remove('hidden');
        }
        
        // Update status
        updateStatus('active', 'Scanning Active');
        
        // Start auto-scanning with configurable interval
        isScanning = true;
        scanInterval = setInterval(() => {
            if (isScanning && !isAnalyzing) {
                const now = Date.now();
                // Ensure minimum time between scans
                if (now - lastScanTime >= scanIntervalTime) {
                    captureAndAnalyze();
                }
            }
        }, scanIntervalTime);
        
        showNotification('Live scanning started', 'success');
        
    } catch (error) {
        console.error('Start scanning error:', error);
        showNotification(error.message, 'error');
        updateStatus('error', 'Camera Error');
    }
}

function stopScanning() {
    isScanning = false;
    
    if (scanInterval) {
        clearInterval(scanInterval);
        scanInterval = null;
    }
    
    if (liveCamera) {
        liveCamera.stopCamera();
    }
    
    // Update UI
    document.getElementById('startBtn').classList.remove('hidden');
    document.getElementById('stopBtn').classList.add('hidden');
    document.getElementById('captureBtn').classList.add('hidden');
    document.getElementById('intervalBtn').classList.add('hidden');
    document.getElementById('intervalControl').classList.add('hidden');
    document.getElementById('switchCameraBtn').classList.add('hidden');
    document.getElementById('centerInstructions').classList.remove('hidden');
    document.getElementById('resultPanel').classList.add('hidden');
    document.getElementById('scanAnimation').classList.add('hidden');
    
    updateStatus('inactive', 'Camera Inactive');
    
    showNotification('Scanning stopped', 'info');
}

async function switchCamera() {
    try {
        const btn = document.getElementById('switchCameraBtn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        await liveCamera.switchCamera();
        
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-camera-rotate"></i>';
        
    } catch (error) {
        console.error('Switch camera error:', error);
        showNotification('Failed to switch camera', 'error');
    }
}

async function captureNow() {
    if (!isScanning) return;
    
    // Prevent spam clicking
    if (isAnalyzing) {
        showNotification('Analysis in progress, please wait...', 'warning');
        return;
    }
    
    await captureAndAnalyze();
}

async function captureAndAnalyze() {
    if (!liveCamera || !liveCamera.isRunning()) {
        return;
    }
    
    // Prevent concurrent API calls
    if (isAnalyzing) {
        console.log('Analysis already in progress, skipping...');
        return;
    }
    
    isAnalyzing = true;
    lastScanTime = Date.now();
    
    try {
        // Show scanning animation
        document.getElementById('scanAnimation').classList.remove('hidden');
        const frameGuide = document.getElementById('frameGuide');
        frameGuide.classList.remove('border-green-500', 'border-red-500');
        frameGuide.classList.add('border-yellow-500');
        
        updateStatus('scanning', 'Analyzing...');
        
        // Capture image
        let file = await liveCamera.captureImage();
        
        // Auto-crop if enabled
        const autoCropEnabled = localStorage.getItem('autoCropEnabled') !== 'false';
        if (autoCropEnabled && typeof processImageWithAutoCrop === 'function') {
            file = await processImageWithAutoCrop(file);
        }
        
        // Check for duplicate image
        let imageHash = null;
        let result = null;
        
        if (typeof duplicateDetector !== 'undefined') {
            try {
                const duplicateCheck = await duplicateDetector.checkDuplicate(file);
                imageHash = duplicateCheck.hash;
                
                if (duplicateCheck.isDuplicate) {
                    console.log('Duplicate detected in live scan, using cached result');
                    result = duplicateCheck.result;
                }
            } catch (error) {
                console.error('Error checking duplicate:', error);
            }
        }
        
        // Quick analysis if not duplicate (no description, no videos)
        if (!result) {
            result = await quickAnalyze(file);
            
            // Cache valid results only (not invalid_image)
            if (typeof duplicateDetector !== 'undefined' && imageHash && result.disease_type !== 'invalid_image') {
                duplicateDetector.saveCachedResult(imageHash, result);
                console.log('Valid live scan result cached');
            }
        }
        
        // Update UI
        scanCount++;
        document.getElementById('scanCount').textContent = scanCount;
        
        displayQuickResult(result);
        
        // Update frame color and handle disease detection
        if (result.disease_detected) {
            frameGuide.classList.remove('border-yellow-500', 'border-green-500');
            frameGuide.classList.add('border-red-500');
            
            // Set theme
            if (typeof window.setDiseaseStatus === 'function') {
                window.setDiseaseStatus('diseased');
            }
            
            // Stop scanning when disease is detected
            stopScanningOnDetection();
        } else {
            frameGuide.classList.remove('border-yellow-500', 'border-red-500');
            frameGuide.classList.add('border-green-500');
            
            // Set theme
            if (typeof window.setDiseaseStatus === 'function') {
                window.setDiseaseStatus('healthy');
            }
        }
        
        // Hide scanning animation
        setTimeout(() => {
            document.getElementById('scanAnimation').classList.add('hidden');
        }, 500);
        
        lastResult = result;
        updateStatus('active', 'Scanning Active');
        
    } catch (error) {
        console.error('Capture and analyze error:', error);
        document.getElementById('scanAnimation').classList.add('hidden');
        updateStatus('error', 'Analysis Failed');
        
        // Show error notification
        if (error.message.includes('429') || error.message.includes('rate limit')) {
            showNotification('Rate limit reached. Slowing down scans...', 'warning');
            // Increase interval on rate limit
            scanIntervalTime = Math.min(scanIntervalTime * 1.5, 30000); // Max 30 seconds
            updateIntervalDisplay();
        } else {
            showNotification('Analysis failed. Retrying...', 'error');
        }
    } finally {
        isAnalyzing = false;
    }
}

async function quickAnalyze(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const token = sessionManager.getToken();
    if (!token) {
        throw new Error('Not authenticated');
    }
    
    try {
        const response = await fetch(`${API_URL}/api/disease-detection`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        // Handle rate limiting
        if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After');
            const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 10000;
            
            throw new Error(`Rate limit reached. Please wait ${waitTime / 1000} seconds.`);
        }
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Analysis failed');
        }
        
        return await response.json();
        
    } catch (error) {
        // Handle network errors
        if (error.message.includes('Failed to fetch')) {
            throw new Error('Network error. Please check your connection.');
        }
        throw error;
    }
}

function stopScanningOnDetection() {
    // Stop the scanning interval but keep camera active
    if (scanInterval) {
        clearInterval(scanInterval);
        scanInterval = null;
    }
    
    isScanning = false;
    
    // Update status
    updateStatus('detected', 'Disease Detected - Scanning Stopped');
    
    // Show notification
    showNotification('Disease detected! Scanning stopped.', 'warning');
    
    // Update UI to show detection stopped
    const stopBtn = document.getElementById('stopBtn');
    const captureBtn = document.getElementById('captureBtn');
    
    if (stopBtn) {
        stopBtn.innerHTML = '<i class="fas fa-camera mr-2"></i>Resume Scanning';
        stopBtn.onclick = resumeScanning;
    }
    
    if (captureBtn) {
        captureBtn.classList.add('hidden');
    }
}

function resumeScanning() {
    isScanning = true;
    
    // Restart scanning interval
    scanInterval = setInterval(() => {
        if (isScanning && !isAnalyzing) {
            const now = Date.now();
            if (now - lastScanTime >= scanIntervalTime) {
                captureAndAnalyze();
            }
        }
    }, scanIntervalTime);
    
    // Update UI
    const stopBtn = document.getElementById('stopBtn');
    const captureBtn = document.getElementById('captureBtn');
    
    if (stopBtn) {
        stopBtn.innerHTML = '<i class="fas fa-stop mr-2"></i>Stop Scanning';
        stopBtn.onclick = stopScanning;
    }
    
    if (captureBtn) {
        captureBtn.classList.remove('hidden');
    }
    
    updateStatus('active', 'Scanning Active');
    showNotification('Scanning resumed', 'success');
}

function displayQuickResult(result) {
    const panel = document.getElementById('resultPanel');
    const content = document.getElementById('resultContent');
    
    panel.classList.remove('hidden');
    
    if (result.disease_detected) {
        // Minified analysis for disease detection
        content.innerHTML = `
            <div class="space-y-3">
                <!-- Compact Header -->
                <div class="flex items-center justify-between bg-red-900 bg-opacity-50 rounded-lg p-4">
                    <div class="flex items-center space-x-3">
                        <i class="fas fa-exclamation-triangle text-red-400 text-2xl"></i>
                        <div>
                            <h3 class="text-lg font-bold text-red-400">${result.disease_name}</h3>
                            <p class="text-xs text-gray-400">${result.disease_type} • ${result.severity}</p>
                        </div>
                    </div>
                    <div class="text-2xl font-bold text-red-400">${result.confidence}%</div>
                </div>
                
                <!-- Quick Summary -->
                <div class="bg-gray-900 bg-opacity-50 rounded-lg p-3">
                    <p class="text-sm text-gray-300 mb-2">
                        <i class="fas fa-stethoscope text-red-400 mr-2"></i>
                        <strong>Key Symptom:</strong> ${result.symptoms[0]}
                    </p>
                    <p class="text-sm text-gray-300">
                        <i class="fas fa-lightbulb text-yellow-400 mr-2"></i>
                        <strong>Treatment:</strong> ${result.treatment[0]}
                    </p>
                </div>
                
                <!-- Action Buttons -->
                <div class="flex space-x-2">
                    <button onclick="goToFullAnalysis()" 
                        class="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition font-semibold text-sm">
                        <i class="fas fa-microscope mr-2"></i>View Full Analysis
                    </button>
                    <button onclick="resumeScanning()" 
                        class="bg-gray-700 text-white px-4 py-3 rounded-lg hover:bg-gray-600 transition text-sm">
                        <i class="fas fa-play mr-2"></i>Resume
                    </button>
                </div>
            </div>
        `;
    } else {
        content.innerHTML = `
            <div class="space-y-4">
                <!-- Header -->
                <div class="flex items-center justify-between border-b border-green-500 pb-4">
                    <div class="flex items-center space-x-3">
                        <div class="relative">
                            <i class="fas fa-check-circle text-green-500 text-4xl"></i>
                            <div class="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full pulse-ring"></div>
                        </div>
                        <div>
                            <h3 class="text-2xl font-bold text-green-400">Healthy Leaf</h3>
                            <p class="text-sm text-gray-400">No disease detected</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="text-4xl font-bold text-green-400">${result.confidence}%</div>
                        <div class="text-xs text-gray-400">Confidence</div>
                    </div>
                </div>
                
                <!-- Message -->
                <div class="bg-green-900 bg-opacity-30 rounded-lg p-6 text-center">
                    <i class="fas fa-leaf text-green-400 text-5xl mb-3"></i>
                    <p class="text-lg text-gray-300">This plant appears to be healthy!</p>
                    <p class="text-sm text-gray-400 mt-2">Continue monitoring for best results</p>
                </div>
            </div>
        `;
    }
}



function goToFullAnalysis() {
    if (!lastResult) {
        showNotification('No analysis available', 'warning');
        return;
    }
    
    // Store result in sessionStorage
    sessionStorage.setItem('pendingAnalysis', JSON.stringify(lastResult));
    
    // Redirect to dashboard
    window.location.href = '/dashboard?showResult=true';
}

function updateStatus(status, text) {
    const dot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    
    dot.className = 'w-3 h-3 rounded-full';
    
    switch (status) {
        case 'active':
            dot.classList.add('bg-green-500', 'animate-pulse');
            break;
        case 'scanning':
            dot.classList.add('bg-yellow-500', 'animate-pulse');
            break;
        case 'detected':
            dot.classList.add('bg-red-500', 'animate-pulse');
            break;
        case 'error':
            dot.classList.add('bg-red-500');
            break;
        default:
            dot.classList.add('bg-gray-500');
    }
    
    statusText.textContent = text;
}

function toggleAutoCrop() {
    const enabled = localStorage.getItem('autoCropEnabled') !== 'false';
    const newState = !enabled;
    
    localStorage.setItem('autoCropEnabled', newState ? 'true' : 'false');
    
    const btn = document.getElementById('autoCropBtn');
    if (newState) {
        btn.innerHTML = '<i class="fas fa-crop-alt mr-2"></i>Auto-Crop: ON';
        btn.classList.remove('bg-gray-700');
        btn.classList.add('bg-green-600');
        showNotification('Auto-crop enabled', 'success');
    } else {
        btn.innerHTML = '<i class="fas fa-crop-alt mr-2"></i>Auto-Crop: OFF';
        btn.classList.remove('bg-green-600');
        btn.classList.add('bg-gray-700');
        showNotification('Auto-crop disabled', 'info');
    }
}

// Initialize auto-crop button state
document.addEventListener('DOMContentLoaded', () => {
    const enabled = localStorage.getItem('autoCropEnabled') !== 'false';
    const btn = document.getElementById('autoCropBtn');
    if (btn) {
        if (enabled) {
            btn.innerHTML = '<i class="fas fa-crop-alt mr-2"></i>Auto-Crop: ON';
            btn.classList.add('bg-green-600');
        } else {
            btn.innerHTML = '<i class="fas fa-crop-alt mr-2"></i>Auto-Crop: OFF';
            btn.classList.add('bg-gray-700');
        }
    }
});

function toggleIntervalControl() {
    const control = document.getElementById('intervalControl');
    control.classList.toggle('hidden');
}

function setScanInterval(interval) {
    scanIntervalTime = interval;
    
    // Update display
    updateIntervalDisplay();
    
    // Restart scanning with new interval if active
    if (isScanning) {
        if (scanInterval) {
            clearInterval(scanInterval);
        }
        
        scanInterval = setInterval(() => {
            if (isScanning && !isAnalyzing) {
                const now = Date.now();
                if (now - lastScanTime >= scanIntervalTime) {
                    captureAndAnalyze();
                }
            }
        }, scanIntervalTime);
        
        showNotification(`Scan interval set to ${interval / 1000}s`, 'success');
    }
    
    // Hide control panel
    document.getElementById('intervalControl').classList.add('hidden');
    
    // Update button highlights
    updateIntervalButtons();
}

function updateIntervalDisplay() {
    const display = document.getElementById('intervalDisplay');
    if (display) {
        display.textContent = `${scanIntervalTime / 1000}s`;
    }
}

function updateIntervalButtons() {
    const buttons = document.querySelectorAll('#intervalControl button');
    buttons.forEach(btn => {
        btn.classList.remove('bg-gray-700');
    });
    
    // Highlight current interval
    const intervals = [3000, 5000, 10000, 15000];
    const index = intervals.indexOf(scanIntervalTime);
    if (index !== -1 && buttons[index]) {
        buttons[index].classList.add('bg-gray-700');
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    stopScanning();
});

// Initialize interval display
document.addEventListener('DOMContentLoaded', () => {
    updateIntervalDisplay();
});
