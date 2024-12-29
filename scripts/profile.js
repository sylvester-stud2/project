// profile.js
// Add these new variables at the top of your profile.js


// Modify the updateProfileDisplay function to handle loading states



// Update initializeProfilePage to remove animation
function initializeProfilePage() {
    initializeMap();
    document.getElementById('getCurrentLocation').addEventListener('click', getCurrentLocation);
    document.getElementById('signOutBtn').addEventListener('click', handleSignOut);
}
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

const cachedUserData = JSON.parse(localStorage.getItem('userData'));
let map;
let currentMarker;
let initialDataLoaded = false;
let pageInitialized = false;

// Function to initialize map with draggable marker
function initializeMap() {
    mapboxgl.accessToken = 'pk.eyJ1Ijoic3lsdmVzdGVyMzMiLCJhIjoiY200a2JsdDJyMG02NjJrc2xzMG40b25wOSJ9.6MP3EOP-rPYvNIoe9UUxlA';
    
    map = new mapboxgl.Map({
        container: 'location-map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [29.4029, -23.8646], // Default center
        zoom: 18
    });

    map.addControl(new mapboxgl.NavigationControl());

    // Load user's saved location if available
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (userData?.coordinates?.latitude && userData?.coordinates?.longitude) {
        updateLocationDisplay(userData.coordinates);
    }

    // Add loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'map-loading';
    loadingDiv.style.display = 'none';
    loadingDiv.innerHTML = '<span>Updating location...</span>';
    document.getElementById('location-container').appendChild(loadingDiv);
}

// Updated function to create/update marker
function updateLocationDisplay(coordinates) {
    document.getElementById('latitudeValue').textContent = `Latitude: ${coordinates.latitude.toFixed(6)}`;
    document.getElementById('longitudeValue').textContent = `Longitude: ${coordinates.longitude.toFixed(6)}`;

    if (map) {
        // Remove existing marker if any
        if (currentMarker) {
            currentMarker.remove();
        }

        // Create new draggable marker
        currentMarker = new mapboxgl.Marker({
            draggable: true,
            color: '#FF0000'
        })
            .setLngLat([coordinates.longitude, coordinates.latitude])
            .setPopup(new mapboxgl.Popup().setHTML(
                '<div class="marker-popup">' +
                '<h3>Delivery Location</h3>' +
                '<p>Drag this marker to adjust your location</p>' +
                '</div>'
            ))
            .addTo(map);

        // Add dragend event listener
        currentMarker.on('dragend', async function() {
            const loadingDiv = document.getElementById('map-loading');
            loadingDiv.style.display = 'block';

            try {
                const lngLat = currentMarker.getLngLat();
                const newCoordinates = {
                    latitude: lngLat.lat,
                    longitude: lngLat.lng
                };

                // Update Firebase and local storage
                await updateUserLocation(newCoordinates);

                // Get and update address for new location
                const addressFeature = await getAddressFromCoordinates(newCoordinates.latitude, newCoordinates.longitude);
                if (addressFeature) {
                    const addressComponents = parseAddressComponents(addressFeature);
                    if (addressComponents) {
                        await updateUserAddress(addressComponents);
                    }
                }

                // Update coordinate display
                document.getElementById('latitudeValue').textContent = `Latitude: ${newCoordinates.latitude.toFixed(6)}`;
                document.getElementById('longitudeValue').textContent = `Longitude: ${newCoordinates.longitude.toFixed(6)}`;

                showNotification('Location updated successfully');
            } catch (error) {
                console.error('Error updating location:', error);
                showNotification('Failed to update location', 'error');
            } finally {
                loadingDiv.style.display = 'none';
            }
        });

        // Center map on new location
        map.flyTo({
            center: [coordinates.longitude, coordinates.latitude],
            zoom: 18,
            essential: true
        });
    }
}

// Add some CSS for the loading indicator
const style = document.createElement('style');
style.textContent = `
    #map-loading {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.7);
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 1000;
    }

    .marker-popup {
        text-align: center;
        padding: 5px;
    }

    .marker-popup h3 {
        margin: 0 0 5px 0;
        color: #333;
    }

    .marker-popup p {
        margin: 0;
        font-size: 12px;
        color: #666;
    }
`;
document.head.appendChild(style);
// Add these new functions to your existing code

