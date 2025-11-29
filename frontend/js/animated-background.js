/**
 * Animated Background System
 * Creates floating leaves and bacteria with collision detection
 * Applies different color themes based on page state
 */

class AnimatedBackground {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.animationId = null;
        this.theme = this.detectTheme();
        this.init();
    }

    detectTheme() {
        const page = window.location.pathname.split('/').pop() || 'index.html';
        const isAdmin = localStorage.getItem('isAdmin') === 'true';
        const isLoggedIn = !!localStorage.getItem('token');
        
        console.log('detectTheme - page:', page, 'isAnalyzing:', window.isAnalyzing, 'diseaseStatus:', window.diseaseStatus);
        
        // Analyzing state has highest priority (set by dashboard)
        if (window.isAnalyzing === true) {
            console.log('Theme detected: analyzing');
            return 'analyzing';
        }
        
        // Disease status (set by dashboard after analysis)
        if (window.diseaseStatus === 'healthy') {
            console.log('Theme detected: healthy');
            return 'healthy';
        }
        
        if (window.diseaseStatus === 'diseased') {
            console.log('Theme detected: user (diseased)');
            // Return to user theme but keep red bacteria active
            return 'user';
        }
        
        // Admin pages
        if (page.includes('admin') || (isAdmin && page.includes('dashboard'))) {
            console.log('Theme detected: admin');
            return 'admin';
        }
        
        // User logged in
        if (isLoggedIn) {
            console.log('Theme detected: user');
            return 'user';
        }
        
        // Before login
        console.log('Theme detected: guest');
        return 'guest';
    }

    getThemeColors() {
        const themes = {
            guest: {
                bg: 'rgba(240, 248, 255, 0.3)',
                leaf: ['rgba(76, 175, 80, 0.6)', 'rgba(139, 195, 74, 0.6)', 'rgba(46, 125, 50, 0.6)'],
                bacteria: ['rgba(244, 67, 54, 0.7)', 'rgba(229, 57, 53, 0.7)', 'rgba(198, 40, 40, 0.7)']
            },
            user: {
                bg: 'rgba(232, 245, 233, 0.3)',
                leaf: ['rgba(102, 187, 106, 0.6)', 'rgba(129, 199, 132, 0.6)', 'rgba(56, 142, 60, 0.6)'],
                bacteria: ['rgba(239, 83, 80, 0.7)', 'rgba(229, 115, 115, 0.7)', 'rgba(211, 47, 47, 0.7)']
            },
            admin: {
                bg: 'rgba(227, 242, 253, 0.3)',
                leaf: ['rgba(66, 165, 245, 0.6)', 'rgba(100, 181, 246, 0.6)', 'rgba(33, 150, 243, 0.6)'],
                bacteria: ['rgba(255, 112, 67, 0.7)', 'rgba(255, 138, 101, 0.7)', 'rgba(244, 81, 30, 0.7)']
            },
            analyzing: {
                bg: 'rgba(255, 243, 224, 0.3)',
                leaf: ['rgba(255, 193, 7, 0.6)', 'rgba(255, 213, 79, 0.6)', 'rgba(255, 179, 0, 0.6)'],
                bacteria: ['rgba(255, 87, 34, 0.7)', 'rgba(255, 112, 67, 0.7)', 'rgba(244, 81, 30, 0.7)']
            },
            healthy: {
                bg: 'rgba(232, 245, 233, 0.3)',
                leaf: ['rgba(102, 187, 106, 0.7)', 'rgba(129, 199, 132, 0.7)', 'rgba(76, 175, 80, 0.7)'],
                bacteria: ['rgba(200, 200, 200, 0.4)', 'rgba(189, 189, 189, 0.4)', 'rgba(158, 158, 158, 0.4)']
            }
        };
        
        return themes[this.theme] || themes.guest;
    }

    init() {
        // Create canvas
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'animated-bg';
        this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            pointer-events: none;
        `;
        document.body.insertBefore(this.canvas, document.body.firstChild);
        
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        
        // Create particles
        this.createParticles();
        
        // Start animation
        this.animate();
        
        // Handle resize
        window.addEventListener('resize', () => this.resize());
        
        // Apply background color
        this.applyBackgroundColor();
    }

    applyBackgroundColor() {
        const colors = this.getThemeColors();
        console.log('Applying background color:', colors.bg);
        document.body.style.transition = 'background-color 0.5s ease';
        document.body.style.backgroundColor = colors.bg;
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createParticles() {
        const particleCount = Math.floor((this.canvas.width * this.canvas.height) / 15000);
        const leafCount = Math.floor(particleCount * 0.6);
        const bacteriaCount = particleCount - leafCount;
        
        // Create leaves
        for (let i = 0; i < leafCount; i++) {
            this.particles.push(new Leaf(this.canvas, this.getThemeColors()));
        }
        
        // Create bacteria
        for (let i = 0; i < bacteriaCount; i++) {
            this.particles.push(new Bacteria(this.canvas, this.getThemeColors()));
        }
    }

    checkCollisions() {
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const p1 = this.particles[i];
                const p2 = this.particles[j];
                
                // Only check collision between leaf and bacteria
                if (p1.type !== p2.type) {
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const minDistance = p1.size + p2.size;
                    
                    if (distance < minDistance) {
                        // Collision detected - bounce
                        const angle = Math.atan2(dy, dx);
                        const targetX = p1.x + Math.cos(angle) * minDistance;
                        const targetY = p1.y + Math.sin(angle) * minDistance;
                        
                        const ax = (targetX - p2.x) * 0.05;
                        const ay = (targetY - p2.y) * 0.05;
                        
                        p1.vx -= ax;
                        p1.vy -= ay;
                        p2.vx += ax;
                        p2.vy += ay;
                        
                        // Visual feedback
                        p1.colliding = true;
                        p2.colliding = true;
                    }
                }
            }
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Update and draw particles
        this.particles.forEach(particle => {
            particle.update();
            particle.draw(this.ctx);
        });
        
        // Check collisions
        this.checkCollisions();
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    updateTheme(newTheme) {
        console.log('updateTheme called - current:', this.theme, 'new:', newTheme);
        if (newTheme !== this.theme) {
            console.log('Theme changing from', this.theme, 'to', newTheme);
            this.theme = newTheme;
            const colors = this.getThemeColors();
            console.log('New colors:', colors);
            this.particles.forEach(particle => {
                particle.updateColors(colors);
            });
            this.applyBackgroundColor();
        } else {
            console.log('Theme unchanged, skipping update');
        }
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}

class Leaf {
    constructor(canvas, colors) {
        this.canvas = canvas;
        this.type = 'leaf';
        this.reset();
        this.updateColors(colors);
    }

    reset() {
        this.x = Math.random() * this.canvas.width;
        this.y = Math.random() * this.canvas.height;
        this.size = Math.random() * 15 + 10;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.02;
        this.colliding = false;
    }

    updateColors(colors) {
        this.color = colors.leaf[Math.floor(Math.random() * colors.leaf.length)];
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotationSpeed;
        
        // Wrap around screen
        if (this.x < -this.size) this.x = this.canvas.width + this.size;
        if (this.x > this.canvas.width + this.size) this.x = -this.size;
        if (this.y < -this.size) this.y = this.canvas.height + this.size;
        if (this.y > this.canvas.height + this.size) this.y = -this.size;
        
        // Damping
        this.vx *= 0.99;
        this.vy *= 0.99;
        
        // Reset collision state
        if (this.colliding) {
            setTimeout(() => this.colliding = false, 100);
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        if (this.colliding) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
        }
        
        // Draw leaf shape
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(0, -this.size);
        ctx.quadraticCurveTo(this.size * 0.5, -this.size * 0.5, this.size * 0.3, 0);
        ctx.quadraticCurveTo(this.size * 0.5, this.size * 0.5, 0, this.size);
        ctx.quadraticCurveTo(-this.size * 0.5, this.size * 0.5, -this.size * 0.3, 0);
        ctx.quadraticCurveTo(-this.size * 0.5, -this.size * 0.5, 0, -this.size);
        ctx.fill();
        
        // Leaf vein
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -this.size);
        ctx.lineTo(0, this.size);
        ctx.stroke();
        
        ctx.restore();
    }
}

class Bacteria {
    constructor(canvas, colors) {
        this.canvas = canvas;
        this.type = 'bacteria';
        this.reset();
        this.updateColors(colors);
    }

    reset() {
        this.x = Math.random() * this.canvas.width;
        this.y = Math.random() * this.canvas.height;
        this.size = Math.random() * 10 + 8;
        this.vx = (Math.random() - 0.5) * 0.7;
        this.vy = (Math.random() - 0.5) * 0.7;
        this.tentacles = Math.floor(Math.random() * 4) + 4;
        this.tentaclePhase = Math.random() * Math.PI * 2;
        this.colliding = false;
    }

    updateColors(colors) {
        this.color = colors.bacteria[Math.floor(Math.random() * colors.bacteria.length)];
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.tentaclePhase += 0.05;
        
        // Wrap around screen
        if (this.x < -this.size) this.x = this.canvas.width + this.size;
        if (this.x > this.canvas.width + this.size) this.x = -this.size;
        if (this.y < -this.size) this.y = this.canvas.height + this.size;
        if (this.y > this.canvas.height + this.size) this.y = -this.size;
        
        // Damping
        this.vx *= 0.99;
        this.vy *= 0.99;
        
        // Reset collision state
        if (this.colliding) {
            setTimeout(() => this.colliding = false, 100);
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        if (this.colliding) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
        }
        
        // Draw bacteria body
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw tentacles
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        for (let i = 0; i < this.tentacles; i++) {
            const angle = (Math.PI * 2 / this.tentacles) * i;
            const wave = Math.sin(this.tentaclePhase + i) * 3;
            const length = this.size + 5 + wave;
            
            ctx.beginPath();
            ctx.moveTo(
                Math.cos(angle) * this.size,
                Math.sin(angle) * this.size
            );
            ctx.lineTo(
                Math.cos(angle) * length,
                Math.sin(angle) * length
            );
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

// Initialize background
let animatedBg = null;

document.addEventListener('DOMContentLoaded', () => {
    animatedBg = new AnimatedBackground();
});

// Export for theme updates
window.updateBackgroundTheme = (theme) => {
    if (animatedBg) {
        animatedBg.updateTheme(theme);
    }
};

// Set analyzing state
window.setAnalyzingState = (isAnalyzing) => {
    console.log('setAnalyzingState called:', isAnalyzing);
    window.isAnalyzing = isAnalyzing;
    if (animatedBg) {
        const newTheme = animatedBg.detectTheme();
        console.log('Updating theme to:', newTheme);
        animatedBg.updateTheme(newTheme);
    } else {
        console.warn('animatedBg not initialized yet');
    }
};

// Set disease status
window.setDiseaseStatus = (status) => {
    console.log('setDiseaseStatus called:', status);
    window.diseaseStatus = status;
    if (animatedBg) {
        const newTheme = animatedBg.detectTheme();
        console.log('Updating theme to:', newTheme);
        animatedBg.updateTheme(newTheme);
    } else {
        console.warn('animatedBg not initialized yet');
    }
};
