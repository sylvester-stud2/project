document.addEventListener('DOMContentLoaded', async () => {
    try {
        const user = await checkAuth();
        await loadCurrentData(user.uid);
        setupFormHandlers(user.uid);
    } catch (error) {
        console.error('Authentication error:', error);
    }
});

async function loadCurrentData(userId) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            
            // Determine which form to populate based on the current page
            const pathname = window.location.pathname;
            if (pathname.includes('edit-name.html')) {
                document.getElementById('nameInput').value = userData.fullName || '';
            } else if (pathname.includes('edit-phone.html')) {
                document.getElementById('phoneInput').value = userData.phone || '';
            } else if (pathname.includes('edit-email.html')) {
                document.getElementById('emailInput').value = userData.email || '';
            }
        }
    } catch (error) {
        console.error('Error loading data:', error);
        showNotification('Error loading data', 'error');
    }
}

function setupFormHandlers(userId) {
    // Name form
    const nameForm = document.getElementById('editNameForm');
    if (nameForm) {
        nameForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newName = document.getElementById('nameInput').value.trim();
            if (!validateName(newName)) {
                showNotification('Please enter a valid name', 'error');
                return;
            }
            await updateUserData(userId, { fullName: newName });
        });
    }

    // Phone form
    const phoneForm = document.getElementById('editPhoneForm');
    if (phoneForm) {
        phoneForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newPhone = document.getElementById('phoneInput').value.trim();
            if (!validatePhone(newPhone)) {
                showNotification('Please enter a valid phone number', 'error');
                return;
            }
            await updateUserData(userId, { 
                phone: newPhone,
                phoneVerified: false // Require new verification
            });
        });
    }

    // Email form
    const emailForm = document.getElementById('editEmailForm');
    if (emailForm) {
        emailForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newEmail = document.getElementById('emailInput').value.trim();
            if (!validateEmail(newEmail)) {
                showNotification('Please enter a valid email', 'error');
                return;
            }
            await updateUserData(userId, { 
                email: newEmail,
                emailVerified: false // Require new verification
            });
        });
    }
}

async function updateUserData(userId, data) {
    try {
        await db.collection('users').doc(userId).update(data);
        showNotification('Updated successfully');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    } catch (error) {
        console.error('Error updating:', error);
        showNotification('Error updating data', 'error');
    }
}

// Validation functions
function validateName(name) {
    return name.length >= 2 && name.length <= 50;
}

function validatePhone(phone) {
    return /^\+?\d{10,14}$/.test(phone);
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Add CSS for notifications if not already in main.css
const style = document.createElement('style');
style.textContent = `
#notificationContainer {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
}

.notification {
    background: #333;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    margin-bottom: 10px;
    animation: slideIn 0.5s ease-out;
}

.notification.error {
    background: #ff3b30;
}

.notification.success {
    background: #34c759;
}

@keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}

@keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
}
`;
document.head.appendChild(style);