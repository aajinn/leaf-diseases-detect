/**
 * Camera Capture System
 * Enables live camera feed for disease detection
 * Supports webcam and mobile phone cameras
 */

class CameraCapture {
    constructor() {
        this.stream = null;
        this.video = null;
        this.canvas = null;
        this.isActive = false;
        this.facingMode = 'environment'; // 'user' for front, 'environment' for back
    }

    async initialize(videoElement, canvasElement) {
        this.video = videoElement;
        this.canvas = canvasElement;
        
        // Check if camera is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Camera not supported in this browser');
        }
    }

    async startCamera() {
        try {
            // Stop existing stream if any
            this.stopCamera();

            // Request camera access
            const constraints = {
                video: {
                    facingMode: this.facingMode,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: false
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.video.srcObject = this.stream;
            
            // Wait for video to be ready
            await new Promise((resolve) => {
                this.video.onloadedmetadata = () => {
                    this.video.play();
                    resolve();
                };
            });

            this.isActive = true;
            return true;
        } catch (error) {
            console.error('Camera access error:', error);
            
            let errorMessage = 'Failed to access camera. ';
            if (error.name === 'NotAllowedError') {
                errorMessage += 'Please allow camera access in your browser settings.';
            } else if (error.name === 'NotFoundError') {
                errorMessage += 'No camera found on this device.';
            } else if (error.name === 'NotReadableError') {
                errorMessage += 'Camera is already in use by another application.';
            } else {
                errorMessage += error.message;
            }
            
            throw new Error(errorMessage);
        }
    }

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        if (this.video) {
            this.video.srcObject = null;
        }
        
        this.isActive = false;
    }

    async switchCamera() {
        // Toggle between front and back camera
        this.facingMode = this.facingMode === 'user' ? 'environment' : 'user';
        
        if (this.isActive) {
            await this.startCamera();
        }
        
        return this.facingMode;
    }

    captureImage() {
        if (!this.isActive || !this.video || !this.canvas) {
            throw new Error('Camera not active');
        }

        // Set canvas size to match video
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;

        // Draw current video frame to canvas
        const ctx = this.canvas.getContext('2d');
        ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);

        // Convert to blob
        return new Promise((resolve, reject) => {
            this.canvas.toBlob((blob) => {
                if (blob) {
                    // Create file from blob
                    const file = new File([blob], `camera-capture-${Date.now()}.jpg`, {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    });
                    resolve(file);
                } else {
                    reject(new Error('Failed to capture image'));
                }
            }, 'image/jpeg', 0.95);
        });
    }

    getVideoElement() {
        return this.video;
    }

    isRunning() {
        return this.isActive;
    }

    getCurrentFacingMode() {
        return this.facingMode;
    }

    // Get available cameras
    async getAvailableCameras() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.filter(device => device.kind === 'videoinput');
        } catch (error) {
            console.error('Error getting cameras:', error);
            return [];
        }
    }

    // Check if device has multiple cameras
    async hasMultipleCameras() {
        const cameras = await this.getAvailableCameras();
        return cameras.length > 1;
    }
}

// Global camera instance
let cameraCapture = null;

// Initialize camera system
function initializeCameraSystem() {
    cameraCapture = new CameraCapture();
}

// Show camera modal
function showCameraModal() {
    const modal = document.getElementById('cameraModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        startCameraPreview();
    }
}

// Hide camera modal
function hideCameraModal() {
    const modal = document.getElementById('cameraModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        stopCameraPreview();
    }
}

// Start camera preview
async function startCameraPreview() {
    try {
        const video = document.getElementById('cameraVideo');
        const canvas = document.getElementById('cameraCanvas');
        const errorDiv = document.getElementById('cameraError');
        const controlsDiv = document.getElementById('cameraControls');
        
        if (!cameraCapture) {
            initializeCameraSystem();
        }
        
        await cameraCapture.initialize(video, canvas);
        await cameraCapture.startCamera();
        
        // Hide error, show controls
        if (errorDiv) errorDiv.classList.add('hidden');
        if (controlsDiv) controlsDiv.classList.remove('hidden');
        
        // Check if device has multiple cameras
        const hasMultiple = await cameraCapture.hasMultipleCameras();
        const switchBtn = document.getElementById('switchCameraBtn');
        if (switchBtn) {
            switchBtn.style.display = hasMultiple ? 'block' : 'none';
        }
        
    } catch (error) {
        console.error('Camera start error:', error);
        const errorDiv = document.getElementById('cameraError');
        const controlsDiv = document.getElementById('cameraControls');
        
        if (errorDiv) {
            errorDiv.textContent = error.message;
            errorDiv.classList.remove('hidden');
        }
        if (controlsDiv) {
            controlsDiv.classList.add('hidden');
        }
    }
}

