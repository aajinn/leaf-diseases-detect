/**
 * Color Theme Manager
 * Detects dominant color from uploaded images and applies theme
 */

class ColorThemeManager {
    constructor() {
        this.originalBgColor = null;
        this.isThemeActive = false;
    }

    /**
     * Extract dominant color from image file
     */
    async extractDominantColor(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                
                img.onload = () => {
                    try {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        // Resize for faster processing
                        const maxSize = 100;
                        const scale = Math.min(maxSize / img.width, maxSize / img.height);
                        canvas.width = img.width * scale;
                        canvas.height = img.height * scale;
                        
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        const color = this.calculateDominantColor(imageData.data);
                        resolve(color);
                    } catch (error) {
                        console.error('Error extracting color:', error);
                        reject(error);
                    }
                };
                
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = e.target.result;
            };
            
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    /**
     * Calculate dominant color from image data
     */
    calculateDominantColor(data) {
        const colorMap = {};
        const step = 4;
        
        for (let i = 0; i < data.length; i += step * 4) {
            const r = Math.round(data[i] / 10) * 10;
            const g = Math.round(data[i + 1] / 10) * 10;
            const b = Math.round(data[i + 2] / 10) * 10;
            const a = data[i + 3];
            
            if (a < 125) continue;
            
            const brightness = (r + g + b) / 3;
            if (brightness < 30 || brightness > 240) continue;
            
            const key = `${r},${g},${b}`;
            colorMap[key] = (colorMap[key] || 0) + 1;
        }
        
        let maxCount = 0;
        let dominantColor = null;
        
        for (const [color, count] of Object.entries(colorMap)) {
            if (count > maxCount) {
                maxCount = count;
                dominantColor = color;
            }
        }
        
        if (!dominantColor) {
            return { r: 34, g: 197, b: 94 };
        }
        
        const [r, g, b] = dominantColor.split(',').map(Number);
        return { r, g, b };
    }

    /**
     * Convert RGB to HSL
     */
    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
                case g: h = ((b - r) / d + 2) / 6; break;
                case b: h = ((r - g) / d + 4) / 6; break;
            }
        }
        
        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    }

    /**
     * Generate theme colors from dominant color
     */
    generateTheme(dominantColor) {
        const hsl = this.rgbToHsl(dominantColor.r, dominantColor.g, dominantColor.b);
        
        const primaryHue = hsl.h;
        const primarySat = Math.max(40, Math.min(70, hsl.s));
        const primaryLight = Math.max(35, Math.min(55, hsl.l));
        
        return {
            primary: `hsl(${primaryHue}, ${primarySat}%, ${primaryLight}%)`,
            primaryLight: `hsl(${primaryHue}, ${primarySat}%, ${primaryLight + 15}%)`,
            primaryDark: `hsl(${primaryHue}, ${primarySat}%, ${primaryLight - 10}%)`,
            background: `hsl(${primaryHue}, ${Math.max(20, primarySat - 30)}%, 97%)`,
            backgroundAlt: `hsl(${primaryHue}, ${Math.max(15, primarySat - 35)}%, 95%)`,
            border: `hsl(${primaryHue}, ${Math.max(25, primarySat - 25)}%, 85%)`,
            rgb: dominantColor
        };
    }

    /**
     * Apply theme to page
     */
    applyTheme(theme) {
        if (!this.originalBgColor) {
            this.originalBgColor = getComputedStyle(document.body).backgroundColor || '#f9fafb';
        }
        
        document.body.style.transition = 'background-color 0.8s ease';
        document.body.style.backgroundColor = theme.background;
        
        // Update primary colored elements
        const primaryBg = document.querySelectorAll('.bg-primary');
        primaryBg.forEach(el => {
            el.style.transition = 'background-color 0.5s ease';
            el.style.backgroundColor = theme.primary;
        });
        
        const primaryText = document.querySelectorAll('.text-primary');
        primaryText.forEach(el => {
            el.style.transition = 'color 0.5s ease';
            el.style.color = theme.primary;
        });
        
        const primaryBorder = document.querySelectorAll('.border-primary');
        primaryBorder.forEach(el => {
            el.style.transition = 'border-color 0.5s ease';
            el.style.borderColor = theme.primary;
        });
        
        // Update white cards
        const whiteCards = document.querySelectorAll('.bg-white.rounded-xl, .bg-white.rounded-lg');
        whiteCards.forEach(card => {
            card.style.transition = 'background-color 0.5s ease';
            card.style.backgroundColor = theme.backgroundAlt;
        });
        
        this.isThemeActive = true;
        
        console.log('🎨 Theme applied:', {
            primary: theme.primary,
            background: theme.background,
            rgb: `rgb(${theme.rgb.r}, ${theme.rgb.g}, ${theme.rgb.b})`
        });
    }

    /**
     * Reset theme to original
     */
    resetTheme() {
        if (!this.isThemeActive) return;
        
        if (this.originalBgColor) {
            document.body.style.backgroundColor = this.originalBgColor;
        }
        
        // Reset inline styles
        const elements = document.querySelectorAll('[style*="background-color"], [style*="color"], [style*="border-color"]');
        elements.forEach(el => {
            el.style.removeProperty('background-color');
            el.style.removeProperty('color');
            el.style.removeProperty('border-color');
        });
        
        this.isThemeActive = false;
        console.log('🎨 Theme reset');
    }

    /**
     * Process image and apply theme
     */
    async processImageAndApplyTheme(file) {
        try {
            console.log('🎨 Starting color theme extraction...');
            const dominantColor = await this.extractDominantColor(file);
            console.log('🎨 Dominant color:', dominantColor);
            
            const theme = this.generateTheme(dominantColor);
            this.applyTheme(theme);
            
            if (typeof showNotification === 'function') {
                showNotification(
                    `🎨 Theme adapted to leaf color (RGB: ${dominantColor.r}, ${dominantColor.g}, ${dominantColor.b})`,
                    'success'
                );
            }
            
            return theme;
        } catch (error) {
            console.error('❌ Error processing image theme:', error);
            return null;
        }
    }
}

// Global instance
const colorThemeManager = new ColorThemeManager();

if (typeof CONFIG !== 'undefined' && CONFIG.DEBUG) {
    window.colorThemeManager = colorThemeManager;
    console.log('🎨 Color Theme Manager initialized');
}
