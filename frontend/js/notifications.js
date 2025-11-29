// Custom Notification System
class NotificationManager {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        // Create notification container
        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.className = 'fixed top-4 right-4 z-50 space-y-2';
        this.container.style.maxWidth = '400px';
        document.body.appendChild(this.container);
    }

    show(message, type = 'info', duration = 4000) {
        const notification = this.createNotification(message, type);
        this.container.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.classList.remove('translate-x-full', 'opacity-0');
        }, 10);

        // Auto remove
        if (duration > 0) {
            setTimeout(() => {
                this.remove(notification);
            }, duration);
        }

        return notification;
    }

    createNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `transform translate-x-full opacity-0 transition-all duration-300 ease-out 
            flex items-start p-4 rounded-lg shadow-lg ${this.getTypeClasses(type)}`;

        const icon = this.getIcon(type);
        
        notification.innerHTML = `
            <div class="flex-shrink-0">
                <i class="fas ${icon} text-xl"></i>
            </div>
            <div class="ml-3 flex-1">
                <p class="text-sm font-medium">${message}</p>
            </div>
            <button onclick="notificationManager.remove(this.parentElement)" 
                class="ml-4 flex-shrink-0 inline-flex text-current hover:opacity-75 focus:outline-none">
                <i class="fas fa-times"></i>
            </button>
        `;

        return notification;
    }

    getTypeClasses(type) {
        const classes = {
            success: 'bg-green-500 text-white',
            error: 'bg-red-500 text-white',
            warning: 'bg-yellow-500 text-white',
            info: 'bg-blue-500 text-white'
        };
        return classes[type] || classes.info;
    }

    getIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }

    remove(notification) {
        notification.classList.add('translate-x-full', 'opacity-0');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }

    // Confirmation dialog
    confirm(message, title = 'Confirm Action') {
        return new Promise((resolve) => {
            const modal = this.createConfirmModal(message, title, resolve);
            document.body.appendChild(modal);
            
            // Animate in
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                modal.querySelector('.modal-content').classList.remove('scale-95');
            }, 10);
        });
    }

    createConfirmModal(message, title, resolve) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 opacity-0 transition-opacity duration-200';
        
        modal.innerHTML = `
            <div class="modal-content bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 transform scale-95 transition-transform duration-200">
                <div class="flex items-center mb-4">
                    <div class="flex-shrink-0 w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                        <i class="fas fa-exclamation-triangle text-yellow-600 text-xl"></i>
                    </div>
                    <h3 class="ml-4 text-xl font-bold text-gray-900">${title}</h3>
                </div>
                <p class="text-gray-700 mb-6">${message}</p>
                <div class="flex space-x-3 justify-end">
                    <button class="cancel-btn px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-semibold">
                        Cancel
                    </button>
                    <button class="confirm-btn px-6 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition font-semibold">
                        Confirm
                    </button>
                </div>
            </div>
        `;

        // Event listeners
        modal.querySelector('.cancel-btn').addEventListener('click', () => {
            this.closeModal(modal);
            resolve(false);
        });

        modal.querySelector('.confirm-btn').addEventListener('click', () => {
            this.closeModal(modal);
            resolve(true);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modal);
                resolve(false);
            }
        });

        return modal;
    }

    closeModal(modal) {
        modal.classList.add('opacity-0');
        modal.querySelector('.modal-content').classList.add('scale-95');
        setTimeout(() => {
            modal.remove();
        }, 200);
    }

    // Alert dialog (replaces window.alert)
    alert(message, title = 'Notice', type = 'info') {
        return new Promise((resolve) => {
            const modal = this.createAlertModal(message, title, type, resolve);
            document.body.appendChild(modal);
            
            // Animate in
            setTimeout(() => {
                modal.classList.remove('opacity-0');
                modal.querySelector('.modal-content').classList.remove('scale-95');
            }, 10);
        });
    }

    createAlertModal(message, title, type, resolve) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 opacity-0 transition-opacity duration-200';
        
        const iconConfig = {
            success: { icon: 'fa-check-circle', color: 'green' },
            error: { icon: 'fa-exclamation-circle', color: 'red' },
            warning: { icon: 'fa-exclamation-triangle', color: 'yellow' },
            info: { icon: 'fa-info-circle', color: 'blue' }
        };
        
        const config = iconConfig[type] || iconConfig.info;
        
        modal.innerHTML = `
            <div class="modal-content bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 transform scale-95 transition-transform duration-200">
                <div class="flex items-center mb-4">
                    <div class="flex-shrink-0 w-12 h-12 rounded-full bg-${config.color}-100 flex items-center justify-center">
                        <i class="fas ${config.icon} text-${config.color}-600 text-xl"></i>
                    </div>
                    <h3 class="ml-4 text-xl font-bold text-gray-900">${title}</h3>
                </div>
                <p class="text-gray-700 mb-6">${message}</p>
                <div class="flex justify-end">
                    <button class="ok-btn px-6 py-2 bg-primary text-white rounded-lg hover:bg-secondary transition font-semibold">
                        OK
                    </button>
                </div>
            </div>
        `;

        // Event listeners
        modal.querySelector('.ok-btn').addEventListener('click', () => {
            this.closeModal(modal);
            resolve(true);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modal);
                resolve(true);
            }
        });

        return modal;
    }
}

// Create global instance
const notificationManager = new NotificationManager();

// Global helper functions
function showNotification(message, type = 'info', duration = 4000) {
    return notificationManager.show(message, type, duration);
}

function showAlert(message, title = 'Notice', type = 'info') {
    return notificationManager.alert(message, title, type);
}

function showConfirm(message, title = 'Confirm Action') {
    return notificationManager.confirm(message, title);
}

// Override window.alert (optional - use with caution)
// window.alert = (message) => notificationManager.alert(message);
// window.confirm = (message) => notificationManager.confirm(message);
