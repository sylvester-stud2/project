// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyB9x85hJMW22we8XlN1Q_Ca92Q5dV76IME",
    authDomain: "kota-6e667.firebaseapp.com",
    projectId: "kota-6e667",
    storageBucket: "kota-6e667.appspot.com",
    messagingSenderId: "698838744468",
    appId: "1:698838744468:web:e5e718e9539dbd4431a381"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Cache DOM elements
const elements = {
    loading: document.getElementById('loading'),
    errorMessage: document.getElementById('error-message'),
    orderTracking: document.getElementById('order-tracking'),
    orderId: document.getElementById('order-id'),
    orderTime: document.getElementById('order-time'),
    statusText: document.getElementById('status-text'),
    statusIcon: document.getElementById('status-icon'),
    statusDescription: document.getElementById('status-description'),
    driverInfo: document.getElementById('driver-info'),
    driverName: document.getElementById('driver-name'),
    vehicleInfo: document.getElementById('vehicle-info'),
    orderDetails: document.getElementById('order-details')
};

// Subscription cleanup
let orderUnsubscribe = null;
let driverUnsubscribe = null;

// Initialize tracking
document.addEventListener('DOMContentLoaded', () => {
    // Pre-render initial state
    setInitialState();

    // Check for shared link access
    const params = new URLSearchParams(window.location.search);
    const sharedOrderId = params.get('orderId');

    if (sharedOrderId) {
        handleSharedOrder(sharedOrderId);
    } else {
        // Normal auth flow
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                await initializeTracking(user.uid);
            } else {
                showLoginRequired();
            }
        });
    }

    // Initialize map
    window.trackMap.init();
});

// Set initial state
function setInitialState() {
    elements.orderId.textContent = 'Loading...';
    elements.orderTime.textContent = '';
    elements.statusText.textContent = 'Checking Order Status...';
    elements.statusIcon.innerHTML = '⏳';
    elements.statusDescription.textContent = 'Loading your order details...';
}

// Initialize tracking for user
async function initializeTracking(userId) {
    try {
        showLoading(true);
        const orderData = await loadActiveOrder(userId);
        
        if (!orderData) {
            showNoOrdersMessage();
            return;
        }

        setupOrderTracking(orderData.orderDoc, orderData.orderId);
        updateCartCount();
    } catch (error) {
        console.error('Error initializing tracking:', error);
        showError('Failed to initialize tracking');
    } finally {
        showLoading(false);
    }
}

// Load active order
async function loadActiveOrder(userId) {
    try {
        const ordersQuery = await db.collection('orders')
            .where('userId', '==', userId)
            .where('status', 'in', ['confirmed', 'delivering'])
            .orderBy('timestamp', 'desc')
            .limit(1)
            .get();

        if (!ordersQuery.empty) {
            const orderDoc = ordersQuery.docs[0];
            return {
                orderDoc,
                orderId: orderDoc.id
            };
        }
        return null;
    } catch (error) {
        console.error('Error loading order:', error);
        throw error;
    }
}

// Setup order tracking
function setupOrderTracking(orderDoc, orderId) {
    if (orderUnsubscribe) {
        orderUnsubscribe();
    }

    elements.orderTracking.style.display = 'block';
    sessionStorage.setItem('currentOrderId', orderId);

    orderUnsubscribe = db.collection('orders')
        .doc(orderId)
        .onSnapshot(async (doc) => {
            if (!doc.exists) {
                showError('Order not found');
                return;
            }

            const orderData = doc.data();
            updateOrderUI(orderData, doc.id);
            updateOrderStatus(orderData.status);
            await handleDriverTracking(orderData);
            window.trackMap.updateDelivery(orderData);

            if (orderData.status === 'delivered') {
                cleanup();
            }
        }, error => {
            console.error('Order subscription error:', error);
            showError('Error tracking order');
        });
}

// Handle driver tracking
async function handleDriverTracking(orderData) {
    if (orderData.status === 'delivering' && orderData.driverId) {
        if (!driverUnsubscribe) {
            driverUnsubscribe = db.collection('drivers')
                .doc(orderData.driverId)
                .onSnapshot(driverDoc => {
                    if (driverDoc.exists) {
                        const driverData = driverDoc.data();
                        if (driverData.currentLocation) {
                            window.trackMap.updateDriver([
                                driverData.currentLocation.longitude,
                                driverData.currentLocation.latitude
                            ]);
                        }
                    }
                });
        }

        elements.driverInfo.classList.add('active');
        elements.driverName.textContent = orderData.driverName || 'Driver';
        elements.vehicleInfo.textContent = `Vehicle: ${orderData.driverVehicle || 'Assigned'}`;
    } else {
        if (driverUnsubscribe) {
            driverUnsubscribe();
            driverUnsubscribe = null;
        }
        elements.driverInfo.classList.remove('active');
    }
}

// Update order UI
function updateOrderUI(orderData, orderId) {
    elements.orderId.textContent = orderId;
    elements.orderTime.textContent = new Date(orderData.timestamp).toLocaleString();
    elements.orderDetails.innerHTML = generateOrderDetailsHtml(orderData);
}

