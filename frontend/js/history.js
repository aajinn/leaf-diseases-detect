// History page functionality

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadUserInfo();
    await loadHistory();
    
    // Check for analysis to auto-open
    const openAnalysisId = sessionStorage.getItem('openAnalysisId');
    console.log('Checking for auto-open analysis ID:', openAnalysisId);
    
    if (openAnalysisId) {
        console.log('Found analysis ID to open:', openAnalysisId);
        sessionStorage.removeItem('openAnalysisId');
        
        // Show loading indicator
        showAutoOpenLoading();
        
        // Wait for history to load, then open the analysis
        setTimeout(async () => {
            console.log('Attempting to open analysis:', openAnalysisId);
            try {
                await viewDetails(openAnalysisId);
                hideAutoOpenLoading();
            } catch (error) {
                console.error('Error opening analysis:', error);
                hideAutoOpenLoading();
            }
        }, 2000);
    }
});

function showAutoOpenLoading() {
    const loading = document.createElement('div');
    loading.id = 'autoOpenLoading';
    loading.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
    loading.innerHTML = `
        <div class="bg-white rounded-lg p-6 text-center">
            <i class="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
            <p class="text-gray-700 font-semibold">Opening analysis...</p>
        </div>
    `;
    document.body.appendChild(loading);
}

function hideAutoOpenLoading() {
    const loading = document.getElementById('autoOpenLoading');
    if (loading) {
        loading.remove();
    }
}

// Refresh history with visual feedback
async function refreshHistory() {
    const refreshBtn = document.getElementById('refreshBtn');
    const icon = refreshBtn.querySelector('i');
    
    // Add spinning animation
    icon.classList.add('fa-spin');
    refreshBtn.disabled = true;
    
    try {
        // Force refresh by clearing cache and reloading
        await loadHistory(true);
        showNotification('History refreshed successfully', 'success');
    } catch (error) {
        showNotification('Failed to refresh history', 'error');
    } finally {
        // Remove spinning animation
        icon.classList.remove('fa-spin');
        refreshBtn.disabled = false;
    }
}

async function loadUserInfo() {
    const profile = await getUserProfile();
    if (profile) {
        document.getElementById('userInfo').textContent = `Hello, ${profile.full_name || profile.username}!`;
    } else {
        // Session invalid, redirect to login
        window.location.href = '/login?redirect=/history';
    }
}

