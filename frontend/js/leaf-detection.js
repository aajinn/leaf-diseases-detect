/**
 * Leaf Detection and Auto-Cropping System
 * Automatically detects and crops leaf from image using computer vision
 */

class LeafDetector {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.debugMode = false;
    }

    /**
     * Detect and crop leaf from image
     * @param {File|HTMLImageElement} input - Image file or image element
     * @returns {Promise<File>} - Cropped image file
     */
    async detectAndCrop(input) {
        try {
            // Load image
            const img = await this.loadImage(input);
            
            // Detect leaf region
            const leafRegion = await this.detectLeafRegion(img);
            
            if (!leafRegion) {
                // No leaf detected, return original
                console.warn('No leaf detected, using original image');
                return input instanceof File ? input : await this.imageToFile(img);
            }
            
            // Crop to leaf region
            const croppedImage = this.cropToRegion(img, leafRegion);
            
            // Convert to file
            return await this.canvasToFile(croppedImage);
            
        } catch (error) {
            console.error('Leaf detection error:', error);
            // Return original on error
            return input instanceof File ? input : await this.imageToFile(input);
        }
    }

    /**
     * Load image from file or element
     */
    async loadImage(input) {
        if (input instanceof HTMLImageElement) {
            return input;
        }
        
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(input);
            
            img.onload = () => {
                URL.revokeObjectURL(url);
                resolve(img);
            };
            
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Failed to load image'));
            };
            
            img.src = url;
        });
    }

    /**
     * Detect leaf region using color and edge detection
     */
    async detectLeafRegion(img) {
        // Set canvas size
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        
        // Draw image
        this.ctx.drawImage(img, 0, 0);
        
        // Get image data
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        
        // Create mask for green regions (leaves are typically green)
        const mask = new Uint8Array(this.canvas.width * this.canvas.height);
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Detect green-ish colors (leaves)
            // Also detect brown/yellow (diseased leaves)
            const isGreen = this.isLeafColor(r, g, b);
            
            const pixelIndex = i / 4;
            mask[pixelIndex] = isGreen ? 255 : 0;
        }
        
        // Apply morphological operations to clean up mask
        const cleanedMask = this.morphologicalClose(mask, this.canvas.width, this.canvas.height);
        
        // Find bounding box of largest contiguous region
        const boundingBox = this.findLargestRegion(cleanedMask, this.canvas.width, this.canvas.height);
        
        if (!boundingBox) {
            return null;
        }
        
        // Add padding around detected region
        const padding = 20;
        return {
            x: Math.max(0, boundingBox.x - padding),
            y: Math.max(0, boundingBox.y - padding),
            width: Math.min(this.canvas.width - boundingBox.x + padding, boundingBox.width + padding * 2),
            height: Math.min(this.canvas.height - boundingBox.y + padding, boundingBox.height + padding * 2)
        };
    }

    /**
     * Check if color is leaf-like (green, brown, yellow)
     */
    isLeafColor(r, g, b) {
        // Green leaves: G > R and G > B
        const isGreen = g > r && g > b && g > 50;
        
        // Yellow/brown leaves (diseased): R and G similar, both > B
        const isYellowBrown = Math.abs(r - g) < 50 && r > b && g > b && r > 80;
        
        // Dark green: All values moderate but G highest
        const isDarkGreen = g > r && g > b && g > 30 && g < 150;
        
        // Light green: High G, moderate R and B
        const isLightGreen = g > 100 && g > r && g > b;
        
        return isGreen || isYellowBrown || isDarkGreen || isLightGreen;
    }

    /**
     * Morphological closing operation to fill holes
     */
    morphologicalClose(mask, width, height) {
        // Dilate then erode
        const dilated = this.dilate(mask, width, height, 3);
        return this.erode(dilated, width, height, 3);
    }

    /**
     * Dilate operation
     */
    dilate(mask, width, height, kernelSize) {
        const result = new Uint8Array(mask.length);
        const half = Math.floor(kernelSize / 2);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let maxVal = 0;
                
                for (let ky = -half; ky <= half; ky++) {
                    for (let kx = -half; kx <= half; kx++) {
                        const ny = y + ky;
                        const nx = x + kx;
                        
                        if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
                            const idx = ny * width + nx;
                            maxVal = Math.max(maxVal, mask[idx]);
                        }
                    }
                }
                
                result[y * width + x] = maxVal;
            }
        }
        
        return result;
    }

    /**
     * Erode operation
     */
    erode(mask, width, height, kernelSize) {
        const result = new Uint8Array(mask.length);
        const half = Math.floor(kernelSize / 2);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let minVal = 255;
                
                for (let ky = -half; ky <= half; ky++) {
                    for (let kx = -half; kx <= half; kx++) {
                        const ny = y + ky;
                        const nx = x + kx;
                        
                        if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
                            const idx = ny * width + nx;
                            minVal = Math.min(minVal, mask[idx]);
                        }
                    }
                }
                
                result[y * width + x] = minVal;
            }
        }
        
        return result;
    }

    /**
     * Find largest contiguous region in mask
     */
    findLargestRegion(mask, width, height) {
        const visited = new Uint8Array(mask.length);
        let largestRegion = null;
        let largestSize = 0;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = y * width + x;
                
                if (mask[idx] === 255 && !visited[idx]) {
                    const region = this.floodFill(mask, visited, x, y, width, height);
                    
                    if (region.size > largestSize) {
                        largestSize = region.size;
                        largestRegion = region.bounds;
                    }
                }
            }
        }
        
        // Only return if region is significant (at least 5% of image)
        const minSize = (width * height) * 0.05;
        if (largestSize < minSize) {
            return null;
        }
        
        return largestRegion;
    }

    /**
     * Flood fill to find connected region
     */
    floodFill(mask, visited, startX, startY, width, height) {
        const stack = [[startX, startY]];
        let size = 0;
        let minX = startX, maxX = startX;
        let minY = startY, maxY = startY;
        
        while (stack.length > 0) {
            const [x, y] = stack.pop();
            const idx = y * width + x;
            
            if (x < 0 || x >= width || y < 0 || y >= height) continue;
            if (visited[idx] || mask[idx] !== 255) continue;
            
            visited[idx] = 1;
            size++;
            
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
            
            // Add neighbors
            stack.push([x + 1, y]);
            stack.push([x - 1, y]);
            stack.push([x, y + 1]);
            stack.push([x, y - 1]);
        }
        
        return {
            size,
            bounds: {
                x: minX,
                y: minY,
                width: maxX - minX + 1,
                height: maxY - minY + 1
            }
        };
    }

    /**
     * Crop image to specified region
     */
    cropToRegion(img, region) {
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width = region.width;
        cropCanvas.height = region.height;
        
        const cropCtx = cropCanvas.getContext('2d');
        cropCtx.drawImage(
            img,
            region.x, region.y, region.width, region.height,
            0, 0, region.width, region.height
        );
        
        return cropCanvas;
    }

    /**
     * Convert canvas to file
     */
    async canvasToFile(canvas) {
        return new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], `leaf-cropped-${Date.now()}.jpg`, {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    });
                    resolve(file);
                } else {
                    reject(new Error('Failed to create blob'));
                }
            }, 'image/jpeg', 0.95);
        });
    }

    /**
     * Convert image element to file
     */
    async imageToFile(img) {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        return await this.canvasToFile(canvas);
    }

    /**
     * Preview detection (for debugging)
     */
    async previewDetection(input, targetElement) {
        const img = await this.loadImage(input);
        const region = await this.detectLeafRegion(img);
        
        if (!region) {
            console.log('No leaf detected');
            return;
        }
        
        // Draw original with bounding box
        const previewCanvas = document.createElement('canvas');
        previewCanvas.width = img.width;
        previewCanvas.height = img.height;
        
        const ctx = previewCanvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        // Draw bounding box
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 3;
        ctx.strokeRect(region.x, region.y, region.width, region.height);
        
        // Show preview
        if (targetElement) {
            targetElement.innerHTML = '';
            targetElement.appendChild(previewCanvas);
        }
        
        return region;
    }
}

// Global instance
let leafDetector = null;

// Initialize leaf detector
function initializeLeafDetector() {
    if (!leafDetector) {
        leafDetector = new LeafDetector();
    }
    return leafDetector;
}

// Process image with auto-crop
async function processImageWithAutoCrop(file, showPreview = false) {
    const detector = initializeLeafDetector();
    
    try {
        // Show processing notification
        if (typeof showNotification === 'function') {
            showNotification('Detecting leaf region...', 'info');
        }
        
        // Detect and crop
        const croppedFile = await detector.detectAndCrop(file);
        
        // Check if cropping was successful
        if (croppedFile.size < file.size * 0.3) {
            // Cropped too much, use original
            console.warn('Cropped image too small, using original');
            return file;
        }
        
        if (typeof showNotification === 'function') {
            showNotification('Leaf detected and cropped!', 'success');
        }
        
        return croppedFile;
        
    } catch (error) {
        console.error('Auto-crop error:', error);
        if (typeof showNotification === 'function') {
            showNotification('Auto-crop failed, using original image', 'warning');
        }
        return file;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LeafDetector, initializeLeafDetector, processImageWithAutoCrop };
}
