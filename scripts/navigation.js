// Navigation functionality
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    const cartCounts = document.querySelectorAll('.cart-count');
    cartCounts.forEach(counter => {
        counter.textContent = count;
        counter.style.display = count > 0 ? 'block' : 'none';
    });
}

// Update cart count on page load
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    
    // Set active nav item based on current page
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-item');
    
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage || (currentPage === 'index.html' && linkPage === '#')) {
            link.classList.add('active');
        }
    });
});