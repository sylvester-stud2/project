// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDAvwoIEXPpCnPpxaKgaleiUHENNDGKG4Q",
    authDomain: "sannes-palace.firebaseapp.com",
    projectId: "sannes-palace",
    storageBucket: "sannes-palace.firebasestorage.app",
    messagingSenderId: "932501443001",
    appId: "1:932501443001:web:18151ec8db5c9b11332668",
    measurementId: "G-4VX18JYY5V"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// Form elements
const form = document.getElementById('signupForm');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const submitButton = document.getElementById('submitButton');

// Input fields
const inputs = {
    fullName: document.getElementById('fullName'),
    email: document.getElementById('email'),
    phone: document.getElementById('phone'),
    password: document.getElementById('password'),
    confirmPassword: document.getElementById('confirmPassword')
};

// Validation rules
const validationRules = {
    fullName: {
        test: (v) => {
            const trimmed = v.trim();
            return trimmed.length >= 2 && /^[a-zA-Z\s]*$/.test(trimmed);
        },
        message: 'Name must be at least 2 characters and contain only letters'
    },
    email: {
        test: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
        message: 'Please enter a valid email address'
    },
    phone: {
        test: (v) => /^\d{10}$/.test(v.replace(/\D/g, '')),
        message: 'Phone number must be exactly 10 digits'
    },
    password: {
        test: (v) => v.length >= 6 && /\d/.test(v) && /[a-zA-Z]/.test(v),
        message: 'Password must be at least 6 characters and contain both letters and numbers'
    },
    confirmPassword: {
        test: (v) => v === inputs.password.value,
        message: 'Passwords do not match'
    }
};

// Function to show error message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    successMessage.style.display = 'none';
}

// Function to show success message
function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.style.display = 'block';
    errorMessage.style.display = 'none';
}

// Validate a single field
function validateField(fieldName) {
    const input = inputs[fieldName];
    const rule = validationRules[fieldName];
    const errorElement = document.getElementById(`${fieldName}Error`);
    
    const isValid = rule.test(input.value);
    
    input.classList.toggle('invalid', !isValid);
    errorElement.textContent = isValid ? '' : rule.message;
    errorElement.style.display = isValid ? 'none' : 'block';
    
    return isValid;
}

// Update submit button state
function updateSubmitButton() {
    const isValid = Object.keys(inputs).every(field => validateField(field));
    submitButton.disabled = !isValid;
}

// Format phone number input
inputs.phone.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 10) {
        value = value.slice(0, 10);
    }
    e.target.value = value;
});

// Add validation listeners to all fields
Object.keys(inputs).forEach(fieldName => {
    const input = inputs[fieldName];
    
    input.addEventListener('input', () => {
        validateField(fieldName);
        updateSubmitButton();
    });
    
    input.addEventListener('blur', () => {
        validateField(fieldName);
        updateSubmitButton();
    });
});

// Form submission handler
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const isValid = Object.keys(inputs).every(field => validateField(field));
    if (!isValid) {
        showError('Please correct all errors before submitting');
        return;
    }
    
    try {
        // Disable submit button and show loading state
        submitButton.disabled = true;
        submitButton.textContent = 'Creating Account...';
        
        // Get form values
        const email = inputs.email.value.trim();
        const password = inputs.password.value;
        
        // Create user in Firebase Authentication
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        
        // Prepare user data for Firestore
        const userData = {
            fullName: inputs.fullName.value.trim(),
            email: email.toLowerCase(),
            phone: inputs.phone.value.trim(),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        // Save user data to Firestore
        await db.collection('users').doc(userCredential.user.uid).set(userData);
        
        // Show success message
        showSuccess('Account created successfully! Redirecting...');
        
        // Redirect after delay
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        
    } catch (error) {
        console.error('Signup error:', error);
        
        // Handle specific Firebase errors
        let errorMsg = 'An error occurred during signup';
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMsg = 'This email is already registered';
                break;
            case 'auth/invalid-email':
                errorMsg = 'Invalid email address format';
                break;
            case 'auth/weak-password':
                errorMsg = 'Password is too weak. Please use at least 6 characters';
                break;
            case 'auth/network-request-failed':
                errorMsg = 'Network error. Please check your internet connection';
                break;
            case 'auth/operation-not-allowed':
                errorMsg = 'Email/password accounts are not enabled. Please contact support.';
                break;
        }
        
        showError(errorMsg);
        
    } finally {
        // Reset button state
        submitButton.disabled = false;
        submitButton.textContent = 'Create Account';
    }
});

// Initial validation check
document.addEventListener('DOMContentLoaded', () => {
    updateSubmitButton();
});