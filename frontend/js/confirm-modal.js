/**
 * Beautiful Tailwind CSS Confirmation Modal
 * Replaces browser's confirm() with a modern UI
 */

// Create modal HTML if it doesn't exist
function createConfirmModal() {
    if (document.getElementById('confirmModal')) return;
    
    const modalHTML = `
        <div id="confirmModal" class="fixed inset-0 z-50 hidden items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
            <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
                <!-- Header -->
                <div class="p-6 border-b border-gray-200">
                    <div class="flex items-center">
                        <div id="confirmIcon" class="flex-shrink-0 w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mr-4">
                            <i class="fas fa-check-circle text-green-600 text-2xl"></i>
                        </div>
                        <div>
                            <h3 id="confirmTitle" class="text-xl font-bold text-gray-900">Success!</h3>
                            <p id="confirmSubtitle" class="text-sm text-gray-500 mt-1"></p>
                        </div>
                    </div>
                </div>
                
                <!-- Body -->
                <div class="p-6">
                    <p id="confirmMessage" class="text-gray-700 leading-relaxed"></p>
                </div>
                
                <!-- Footer -->
                <div class="p-6 bg-gray-50 rounded-b-2xl flex justify-end space-x-3">
                    <button id="confirmCancel" class="px-6 py-2.5 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold">
                        Not Now
                    </button>
                    <button id="confirmOk" class="px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition font-semibold shadow-lg">
                        View Prescription
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

/**
 * Show prescription confirmation modal
 * @param {boolean} isExisting - Whether prescription already exists
 * @returns {Promise<boolean>}
 */
async function showPrescriptionConfirm(isExisting = false) {
    return new Promise((resolve) => {
        createConfirmModal();
        
        const modal = document.getElementById('confirmModal');
        const title = document.getElementById('confirmTitle');
        const subtitle = document.getElementById('confirmSubtitle');
        const message = document.getElementById('confirmMessage');
        const okBtn = document.getElementById('confirmOk');
        const cancelBtn = document.getElementById('confirmCancel');
        
        // Set content
        title.textContent = isExisting ? 'Prescription Found!' : 'Prescription Created!';
        subtitle.textContent = isExisting ? 'Already exists for this analysis' : 'Successfully generated';
        message.textContent = isExisting 
            ? 'A prescription was already created for this analysis. Would you like to view it now?'
            : 'Your treatment prescription has been generated with detailed recommendations. Would you like to view it now?';
        
        // Show modal
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        
        // Handle confirm
        const handleConfirm = () => {
            closeModal();
            resolve(true);
        };
        
        // Handle cancel
        const handleCancel = () => {
            closeModal();
            resolve(false);
        };
        
        // Close modal
        const closeModal = () => {
            modal.classList.remove('flex');
            modal.classList.add('hidden');
            okBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
            modal.removeEventListener('click', handleBackdropClick);
        };
        
        // Handle backdrop click
        const handleBackdropClick = (e) => {
            if (e.target === modal) {
                handleCancel();
            }
        };
        
        // Add event listeners
        okBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', handleCancel);
        modal.addEventListener('click', handleBackdropClick);
        
        // Handle escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                handleCancel();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    });
}
