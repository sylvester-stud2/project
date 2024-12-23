// Firebase config
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
const DELIVERY_FEE = 20;

// Check authentication
document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('isAuthenticated')) {
        window.location.href = 'index.html';
        return;
    }
    
    displayCart();
    setupCheckoutModal();
});

function displayCart() {
    const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
    const cartContainer = document.getElementById('cartItems');
    const itemCountElement = document.getElementById('itemCount');
    
    if (cartItems.length === 0) {
        cartContainer.innerHTML = `
            <div class="empty-cart">
                <h3>Your cart is empty</h3>
                <p>Add some items from the menu to get started!</p>
            </div>
        `;
        itemCountElement.textContent = '0 items';
        updateTotals(0);
        return;
    }

    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    itemCountElement.textContent = `${totalItems} item${totalItems !== 1 ? 's' : ''}`;

    cartContainer.innerHTML = cartItems.map(item => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}">
            <div class="item-details">
                <h3>${item.name}</h3>
                <p>${item.description || ''}</p>
                <div class="price">R${(item.price * item.quantity).toFixed(2)}</div>
                <div class="quantity-controls">
                    <button class="quantity-btn" onclick="updateQuantity('${item.id}', ${item.quantity - 1})">-</button>
                    <span class="quantity-display">${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
                    <button class="remove-btn" onclick="removeItem('${item.id}')">Remove</button>
                </div>
            </div>
        </div>
    `).join('');

    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    updateTotals(subtotal);
}

function updateTotals(subtotal) {
    const subtotalElement = document.getElementById('subtotal');
    const totalElement = document.getElementById('total');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    subtotalElement.textContent = `R${subtotal.toFixed(2)}`;
    const total = subtotal + (subtotal > 0 ? DELIVERY_FEE : 0);
    totalElement.textContent = `R${total.toFixed(2)}`;
    
    checkoutBtn.disabled = subtotal === 0;
}

function updateQuantity(itemId, newQuantity) {
    if (newQuantity < 1) {
        removeItem(itemId);
        return;
    }

    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const itemIndex = cart.findIndex(item => item.id === itemId);
    
    if (itemIndex !== -1) {
        cart[itemIndex].quantity = newQuantity;
        localStorage.setItem('cart', JSON.stringify(cart));
        displayCart();
        updateCartCount(); // Update cart count in navigation
    }
}

function removeItem(itemId) {
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    cart = cart.filter(item => item.id !== itemId);
    localStorage.setItem('cart', JSON.stringify(cart));
    displayCart();
    updateCartCount(); // Update cart count in navigation
}



















// Initialize Yoco SDK globally
let yoco;
document.addEventListener('DOMContentLoaded', () => {
    try {
        yoco = new window.YocoSDK({
            publicKey: 'pk_test_0c72d315vnYeAqq89ce4',
            env: 'test'
        });
        console.log('Yoco SDK initialized successfully');
    } catch (error) {
        console.error('Error initializing Yoco SDK:', error);
    }
});






function updateOrderSummary() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal + DELIVERY_FEE;

    document.getElementById('modal-subtotal').textContent = `Subtotal: R${subtotal.toFixed(2)}`;
    document.getElementById('modal-delivery').textContent = `Delivery Fee: R${DELIVERY_FEE.toFixed(2)}`;
    document.getElementById('modal-total').textContent = `Total: R${total.toFixed(2)}`;
}



async function handlePaymentCallback(result) {
    const submitButton = document.querySelector('.btn-place-order');
    const errorElement = document.getElementById('payment-error');

    try {
        if (result.error) {
            throw new Error(result.error.message || 'Payment failed');
        }

        submitButton.disabled = true;
        await processSuccessfulPayment(result);
        
    } catch (error) {
        console.error('Payment error:', error);
        errorElement.textContent = error.message;
        errorElement.style.display = 'block';
        submitButton.disabled = false;
    }
}


async function performPrePaymentChecks() {
    const userId = localStorage.getItem('userId');
    const db = firebase.firestore();

    // Check for active orders
    const hasActiveOrders = await checkActiveOrders(userId);
    if (hasActiveOrders) {
        throw new Error('You have an active order that is being processed or delivered. Please wait for it to be completed before placing a new order.');
    }

    // Get user data
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    // Check address fields
    const requiredFields = ['street', 'suburb', 'city', 'postalCode', 'province', 'country'];
    const missingFields = requiredFields.filter(field => !userData[field]);
    if (missingFields.length > 0) {
        throw new Error(`Please complete your address in Profile:\n${missingFields.join(', ')}`);
    }

    // Check coordinates
    if (!userData.coordinates?.latitude || !userData.coordinates?.longitude) {
        throw new Error('Please set your delivery location coordinates in Profile');
    }

    // Verify location
    const locationVerification = await verifyLocation(userData.coordinates);
    if (!locationVerification.verified) {
        throw new Error(
            `Order cannot be placed. Your current location is ${locationVerification.distance.toFixed(1)}km away from your saved delivery address.\n\n` +
            `For security reasons, orders can only be placed when you are within 500m of your saved delivery address.\n\n` +
            `Please update your delivery address in Profile if you've moved, or try placing the order from your saved address location.`
        );
    }

    // Check phone number
    if (!userData.phone) {
        throw new Error('Please add your phone number in Profile');
    }
}

















