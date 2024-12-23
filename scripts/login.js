// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyB9x85hJMW22we8XlN1Q_Ca92Q5dV76IME",
    authDomain: "kota-6e667.firebaseapp.com",
    projectId: "kota-6e667",
    storageBucket: "kota-6e667.firebasestorage.app",
    messagingSenderId: "698838744468",
    appId: "1:698838744468:web:e5e718e9539dbd4431a381"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// Form elements
const form = document.getElementById('loginForm');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const submitButton = document.getElementById('submitButton');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

// Track login attempts
let loginAttempts = 0;
const MAX_ATTEMPTS = 3;
const LOCKOUT_TIME = 300000; // 5 minutes

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    if (successMessage) {
        successMessage.style.display = 'none';
    }
}

// Show success message
function showSuccess(message) {
    if (successMessage) {
        successMessage.textContent = message;
        successMessage.style.display = 'block';
        errorMessage.style.display = 'none';
    }
}

// Hide error message
function hideError() {
    errorMessage.style.display = 'none';
}

// Check if user is already logged in
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is logged in, redirect to menu page
        window.location.href = 'menu.html';
    }
});

// Form submission handler
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Basic validation
    if (!email || !password) {
        showError('Please fill in all fields');
        return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('Please enter a valid email address');
        return;
    }

    try {
        // Disable submit button and show loading state
        submitButton.disabled = true;
        submitButton.textContent = 'Logging in...';

        // Attempt to sign in
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Log successful login
        await db.collection('users').doc(user.uid).update({
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        });

        showSuccess('Login successful! Redirecting...');
        
        // Redirect will happen automatically due to onAuthStateChanged
        
    } catch (error) {
        console.error('Login error:', error);
        
        // Increment failed attempts
        loginAttempts++;

        let errorMsg;
        switch (error.code) {
            case 'auth/invalid-credential':
            case 'auth/user-not-found':
            case 'auth/wrong-password':
                errorMsg = `Invalid email or password. ${MAX_ATTEMPTS - loginAttempts} attempts remaining`;
                break;
            case 'auth/invalid-email':
                errorMsg = 'Invalid email address format';
                break;
            case 'auth/too-many-requests':
                errorMsg = 'Too many failed attempts. Please try again later';
                break;
            case 'auth/network-request-failed':
                errorMsg = 'Network error. Please check your internet connection';
                break;
            default:
                errorMsg = 'An error occurred. Please try again';
        }
        
        // Check if max attempts reached
        if (loginAttempts >= MAX_ATTEMPTS) {
            errorMsg = 'Too many failed attempts. Please try again later';
            setTimeout(() => {
                loginAttempts = 0; // Reset attempts after timeout
            }, LOCKOUT_TIME);
        }
        
        showError(errorMsg);
        
    } finally {
        // Reset button state
        submitButton.disabled = false;
        submitButton.textContent = 'Login';
    }
});

// Clear error on input
emailInput.addEventListener('input', () => {
    hideError();
    updateSubmitButton();
});

passwordInput.addEventListener('input', () => {
    hideError();
    updateSubmitButton();
});

// Update submit button state
function updateSubmitButton() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    submitButton.disabled = !email || !password || loginAttempts >= MAX_ATTEMPTS;
}

// Initial button state
updateSubmitButton();