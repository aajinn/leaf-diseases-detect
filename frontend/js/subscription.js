// Subscription management functionality

let currentSubscription = null;

// Load current subscription on page load
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Subscription page loaded, initializing...');
    
    // Initialize plans first
    try {
        console.log('📡 Initializing subscription plans...');
        const initResponse = await fetch(`${API_URL}/api/subscriptions/initialize-plans`);
        console.log('📡 Initialize plans response:', initResponse.status, initResponse.ok);
        
        if (initResponse.ok) {
            const initData = await initResponse.json();
            console.log('✅ Plans initialized:', initData);
        } else {
            console.warn('⚠️ Plans initialization failed, but continuing...');
        }
    } catch (error) {
        console.error('❌ Failed to initialize plans:', error);
    }
    
    console.log('📡 Loading current subscription...');
    await loadCurrentSubscription();
    
    console.log('🔄 Updating plan buttons...');
    updatePlanButtons();
    
    console.log('✅ Subscription page initialization complete');
});

// Load current subscription
async function loadCurrentSubscription() {
    try {
        console.log('📡 Loading current subscription from API...');
        const response = await authenticatedFetch(`${API_URL}/api/subscriptions/my-subscription`);
        console.log('📡 My subscription response:', response.status, response.ok);
        
        const data = await response.json();
        console.log('📡 My subscription data:', data);
        
        if (data && data.plan) {
            console.log('✅ Current subscription found:', data.plan.name);
            currentSubscription = data;
            displayCurrentSubscription(data);
        } else {
            console.log('📝 No active subscription found');
            currentSubscription = null;
        }
    } catch (error) {
        console.error('❌ Error loading subscription:', error);
    }
}

