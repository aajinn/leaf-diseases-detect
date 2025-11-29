// PDF Export Module using jsPDF
class PDFExporter {
    constructor() {
        this.doc = null;
        this.pageWidth = 210; // A4 width in mm
        this.pageHeight = 297; // A4 height in mm
        this.margin = 20;
        this.currentY = 20;
    }

    async generateAnalysisReport(analysisData, imageData = null) {
        // Load jsPDF if not already loaded
        if (typeof jspdf === 'undefined') {
            console.error('jsPDF library not loaded');
            return;
        }

        const { jsPDF } = window.jspdf;
        this.doc = new jsPDF();
        this.currentY = this.margin;

        // Add header
        this.addHeader();

        // Add analysis date
        this.doc.setFontSize(10);
        this.doc.setTextColor(100, 100, 100);
        this.doc.text(`Analysis Date: ${new Date(analysisData.analysis_timestamp || Date.now()).toLocaleString()}`, this.margin, this.currentY);
        this.currentY += 8;

        // Add image if available (medium size)
        if (imageData) {
            await this.addImage(imageData);
        }

        // Add disease information
        this.addDiseaseInfo(analysisData);

        // Add description
        if (analysisData.description) {
            this.addSection('About This Condition', analysisData.description);
        }

        // Add symptoms, causes, and treatment in a grid
        const hasSymptoms = analysisData.symptoms && analysisData.symptoms.length > 0;
        const hasCauses = analysisData.possible_causes && analysisData.possible_causes.length > 0;
        const hasTreatment = analysisData.treatment && analysisData.treatment.length > 0;

        if (hasSymptoms || hasCauses || hasTreatment) {
            const startY = this.currentY;
            const colWidth = (this.pageWidth - 2 * this.margin - 10) / 3;
            
            // Symptoms column
            if (hasSymptoms) {
                this.currentY = startY;
                this.addListSectionInColumn('Symptoms', analysisData.symptoms.slice(0, 4), this.margin, colWidth);
            }
            
            // Causes column
            if (hasCauses) {
                this.currentY = startY;
                this.addListSectionInColumn('Possible Causes', analysisData.possible_causes.slice(0, 4), this.margin + colWidth + 5, colWidth);
            }
            
            // Treatment column
            if (hasTreatment) {
                this.currentY = startY;
                this.addListSectionInColumn('Treatment', analysisData.treatment.slice(0, 4), this.margin + 2 * colWidth + 10, colWidth);
            }
            
            this.currentY += 35; // Move past columns
        }

        // Add YouTube resources
        if (analysisData.youtube_videos && analysisData.youtube_videos.length > 0) {
            this.addYouTubeSection(analysisData.youtube_videos);
        }

        // Add footer
        this.addFooter();

        // Generate filename
        const filename = this.generateFilename(analysisData);

        // Save PDF
        this.doc.save(filename);
    }

    addHeader() {
        // Title
        this.doc.setFontSize(20);
        this.doc.setTextColor(16, 185, 129);
        this.doc.text('Leaf Disease Analysis Report', this.pageWidth / 2, this.currentY, { align: 'center' });
        this.currentY += 10;

        // Line separator
        this.doc.setDrawColor(16, 185, 129);
        this.doc.setLineWidth(0.5);
        this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
        this.currentY += 8;
    }

    addDiseaseInfo(data) {
        const isHealthy = !data.disease_detected;
        const isInvalid = data.disease_type === 'invalid_image';

        // Status box (smaller)
        this.doc.setFillColor(isInvalid ? 255 : isHealthy ? 220 : 254, isInvalid ? 251 : isHealthy ? 252 : 226, isInvalid ? 230 : isHealthy ? 231 : 230);
        this.doc.roundedRect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 30, 3, 3, 'F');

        // Status text
        this.doc.setFontSize(16);
        this.doc.setTextColor(isInvalid ? 180 : isHealthy ? 22 : 153, isInvalid ? 140 : isHealthy ? 163 : 27, isInvalid ? 0 : isHealthy ? 74 : 27);
        
        const statusText = isInvalid ? 'Invalid Image' : isHealthy ? 'Healthy Plant' : data.disease_name;
        this.doc.text(statusText, this.pageWidth / 2, this.currentY + 10, { align: 'center' });

        if (!isInvalid) {
            // Details
            this.doc.setFontSize(10);
            this.doc.setTextColor(100, 100, 100);
            
            if (!isHealthy) {
                this.doc.text(`Type: ${data.disease_type} | Severity: ${data.severity}`, this.pageWidth / 2, this.currentY + 18, { align: 'center' });
            }
            
            this.doc.text(`Confidence: ${data.confidence}%`, this.pageWidth / 2, this.currentY + 25, { align: 'center' });
        }