// Stop camera preview
function stopCameraPreview() {
    if (cameraCapture) {
        cameraCapture.stopCamera();
    }
}

// Switch camera (front/back)
async function switchCamera() {
    try {
        const btn = document.getElementById('switchCameraBtn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        }
        
        const facingMode = await cameraCapture.switchCamera();
        
        if (btn) {
            btn.disabled = false;
            const icon = facingMode === 'user' ? 'fa-camera' : 'fa-camera-rotate';
            btn.innerHTML = `<i class="fas ${icon}"></i>`;
        }
    } catch (error) {
        console.error('Switch camera error:', error);
        showNotification('Failed to switch camera', 'error');
    }
}

// Capture image from camera
async function captureFromCamera() {
    try {
        const btn = document.getElementById('captureBtn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Capturing...';
        }
        
        let file = await cameraCapture.captureImage();
        
        // Auto-crop leaf if enabled
        const autoCropEnabled = localStorage.getItem('autoCropEnabled') !== 'false';
        if (autoCropEnabled && typeof processImageWithAutoCrop === 'function') {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Detecting leaf...';
            file = await processImageWithAutoCrop(file);
        }
        
        // Close modal
        hideCameraModal();
        
        // Handle the captured file (same as file upload)
        if (typeof handleFile === 'function') {
            handleFile(file);
        }
        
        showNotification('Image captured successfully!', 'success');
        
    } catch (error) {
        console.error('Capture error:', error);
        showNotification('Failed to capture image', 'error');
    } finally {
        const btn = document.getElementById('captureBtn');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-camera mr-2"></i>Capture Photo';
        }
    }
}

// Auto-capture mode for continuous detection
class AutoCaptureMode {
    constructor() {
        this.isActive = false;
        this.interval = null;
        this.captureDelay = 3000; // 3 seconds between captures
    }

    start() {
        if (this.isActive) return;
        
        this.isActive = true;
        this.interval = setInterval(() => {
            if (cameraCapture && cameraCapture.isRunning()) {
                this.autoCapture();
            }
        }, this.captureDelay);
        
        showNotification('Auto-capture mode enabled', 'info');
    }

    stop() {
        if (!this.isActive) return;
        
        this.isActive = false;
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        
        showNotification('Auto-capture mode disabled', 'info');
    }

    async autoCapture() {
        try {
            let file = await cameraCapture.captureImage();
            
            // Auto-crop leaf if enabled
            const autoCropEnabled = localStorage.getItem('autoCropEnabled') !== 'false';
            if (autoCropEnabled && typeof processImageWithAutoCrop === 'function') {
                file = await processImageWithAutoCrop(file);
            }
            
            // Show preview briefly
            const preview = document.getElementById('autoCapturePreview');
            if (preview) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    preview.src = e.target.result;
                    preview.classList.remove('hidden');
                    
                    // Hide after 1 second
                    setTimeout(() => {
                        preview.classList.add('hidden');
                    }, 1000);
                };
                reader.readAsDataURL(file);
            }
            
            // Analyze automatically
            if (typeof analyzeImageFile === 'function') {
                await analyzeImageFile(file);
            }
            
        } catch (error) {
            console.error('Auto-capture error:', error);
        }
    }

    toggle() {
        if (this.isActive) {
            this.stop();
        } else {
            this.start();
        }
        return this.isActive;
    }

    isRunning() {
        return this.isActive;
    }
}

// Global auto-capture instance
let autoCaptureMode = null;

// Toggle auto-capture mode
function toggleAutoCapture() {
    if (!autoCaptureMode) {
        autoCaptureMode = new AutoCaptureMode();
    }
    
    const isActive = autoCaptureMode.toggle();
    
    // Update button
    const btn = document.getElementById('autoCaptureBtn');
    if (btn) {
        if (isActive) {
            btn.classList.remove('bg-gray-500');
            btn.classList.add('bg-red-500');
            btn.innerHTML = '<i class="fas fa-stop mr-2"></i>Stop Auto-Capture';
        } else {
            btn.classList.remove('bg-red-500');
            btn.classList.add('bg-gray-500');
            btn.innerHTML = '<i class="fas fa-play mr-2"></i>Start Auto-Capture';
        }
    }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (cameraCapture) {
        cameraCapture.stopCamera();
    }
    if (autoCaptureMode) {
        autoCaptureMode.stop();
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CameraCapture, AutoCaptureMode };
}
