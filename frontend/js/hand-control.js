// Hand Gesture Control System with AI
class HandGestureController {
    constructor() {
        this.video = null;
        this.canvas = null;
        this.ctx = null;
        this.hands = null;
        this.camera = null;
        this.isActive = false;
        this.elements = [];
        this.currentElement = null;
        this.gestureHistory = [];
        this.lastGesture = null;
        this.confidence = 0;
        this.cursor = null;
        this.clickTimeout = null;
        this.hoverTimeout = null;
        
        this.init();
    }

    async init() {
        try {
            await this.loadMediaPipe();
            this.scanDOMElements();
            this.setupUI();
            console.log('Hand Gesture Controller initialized');
        } catch (error) {
            console.error('Failed to initialize hand control:', error);
        }
    }

    async loadMediaPipe() {
        if (!window.Hands) {
            await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
            await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js');
            await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js');
            await this.loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');
        }

        this.hands = new Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        this.hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        this.hands.onResults(this.onResults.bind(this));
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    scanDOMElements() {
        const selectors = [
            'button', 'input', 'select', 'textarea', 'a[href]',
            '[onclick]', '[role="button"]', '.btn', '.clickable',
            '[data-gesture]', '.card', '.nav-item'
        ];

        this.elements = [];
        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                if (this.isElementVisible(el)) {
                    const rect = el.getBoundingClientRect();
                    this.elements.push({
                        element: el,
                        rect: rect,
                        center: {
                            x: rect.left + rect.width / 2,
                            y: rect.top + rect.height / 2
                        },
                        type: this.getElementType(el)
                    });
                }
            });
        });

        console.log(`Scanned ${this.elements.length} interactive elements`);
    }

    isElementVisible(el) {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               style.opacity !== '0' &&
               el.offsetWidth > 0 && 
               el.offsetHeight > 0;
    }

    getElementType(el) {
        if (el.tagName === 'BUTTON') return 'button';
        if (el.tagName === 'INPUT') return el.type || 'input';
        if (el.tagName === 'A') return 'link';
        if (el.hasAttribute('onclick')) return 'clickable';
        return 'interactive';
    }

    setupUI() {
        // Create virtual cursor
        this.cursor = document.createElement('div');
        this.cursor.id = 'virtual-cursor';
        this.cursor.style.cssText = `
            position: fixed; width: 20px; height: 20px; border-radius: 50%;
            background: radial-gradient(circle, #ff4444, #cc0000);
            border: 2px solid white; box-shadow: 0 0 10px rgba(255,68,68,0.8);
            pointer-events: none; z-index: 9999; display: none;
            transition: all 0.1s ease;
        `;
        document.body.appendChild(this.cursor);

        // Create control panel
        const panel = document.createElement('div');
        panel.id = 'hand-control-panel';
        panel.innerHTML = `
            <div style="position: fixed; top: 10px; right: 10px; z-index: 10000; 
                        background: rgba(0,0,0,0.9); color: white; padding: 15px; 
                        border-radius: 10px; font-family: Arial; max-width: 200px;">
                <h4>🤏 Hand Control</h4>
                <button id="toggleHandControl" style="margin: 5px; padding: 8px 12px; 
                        background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Start
                </button>
                <div style="font-size: 11px; margin: 10px 0; line-height: 1.3;">
                    <strong>Super Easy:</strong><br>
                    ✋ Move hand = move cursor<br>
                    🔼 Quick UP = click<br>
                    📜 Slow up/down = scroll
                </div>
                <div id="gestureStatus" style="margin-top: 10px; font-size: 12px;">
                    Status: Inactive
                </div>
                <canvas id="handCanvas" width="160" height="120" style="margin-top: 10px; 
                        border: 1px solid #ccc; display: none;"></canvas>
            </div>
        `;
        document.body.appendChild(panel);

        // Setup video element (hidden)
        this.video = document.createElement('video');
        this.video.style.display = 'none';
        document.body.appendChild(this.video);

        // Setup canvas
        this.canvas = document.getElementById('handCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Event listeners
        document.getElementById('toggleHandControl').addEventListener('click', () => {
            this.isActive ? this.stop() : this.start();
        });
    }

    async start() {
        try {
            this.camera = new Camera(this.video, {
                onFrame: async () => {
                    await this.hands.send({ image: this.video });
                },
                width: 640,
                height: 480
            });

            await this.camera.start();
            this.isActive = true;
            this.canvas.style.display = 'block';
            this.cursor.style.display = 'block';
            
            document.getElementById('toggleHandControl').textContent = 'Stop';
            document.getElementById('gestureStatus').innerHTML = 'Status: <span style="color: #4CAF50;">Active</span><br>Show your hand to camera';
            
            console.log('Hand gesture control started');
        } catch (error) {
            console.error('Failed to start camera:', error);
            alert('Camera access denied or not available');
        }
    }

    stop() {
        if (this.camera) {
            this.camera.stop();
        }
        this.isActive = false;
        this.canvas.style.display = 'none';
        this.cursor.style.display = 'none';
        
        document.getElementById('toggleHandControl').textContent = 'Start';
        document.getElementById('gestureStatus').textContent = 'Status: Inactive';
        
        this.clearHighlights();
        console.log('Hand gesture control stopped');
    }

    onResults(results) {
        if (!this.isActive) return;

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            
            this.drawHand(landmarks);
            
            const gesture = this.analyzeGesture(landmarks);
            const pointer = this.getPointerPosition(landmarks);
            
            this.moveCursor(pointer);
            
            document.getElementById('gestureStatus').innerHTML = `
                Status: <span style="color: #4CAF50;">Tracking</span><br>
                Gesture: ${gesture.type}<br>
                ${gesture.type === 'click' ? '🔼 Clicking!' : gesture.type === 'scroll' ? '📜 Scrolling' : '✋ Moving'}
            `;

            this.handleGesture(gesture, pointer);
        } else {
            document.getElementById('gestureStatus').innerHTML = 'Status: <span style="color: #ff6b6b;">No hand detected</span><br>Show palm to camera';
            this.clearHighlights();
            this.cursor.style.display = 'none';
        }
    }

    drawHand(landmarks) {
        this.ctx.strokeStyle = '#00FF00';
        this.ctx.lineWidth = 2;
        this.ctx.fillStyle = '#FF0000';

        landmarks.forEach(landmark => {
            const x = landmark.x * this.canvas.width;
            const y = landmark.y * this.canvas.height;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, 3, 0, 2 * Math.PI);
            this.ctx.fill();
        });

        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4],
            [0, 5], [5, 6], [6, 7], [7, 8],
            [5, 9], [9, 10], [10, 11], [11, 12],
            [9, 13], [13, 14], [14, 15], [15, 16],
            [13, 17], [17, 18], [18, 19], [19, 20]
        ];

        this.ctx.beginPath();
        connections.forEach(([start, end]) => {
            const startPoint = landmarks[start];
            const endPoint = landmarks[end];
            
            this.ctx.moveTo(startPoint.x * this.canvas.width, startPoint.y * this.canvas.height);
            this.ctx.lineTo(endPoint.x * this.canvas.width, endPoint.y * this.canvas.height);
        });
        this.ctx.stroke();
    }

    analyzeGesture(landmarks) {
        const wrist = landmarks[0];
        const indexTip = landmarks[8];
        
        // Simple: if hand moves up quickly = click
        const currentY = wrist.y;
        
        if (!this.lastY) this.lastY = currentY;
        const movement = this.lastY - currentY;
        this.lastY = currentY;
        
        let gestureType = 'hover';
        let confidence = 0.8;
        
        // Quick upward movement = click
        if (movement > 0.02) {
            gestureType = 'click';
            confidence = 0.9;
        }
        
        return { type: gestureType, confidence, movement };
    }

    getPointerPosition(landmarks) {
        const indexTip = landmarks[8];
        return {
            x: (1 - indexTip.x) * window.innerWidth, // Mirror horizontally
            y: indexTip.y * window.innerHeight
        };
    }

    moveCursor(pointer) {
        this.cursor.style.display = 'block';
        this.cursor.style.left = (pointer.x - 10) + 'px';
        this.cursor.style.top = (pointer.y - 10) + 'px';
    }

    handleGesture(gesture, pointer) {
        const targetElement = this.findElementAtPosition(pointer.x, pointer.y);
        
        if (targetElement !== this.currentElement) {
            this.clearHighlights();
            this.currentElement = targetElement;
            if (targetElement) {
                this.highlightElement(targetElement);
            }
        }

        this.updateCursorAppearance(gesture, targetElement);

        if (gesture.confidence > 0.6) {
            switch (gesture.type) {
                case 'hover':
                    if (targetElement) {
                        this.simulateHover(targetElement.element);
                    }
                    break;
                    
                case 'click':
                    if (targetElement && this.lastGesture !== 'click') {
                        this.simulateClick(targetElement.element);
                    }
                    break;
            }
        }

        this.lastGesture = gesture.type;
    }

    updateCursorAppearance(gesture, targetElement) {
        let cursorStyle = 'radial-gradient(circle, #ff4444, #cc0000)';
        let transform = 'scale(1)';
        
        if (targetElement) {
            cursorStyle = 'radial-gradient(circle, #44ff44, #00cc00)';
            transform = 'scale(1.2)';
        }
        
        if (gesture.type === 'click' && gesture.confidence > 0.6) {
            cursorStyle = 'radial-gradient(circle, #ffff44, #cccc00)';
            transform = 'scale(0.8)';
        }
        
        this.cursor.style.background = cursorStyle;
        this.cursor.style.transform = transform;
    }

    findElementAtPosition(x, y) {
        return this.elements.find(item => {
            const rect = item.rect;
            return x >= rect.left && x <= rect.right && 
                   y >= rect.top && y <= rect.bottom;
        });
    }

    highlightElement(elementData) {
        const el = elementData.element;
        el.style.outline = '3px solid #00FF00';
        el.style.boxShadow = '0 0 10px rgba(0, 255, 0, 0.5)';
        el.style.transition = 'all 0.2s ease';
    }

    clearHighlights() {
        this.elements.forEach(item => {
            const el = item.element;
            el.style.outline = '';
            el.style.boxShadow = '';
        });
    }

    simulateHover(element) {
        const hoverEvent = new MouseEvent('mouseenter', {
            bubbles: true,
            cancelable: true
        });
        element.dispatchEvent(hoverEvent);
    }

    simulateClick(element) {
        console.log('Gesture click on:', element.tagName, element.textContent?.substring(0, 20));
        
        element.style.transform = 'scale(0.95)';
        element.style.filter = 'brightness(1.2)';
        
        this.cursor.style.transform = 'scale(0.5)';
        this.cursor.style.background = 'radial-gradient(circle, #ffff00, #ff8800)';
        
        setTimeout(() => {
            element.style.transform = '';
            element.style.filter = '';
            this.cursor.style.transform = 'scale(1)';
        }, 200);

        const rect = element.getBoundingClientRect();
        const clickEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            clientX: rect.left + rect.width / 2,
            clientY: rect.top + rect.height / 2
        });
        element.dispatchEvent(clickEvent);

        this.showNotification(`✅ Clicked: ${element.textContent?.substring(0, 30) || element.tagName}`);
    }

    simulateScroll(pointer) {
        const scrollAmount = (pointer.y - window.innerHeight / 2) * 0.1;
        window.scrollBy(0, scrollAmount);
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8); color: white; padding: 10px 20px;
            border-radius: 5px; z-index: 10001; font-size: 14px;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 2000);
    }
}

// Auto-initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.handController = new HandGestureController();
});

// Re-scan elements when DOM changes
const observer = new MutationObserver(() => {
    if (window.handController) {
        window.handController.scanDOMElements();
    }
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});