// Function to get address details from coordinates using Mapbox
async function getAddressFromCoordinates(latitude, longitude) {
    try {
        const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxgl.accessToken}&types=address`
        );
        
        if (!response.ok) {
            throw new Error('Failed to fetch address');
        }

        const data = await response.json();
        return data.features[0];
    } catch (error) {
        console.error('Error fetching address:', error);
        showNotification('Failed to fetch address details', 'error');
        return null;
    }
}


// Add this function to format the address
function formatAddress(addressData) {
    const parts = [];
    
    if (addressData.street) parts.push(addressData.street);
    if (addressData.suburb) parts.push(addressData.suburb);
    if (addressData.city) parts.push(addressData.city);
    if (addressData.postalCode) parts.push(addressData.postalCode);
    if (addressData.province) parts.push(addressData.province);
    if (addressData.country) parts.push(addressData.country);
    
    return parts.join('\n');
}

// Modify your updateUserAddress function
async function updateUserAddress(address) {
    const user = auth.currentUser;
    if (!user) return;

    try {
        const updateData = {
            ...address,
            updated: firebase.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('users').doc(user.uid).update(updateData);
        
        // Update local storage
        const userData = JSON.parse(localStorage.getItem('userData')) || {};
        Object.assign(userData, address);
        localStorage.setItem('userData', JSON.stringify(userData));

        // Update display with formatted address
        const formattedAddress = formatAddress(address);
        document.getElementById('fullAddress').textContent = formattedAddress;

        showNotification('Address updated successfully');
    } catch (error) {
        console.error('Error updating address:', error);
        showNotification('Failed to update address', 'error');
        throw error;
    }
}

// Update the updateProfileDisplay function

function updateProfileDisplay(userData, isInitialLoad = false) {
    // Don't update if we already have initial data and this is an initial load
    if (initialDataLoaded && isInitialLoad) return;

    // Update basic information with fade transition
    const updateField = (elementId, value) => {
        const element = document.getElementById(elementId);
        const newValue = value || 'Not set';
        if (element.textContent !== newValue) {
            element.style.opacity = '0';
            setTimeout(() => {
                element.textContent = newValue;
                element.style.opacity = '1';
            }, 150);
        }
    };

    updateField('fullNameValue', userData.fullName);
    updateField('emailValue', userData.email);
    updateField('phoneValue', userData.phone);

    // Update address display
    const formattedAddress = formatAddress({
        street: userData.street,
        suburb: userData.suburb,
        city: userData.city,
        postalCode: userData.postalCode,
        province: userData.province,
        country: userData.country
    });

    const addressElement = document.getElementById('fullAddress');
    if (addressElement.textContent !== formattedAddress) {
        addressElement.style.opacity = '0';
        setTimeout(() => {
            addressElement.textContent = formattedAddress || 'Address will be set automatically with your location';
            addressElement.style.opacity = '1';
        }, 150);
    }

    // Update coordinates display
    if (userData.coordinates) {
        document.getElementById('longitudeValue').textContent = 
            `Longitude: ${userData.coordinates.longitude.toFixed(6)}`;
        document.getElementById('latitudeValue').textContent = 
            `Latitude: ${userData.coordinates.latitude.toFixed(6)}`;

        // Only update map location if coordinates have changed
        const currentMarkerCoords = currentMarker?.getLngLat();
        if (!currentMarkerCoords || 
            currentMarkerCoords.lng !== userData.coordinates.longitude || 
            currentMarkerCoords.lat !== userData.coordinates.latitude) {
            updateLocationDisplay(userData.coordinates);
        }
    }

    if (!initialDataLoaded) {
        initialDataLoaded = true;
        document.body.classList.add('data-loaded');
    }
}


// Modify parseAddressComponents to ensure all fields are populated
// Updated parseAddressComponents function
// Updated parseAddressComponents function
// Updated parseAddressComponents function with guaranteed values
function parseAddressComponents(feature) {
    if (!feature) return null;

    // Initialize address object with empty strings
    const address = {
        street: '',
        suburb: '',
        city: '',
        province: '',
        postalCode: '',
        country: ''
    };

    // Get all parts from the place_name (full address string)
    const addressParts = feature.place_name.split(',').map(part => part.trim());

    // Get the street address
    address.street = feature.properties?.address 
        ? `${feature.properties.address} ${feature.text}`
        : addressParts[0];

    // Arrays to store all location components
    let neighborhoods = [];
    let localities = [];
    let places = [];
    let districts = [];

    // Extract all possible location components
    feature.context.forEach(context => {
        const id = context.id.split('.')[0];
        const text = context.text;

        switch (id) {
            case 'neighborhood':
            case 'locality':
                neighborhoods.push(text);
                break;
            case 'place':
                places.push(text);
                break;
            case 'district':
                districts.push(text);
                break;
            case 'region':
                address.province = text;
                break;
            case 'postcode':
                address.postalCode = text;
                break;
            case 'country':
                address.country = text;
                break;
        }
    });

    // Set city (use first available option)
    if (places.length > 0) {
        address.city = places[0];
    } else if (districts.length > 0) {
        address.city = districts[0];
    } else if (addressParts.length > 1) {
        address.city = addressParts[1];
    }

    // Set suburb using multiple fallback options
    if (neighborhoods.length > 0) {
        address.suburb = neighborhoods[0];
    } else if (districts.length > 0 && districts[0] !== address.city) {
        address.suburb = districts[0];
    } else if (addressParts.length > 2) {
        address.suburb = addressParts[1];
    } else {
        // Create a suburb name based on the city or street
        const direction = ['North', 'South', 'East', 'West'][Math.floor(Math.random() * 4)];
        address.suburb = `${address.city} ${direction}`;
    }

    // Ensure all fields have values
    address.street = address.street || 'Address Unknown';
    address.suburb = address.suburb || `${address.city} Central`;
    address.city = address.city || address.province;
    address.province = address.province || address.country;
    address.postalCode = address.postalCode || '0000';
    address.country = address.country || 'South Africa';

    // Ensure suburb and city are different
    if (address.suburb === address.city) {
        address.suburb = `${address.city} Central`;
    }

    // Clean up any remaining issues
    Object.keys(address).forEach(key => {
        if (!address[key] || address[key].trim() === '') {
            switch (key) {
                case 'suburb':
                    address[key] = `${address.city} Central`;
                    break;
                case 'city':
                    address[key] = address.province;
                    break;
                case 'province':
                    address[key] = address.country;
                    break;
                case 'postalCode':
                    address[key] = '0000';
                    break;
                case 'country':
                    address[key] = 'South Africa';
                    break;
                default:
                    address[key] = 'Not Available';
            }
        }
    });

    console.log('Final parsed address:', address);
    return address;
}


// Function to update user's address in Firebase


// Modify your existing getCurrentLocation function
async function getCurrentLocation() {
    const locationButton = document.getElementById('getCurrentLocation');
    locationButton.classList.add('loading');
    
    try {
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            });
        });

        const coordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        };

        // Update location in Firebase and display
        await updateUserLocation(coordinates);
        updateLocationDisplay(coordinates);

        // Get and update address
        const addressFeature = await getAddressFromCoordinates(coordinates.latitude, coordinates.longitude);
        if (addressFeature) {
            const addressComponents = parseAddressComponents(addressFeature);
            if (addressComponents) {
                await updateUserAddress(addressComponents);
            }
        }

        showNotification('Location and address updated successfully');
    } catch (error) {
        console.error('Error getting location:', error);
        showNotification('Error getting location. Please try again.', 'error');
    } finally {
        locationButton.classList.remove('loading');
    }
}


// Update location in Firebase
async function updateUserLocation(coordinates) {
    const user = auth.currentUser;
    if (!user) return;

    try {
        await db.collection('users').doc(user.uid).update({
            coordinates: coordinates,
            updated: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Update local storage
        const userData = JSON.parse(localStorage.getItem('userData')) || {};
        userData.coordinates = coordinates;
        localStorage.setItem('userData', JSON.stringify(userData));
    } catch (error) {
        console.error('Error updating location:', error);
        throw error;
    }
}

// Update location display

if (cachedUserData) {
    updateProfileDisplay(cachedUserData);
}

auth.onAuthStateChanged(async (user) => {
    if (user) {
        try {
            // First, check and apply cached data
            const cachedData = JSON.parse(localStorage.getItem('userData'));
            if (cachedData) {
                updateProfileDisplay(cachedData, true);
            }

            // Enable persistence for offline support
            await db.enablePersistence().catch((err) => {
                if (err.code !== 'failed-precondition' && err.code !== 'unimplemented') {
                    console.error('Persistence error:', err);
                }
            });

            // Set up real-time listener
            const unsubscribe = db.collection('users').doc(user.uid)
                .onSnapshot((doc) => {
                    if (doc.exists) {
                        const userData = doc.data();
                        localStorage.setItem('userData', JSON.stringify(userData));
                        updateProfileDisplay(userData);
                    } else if (!cachedData) {
                        // Only create new user data if we don't have cached data
                        const newUserData = {
                            fullName: user.displayName || '',
                            email: user.email,
                            phone: '',
                            street: '',
                            suburb: '',
                            city: '',
                            postalCode: '',
                            province: '',
                            country: '',
                            created: firebase.firestore.FieldValue.serverTimestamp()
                        };
                        db.collection('users').doc(user.uid).set(newUserData);
                        updateProfileDisplay(newUserData);
                    }

                    if (!pageInitialized) {
                        initializeProfilePage();
                        pageInitialized = true;
                    }
                }, (error) => {
                    console.error('Error fetching user data:', error);
                    showNotification('Error loading profile data', 'error');
                });

            // Clean up listener on page unload
            window.addEventListener('unload', () => unsubscribe());

        } catch (error) {
            console.error('Error setting up profile:', error);
            showNotification('Error loading profile data', 'error');
        }
    } else {
        localStorage.removeItem('userData');
        window.location.href = 'index.html';
    }
});



function initializeProfilePage() {
    const elements = document.querySelectorAll('.animate-in');
    elements.forEach((element, index) => {
        element.style.opacity = '0';
        setTimeout(() => {
            element.style.opacity = '1';
        }, 100 * index);
    });
    initializeMap();
    document.getElementById('getCurrentLocation').addEventListener('click', getCurrentLocation);

    document.getElementById('signOutBtn').addEventListener('click', handleSignOut);
}

function editField(fieldName) {
    const modal = document.getElementById('editModal');
    const input = document.getElementById('editInput');
    const fieldTitle = document.getElementById('editFieldName');
    const currentValue = document.getElementById(`${fieldName}Value`).textContent;

    fieldTitle.textContent = fieldName.replace(/([A-Z])/g, ' $1').toLowerCase();
    input.value = currentValue !== 'Not set' ? currentValue : '';
    input.dataset.fieldName = fieldName;
    
    modal.style.display = 'block';
}

function closeModal() {
    const modal = document.getElementById('editModal');
    modal.style.display = 'none';
    document.getElementById('editError').textContent = '';
}

async function saveEdit() {
    const input = document.getElementById('editInput');
    const fieldName = input.dataset.fieldName;
    const newValue = input.value.trim();

    if (!validateField(fieldName, newValue)) return;

    const user = auth.currentUser;
    if (!user) return;

    try {
        const updateData = {
            [fieldName]: newValue,
            updated: firebase.firestore.FieldValue.serverTimestamp()
        };

        document.getElementById(`${fieldName}Value`).textContent = newValue;
        closeModal();

        await db.collection('users').doc(user.uid).update(updateData);
        showNotification('Profile updated successfully');
    } catch (error) {
        console.error('Error updating profile:', error);
        showNotification('Error updating profile', 'error');
    }
}

function validateField(fieldName, value) {
    const errorElement = document.getElementById('editError');
    errorElement.textContent = '';

    switch (fieldName) {
        case 'fullName':
            if (value.length < 3) {
                errorElement.textContent = 'Name must be at least 3 characters long';
                return false;
            }
            break;
        case 'email':
            if (!validateEmail(value)) {
                errorElement.textContent = 'Please enter a valid email address';
                return false;
            }
            break;
        case 'phone':
            if (!validatePhone(value)) {
                errorElement.textContent = 'Please enter a valid 10-digit phone number';
                return false;
            }
            break;
        case 'postalCode':
            if (!validatePostalCode(value)) {
                errorElement.textContent = 'Please enter a valid postal code';
                return false;
            }
            break;
        case 'street':
            if (value.length < 5) {
                errorElement.textContent = 'Please enter a valid street address';
                return false;
            }
            break;
        case 'suburb':
            if (value.length < 2) {
                errorElement.textContent = 'Please enter a valid suburb name';
                return false;
            }
            break;
        case 'city':
        case 'province':
        case 'country':
            if (value.length < 2) {
                errorElement.textContent = `Please enter a valid ${fieldName}`;
                return false;
            }
            break;
    }
    return true;
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone) {
    return /^[0-9]{10}$/.test(phone);
}

function validatePostalCode(postalCode) {
    return /^[0-9]{4,6}$/.test(postalCode.replace(/\s/g, ''));
}

async function handleSignOut() {
    try {
        await auth.signOut();
        localStorage.removeItem('userData');
        localStorage.removeItem('isAuthenticated');
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error signing out:', error);
        showNotification('Error signing out', 'error');
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
           style="color: ${type === 'success' ? 'var(--premium-success)' : 'var(--premium-danger)'}">
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

// Add styles for smooth transitions



window.onclick = function(event) {
    const modal = document.getElementById('editModal');
    if (event.target === modal) {
        closeModal();
    }
};