// Display current subscription
function displayCurrentSubscription(subscription) {
    const container = document.getElementById('currentSubscription');
    const content = document.getElementById('currentSubscriptionContent');
    
    if (!subscription || !subscription.plan) {
        container.classList.add('hidden');
        return;
    }
    
    container.classList.remove('hidden');
    
    const plan = subscription.plan;
    const usage = subscription.usage || { analyses_used: 0 };
    const usagePercent = plan.analyses_limit === -1 ? 0 : Math.min((usage.analyses_used / plan.analyses_limit) * 100, 100);
    
    const nextBilling = subscription.next_billing_date 
        ? new Date(subscription.next_billing_date).toLocaleDateString()
        : 'N/A';
    
    const status = subscription.status === 'active' ? 
        '<span class="text-green-600 font-semibold">Active</span>' :
        '<span class="text-red-600 font-semibold">Inactive</span>';
    
    content.innerHTML = `
        <div class="grid md:grid-cols-3 gap-6">
            <div>
                <div class="text-2xl font-bold text-gray-900">${plan.name}</div>
                <div class="text-gray-600">₹${plan.price}/${plan.billing_cycle}</div>
                <div class="text-sm text-gray-500 mt-1">Status: ${status}</div>
            </div>
            
            <div>
                <div class="text-sm text-gray-600 mb-2">Usage This Month</div>
                <div class="text-lg font-semibold">${usage.analyses_used}/${plan.analyses_limit === -1 ? '∞' : plan.analyses_limit}</div>
                ${plan.analyses_limit !== -1 ? `
                    <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div class="bg-primary h-2 rounded-full transition-all" style="width: ${usagePercent}%"></div>
                    </div>
                ` : '<div class="text-sm text-green-600 mt-2">Unlimited</div>'}
            </div>
            
            <div>
                <div class="text-sm text-gray-600">Next Billing</div>
                <div class="text-lg font-semibold">${nextBilling}</div>
                <div class="mt-3 space-x-2">
                    <button onclick="manageBilling()" class="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition text-sm">
                        <i class="fas fa-credit-card mr-1"></i>Billing
                    </button>
                    <button onclick="cancelSubscription()" class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm">
                        <i class="fas fa-times mr-1"></i>Cancel
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Update plan buttons based on current subscription
function updatePlanButtons() {
    const buttons = document.querySelectorAll('[onclick^="subscribeToPlan"]');
    
    buttons.forEach(button => {
        const planName = button.getAttribute('onclick').match(/subscribeToPlan\('(.+?)'\)/)[1];
        
        if (currentSubscription && currentSubscription.plan.name.toLowerCase() === planName) {
            button.textContent = 'Current Plan';
            button.className = 'w-full bg-gray-100 text-gray-600 py-3 rounded-lg font-semibold cursor-not-allowed';
            button.disabled = true;
            button.onclick = null;
        } else if (currentSubscription) {
            const currentPlanLevel = getPlanLevel(currentSubscription.plan.name);
            const targetPlanLevel = getPlanLevel(planName);
            
            if (targetPlanLevel > currentPlanLevel) {
                button.textContent = 'Upgrade';
                button.innerHTML = '<i class="fas fa-arrow-up mr-2"></i>Upgrade';
            } else if (targetPlanLevel < currentPlanLevel) {
                button.textContent = 'Downgrade';
                button.innerHTML = '<i class="fas fa-arrow-down mr-2"></i>Downgrade';
            }
        }
    });
}

// Get plan level for comparison
function getPlanLevel(planName) {
    const levels = {
        'free': 0,
        'basic': 1,
        'premium': 2,
        'enterprise': 3
    };
    return levels[planName.toLowerCase()] || 0;
}

// Subscribe to a plan with Razorpay
async function subscribeToPlan(planName) {
    try {
        console.log('🚀 Starting subscription process for plan:', planName);
        
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('❌ No authentication token found');
            showNotification('Please login to subscribe', 'error');
            window.location.href = '/login?redirect=/subscription';
            return;
        }
        console.log('✅ Token found, proceeding with subscription');

        const confirmed = await showSubscriptionConfirm(planName);
        if (!confirmed) {
            console.log('❌ User cancelled subscription');
            return;
        }
        console.log('✅ User confirmed subscription');

        showNotification('Creating payment order...', 'info');
        console.log('📡 Making API call to create payment order...');

        // Create Razorpay order
        const orderResponse = await fetch(`${API_URL}/api/subscriptions/create-order`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                plan_name: planName,
                billing_cycle: 'monthly'
            })
        });

        console.log('📡 Order API Response Status:', orderResponse.status);
        console.log('📡 Order API Response OK:', orderResponse.ok);
        
        const orderData = await orderResponse.json();
        console.log('📡 Order API Response Data:', orderData);
        
        if (!orderResponse.ok) {
            console.error('❌ Order creation failed:', orderData);
            throw new Error(orderData.detail || 'Failed to create payment order');
        }
        
        console.log('✅ Payment order created successfully:', orderData);
        console.log('💳 Initializing Razorpay with options:', {
            key: orderData.key_id,
            amount: orderData.amount,
            currency: orderData.currency,
            order_id: orderData.order_id
        });

        // Check if Razorpay is loaded
        if (typeof Razorpay === 'undefined') {
            console.error('❌ Razorpay SDK not loaded');
            throw new Error('Payment gateway not available. Please refresh the page.');
        }
        console.log('✅ Razorpay SDK loaded successfully');

        // Initialize Razorpay payment
        const options = {
            key: orderData.key_id,
            amount: orderData.amount,
            currency: orderData.currency,
            name: 'Leaf Disease Detection',
            description: `${orderData.plan_name} Plan Subscription`,
            order_id: orderData.order_id,
            handler: async function(response) {
                console.log('💳 Payment successful, response:', response);
                await verifyPayment(response, planName, 'monthly');
            },
            prefill: {
                name: 'User',
                email: 'user@example.com'
            },
            theme: {
                color: '#10b981'
            },
            modal: {
                ondismiss: function() {
                    console.log('❌ Payment modal dismissed by user');
                    showNotification('Payment cancelled', 'warning');
                }
            }
        };

        console.log('🚀 Opening Razorpay checkout...');
        const rzp = new Razorpay(options);
        rzp.open();

    } catch (error) {
        console.error('❌ Subscription error:', error);
        console.error('❌ Error stack:', error.stack);
        showNotification('Error: ' + error.message, 'error');
    }
}

// Verify payment and activate subscription
async function verifyPayment(paymentResponse, planName, billingCycle) {
    try {
        console.log('🔍 Starting payment verification...');
        console.log('💳 Payment response:', paymentResponse);
        
        showNotification('Verifying payment...', 'info');

        const token = localStorage.getItem('token');
        if (!token) {
            console.error('❌ No token for payment verification');
            throw new Error('Authentication required');
        }
        
        // Test token validity first
        try {
            const testResponse = await fetch(`${API_URL}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!testResponse.ok) {
                console.error('❌ Token expired, redirecting to login');
                localStorage.removeItem('token');
                window.location.href = '/login?redirect=/subscription';
                return;
            }
            console.log('✅ Token is valid');
        } catch (e) {
            console.error('❌ Token validation failed:', e);
            throw new Error('Authentication failed');
        }
        
        console.log('📡 Making payment verification API call...');
        
        // First try debug endpoint
        const debugResponse = await fetch(`${API_URL}/api/subscriptions/verify-payment-debug`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                payment_id: paymentResponse.razorpay_payment_id,
                order_id: paymentResponse.razorpay_order_id,
                signature: paymentResponse.razorpay_signature,
                plan_name: planName
            })
        });
        
        const debugData = await debugResponse.json();
        console.log('🔧 Debug verification result:', debugData);
        
        const response = await fetch(`${API_URL}/api/subscriptions/verify-payment`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                payment_id: paymentResponse.razorpay_payment_id,
                order_id: paymentResponse.razorpay_order_id,
                signature: paymentResponse.razorpay_signature,
                plan_name: planName,
                billing_cycle: billingCycle
            })
        });

        console.log('📡 Verification API Response Status:', response.status);
        console.log('📡 Verification API Response OK:', response.ok);
        
        const data = await response.json();
        console.log('📡 Verification API Response Data:', data);

        if (response.ok && data.success) {
            console.log('✅ Payment verification successful!');
            showNotification('Payment successful! Subscription activated.', 'success');
            await loadCurrentSubscription();
            updatePlanButtons();
        } else {
            console.error('❌ Payment verification failed:', data);
            // Show more specific error message
            const errorMsg = data.detail || data.message || 'Payment verification failed';
            throw new Error(errorMsg);
        }
    } catch (error) {
        console.error('❌ Payment verification error:', error);
        console.error('❌ Error stack:', error.stack);
        showNotification('Payment verification failed: ' + error.message, 'error');
    }
}

