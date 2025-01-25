// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDAvwoIEXPpCnPpxaKgaleiUHENNDGKG4Q",
    authDomain: "sannes-palace.firebaseapp.com",
    projectId: "sannes-palace",
    storageBucket: "sannes-palace.firebasestorage.app",
    messagingSenderId: "932501443001",
    appId: "1:932501443001:web:18151ec8db5c9b11332668",
    measurementId: "G-4VX18JYY5V"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();
let unsubscribe = null;
const ORDERS_PER_PAGE = 10;
let lastVisibleOrder = null;

// Enable offline persistence for Firestore
firebase.firestore().enablePersistence()
    .catch((err) => {
        if (err.code == 'failed-precondition') {
            console.log('Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (err.code == 'unimplemented') {
            console.log('The current browser does not support persistence.');
        }
    });

// Hide orders content initially
document.getElementById('ordersContent').style.display = 'none';
document.getElementById('emptyState').style.display = 'none';

// Check authentication state
auth.onAuthStateChanged(async (user) => {
    if (user) {
        console.log("User authenticated:", user.uid);
        loadOrders(true);
        document.getElementById('ordersContent').style.display = 'block';
    } else {
        console.log("No user authenticated, redirecting...");
        window.location.href = 'index.html';
    }
});

function showLoading(show) {
    document.getElementById('loadingState').style.display = show ? 'flex' : 'none';
    document.getElementById('ordersContent').style.opacity = show ? '0.5' : '1';
}

async function loadOrders(isInitialLoad = true) {
    const user = auth.currentUser;
    if (!user) return;

    if (isInitialLoad) {
        showLoading(true);
        
        // Check cache first
        const cachedData = localStorage.getItem('ordersData');
        if (cachedData) {
            const { userId, orders, timestamp } = JSON.parse(cachedData);
            const cacheAge = Date.now() - timestamp;
            
            // Use cache if it's less than 5 minutes old
            if (userId === user.uid && cacheAge < 300000) {
                displayOrders(orders, true);
                showLoading(false);
                // Still load fresh data in background
                loadFreshOrders();
                return;
            }
        }
    }

    try {
        await loadFreshOrders(isInitialLoad);
    } finally {
        showLoading(false);
    }
}

async function loadFreshOrders(isInitialLoad = true) {
    const user = auth.currentUser;
    if (!user) {
        console.log("No user found");
        return;
    }

    console.log("Loading orders for user:", user.uid);

    try {
        let query = db.collection('orders')
            .where('userId', '==', user.uid)
            .where('status', 'in', ['delivered', 'collected'])
            .orderBy('timestamp', 'desc')
            .limit(ORDERS_PER_PAGE);

        unsubscribe = query.onSnapshot((snapshot) => {
            console.log("Snapshot received:", snapshot.size, "documents");
            
            if (snapshot.empty) {
                console.log("No orders found");
                if (isInitialLoad) {
                    document.getElementById('emptyState').style.display = 'block';
                    document.getElementById('ordersContent').innerHTML = '';
                }
                return;
            }

            const orders = [];
            snapshot.forEach((doc) => {
                orders.push({ id: doc.id, ...doc.data() });
            });
            
            console.log("Processed orders:", orders);

            displayOrders(orders, isInitialLoad);
        });

    } catch (error) {
        console.error("Error loading orders:", error);
        showNotification('Error loading orders: ' + error.message, 'error');
    }
}

function addLoadMoreButton() {
    const existingBtn = document.querySelector('.load-more-btn');
    if (existingBtn) {
        existingBtn.remove();
    }
    
    const loadMoreBtn = document.createElement('button');
    loadMoreBtn.className = 'load-more-btn';
    loadMoreBtn.textContent = 'Load More Orders';
    loadMoreBtn.onclick = () => loadOrders(false);
    document.getElementById('ordersContent').appendChild(loadMoreBtn);
}

function displayOrders(orders, isInitialLoad) {
    console.log("Displaying orders:", orders.length);
    
    const ordersContent = document.getElementById('ordersContent');
    const emptyState = document.getElementById('emptyState');

    if (!orders || orders.length === 0) {
        console.log("No orders to display");
        if (isInitialLoad) {
            ordersContent.innerHTML = '';
            emptyState.style.display = 'block';
        }
        return;
    }

    emptyState.style.display = 'none';
    ordersContent.style.display = 'block'; // Make sure content is visible
    
    const fragment = document.createDocumentFragment();
    
    orders.forEach((order) => {
        const orderElement = createOrderElement(order.id, order);
        fragment.appendChild(orderElement);
    });

    if (isInitialLoad) {
        ordersContent.innerHTML = '';
    }
    ordersContent.appendChild(fragment);
    console.log("Orders displayed successfully");
}

function createOrderElement(orderId, order) {
    try {
        console.log("Creating order element for:", order); // Debug log
        
        const orderCard = document.createElement('div');
        orderCard.className = 'order-card';
        
        // Safely handle timestamp - check if it's a Firebase timestamp or string
        const orderDate = order.timestamp && order.timestamp.toDate ? 
            order.timestamp.toDate() : 
            new Date(order.timestamp);

        const formattedDate = orderDate.toLocaleDateString('en-ZA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        // Safely handle values with defaults
        const totalItems = order.items ? 
            order.items.reduce((sum, item) => sum + (item.quantity || 0), 0) : 
            0;

        // Add null checks for all object properties
        const address = order.address || {};
        const deliveryFee = order.deliveryFee || 0;
        const subtotal = order.subtotal || 0;
        const total = order.total || 0;
        
        orderCard.innerHTML = `
            <div class="order-header">
                <span class="order-number">Order #${orderId.slice(-6)}</span>

                <span class="order-status ${order.status || ''}">${order.status || ''}</span>
            </div>
            
            ${order.orderType === 'delivery' ? `
                <div class="delivery-info">
                    <p><i class="fas fa-map-marker-alt"></i> ${address.street || ''}, ${address.suburb || ''}</p>
                    <p><i class="fas fa-phone"></i> ${order.phone || ''}</p>
                    ${order.instructions ? `<p><i class="fas fa-info-circle"></i> ${order.instructions}</p>` : ''}
                </div>
            ` : `
                <div class="collection-info">
                    <p><i class="fas fa-store"></i> Collected from store</p>
                    <p><i class="fas fa-phone"></i> ${order.phone || ''}</p>
                </div>
            `}

            <div class="order-items">
                <div class="items-header">
                    <span>Order Details (${totalItems} items)</span>
                </div>
                ${order.items ? order.items.map(item => `
                    <div class="order-item">
                        <div class="item-details">
                            <span class="item-quantity">${item.quantity || 0}x</span>
                            <span class="item-name">${item.name || ''}</span>
                        </div>
                        <span class="item-price">R${((item.price || 0) * (item.quantity || 0)).toFixed(2)}</span>
                    </div>
                    ${item.description ? `
                        <div class="item-description">${item.description}</div>
                    ` : ''}
                `).join('') : ''}
            </div>

            <div class="order-summary">
                <div class="summary-item">
                    <span>Subtotal</span>
                    <span>R${subtotal.toFixed(2)}</span>
                </div>
                ${order.orderType === 'delivery' ? `
                    <div class="summary-item">
                        <span>Delivery Fee</span>
                        <span>R${deliveryFee.toFixed(2)}</span>
                    </div>
                ` : ''}
                <div class="order-total">
                    <span>Total</span>
                    <span>R${total.toFixed(2)}</span>
                </div>
            </div>

            <div class="order-date">
                <i class="fas fa-clock"></i>
                <small>Ordered on ${formattedDate}</small>
            </div>
        `;

        return orderCard;
    } catch (error) {
        console.error("Error creating order element:", error, order);
        const errorCard = document.createElement('div');
        errorCard.className = 'order-card error';
        errorCard.textContent = 'Error displaying order';
        return errorCard;
    }
}

function showNotification(message, type = 'success') {
    const container = document.getElementById('notificationContainer') || 
        (() => {
            const cont = document.createElement('div');
            cont.id = 'notificationContainer';
            cont.className = 'notification-container';
            document.body.appendChild(cont);
            return cont;
        })();

    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}" 
           style="color: ${type === 'success' ? 'var(--success-color)' : 'var(--error-color)'}">
        </i>
        <span>${message}</span>
    `;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (container.contains(notification)) {
                container.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Clean up when leaving the page
window.addEventListener('unload', () => {
    if (unsubscribe) {
        unsubscribe();
    }
});
