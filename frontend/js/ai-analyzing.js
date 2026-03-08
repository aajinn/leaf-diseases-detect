/**
 * AI Analyzing Animation
 */

const AI_MESSAGES = [
    "Initializing AI model...",
    "Processing image data...",
    "Analyzing leaf patterns...",
    "Detecting disease markers...",
    "Evaluating severity...",
    "Generating recommendations...",
    "Finalizing results..."
];

let currentMessageIndex = 0;
let messageInterval = null;

function showAIAnalyzing() {
    const overlay = document.createElement('div');
    overlay.id = 'aiAnalyzingOverlay';
    overlay.className = 'ai-analyzing-overlay';
    
    overlay.innerHTML = `
        <div class="ai-analyzing-container">
            <!-- Glow Effect -->
            <div class="ai-glow"></div>
            
            <!-- Particles -->
            <div class="ai-particles">
                ${Array(9).fill(0).map(() => '<div class="particle"></div>').join('')}
            </div>
            
            <!-- Brain Icon -->
            <div class="ai-brain">
                <i class="fas fa-brain"></i>
            </div>
            
            <!-- Status -->
            <div class="ai-status">AI Analysis in Progress</div>
            <div class="ai-substatus" id="aiSubstatus">Initializing AI model...</div>
            
            <!-- Progress Bar -->
            <div class="ai-progress">
                <div class="ai-progress-bar"></div>
            </div>
            
            <!-- Info -->
            <div style="margin-top: 1rem; opacity: 0.8; font-size: 0.9rem;">
                <i class="fas fa-robot mr-2"></i>
                Powered by Advanced AI
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Cycle through messages
    currentMessageIndex = 0;
    messageInterval = setInterval(() => {
        currentMessageIndex = (currentMessageIndex + 1) % AI_MESSAGES.length;
        const substatus = document.getElementById('aiSubstatus');
        if (substatus) {
            substatus.textContent = AI_MESSAGES[currentMessageIndex];
        }
    }, 2000);
}

function hideAIAnalyzing() {
    const overlay = document.getElementById('aiAnalyzingOverlay');
    if (overlay) {
        overlay.remove();
    }
    
    if (messageInterval) {
        clearInterval(messageInterval);
        messageInterval = null;
    }
}

// Export functions
window.showAIAnalyzing = showAIAnalyzing;
window.hideAIAnalyzing = hideAIAnalyzing;
