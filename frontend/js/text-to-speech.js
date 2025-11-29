// Text-to-Speech Module
class TextToSpeech {
    constructor() {
        this.synth = window.speechSynthesis;
        this.enabled = localStorage.getItem('tts_enabled') !== 'false'; // Default enabled
        this.speaking = false;
        this.currentUtterance = null;
    }

    isEnabled() {
        return this.enabled;
    }

    toggle() {
        this.enabled = !this.enabled;
        localStorage.setItem('tts_enabled', this.enabled);
        
        if (!this.enabled && this.speaking) {
            this.stop();
        }
        
        return this.enabled;
    }

    stop() {
        if (this.synth.speaking) {
            this.synth.cancel();
        }
        this.speaking = false;
        this.currentUtterance = null;
    }

    speak(text, options = {}) {
        if (!this.enabled || !text) {
            return;
        }

        // Stop any ongoing speech
        this.stop();

        // Create utterance
        this.currentUtterance = new SpeechSynthesisUtterance(text);
        
        // Configure voice settings
        this.currentUtterance.rate = options.rate || 1.0;
        this.currentUtterance.pitch = options.pitch || 1.0;
        this.currentUtterance.volume = options.volume || 1.0;
        this.currentUtterance.lang = options.lang || 'en-US';

        // Event handlers
        this.currentUtterance.onstart = () => {
            this.speaking = true;
            this.updateSpeakerIcon(true);
        };

        this.currentUtterance.onend = () => {
            this.speaking = false;
            this.updateSpeakerIcon(false);
        };

        this.currentUtterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            this.speaking = false;
            this.updateSpeakerIcon(false);
        };

        // Speak
        this.synth.speak(this.currentUtterance);
    }

    speakAnalysisResult(result) {
        if (!this.enabled) return;

        let text = '';

        // Build speech text based on result
        if (result.disease_type === 'invalid_image') {
            text = 'Invalid image detected. Please upload a clear image of a plant leaf for analysis.';
        } else if (result.disease_detected) {
            text = `Disease detected: ${result.disease_name}. `;
            text += `This is a ${result.disease_type} disease with ${result.severity} severity. `;
            text += `Confidence level: ${result.confidence} percent. `;
            
            if (result.description) {
                text += result.description + ' ';
            }
            
            text += 'Please check the screen for detailed symptoms and treatment recommendations.';
        } else {
            text = `Good news! Your plant appears to be healthy with ${result.confidence} percent confidence. `;
            
            if (result.description) {
                text += result.description + ' ';
            }
            
            text += 'Continue with regular care and monitoring.';
        }

        this.speak(text);
    }

    updateSpeakerIcon(speaking) {
        const icon = document.getElementById('ttsIcon');
        if (icon) {
            if (speaking) {
                icon.classList.remove('fa-volume-up', 'fa-volume-mute');
                icon.classList.add('fa-volume-high');
                icon.parentElement.classList.add('animate-pulse');
            } else {
                icon.classList.remove('fa-volume-high');
                icon.classList.add(this.enabled ? 'fa-volume-up' : 'fa-volume-mute');
                icon.parentElement.classList.remove('animate-pulse');
            }
        }
    }
}

// Create global instance
const tts = new TextToSpeech();

// Toggle function for button
function toggleTTS() {
    const enabled = tts.toggle();
    const icon = document.getElementById('ttsIcon');
    const button = document.getElementById('ttsButton');
    
    if (icon) {
        icon.classList.remove('fa-volume-up', 'fa-volume-mute', 'fa-volume-high');
        icon.classList.add(enabled ? 'fa-volume-up' : 'fa-volume-mute');
    }
    
    if (button) {
        button.title = enabled ? 'Disable voice announcements' : 'Enable voice announcements';
        button.classList.remove('bg-primary', 'bg-gray-400');
        button.classList.add(enabled ? 'bg-primary' : 'bg-gray-400');
    }
    
    // Show notification
    const message = enabled ? 'Voice announcements enabled' : 'Voice announcements disabled';
    showNotification(message, enabled ? 'success' : 'info');
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed bottom-4 left-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 
        'bg-blue-500'
    } text-white`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}
