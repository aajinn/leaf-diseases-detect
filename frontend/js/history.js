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
});

async function loadUserInfo() {
    const profile = await getUserProfile();
    if (profile) {
        document.getElementById('userInfo').textContent = `Hello, ${profile.full_name || profile.username}!`;
    } else {
        // Session invalid, redirect to login
        window.location.href = '/login?redirect=/history';
    }
}

async function loadHistory() {
    const loading = document.getElementById('loading');
    const historyList = document.getElementById('historyList');
    const emptyState = document.getElementById('emptyState');

    loading.classList.remove('hidden');
    historyList.classList.add('hidden');
    emptyState.classList.add('hidden');

    try {
        const response = await authenticatedFetch(`${API_URL}/api/my-analyses`);

        if (response.ok) {
            const data = await response.json();
            const records = data.records || [];

            loading.classList.add('hidden');

            if (records.length === 0) {
                emptyState.classList.remove('hidden');
            } else {
                displayHistory(records);
                historyList.classList.remove('hidden');
            }
        } else {
            throw new Error('Failed to load history');
        }
    } catch (error) {
        console.error('Error loading history:', error);
        loading.classList.add('hidden');
        if (error.message !== 'Session expired') {
            alert('Failed to load history. Please try again.');
        }
    }
}

function displayHistory(records) {
    const historyList = document.getElementById('historyList');
    
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
            <div class="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4 flex-1">
                        <div class="bg-${statusColor}-100 p-4 rounded-lg">
                            <i class="fas fa-${statusIcon} text-${statusColor}-600 text-2xl"></i>
                        </div>
                        <div class="flex-1">
                            <h3 class="text-xl font-bold text-gray-800">${statusText}</h3>
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
        const response = await authenticatedFetch(`${API_URL}/api/analyses/${recordId}`);

        if (response.ok) {
            const record = await response.json();
            showDetailModal(record);
        } else {
            showNotification('Failed to load details', 'error');
        }
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
    
    const date = new Date(record.analysis_timestamp);
    const isHealthy = !record.disease_detected;
    const isInvalid = record.disease_type === 'invalid_image';

    let content = `
        <div class="space-y-6">
            <div class="bg-gray-50 p-6 rounded-lg">
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
        `;
    } else if (!isHealthy) {
        content += `
            <div class="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
                <h4 class="font-bold text-xl mb-2 text-red-800">${record.disease_name}</h4>
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
                <div class="mt-4 flex space-x-3">
                    <button onclick="generatePrescriptionFromHistory('${record.id}', this)" class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition font-semibold flex items-center text-sm">
                        <i class="fas fa-prescription mr-2"></i>
                        Generate Prescription
                    </button>
                    <button onclick="window.location.href='/prescriptions'" class="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition font-semibold flex items-center text-sm">
                        <i class="fas fa-list mr-2"></i>
                        View Prescriptions
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
        `;
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
            </div>

            ${displayYouTubeVideosInModal(record.youtube_videos, true)}
        `;
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

    return `
        <div class="bg-white border border-gray-200 rounded-lg p-6">
            <h5 class="font-bold text-lg mb-4 flex items-center">
                <i class="fas ${icon} ${iconColor} mr-3 text-xl"></i>
                ${title}
            </h5>
            <div class="grid md:grid-cols-${videos.length > 2 ? '2' : '1'} gap-4">
                ${videos.map(video => `
                    <div class="bg-gray-50 rounded-lg overflow-hidden shadow-sm">
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
                        <div class="p-3">
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
            await loadHistory();
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
            
            // Ask if user wants to view it
            const viewPrescription = confirm('Would you like to view the prescription now?');
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