        this.currentY += 35;
    }

    async addImage(imageData) {
        try {
            // Add image (medium size, centered)
            const imgWidth = 60;
            const imgHeight = 45;
            const imgX = (this.pageWidth - imgWidth) / 2;

            this.doc.addImage(imageData, 'JPEG', imgX, this.currentY, imgWidth, imgHeight);
            this.currentY += imgHeight + 8;
        } catch (error) {
            console.error('Error adding image to PDF:', error);
        }
    }

    addSection(title, content) {
        // Section title
        this.doc.setFontSize(12);
        this.doc.setTextColor(59, 130, 246);
        this.doc.text(title, this.margin, this.currentY);
        this.currentY += 6;

        // Section content (limit to 3 lines)
        this.doc.setFontSize(9);
        this.doc.setTextColor(60, 60, 60);
        const lines = this.doc.splitTextToSize(content, this.pageWidth - 2 * this.margin);
        const displayLines = lines.slice(0, 3);
        this.doc.text(displayLines, this.margin, this.currentY);
        this.currentY += displayLines.length * 4 + 4;
    }

    addListSectionInColumn(title, items, x, width) {
        const startY = this.currentY;
        
        // Section title
        this.doc.setFontSize(11);
        this.doc.setTextColor(16, 185, 129);
        this.doc.text(title, x, startY);
        let y = startY + 6;

        // List items
        this.doc.setFontSize(8);
        this.doc.setTextColor(60, 60, 60);

        items.forEach(item => {
            // Bullet point
            this.doc.circle(x + 2, y - 1, 0.7, 'F');
            
            // Item text (truncate if too long)
            const lines = this.doc.splitTextToSize(item, width - 6);
            const displayText = lines[0] + (lines.length > 1 ? '...' : '');
            this.doc.text(displayText, x + 5, y);
            y += 4;
        });
    }

    addListSection(title, items) {
        this.checkPageBreak(30);

        // Section title
        this.doc.setFontSize(14);
        this.doc.setTextColor(16, 185, 129); // Primary green
        this.doc.text(title, this.margin, this.currentY);
        this.currentY += 8;

        // List items
        this.doc.setFontSize(10);
        this.doc.setTextColor(60, 60, 60);

        items.forEach(item => {
            this.checkPageBreak(10);
            
            // Bullet point
            this.doc.circle(this.margin + 2, this.currentY - 1.5, 1, 'F');
            
            // Item text
            const lines = this.doc.splitTextToSize(item, this.pageWidth - 2 * this.margin - 10);
            this.doc.text(lines, this.margin + 6, this.currentY);
            this.currentY += lines.length * 5 + 2;
        });

        this.currentY += 5;
    }

    addYouTubeSection(videos) {
        // Section title
        this.doc.setFontSize(11);
        this.doc.setTextColor(220, 38, 38);
        this.doc.text('Recommended Video Resources', this.margin, this.currentY);
        this.currentY += 6;

        // Videos (limit to 2)
        this.doc.setFontSize(8);
        this.doc.setTextColor(60, 60, 60);

        videos.slice(0, 2).forEach((video, index) => {
            const title = video.title.length > 60 ? video.title.substring(0, 60) + '...' : video.title;
            
            this.doc.setFont(undefined, 'bold');
            this.doc.text(`${index + 1}. ${title}`, this.margin + 2, this.currentY);
            this.currentY += 4;
            
            this.doc.setFont(undefined, 'normal');
            this.doc.setTextColor(59, 130, 246);
            this.doc.textWithLink(video.url, this.margin + 5, this.currentY, { url: video.url });
            this.currentY += 5;
            
            this.doc.setTextColor(60, 60, 60);
        });

        this.currentY += 3;
    }

    addFooter() {
        const footerY = this.pageHeight - 12;
        
        this.doc.setFontSize(8);
        this.doc.setTextColor(150, 150, 150);
        this.doc.text('Generated by Leaf Disease Detection System', this.pageWidth / 2, footerY, { align: 'center' });
        this.doc.text(`Report Date: ${new Date().toLocaleDateString()}`, this.pageWidth / 2, footerY + 4, { align: 'center' });
    }

    addText(text, fontSize = 12, bold = false) {
        this.doc.setFontSize(fontSize);
        this.doc.setFont(undefined, bold ? 'bold' : 'normal');
        this.doc.setTextColor(60, 60, 60);
        this.doc.text(text, this.margin, this.currentY);
        this.currentY += fontSize / 2 + 2;
    }

    checkPageBreak(requiredSpace) {
        if (this.currentY + requiredSpace > this.pageHeight - 30) {
            this.doc.addPage();
            this.currentY = this.margin;
        }
    }

    generateFilename(data) {
        const date = new Date().toISOString().split('T')[0];
        const status = data.disease_detected ? 
            data.disease_name.replace(/[^a-z0-9]/gi, '_') : 
            'Healthy';
        return `Leaf_Analysis_${status}_${date}.pdf`;
    }

    // Compact methods for single-page layout
    async addCompactImage(imageData, x) {
        try {
            const imgWidth = 50;
            const imgHeight = 40;
            this.doc.addImage(imageData, 'JPEG', x, this.currentY, imgWidth, imgHeight);
            this.currentY += imgHeight + 5;
        } catch (error) {
            console.error('Error adding image:', error);
        }
    }

    addCompactDiseaseInfo(data, x) {
        const isHealthy = !data.disease_detected;
        const isInvalid = data.disease_type === 'invalid_image';

        // Status box (smaller)
        this.doc.setFillColor(isInvalid ? 255 : isHealthy ? 220 : 254, isInvalid ? 251 : isHealthy ? 252 : 226, isInvalid ? 230 : isHealthy ? 231 : 230);
        this.doc.roundedRect(x, this.currentY, 80, 25, 2, 2, 'F');

        // Status text
        this.doc.setFontSize(12);
        this.doc.setTextColor(isInvalid ? 180 : isHealthy ? 22 : 153, isInvalid ? 140 : isHealthy ? 163 : 27, isInvalid ? 0 : isHealthy ? 74 : 27);
        
        const statusText = isInvalid ? 'Invalid' : isHealthy ? 'Healthy' : data.disease_name;
        const lines = this.doc.splitTextToSize(statusText, 75);
        this.doc.text(lines, x + 40, this.currentY + 8, { align: 'center' });

        if (!isInvalid) {
            this.doc.setFontSize(8);
            this.doc.setTextColor(100, 100, 100);
            
            if (!isHealthy) {
                this.doc.text(`${data.disease_type} | ${data.severity}`, x + 40, this.currentY + 16, { align: 'center' });
            }
            
            this.doc.text(`${data.confidence}% confidence`, x + 40, this.currentY + 21, { align: 'center' });
        }

        this.currentY += 30;
    }

    addCompactSection(title, content, x, width) {
        this.doc.setFontSize(10);
        this.doc.setTextColor(59, 130, 246);
        this.doc.text(title, x, this.currentY);
        this.currentY += 5;

        this.doc.setFontSize(8);
        this.doc.setTextColor(60, 60, 60);
        const lines = this.doc.splitTextToSize(content, width);
        const maxLines = 6; // Limit lines
        const displayLines = lines.slice(0, maxLines);
        this.doc.text(displayLines, x, this.currentY);
        this.currentY += displayLines.length * 3.5 + 3;
    }

    addCompactList(title, items, x, width) {
        this.doc.setFontSize(10);
        this.doc.setTextColor(16, 185, 129);
        this.doc.text(title, x, this.currentY);
        this.currentY += 5;

        this.doc.setFontSize(7);
        this.doc.setTextColor(60, 60, 60);

        const maxItems = 5; // Limit items
        items.slice(0, maxItems).forEach(item => {
            this.doc.circle(x + 1.5, this.currentY - 1, 0.5, 'F');
            const lines = this.doc.splitTextToSize(item, width - 5);
            this.doc.text(lines[0] + (lines.length > 1 ? '...' : ''), x + 4, this.currentY);
            this.currentY += 3.5;
        });

        this.currentY += 2;
    }

    addCompactYouTubeSection(videos) {
        this.doc.setFontSize(9);
        this.doc.setTextColor(220, 38, 38);
        this.doc.text('Video Resources', this.margin, this.currentY);
        this.currentY += 4;

        this.doc.setFontSize(7);
        this.doc.setTextColor(60, 60, 60);

        const maxVideos = 2; // Limit videos
        videos.slice(0, maxVideos).forEach((video, index) => {
            const title = video.title.length > 50 ? video.title.substring(0, 50) + '...' : video.title;
            this.doc.text(`${index + 1}. ${title}`, this.margin + 2, this.currentY);
            this.currentY += 3;
            
            this.doc.setTextColor(59, 130, 246);
            this.doc.textWithLink(video.url, this.margin + 5, this.currentY, { url: video.url });
            this.currentY += 4;
            
            this.doc.setTextColor(60, 60, 60);
        });
    }
}

// Global instance
const pdfExporter = new PDFExporter();

// Helper function for notifications
function showPDFNotification(message, type = 'info') {
    // Try to use existing showNotification if available
    if (typeof showNotification !== 'undefined') {
        showNotification(message, type);
        return;
    }
    
    // Fallback notification
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

// Export function for easy access
async function exportAnalysisToPDF(analysisData, imageElement = null) {
    try {
        let imageData = null;
        
        // Get image data if element provided
        if (imageElement) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = imageElement.naturalWidth || imageElement.width;
            canvas.height = imageElement.naturalHeight || imageElement.height;
            ctx.drawImage(imageElement, 0, 0);
            imageData = canvas.toDataURL('image/jpeg', 0.8);
        }
        
        await pdfExporter.generateAnalysisReport(analysisData, imageData);
        
        showPDFNotification('PDF report downloaded successfully!', 'success');
    } catch (error) {
        console.error('Error generating PDF:', error);
        showPDFNotification('Failed to generate PDF report', 'error');
    }
}