// ... previous Firebase config and constants ...

const LOCATION_THRESHOLD = 0.1; // Roughly 1km in decimal degrees

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
}

async function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser'));
            return;
        }

        navigator.permissions.query({ name: 'geolocation' }).then((permissionStatus) => {
            if (permissionStatus.state === 'denied') {
                reject(new Error('Location access is required to place orders. Please enable location access in your browser settings and try again.'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                },
                (error) => {
                    let errorMessage;
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = 'Location access is required to place orders. Please enable location access in your browser settings and try again.';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = 'Location information is unavailable. Please try again.';
                            break;
                        case error.TIMEOUT:
                            errorMessage = 'Location request timed out. Please try again.';
                            break;
                        default:
                            errorMessage = 'An unknown error occurred while getting location. Please try again.';
                    }
                    reject(new Error(errorMessage));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        });
    });
}

// Update the LOCATION_THRESHOLD constant to 0.5 km

async function verifyLocation(savedCoordinates) {
    try {
        const currentLocation = await getCurrentLocation();
        const distance = calculateDistance(
            savedCoordinates.latitude,
            savedCoordinates.longitude,
            currentLocation.latitude,
            currentLocation.longitude
        );

        return {
            verified: distance <= LOCATION_THRESHOLD,
            distance: distance,
            current: currentLocation,
            saved: savedCoordinates
        };
    } catch (error) {
        throw error;
    }
}

async function checkActiveOrders(userId) {
    const db = firebase.firestore();
    
    try {
        const activeOrders = await db.collection('orders')
            .where('userId', '==', userId)
            .where('status', 'in', ['confirmed', 'delivering'])
            .get();

        return !activeOrders.empty;
    } catch (error) {
        console.error('Error checking active orders:', error);
        throw error;
    }
}

// Update the styles with extra small screen handling
// Update the styles with much larger spacing for small screens
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    .modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 1000;
    }
    
    .modal-content {
        position: relative;
        background-color: #fff;
        margin: 15% auto;
        padding: 20px;
        border-radius: 8px;
        width: 90%;
        max-width: 500px;
        z-index: 1001;
    }
    
    /* Yoco specific styles */
    .yoco-payment-overlay {
        z-index: 60000 !important;
    }
    
    iframe[id^='yoco-3ds-modal'] {
        z-index: 60001 !important;
    }
    
    .yoco-payment-overlay-modal {
        z-index: 60002 !important;
    }

    /* Responsive positioning for tablets and medium-sized phones */
    @media screen and (max-width: 768px) {
        iframe[id^='yoco-payment-form'] {
            margin-top: 120px !important;
            top: 25% !important;
            transform: translateY(-10%) !important;
            max-height: 85vh !important;
            position: fixed !important;
        }
    }

    /* Extra specific styling for very small screens */
    @media screen and (max-width: 420px) {
        iframe[id^='yoco-payment-form'] {
            margin-top: 200px !important; /* Significantly increased margin */
            top: 0 !important; /* Remove top percentage */
            transform: none !important; /* Remove transform */
            max-height: 75vh !important; /* Reduced max height */
            position: fixed !important;
            padding-top: 20px !important; /* Add padding at the top */
        }
    }