async function loadHistory(forceRefresh = false) {
    const loading = document.getElementById('loading');
    const historyList = document.getElementById('historyList');
    const emptyState = document.getElementById('emptyState');

    loading.classList.remove('hidden');
    historyList.classList.add('hidden');
    emptyState.classList.add('hidden');

    try {
        // Use cached fetch with 2 minute TTL for history data
        const data = await cachedFetch(
            `${API_URL}/api/my-analyses`,
            {},
            'history',
            forceRefresh
        );

        const records = data.records || [];

        loading.classList.add('hidden');

        if (records.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            displayHistory(records);
            historyList.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error loading history:', error);
        loading.classList.add('hidden');
        if (error.message !== 'Session expired') {
            showNotification('Failed to load history. Please try again.', 'error');
        }
    }
}

function displayHistory(records) {
    const historyList = document.getElementById('historyList');
    
    console.log('Records received:', records);
    
    historyList.innerHTML = records.map(record => {
        const date = new Date(record.analysis_timestamp);
        const isHealthy = !record.disease_detected;
        const isInvalid = record.disease_type === 'invalid_image';
        
        let statusColor, statusIcon, statusText;
        if (isInvalid) {
            statusColor = 'yellow';
            statusIcon = 'exclamation-triangle';
            statusText = 'Invalid Image';
        } else if (isHealthy) {
            statusColor = 'green';
            statusIcon = 'check-circle';
            statusText = 'Healthy';
        } else {
            statusColor = 'red';
            statusIcon = 'virus';
            statusText = record.disease_name;
        }

        return `
            <div class="relative bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
                ${(record.updated_by_admin || record.updated_at) ? `
                    <div class="absolute top-2 right-2">
                        <span class="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                            <i class="fas fa-user-shield mr-1"></i>UPDATED
                        </span>
                    </div>
                ` : ''}
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4 flex-1">
                        <div class="flex-shrink-0">
                            ${record.username ? `
                                <img src="/images/${record.username}/${record.image_filename}" 
                                     alt="Analysis Image" 
                                     class="w-20 h-20 object-cover rounded-lg border border-gray-300"
                                     onerror="this.style.display='none'; this.nextElementSibling.style.display='block'">
                                <div class="bg-${statusColor}-100 p-4 rounded-lg w-20 h-20 flex items-center justify-center" style="display:none">
                                    <i class="fas fa-${statusIcon} text-${statusColor}-600 text-2xl"></i>
                                </div>
                            ` : `
                                <div class="bg-${statusColor}-100 p-4 rounded-lg w-20 h-20 flex items-center justify-center">
                                    <i class="fas fa-${statusIcon} text-${statusColor}-600 text-2xl"></i>
                                </div>
                            `}
                        </div>
                        <div class="flex-1">
                            <div class="flex items-center justify-between">
                                <div>
                                    <h3 class="text-xl font-bold text-gray-800">${record.original_disease_name || statusText}</h3>
                                    ${record.disease_name && record.original_disease_name && record.disease_name !== record.original_disease_name ? `<p class="text-xs text-gray-500 font-mono">ID: ${record.disease_name.split('#')[1] || 'N/A'}</p>` : ''}
                                </div>
                            </div>
                            <div class="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                                <span><i class="fas fa-calendar mr-1"></i>${date.toLocaleDateString()}</span>
                                <span><i class="fas fa-clock mr-1"></i>${date.toLocaleTimeString()}</span>
                                ${!isInvalid ? `<span><i class="fas fa-chart-line mr-1"></i>${record.confidence}% confidence</span>` : ''}
                            </div>
                            ${!isInvalid && !isHealthy ? `
                                <div class="mt-2">
                                    <span class="inline-block bg-${statusColor}-100 text-${statusColor}-800 px-3 py-1 rounded-full text-xs font-semibold mr-2">
                                        ${record.disease_type}
                                    </span>
                                    <span class="inline-block bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-semibold">
                                        ${record.severity}
                                    </span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <button onclick="viewDetails('${record.id}')" 
                            class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-secondary transition">
                            <i class="fas fa-eye mr-2"></i>View
                        </button>
                        <button onclick="exportHistoryRecord('${record.id}')" 
                            class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition">
                            <i class="fas fa-file-pdf"></i>
                        </button>
                        <button onclick="deleteRecord('${record.id}')" 
                            class="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function viewDetails(recordId) {
    try {
        // Use cached fetch for individual record details
        const record = await cachedFetch(
            `${API_URL}/api/analyses/${recordId}`,
            {},
            'analysis-detail',
            false
        );

        showDetailModal(record);
    } catch (error) {
        console.error('Error loading details:', error);
        if (error.message !== 'Session expired') {
            showNotification('Failed to load details', 'error');
        }
    }
}

function showDetailModal(record) {
    const modal = document.getElementById('detailModal');
    const modalContent = document.getElementById('modalContent');
    
    if (!modal || !modalContent) {
        console.error('Modal elements not found');
        return;
    }
    
    const date = new Date(record.analysis_timestamp);
    const isHealthy = !record.disease_detected;
    const isInvalid = record.disease_type === 'invalid_image';

    let content = `
        <div class="space-y-6">
            <div class="bg-gray-50 p-6 rounded-lg">
                <div class="mb-4">
                    ${record.username ? `
                        <img src="/images/${record.username}/${record.image_filename}" 
                             alt="Analysis Image" 
                             class="w-full max-w-md mx-auto h-64 object-cover rounded-lg border border-gray-300"
                             onerror="this.style.display='none'; this.nextElementSibling.style.display='block'">
                        <div class="w-full max-w-md mx-auto h-64 bg-gray-200 rounded-lg border border-gray-300 flex items-center justify-center" style="display:none">
                            <i class="fas fa-image text-gray-400 text-4xl"></i>
                            <span class="ml-2 text-gray-500">Image not available</span>
                        </div>
                    ` : `
                        <div class="w-full max-w-md mx-auto h-64 bg-gray-200 rounded-lg border border-gray-300 flex items-center justify-center">
                            <i class="fas fa-image text-gray-400 text-4xl"></i>
                            <span class="ml-2 text-gray-500">Image not available</span>
                        </div>
                    `}
                </div>
                <div class="grid md:grid-cols-2 gap-4">
                    <div>
                        <p class="text-sm text-gray-600">Analysis Date</p>
                        <p class="font-semibold">${date.toLocaleString()}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-600">Image File</p>
                        <p class="font-semibold">${record.image_filename}</p>
                    </div>
                    ${!isInvalid ? `
                        <div>
                            <p class="text-sm text-gray-600">Confidence</p>
                            <p class="font-semibold">${record.confidence}%</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">Status</p>
                            <p class="font-semibold">${isHealthy ? 'Healthy' : 'Disease Detected'}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
    `;

    if (isInvalid) {
        content += `
            <div class="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-lg">
                <h4 class="font-bold text-lg mb-3 text-yellow-800">Invalid Image</h4>
                <p class="text-yellow-700 mb-4">${record.symptoms[0]}</p>
                <div class="bg-white p-4 rounded">
                    <p class="font-semibold mb-2">Recommendations:</p>
                    <ul class="list-disc list-inside space-y-1">
                        ${record.treatment.map(t => `<li>${t}</li>`).join('')}
                    </ul>
                </div>
            </div>
            
            ${record.updated_by_admin ? `
                <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
                    <h5 class="font-bold text-blue-800 mb-2 flex items-center">
                        <i class="fas fa-user-shield mr-2"></i>
                        Admin Updated Analysis
                    </h5>
                    <p class="text-blue-700 text-sm">This analysis has been reviewed and updated by an administrator.</p>
                    <p class="text-xs text-blue-600 mt-1">Updated: ${new Date(record.updated_at).toLocaleDateString()}</p>
                </div>
            ` : ''}
        `;
    } else if (!isHealthy) {
        content += `
            <div class="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
                <div class="flex justify-between items-start mb-2">
                    <div>
                        <h4 class="font-bold text-xl text-red-800">${record.original_disease_name || record.disease_name}</h4>
                        ${record.disease_name && record.original_disease_name && record.disease_name !== record.original_disease_name ? `<p class="text-xs text-gray-500 font-mono mb-1">Analysis ID: ${record.disease_name.split('#')[1] || 'N/A'}</p>` : ''}
                    </div>
                    ${record.updated_by_admin ? `
                        <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                            <i class="fas fa-user-shield mr-1"></i>
                            Admin Updated
                        </span>
                    ` : ''}
                </div>
                <p class="text-red-600">Type: ${record.disease_type} | Severity: ${record.severity}</p>
                ${record.description && record.description.trim() ? `
                <div class="mt-4 p-4 bg-white rounded-lg">
                    <h5 class="font-bold text-sm text-gray-700 mb-2 flex items-center">
                        <i class="fas fa-info-circle text-blue-500 mr-2"></i>
                        About This Disease
                    </h5>
                    <p class="text-gray-700 text-sm leading-relaxed">${escapeHtml(record.description)}</p>
                </div>
                ` : ''}
                
                ${record.updated_by_admin ? `
                    <div class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h5 class="font-bold text-sm text-blue-800 mb-2 flex items-center">
                            <i class="fas fa-edit text-blue-600 mr-2"></i>
                            Analysis Updated by Administrator
                        </h5>
                        <p class="text-blue-700 text-sm mb-2">This analysis has been reviewed and corrected by our medical team.</p>
                        <p class="text-xs text-blue-600">Last updated: ${new Date(record.updated_at).toLocaleString()}</p>
                    </div>
                ` : ''}
                <div class="mt-4 flex flex-wrap gap-2">
                    <button onclick="generatePrescriptionFromHistory('${record.id}', this)" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition font-semibold flex items-center text-sm">
                        <i class="fas fa-prescription mr-2"></i>
                        Generate Prescription
                    </button>
                    <button onclick="window.location.href='/prescriptions'" class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition font-semibold flex items-center text-sm">
                        <i class="fas fa-list mr-2"></i>
                        View Prescriptions
                    </button>
                    <button onclick="checkAndShowFeedbackModal('${record.id}')" class="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition font-semibold flex items-center text-sm">
                        <i class="fas fa-comment-alt mr-2"></i>
                        Provide Feedback
                    </button>
                </div>
            </div>

            <div>
                <h5 class="font-bold text-lg mb-3 flex items-center">
                    <i class="fas fa-stethoscope text-primary mr-2"></i>
                    Symptoms Observed
                </h5>
                <ul class="space-y-2 bg-gray-50 p-4 rounded-lg">
                    ${record.symptoms.map(s => `<li class="flex items-start"><i class="fas fa-circle text-xs text-primary mr-2 mt-1"></i><span>${s}</span></li>`).join('')}
                </ul>
            </div>

            <div>
                <h5 class="font-bold text-lg mb-3 flex items-center">
                    <i class="fas fa-search text-primary mr-2"></i>
                    Possible Causes
                </h5>
                <ul class="space-y-2 bg-gray-50 p-4 rounded-lg">
                    ${record.possible_causes.map(c => `<li class="flex items-start"><i class="fas fa-circle text-xs text-primary mr-2 mt-1"></i><span>${c}</span></li>`).join('')}
                </ul>
            </div>

            <div>
                <h5 class="font-bold text-lg mb-3 flex items-center">
                    <i class="fas fa-prescription-bottle text-primary mr-2"></i>
                    Recommended Treatment
                </h5>
                <ul class="space-y-2 bg-gray-50 p-4 rounded-lg">
                    ${record.treatment.map(t => `<li class="flex items-start"><i class="fas fa-circle text-xs text-primary mr-2 mt-1"></i><span>${t}</span></li>`).join('')}
                </ul>
            </div>

            ${displayYouTubeVideosInModal(record.youtube_videos, false)}
            
            <div id="feedbackSection-${record.id}"></div>
        `;
        
        // Load and display feedback for this analysis
        loadFeedbackForAnalysis(record.id);
    } else {
        content += `
            <div class="bg-green-50 border-l-4 border-green-500 p-6 rounded-lg text-center">
                <i class="fas fa-check-circle text-green-500 text-5xl mb-4"></i>
                <h4 class="font-bold text-2xl text-green-800 mb-2">Healthy Plant!</h4>
                <p class="text-green-600">No disease was detected in this analysis</p>
                ${record.description && record.description.trim() ? `
                <div class="mt-4 p-4 bg-white rounded-lg text-left">
                    <h5 class="font-bold text-sm text-gray-700 mb-2 flex items-center">
                        <i class="fas fa-leaf text-green-500 mr-2"></i>
                        Plant Health Information
                    </h5>
                    <p class="text-gray-700 text-sm leading-relaxed">${escapeHtml(record.description)}</p>
                </div>
                ` : ''}
                
                ${record.updated_by_admin ? `
                    <div class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-left">
                        <h5 class="font-bold text-sm text-blue-800 mb-2 flex items-center">
                            <i class="fas fa-user-shield text-blue-600 mr-2"></i>
                            Analysis Reviewed by Administrator
                        </h5>
                        <p class="text-blue-700 text-sm mb-2">This analysis has been verified by our expert team.</p>
                        <p class="text-xs text-blue-600">Last updated: ${new Date(record.updated_at).toLocaleString()}</p>
                    </div>
                ` : ''}
            </div>

            ${displayYouTubeVideosInModal(record.youtube_videos, true)}
            
            <div id="feedbackSection-${record.id}"></div>
        `;
        
        // Load and display feedback for this analysis
        loadFeedbackForAnalysis(record.id);
    }

    content += `</div>`;
    
    modalContent.innerHTML = content;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function displayYouTubeVideosInModal(videos, isHealthy = false) {
    if (!videos || videos.length === 0) {
        return '';
    }

    const title = isHealthy ? 'Plant Care & Maintenance Tips' : 'Recommended Treatment Videos';
    const icon = isHealthy ? 'fa-seedling' : 'fa-prescription-bottle-medical';
    const iconColor = isHealthy ? 'text-green-600' : 'text-red-600';
    const bgColor = isHealthy ? 'bg-green-50' : 'bg-red-50';
    const borderColor = isHealthy ? 'border-green-200' : 'border-red-200';

    return `
        <div class="${bgColor} border-2 ${borderColor} rounded-xl p-6 shadow-lg">
            <div class="flex items-center justify-between mb-6">
                <h5 class="font-bold text-2xl flex items-center">
                    <i class="fas ${icon} ${iconColor} mr-3 text-3xl"></i>
                    ${title}
                </h5>
                <span class="text-sm text-gray-600 bg-white px-3 py-1 rounded-full">
                    ${videos.length} video${videos.length > 1 ? 's' : ''}
                </span>
            </div>
            <div class="grid ${videos.length === 1 ? 'grid-cols-1' : 'md:grid-cols-2'} gap-6">
                ${videos.map(video => `
                    <div class="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
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
                            <h6 class="font-bold text-base text-gray-900 mb-3 line-clamp-2">${video.title}</h6>
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

function closeModal() {
    const modal = document.getElementById('detailModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

async function deleteRecord(recordId) {
    const confirmed = await showConfirm(
        'Are you sure you want to delete this analysis record? This action cannot be undone.',
        'Delete Analysis'
    );
    
    if (!confirmed) {
        return;
    }

    try {
        const response = await authenticatedFetch(`${API_URL}/api/analyses/${recordId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showNotification('Record deleted successfully', 'success');
            
            // Invalidate cache for history and analysis details
            apiCache.clearPattern(/my-analyses|analyses\//);
            
            // Force refresh to get updated list
            await loadHistory(true);
        } else {
            showNotification('Failed to delete record', 'error');
        }
    } catch (error) {
        console.error('Error deleting record:', error);
        if (error.message !== 'Session expired') {
            showNotification('Failed to delete record', 'error');
        }
    }
}

// Export history record to PDF
async function exportHistoryRecord(recordId) {
    try {
        const response = await authenticatedFetch(`${API_URL}/api/analyses/${recordId}`);
        
        if (response.ok) {
            const record = await response.json();
            
            if (typeof exportAnalysisToPDF !== 'undefined') {
                await exportAnalysisToPDF(record, null);
            } else {
                showNotification('PDF export feature not available', 'warning');
            }
        } else {
            showNotification('Failed to load analysis record', 'error');
        }
    } catch (error) {
        console.error('Error exporting record:', error);
        showNotification('Failed to export PDF', 'error');
    }
}

// Close modal when clicking outside
document.getElementById('detailModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'detailModal') {
        closeModal();
    }
});


// Show feedback modal (reuse from dashboard)
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

// Submit feedback (reuse from dashboard)
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

// Check for existing feedback before showing modal
async function checkAndShowFeedbackModal(analysisId) {
    try {
        const response = await authenticatedFetch(`${API_URL}/api/feedback/analysis/${analysisId}`);
        const data = await response.json();
        
        if (data.feedback) {
            showNotification('You have already provided feedback for this analysis', 'info');
            return;
        }
        
        showFeedbackModal(analysisId);
    } catch (error) {
        console.error('Error checking feedback:', error);
        showFeedbackModal(analysisId);
    }
}

// Load and display feedback for analysis
async function loadFeedbackForAnalysis(analysisId) {
    try {
        const response = await authenticatedFetch(`${API_URL}/api/feedback/analysis/${analysisId}`);
        const data = await response.json();
        
        if (data.feedback) {
            displayFeedbackInModal(data.feedback, analysisId);
        }
    } catch (error) {
        console.error('Error loading feedback:', error);
    }
}

// Display feedback in modal
function displayFeedbackInModal(feedback, analysisId) {
    const feedbackSection = document.getElementById(`feedbackSection-${analysisId}`);
    if (!feedbackSection) return;
    
    const statusColors = {
        'pending': 'bg-yellow-100 border-yellow-300 text-yellow-800',
        'reviewed': 'bg-blue-100 border-blue-300 text-blue-800',
        'resolved': 'bg-green-100 border-green-300 text-green-800'
    };
    
    feedbackSection.innerHTML = `
        <div class="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 shadow-lg">
            <div class="flex items-center justify-between mb-4">
                <h5 class="font-bold text-xl flex items-center">
                    <i class="fas fa-comment-dots text-blue-600 mr-3"></i>
                    Your Feedback
                </h5>
                <span class="px-3 py-1 rounded-full text-sm font-semibold ${statusColors[feedback.status] || 'bg-gray-100 text-gray-800'}">
                    ${feedback.status.charAt(0).toUpperCase() + feedback.status.slice(1)}
                </span>
            </div>
            
            <div class="bg-white rounded-lg p-4 mb-4">
                <p class="text-sm text-gray-600 mb-1">Issue Type: <span class="font-semibold">${feedback.feedback_type}</span></p>
                <p class="text-gray-800">${feedback.message}</p>
                ${feedback.correct_disease ? `<p class="text-sm text-gray-600 mt-2"><strong>Suggested Disease:</strong> ${feedback.correct_disease}</p>` : ''}
                ${feedback.correct_treatment ? `<p class="text-sm text-gray-600 mt-1"><strong>Suggested Treatment:</strong> ${feedback.correct_treatment}</p>` : ''}
                <p class="text-xs text-gray-500 mt-2">Submitted: ${new Date(feedback.created_at).toLocaleDateString()}</p>
            </div>
            
            ${feedback.status === 'pending' ? `
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                    <i class="fas fa-clock text-yellow-600 mr-2"></i>
                    <span class="text-yellow-700 text-sm">Waiting for admin review</span>
                </div>
            ` : `
                <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                    <h6 class="font-bold text-blue-800 mb-2 flex items-center">
                        <i class="fas fa-user-shield mr-2"></i>
                        Admin Response
                    </h6>
                    ${feedback.admin_notes ? `<p class="text-blue-700">${feedback.admin_notes}</p>` : `<p class="text-blue-700">Your feedback has been reviewed and processed.</p>`}
                    ${feedback.reviewed_at ? `<p class="text-xs text-blue-600 mt-2">Reviewed: ${new Date(feedback.reviewed_at).toLocaleDateString()}</p>` : ''}
                </div>
            `}
        </div>
    `;
    
    // Auto-scroll to feedback section if admin has responded
    if (feedback.admin_notes) {
        setTimeout(() => {
            feedbackSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 500);
    }
}

// Generate prescription from history record
async function generatePrescriptionFromHistory(recordId, buttonElement) {
    let button = buttonElement;
    let originalText = '';
    
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showNotification('Please login to generate prescription', 'error');
            return;
        }

        // Get button reference if not passed
        if (!button && event && event.target) {
            button = event.target.closest('button');
        }

        // Show loading state
        if (button) {
            originalText = button.innerHTML;
            button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Generating...';
            button.disabled = true;
        }

        console.log('Fetching analysis record:', recordId);

        // Get the record details
        const response = await fetch(`/api/analyses/${recordId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch analysis: ${response.status}`);
        }

        const record = await response.json();
        console.log('Analysis record:', record);

        if (!record.disease_detected) {
            showNotification('Cannot generate prescription for healthy plants', 'warning');
            if (button) {
                button.innerHTML = originalText;
                button.disabled = false;
            }
            return;
        }

        console.log('Generating prescription with data:', {
            analysis_id: recordId,
            disease_name: record.disease_name,
            disease_type: record.disease_type,
            severity: record.severity,
            confidence: record.confidence / 100
        });

        // Generate prescription
        const prescriptionResponse = await fetch('/api/prescriptions/generate', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                analysis_id: recordId,
                disease_name: record.disease_name,
                disease_type: record.disease_type,
                severity: record.severity,
                confidence: record.confidence / 100
            })
        });

        console.log('Prescription response status:', prescriptionResponse.status);

        if (!prescriptionResponse.ok) {
            const errorData = await prescriptionResponse.json();
            console.error('Prescription error:', errorData);
            throw new Error(errorData.detail || 'Failed to generate prescription');
        }

        const data = await prescriptionResponse.json();
        console.log('Prescription data:', data);

        if (data.success) {
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
            const viewPrescription = await showPrescriptionConfirm(isExisting);
            if (viewPrescription) {
                window.location.href = '/prescriptions';
            } else {
                if (button) {
                    button.innerHTML = originalText;
                    button.disabled = false;
                }
            }
        } else {
            throw new Error(data.message || 'Unknown error');
        }
    } catch (error) {
        console.error('Error generating prescription:', error);
        showNotification('Error: ' + error.message, 'error');
        
        // Restore button state
        if (button && originalText) {
            button.innerHTML = originalText;
            button.disabled = false;
        }
    }
}
