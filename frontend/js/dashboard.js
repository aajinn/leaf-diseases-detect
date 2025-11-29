// Dashboard functionality
let selectedFile = null;
let lastAnalysisResult = null;

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
    const toggle = document.getElementById('autoCropToggle');
    if (toggle) {
        const enabled = localStorage.getItem('autoCropEnabled') !== 'false';
        toggle.checked = enabled;
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

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
    await loadUserInfo();
    await loadStats();
    setupFileUpload();
    initializeTTS();
    initializeAutoCropToggle();
    checkPendingAnalysis();
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
            document.getElementById('adminLink').classList.remove('hidden');
        }
    } else {
        // Session invalid, redirect to login
        window.location.href = '/login?redirect=/dashboard';
    }
}

async function loadStats() {
    try {
        const response = await authenticatedFetch(`${API_URL}/api/my-analyses`);

        if (response.ok) {
            const data = await response.json();
            const records = data.records || [];
            
            document.getElementById('totalAnalyses').textContent = records.length;
            
            const diseased = records.filter(r => r.disease_detected).length;
            const healthy = records.length - diseased;
            
            document.getElementById('diseasesFound').textContent = diseased;
            document.getElementById('healthyPlants').textContent = healthy;
            
            // Show recent activity
            displayRecentActivity(records.slice(0, 5));
        }
    } catch (error) {
        console.error('Error loading stats:', error);
        if (error.message === 'Session expired') {
            return; // Already handled by authenticatedFetch
        }
    }
}

function displayRecentActivity(records) {
    const container = document.getElementById('recentActivity');
    
    if (records.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-sm">No recent activity</p>';
        return;
    }
    
    container.innerHTML = records.map(record => `
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div class="flex items-center">
                <i class="fas fa-${record.disease_detected ? 'exclamation-circle text-red-500' : 'check-circle text-green-500'} mr-3"></i>
                <div>
                    <p class="font-semibold text-sm">${record.disease_name || 'Healthy'}</p>
                    <p class="text-xs text-gray-500">${new Date(record.analysis_timestamp).toLocaleDateString()}</p>
                </div>
            </div>
        </div>
    `).join('');
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
}

async function analyzeImage() {
    if (!selectedFile) return;

    const analyzeBtn = document.getElementById('analyzeBtn');
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Analyzing...';

    // Set analyzing state for background animation
    if (typeof window.setAnalyzingState === 'function') {
        window.setAnalyzingState(true);
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    
    let analysisSuccessful = false;

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
            
            displayResults(result);
            
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
        // Only reset analyzing state if analysis failed
        if (!analysisSuccessful && typeof window.setAnalyzingState === 'function') {
            window.setAnalyzingState(false);
            // Also clear any previous disease status
            window.diseaseStatus = null;
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
                            <h4 class="text-2xl font-bold text-red-800">${result.disease_name}</h4>
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

    console.log(`Displaying ${videos.length} YouTube videos`);
    return `
        <div class="mt-8 bg-white border border-gray-200 rounded-lg p-6">
            <h5 class="font-bold text-xl mb-4 flex items-center">
                <i class="fas ${icon} ${iconColor} mr-3 text-2xl"></i>
                ${title}
            </h5>
            <div class="grid md:grid-cols-${videos.length > 2 ? '3' : videos.length} gap-6">
                ${videos.map(video => `
                    <div class="bg-gray-50 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div class="relative pb-[56.25%]">
                            <iframe 
                                class="absolute top-0 left-0 w-full h-full"
                                src="https://www.youtube.com/embed/${video.video_id}" 
                                title="${video.title}"
                                frameborder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowfullscreen>
                            </iframe>
                        </div>
                        <div class="p-4">
                            <h6 class="font-semibold text-sm text-gray-800 mb-2">${video.title}</h6>
                            <a href="${video.url}" target="_blank" class="text-primary hover:text-primary-dark text-sm flex items-center">
                                <i class="fas fa-external-link-alt mr-2"></i>
                                Watch on YouTube
                            </a>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}
