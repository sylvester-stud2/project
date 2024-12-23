// menu.js

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

// Menu items data
const menuItems = {
    kotas: [
        {
            id: 'k1',
            name: 'Original Kota',
            description: 'Classic kota with chips, polony, and cheese',
            price: 35.99,
            image: 'https://via.placeholder.com/300x200'
        },
        {
            id: 'k2',
            name: 'Chicken Kota',
            description: 'Kota with chicken fillet, chips, and sauce',
            price: 45.99,
            image: 'https://via.placeholder.com/300x200'
        },
        {
            id: 'k3',
            name: 'Beef Kota',
            description: 'Kota with beef patty, cheese, and chips',
            price: 49.99,
            image: 'https://via.placeholder.com/300x200'
        }
    ],
    platters: [
        {
            id: 'p1',
            name: 'Chicken Platter',
            description: 'Grilled chicken with sides',
            price: 89.99,
            image: 'https://via.placeholder.com/300x200'
        },
        {
            id: 'p2',
            name: 'Mixed Grill Platter',
            description: 'Assorted grilled meats and sides',
            price: 129.99,
            image: 'https://via.placeholder.com/300x200'
        },
        {
            id: 'p3',
            name: 'Family Feast',
            description: 'Large platter for sharing',
            price: 199.99,
            image: 'https://via.placeholder.com/300x200'
        }
    ],
    fries: [
        {
            id: 'f1',
            name: 'Regular Fries',
            description: 'Classic crispy fries',
            price: 25.99,
            image: 'https://via.placeholder.com/300x200'
        },
        {
            id: 'f2',
            name: 'Loaded Fries',
            description: 'Fries with cheese and toppings',
            price: 39.99,
            image: 'https://via.placeholder.com/300x200'
        },
        {
            id: 'f3',
            name: 'Spicy Fries',
            description: 'Fries with special spicy seasoning',
            price: 29.99,
            image: 'https://via.placeholder.com/300x200'
        }
    ]
};

// Authentication check and initialization
document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('isAuthenticated')) {
        window.location.href = 'index.html';
        return;
    }

    setupFilters();
    setupScrollControls();
    displayMenuItems('all');
});

function setupFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            displayMenuItems(button.dataset.category);
        });
    });
}
// Continuing from the previous setupScrollControls function...

function setupScrollControls() {
    const filtersContainer = document.querySelector('.menu-filters');
    const leftButton = document.querySelector('.scroll-left');
    const rightButton = document.querySelector('.scroll-right');
    
    const scrollAmount = 200;

    if (leftButton && rightButton) {
        leftButton.addEventListener('click', () => {
            filtersContainer.scrollBy({
                left: -scrollAmount,
                behavior: 'smooth'
            });
        });

        rightButton.addEventListener('click', () => {
            filtersContainer.scrollBy({
                left: scrollAmount,
                behavior: 'smooth'
            });
        });

        // Update button visibility based on scroll position
        function updateScrollButtons() {
            const { scrollLeft, scrollWidth, clientWidth } = filtersContainer;
            
            leftButton.style.opacity = scrollLeft > 0 ? '1' : '0';
            rightButton.style.opacity = 
                scrollLeft < (scrollWidth - clientWidth - 1) ? '1' : '0';
        }

        // Listen for scroll events to update button visibility
        filtersContainer.addEventListener('scroll', updateScrollButtons);
        window.addEventListener('resize', updateScrollButtons);

        // Initial button state
        updateScrollButtons();
    }

    // Add touch scroll indicator for mobile
    if (window.matchMedia('(max-width: 768px)').matches) {
        const filters = document.querySelector('.menu-filters');
        filters.addEventListener('scroll', () => {
            filters.style.background = filters.scrollLeft > 0 
                ? 'linear-gradient(to right, rgba(255,255,255,0) 0%, white 30%, white 100%)'
                : 'linear-gradient(to right, white 30%, rgba(255,255,255,0) 100%)';
        });
    }
}

function displayMenuItems(category) {
    const menuContainer = document.getElementById('menuItems');
    let itemsToDisplay = [];

    if (category === 'all') {
        itemsToDisplay = [
            ...menuItems.kotas,
            ...menuItems.platters,
            ...menuItems.fries
        ];
    } else {
        itemsToDisplay = menuItems[category] || [];
    }

    menuContainer.innerHTML = itemsToDisplay.map(item => `
        <div class="menu-item">
            <img src="${item.image}" alt="${item.name}">
            <div class="menu-item-content">
                <h3>${item.name}</h3>
                <p>${item.description}</p>
                <div class="price">R${item.price.toFixed(2)}</div>
                <button onclick="addToCart('${item.id}')" class="btn">Add to Cart</button>
            </div>
        </div>
    `).join('');
}

function addToCart(itemId) {
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    const item = [...Object.values(menuItems).flat()]
        .find(item => item.id === itemId);

    if (item) {
        const existingItem = cart.find(i => i.id === itemId);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                ...item,
                quantity: 1
            });
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        showNotification('Item added to cart!');
        updateCartCount(); // Update cart count in navigation
    }
}

function showNotification(message) {
    let notificationContainer = document.getElementById('notificationContainer');
    
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notificationContainer';
        document.body.appendChild(notificationContainer);
    }

    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;

    notificationContainer.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.5s ease-out';
        setTimeout(() => {
            notificationContainer.removeChild(notification);
        }, 500);
    }, 3000);
}

// Update cart count - this function should also exist in your navigation.js
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    const cartCounts = document.querySelectorAll('.cart-count');
    cartCounts.forEach(counter => {
        counter.textContent = count;
        counter.style.display = count > 0 ? 'block' : 'none';
    });
}