// Show subscription confirmation modal
async function showSubscriptionConfirm(planName) {
    return new Promise((resolve) => {
        const planDetails = getPlanDetails(planName);
        
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-xl shadow-2xl max-w-md w-full">
                <div class="p-6">
                    <div class="text-center mb-6">
                        <div class="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                            <i class="fas fa-crown text-blue-600 text-2xl"></i>
                        </div>
                        <h3 class="text-xl font-bold text-gray-800 mb-2">
                            Subscribe to ${planDetails.name}
                        </h3>
                        <p class="text-gray-600">
                            ₹${planDetails.price}/month • ${planDetails.analyses} analyses
                        </p>
                    </div>
                    
                    <div class="bg-gray-50 rounded-lg p-4 mb-6">
                        <h4 class="font-semibold text-gray-800 mb-2">What you'll get:</h4>
                        <ul class="space-y-1 text-sm text-gray-600">
                            ${planDetails.features.map(feature => `<li class="flex items-center"><i class="fas fa-check text-green-500 mr-2"></i>${feature}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div class="flex space-x-3">
                        <button onclick="handleSubscriptionChoice(true)" class="flex-1 bg-primary text-white py-3 rounded-lg hover:bg-secondary transition font-semibold">
                            <i class="fas fa-credit-card mr-2"></i>Subscribe Now
                        </button>
                        <button onclick="handleSubscriptionChoice(false)" class="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        window.handleSubscriptionChoice = (confirmed) => {
            modal.remove();
            delete window.handleSubscriptionChoice;
            resolve(confirmed);
        };
    });
}

// Get plan details
function getPlanDetails(planName) {
    const plans = {
        basic: {
            name: 'Basic Plan',
            price: 299,
            analyses: '50',
            features: [
                '50 analyses per month',
                'Advanced AI detection',
                'Detailed treatment plans',
                'Email support'
            ]
        },
        premium: {
            name: 'Premium Plan',
            price: 799,
            analyses: '200',
            features: [
                '200 analyses per month',
                'Premium AI models',
                'Prescription generation',
                'Priority support',
                'PDF export'
            ]
        },
        enterprise: {
            name: 'Enterprise Plan',
            price: 2499,
            analyses: 'Unlimited',
            features: [
                'Unlimited analyses',
                'Enterprise AI models',
                'API access',
                '24/7 phone support',
                'Custom integrations'
            ]
        }
    };
    
    return plans[planName] || plans.basic;
}

// Manage billing
function manageBilling() {
    showNotification('Billing management coming soon!', 'info');
}

// Cancel subscription
async function cancelSubscription() {
    try {
        const confirmed = await showCancelConfirm();
        if (!confirmed) return;

        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/api/subscriptions/cancel`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('Subscription cancelled successfully', 'success');
            await loadCurrentSubscription();
            updatePlanButtons();
        } else {
            throw new Error(data.detail || 'Cancellation failed');
        }
    } catch (error) {
        console.error('Cancellation error:', error);
        showNotification('Error: ' + error.message, 'error');
    }
}

// Show cancellation confirmation
async function showCancelConfirm() {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-xl shadow-2xl max-w-md w-full">
                <div class="p-6">
                    <div class="text-center mb-6">
                        <div class="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                            <i class="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
                        </div>
                        <h3 class="text-xl font-bold text-gray-800 mb-2">
                            Cancel Subscription
                        </h3>
                        <p class="text-gray-600">
                            Are you sure you want to cancel your subscription? You'll lose access to premium features at the end of your billing cycle.
                        </p>
                    </div>
                    
                    <div class="flex space-x-3">
                        <button onclick="handleCancelChoice(true)" class="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition font-semibold">
                            Yes, Cancel
                        </button>
                        <button onclick="handleCancelChoice(false)" class="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 transition font-semibold">
                            Keep Subscription
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        window.handleCancelChoice = (confirmed) => {
            modal.remove();
            delete window.handleCancelChoice;
            resolve(confirmed);
        };
    });
}

// Simple notification function
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    const bgColor = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
    }[type] || 'bg-blue-500';
    
    notification.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 transform translate-x-full transition-transform`;
    notification.innerHTML = `
        <div class="flex items-center">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Slide in
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
}