// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyB9x85hJMW22we8XlN1Q_Ca92Q5dV76IME",
    authDomain: "kota-6e667.firebaseapp.com",
    projectId: "kota-6e667",
    storageBucket: "kota-6e667.firebasestorage.app",
    messagingSenderId: "698838744468",
    appId: "1:698838744468:web:e5e718e9539dbd4431a381"
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
    if (!user) return;

    if (unsubscribe) {
        unsubscribe();
    }

    try {
        let query = db.collection('orders')
            .where('userId', '==', user.uid)
            .where('status', '==', 'delivered')
            .orderBy('timestamp', 'desc')
            .limit(ORDERS_PER_PAGE);

        if (!isInitialLoad && lastVisibleOrder) {
            query = query.startAfter(lastVisibleOrder);
        }

        unsubscribe = query.onSnapshot((snapshot) => {
            if (snapshot.empty && isInitialLoad) {
                document.getElementById('emptyState').style.display = 'block';
                document.getElementById('ordersContent').innerHTML = '';
                return;
            }

            const orders = [];
            snapshot.forEach((doc) => {
                orders.push({ id: doc.id, ...doc.data() });
            });

            if (orders.length > 0) {
                lastVisibleOrder = snapshot.docs[snapshot.docs.length - 1];
                
                // Update cache with new data
                if (isInitialLoad) {
                    const cacheData = {
                        userId: user.uid,
                        orders: orders,
                        timestamp: Date.now()
                    };
                    localStorage.setItem('ordersData', JSON.stringify(cacheData));
                }
            }

            displayOrders(orders, isInitialLoad);
            
            // Add load more button if there might be more orders
            if (orders.length === ORDERS_PER_PAGE) {
                addLoadMoreButton();
            }
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
    const ordersContent = document.getElementById('ordersContent');
    const emptyState = document.getElementById('emptyState');

    if (!orders || orders.length === 0) {
        if (isInitialLoad) {
            ordersContent.innerHTML = '';
            emptyState.style.display = 'block';
        }
        return;
    }

    emptyState.style.display = 'none';
    
    // Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment();
    
    orders.forEach((order) => {
        const orderElement = createOrderElement(order.id, order);
        fragment.appendChild(orderElement);
    });

    if (isInitialLoad) {
        ordersContent.innerHTML = '';
    }
    ordersContent.appendChild(fragment);
}

function createOrderElement(orderId, order) {
    const orderCard = document.createElement('div');
    orderCard.className = 'order-card';
    
    // Format timestamp
    const orderDate = new Date(order.timestamp);
    const formattedDate = orderDate.toLocaleDateString('en-ZA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Calculate total items
    const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
    
    orderCard.innerHTML = `
        <div class="order-header">
            <span class="order-number">Order #${orderId.slice(-6)}</span>
            <span class="order-status ${order.status}">${order.status}</span>
        </div>
        
        <div class="delivery-info">
            <p><i class="fas fa-map-marker-alt"></i> ${order.address.street}, ${order.address.suburb}</p>
            <p><i class="fas fa-phone"></i> ${order.phone}</p>
            ${order.instructions ? `
                <p><i class="fas fa-info-circle"></i> Special Instructions: ${order.instructions}</p>
            ` : ''}
        </div>

        <div class="order-items">
            <div class="items-header">
                <span>Order Details (${totalItems} items)</span>
            </div>
            ${order.items.map(item => `
                <div class="order-item">
                    <div class="item-details">
                        <span class="item-quantity">${item.quantity}x</span>
                        <span class="item-name">${item.name}</span>
                    </div>
                    <span class="item-price">R${(item.price * item.quantity).toFixed(2)}</span>
                </div>
                ${item.description ? `
                    <div class="item-description">${item.description}</div>
                ` : ''}
            `).join('')}
        </div>

        <div class="order-summary">
            <div class="summary-item">
                <span>Subtotal</span>
                <span>R${order.subtotal.toFixed(2)}</span>
            </div>
            <div class="summary-item">
                <span>Delivery Fee</span>
                <span>R${order.deliveryFee.toFixed(2)}</span>
            </div>
            <div class="order-total">
                <span>Total</span>
                <span>R${order.total.toFixed(2)}</span>
            </div>
        </div>

        <div class="order-date">
            <i class="fas fa-clock"></i>
            <small>Ordered on ${formattedDate}</small>
        </div>
    `;

    return orderCard;
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