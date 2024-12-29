//auth.js
import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Make functions available to window object for HTML access
window.handleLogin = async (event) => {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');
    const submitButton = event.submitter;

    try {
        submitButton.disabled = true;
        submitButton.textContent = 'Logging in...';
        
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('Login successful:', userCredential.user.email);
        
        // Redirect to menu page after successful login
        window.location.href = 'menu.html';
    } catch (error) {
        console.error('Login error:', error);
        let errorMessage;
        switch (error.code) {
            case 'auth/invalid-credential':
                errorMessage = 'Invalid email or password.';
                break;
            case 'auth/user-not-found':
                errorMessage = 'No account found with this email.';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Incorrect password.';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Invalid email address.';
                break;
            default:
                errorMessage = 'An error occurred. Please try again.';
        }
        errorDiv.textContent = errorMessage;
        errorDiv.style.display = 'block';
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Login';
    }
};

// Check if user is already logged in
auth.onAuthStateChanged((user) => {
    if (user && window.location.pathname.endsWith('index.html')) {
        window.location.href = 'menu.html';
    }
});