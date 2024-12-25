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
            name: 'POLO TSI',
            description: 'ACHAR | POLONY | CHIPS | VIENNA | LETTUCE',
            price: 35.00,
            image: 'https://lh3.googleusercontent.com/40I6BfXs29ybMx9KBZGsBOYBXkXZYc4Y2pOo32G6AF4XShhWnD3VEkZ4W8iX65g0yXcUqIahFududEmDWGtECDpZ8zWFZRS0EjY-=s1000'
        },
        {
            id: 'k2',
            name: 'M2',
            description: 'ACHAR | POLONY | CHIPS | CHEESE | LETTUCE | HALF RUSSIAN',
            price: 40.00,
            image: 'https://via.placeholder.com/300x200'
        },
        {
            id: 'k3',
            name: 'M3',
            description: 'ATCHAR | BURGER | CHEESE | FULL RUSSIAN | EGG LETTUCE | CHIPS',
            price: 60.00,
            image: 'https://via.placeholder.com/300x200'
        },
        {
            id: 'k4',
            name: 'G63 WAGON LUMMA (FULL HOUSE)',
            description: 'ACHAR | 2 BURGER | CHEESE | POLONY| 2 FULL VIENNA |  2 FULL RUSSIAN | LETTUCE / CUCUMBER | CHIPS | FULL LOAF | Eggs',
            price: 120.00,
            image: 'https://via.placeholder.com/300x200'
        }
    ],
    platters: [
        {
            id: 'p1',
            name: 'JUNK PARK',
            description: '3 BEEF/ CHICKEN BURGERS, 9 WINGS & CHIPS',
            price: 215.00,
            image: 'https://via.placeholder.com/300x200'
        },
        {
            id: 'p2',
            name: 'MAKUBENJALO',
            description: 'BURGER WITH 3 WINGS, KOTA, CHIPS',
            price: 120.00,
            image: 'https://via.placeholder.com/300x200'
        },
        {
            id: 'p3',
            name: 'RANDS CAPE TOWN',
            description: '2 BEEF/ CHICKEN BURGERS, BEEF brisket & CHIPS',
            price: 180.00,
            image: 'https://via.placeholder.com/300x200'
        },
        {
            id: 'p4',
            name: 'DRAMA',
            description: '2 Beef/Chicken Burgers, 400g Beef short Ribs, Wings, Chips',
            price: 270.00,
            image: 'https://via.placeholder.com/300x200'
        },
        {
            id: 'p5',
            name: 'CUBANA',
            description: '2 CHICKEN WRAPS, WINGS, BEEF CHOPS, CHIPS',
            price: 240.00,
            image: 'https://via.placeholder.com/300x200'
        }
    ],
    burgers_wraps: [
        {
            id: 'bw1',
            name: 'CHICKEN WRAP WITH CHIPS',
            description: 'Chicken wrap served with chips',
            price: 55.00,
            image: 'https://via.placeholder.com/300x200'
        },
        {
            id: 'bw2',
            name: 'BEEF WRAP WITH CHIPS',
            description: 'Beef wrap served with chips',
            price: 65.00,
            image: 'https://via.placeholder.com/300x200'
        },
        {
            id: 'bw3',
            name: 'SINGLE CHICKEN BURGER WITH CHIPS',
            description: 'Single chicken patty burger with chips',
            price: 55.00,
            image: 'https://via.placeholder.com/300x200'
        },
        {
            id: 'bw4',
            name: 'SINGLE BEEF BURGER WITH CHIPS',
            description: 'Single beef patty burger with chips',
            price: 55.00,
            image: 'https://via.placeholder.com/300x200'
        },
        {
            id: 'bw5',
            name: 'DOUBLE CHICKEN BURGER WITH CHIPS',
            description: 'Double chicken patty burger with chips',
            price: 65.00,
            image: 'https://via.placeholder.com/300x200'
        },
        {
            id: 'bw6',
            name: 'DOUBLE BEEF BURGER WITH CHIPS',
            description: 'Double beef patty burger with chips',
            price: 70.00,
            image: 'https://via.placeholder.com/300x200'
        }
    ],
    wings: [
        {
            id: 'w1',
            name: 'DUNKED WINGS 4 PC',
            description: '4 dunked wings served with chips',
            price: 60.00,
            image: 'https://via.placeholder.com/300x200'
        },
        {
            id: 'w2',
            name: 'DUNKED WINGS 6 PC',
            description: '6 dunked wings served with chips',
            price: 75.00,
            image: 'https://via.placeholder.com/300x200'
        },
        {
            id: 'w3',
            name: 'DUNKED WINGS 10 PC',
            description: '10 dunked wings served with chips',
            price: 90.00,
            image: 'https://via.placeholder.com/300x200'
        },
        {
            id: 'w4',
            name: 'REGULAR WINGS 4 PC',
            description: '4 regular wings served with chips',
            price: 55.00,
            image: 'https://via.placeholder.com/300x200'
        },
        {
            id: 'w5',
            name: 'REGULAR WINGS 6 PC',
            description: '6 regular wings served with chips',
            price: 65.00,
            image: 'https://via.placeholder.com/300x200'
        },
        {
            id: 'w6',
            name: 'REGULAR WINGS 10 PC',
            description: '10 regular wings served with chips',
            price: 85.00,
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
            ...menuItems.burgers_wraps,
            ...menuItems.wings
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