`;
document.head.appendChild(styleSheet);

// Update the handleCheckout function with increased spacing
async function handleCheckout(event) {
    event.preventDefault();
    const submitButton = document.querySelector('.btn-place-order');
    const errorElement = document.getElementById('payment-error');
    const modal = document.getElementById('checkoutModal');
    
    try {
        submitButton.disabled = true;
        submitButton.textContent = 'Checking requirements...';
        errorElement.style.display = 'none';
        
        await performPrePaymentChecks();
        
        submitButton.textContent = 'Processing...';
        
        if (!yoco) {
            throw new Error('Payment system not initialized');
        }

        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        if (cart.length === 0) {
            throw new Error('Cart is empty');
        }

        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const total = subtotal + DELIVERY_FEE;

        // Hide the checkout modal while Yoco popup is active
        modal.style.visibility = 'hidden';

        // Get window dimensions and calculate positioning
        const windowWidth = window.innerWidth;
        const isVerySmallScreen = windowWidth <= 420;
        const isMobile = windowWidth <= 768;
        const headerHeight = isVerySmallScreen ? 200 : 120; // Significantly increased header spacing
        
        // Initialize Yoco popup with increased spacing
        yoco.showPopup({
            amountInCents: Math.round(total * 100),
            currency: 'ZAR',
            name: "Sanne's Palace Order",
            description: `Order Total: R${total.toFixed(2)}`,
            position: {
                // Much more space for very small screens
                top: isVerySmallScreen 
                    ? headerHeight + 50 // Added extra spacing
                    : isMobile 
                        ? headerHeight + 30
                        : undefined,
            },
            callback: async function(result) {
                // Show the modal again after Yoco popup closes
                modal.style.visibility = 'visible';
                
                if (result.error) {
                    errorElement.textContent = result.error.message;
                    errorElement.style.display = 'block';
                    submitButton.disabled = false;
                    submitButton.textContent = 'Pay and Place Order';
                    return;
                }
                submitButton.textContent = 'Processing Order...';
                await processSuccessfulPayment(result);
            }
        });
        
    } catch (error) {
        // Show the modal again in case of error
        modal.style.visibility = 'visible';
        
        console.error('Checkout error:', error);
        if (error.message.includes('Please complete your address') || 
            error.message.includes('Please set your delivery location') ||
            error.message.includes('Please add your phone number')) {
            alert(error.message + '\n\nRedirecting to Profile page...');
            window.location.href = 'profile.html';
            return;
        }
        
        errorElement.textContent = error.message;
        errorElement.style.display = 'block';
        submitButton.disabled = false;
        submitButton.textContent = 'Pay and Place Order';
    }
}


// Update the close modal function to reset visibility
function closeCheckoutModal() {
    const modal = document.getElementById('checkoutModal');
    const paymentForm = document.getElementById('payment-form');
    const errorElement = document.getElementById('payment-error');
    const submitButton = document.querySelector('.btn-place-order');
    
    // Reset everything when closing
    paymentForm.innerHTML = '';
    errorElement.style.display = 'none';
    errorElement.textContent = '';
    submitButton.disabled = false;
    submitButton.textContent = 'Pay and Place Order';
    
    modal.style.display = 'none';
    modal.style.visibility = 'visible'; // Reset visibility
    document.body.style.overflow = 'auto';
}




async function openCheckoutModal() {
    if (!await checkLocationPermission()) {
        return;
    }
    
    const modal = document.getElementById('checkoutModal');
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Reset any previous error messages
    const errorElement = document.getElementById('payment-error');
    errorElement.style.display = 'none';
    errorElement.textContent = '';
    
    // Update the order summary
    updateOrderSummary();
    
    // Remove any existing payment form
    const paymentForm = document.getElementById('payment-form');
    paymentForm.innerHTML = '';
}


// Add this CSS to your styles

document.head.appendChild(styleSheet);



// Update modal setup to ensure proper layering
function setupCheckoutModal() {
    const modal = document.getElementById('checkoutModal');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const closeBtn = document.getElementById('closeModal');
    const form = document.getElementById('checkoutForm');
    
    checkoutBtn.addEventListener('click', openCheckoutModal);
    closeBtn.addEventListener('click', closeCheckoutModal);
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        handleCheckout(e);
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeCheckoutModal();
        }
    });
}


















async function initializePaymentForm() {
    const paymentContainer = document.getElementById('payment-form');
    
    try {
        if (!yoco) {
            throw new Error('Payment system not initialized');
        }

        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        if (cart.length === 0) {
            throw new Error('Cart is empty');
        }

        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const total = subtotal + DELIVERY_FEE;

        // Create Yoco popup
        yoco.showPopup({
            amountInCents: Math.round(total * 100),
            currency: 'ZAR',
            name: "Sanne's Palace Order",
            description: `Order Total: R${total.toFixed(2)}`,
            callback: async function(result) {
                const submitButton = document.querySelector('.btn-place-order');
                const errorElement = document.getElementById('payment-error');
                
                if (result.error) {
                    errorElement.textContent = result.error.message;
                    errorElement.style.display = 'block';
                    submitButton.disabled = false;
                    submitButton.textContent = 'Pay and Place Order';
                    return;
                }
                
                submitButton.textContent = 'Processing Order...';
                await processSuccessfulPayment(result);
            }
        });
    } catch (error) {
        console.error('Payment form initialization error:', error);
        throw error;
    }
}

async function processSuccessfulPayment(paymentResult) {
    try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const userId = localStorage.getItem('userId');
        const db = firebase.firestore();
        
        // Get user data
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();

        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const total = subtotal + DELIVERY_FEE;
        const instructions = document.getElementById('instructions').value;

        // Create order object
        const order = {
            userId,
            items: cart,
            address: {
                street: userData.street,
                suburb: userData.suburb,
                city: userData.city,
                postalCode: userData.postalCode,
                province: userData.province,
                country: userData.country,
                coordinates: userData.coordinates
            },
            phone: userData.phone,
            instructions,
            subtotal,
            deliveryFee: DELIVERY_FEE,
            total,
            status: 'confirmed',
            timestamp: new Date().toISOString(),
            payment: {
                status: 'completed',
                timestamp: new Date().toISOString(),
                reference: paymentResult.id
            }
        };

        // Save order to Firestore
        const orderRef = await db.collection('orders').add(order);
        localStorage.setItem('latestOrderId', orderRef.id);

        // Show success message
        const modal = document.getElementById('checkoutModal');
        const modalContent = modal.querySelector('.modal-content');
        modalContent.innerHTML = `
            <div class="success-message" style="text-align: center; padding: 2rem;">
                <i class="fas fa-check-circle" style="color: #4CAF50; font-size: 3rem; margin-bottom: 1rem;"></i>
                <h2 style="color: #4CAF50; margin-bottom: 1rem;">Order Placed Successfully!</h2>
                <p style="margin-bottom: 0.5rem;">Your order has been confirmed and is being processed.</p>
                <p style="margin-bottom: 1rem;">Order Reference: #${orderRef.id}</p>
                <p>Redirecting to order tracking...</p>
            </div>
        `;

        // Clear cart and update UI
        localStorage.removeItem('cart');
        updateCartCount();

        // Redirect to tracking page after 3 seconds
        setTimeout(() => {
            window.location.href = 'track.html';
        }, 3000);

    } catch (error) {
        console.error('Error processing order:', error);
        const errorElement = document.getElementById('payment-error');
        errorElement.textContent = 'Error processing order. Please try again.';
        errorElement.style.display = 'block';
        const submitButton = document.querySelector('.btn-place-order');
        submitButton.disabled = false;
        submitButton.textContent = 'Pay and Place Order';
    }
}



























// Add this helper function to check for address completeness
function checkAddressCompleteness(userData) {
    const requiredFields = ['street', 'suburb', 'city', 'postalCode', 'province', 'country'];
    const missingFields = requiredFields.filter(field => !userData[field]);
    
    if (missingFields.length > 0) {
        throw new Error(`Please complete your address in Profile:\n${missingFields.join(', ')}`);
    }
    
    if (!userData.coordinates?.latitude || !userData.coordinates?.longitude) {
        throw new Error('Please set your delivery location coordinates in Profile');
    }
    
    if (!userData.phone) {
        throw new Error('Please add your phone number in Profile');
    }
}














// Add this function to check location permission when the checkout modal opens
async function checkLocationPermission() {
    try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        if (permission.state === 'denied') {
            alert('Location access is required to place orders. Please enable location access in your browser settings and try again.');
            return false;
        }
        return true;
    } catch (error) {
        console.error('Error checking location permission:', error);
        return false;
    }
}


// New function to update order summary
function updateOrderSummary() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal + DELIVERY_FEE;

    document.getElementById('modal-subtotal').textContent = `Subtotal: R${subtotal.toFixed(2)}`;
    document.getElementById('modal-delivery').textContent = `Delivery Fee: R${DELIVERY_FEE.toFixed(2)}`;
    document.getElementById('modal-total').textContent = `Total: R${total.toFixed(2)}`;
}


// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('isAuthenticated')) {
        window.location.href = 'index.html';
        return;
    }
    displayCart();
    setupCheckoutModal();
});