// Generate order details HTML with sanitization
function generateOrderDetailsHtml(orderData) {
    // Helper function to sanitize text
    const sanitize = (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };

    const items = orderData.items.map(item => `
        <div class="item">
            <div class="item-name">${sanitize(item.name)} x ${item.quantity}</div>
            <div class="item-price">R${(item.price * item.quantity).toFixed(2)}</div>
            ${item.description ? `<div class="item-description">${sanitize(item.description)}</div>` : ''}
        </div>
    `).join('');

    return `
        <div class="order-items">
            <div class="items-header">
                <h3>Order Items</h3>
            </div>
            <div class="items-list">
                ${items}
                <div class="order-summary">
                    <div class="summary-item">
                        <span>Subtotal</span>
                        <span>R${orderData.subtotal.toFixed(2)}</span>
                    </div>
                    <div class="summary-item">
                        <span>Delivery Fee</span>
                        <span>R${orderData.deliveryFee.toFixed(2)}</span>
                    </div>
                    <div class="order-total">
                        <span>Total</span>
                        <span>R${orderData.total.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Update order status
function updateOrderStatus(status) {
    const statusConfig = {
        confirmed: {
            text: 'Preparing Order',
            icon: '👨‍🍳',
            description: 'Your order is being prepared at our kitchen',
            class: 'status-confirmed'
        },
        delivering: {
            text: 'On The Way',
            icon: '🚗',
            description: 'Your driver is on the way with your order',
            class: 'status-delivering'
        },
        delivered: {
            text: 'Delivered',
            icon: '✅',
            description: 'Your order has been delivered successfully',
            class: 'status-delivered'
        },
        default: {
            text: 'Processing',
            icon: '⏳',
            description: 'Your order is being processed',
            class: ''
        }
    };

    const config = statusConfig[status] || statusConfig.default;
    elements.statusText.textContent = config.text;
    elements.statusIcon.className = `status-icon ${config.class}`;
    elements.statusIcon.innerHTML = config.icon;
    elements.statusDescription.textContent = config.description;
}

// Handle shared order links
async function handleSharedOrder(orderId) {
    try {
        showLoading(true);
        const orderDoc = await db.collection('orders').doc(orderId).get();
        
        if (orderDoc.exists) {
            setupOrderTracking(orderDoc, orderId);
        } else {
            showError('Order not found');
        }
    } catch (error) {
        console.error('Error loading shared order:', error);
        showError('Error loading order details');
    } finally {
        showLoading(false);
    }
}

// UI Helper Functions
function showLoading(show) {
    elements.loading.style.display = show ? 'block' : 'none';
    elements.orderTracking.style.display = show ? 'none' : 'block';
}

function showError(message) {
    elements.errorMessage.style.display = 'block';
    elements.errorMessage.innerHTML = `
        <div style="text-align: center;">
            <h3 style="color: #721c24; margin-bottom: 10px;">Error</h3>
            <p>${message}</p>
            <p style="margin-top: 10px;">
                <a href="menu.html" style="color: #721c24; text-decoration: underline;">
                    Return to Menu
                </a>
            </p>
        </div>
    `;
    elements.orderTracking.style.display = 'none';
}

function showNoOrdersMessage() {
    elements.errorMessage.style.display = 'block';
    elements.errorMessage.innerHTML = `
        <div style="text-align: center;">
            <h3 style="color: #721c24; margin-bottom: 10px;">No Active Orders</h3>
            <p>You don't have any orders to track at the moment.</p>
            <p style="margin-top: 10px;">
                <a href="menu.html" style="color: #721c24; text-decoration: underline;">
                    Place an Order
                </a>
            </p>
        </div>
    `;
    elements.orderTracking.style.display = 'none';
}

function showLoginRequired() {
    elements.errorMessage.style.display = 'block';
    elements.errorMessage.innerHTML = `
        <div style="text-align: center;">
            <h3 style="color: #721c24; margin-bottom: 10px;">Login Required</h3>
            <p>Please log in to track your orders.</p>
            <p style="margin-top: 10px;">
                <a href="login.html" style="color: #721c24; text-decoration: underline;">
                    Login Now
                </a>
            </p>
        </div>
    `;
    elements.orderTracking.style.display = 'none';
}

// Cart count update
function updateCartCount() {
    const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    
    const cartCountElements = document.querySelectorAll('.cart-count');
    cartCountElements.forEach(element => {
        element.textContent = totalItems.toString();
    });
}

// Cleanup function
function cleanup() {
    if (orderUnsubscribe) {
        orderUnsubscribe();
        orderUnsubscribe = null;
    }

    if (driverUnsubscribe) {
        driverUnsubscribe();
        driverUnsubscribe = null;
    }

    window.trackMap.cleanup();
    sessionStorage.removeItem('currentOrderId');
}

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && auth.currentUser) {
        initializeTracking(auth.currentUser.uid);
    }
});

// Global error handling
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    showError('Something went wrong. Please refresh the page.');
});

// Cleanup on page unload
window.addEventListener('unload', cleanup);

// Performance optimization for map tiles
if (typeof mapboxgl !== 'undefined') {
    mapboxgl.prewarm();
}

// Initialize mobile navigation
document.addEventListener('DOMContentLoaded', () => {
    const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
    mobileNavItems.forEach(item => {
        item.addEventListener('click', function(e) {
            mobileNavItems.forEach(navItem => navItem.classList.remove('active'));
            this.classList.add('active');
        });
    });
});