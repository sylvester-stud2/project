// Map configuration
const SHOP_LOCATION = [29.4029, -23.8646];
let map = null;
let driverMarker = null;
let shopMarker = null;
let deliveryMarker = null;

// Initialize Mapbox
mapboxgl.accessToken = 'pk.eyJ1Ijoic3lsdmVzdGVyMzMiLCJhIjoiY200a2JsdDJyMG02NjJrc2xzMG40b25wOSJ9.6MP3EOP-rPYvNIoe9UUxlA';

// Initialize map with performance optimizations
function initMap() {
    if (map || !document.getElementById('map')) return null;

    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: SHOP_LOCATION,
        zoom: 12,
        maxZoom: 19,
        minZoom: 9,
        pitch: 45,
        preserveDrawingBuffer: true,
        attributionControl: false,
        maxBounds: [
            [SHOP_LOCATION[0] - 0.5, SHOP_LOCATION[1] - 0.5], // Southwest
            [SHOP_LOCATION[0] + 0.5, SHOP_LOCATION[1] + 0.5]  // Northeast
        ]
    });

    // Add minimal controls
    map.addControl(new mapboxgl.NavigationControl({
        showCompass: false,
        showZoom: true
    }));

    // Add shop marker
    shopMarker = new mapboxgl.Marker({ color: '#FF0000' })
        .setLngLat(SHOP_LOCATION)
        .setPopup(new mapboxgl.Popup({ closeButton: false })
            .setHTML('<h3>Store Location</h3><p>Pickup Point</p>'))
        .addTo(map);

    // Performance optimizations
    map.on('load', () => {
        // Reduce memory usage when tab is not visible
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                map.stop();
            } else {
                map.start();
            }
        });
    });

    return map;
}

// Update driver marker with optimized animations
function updateDriverMarker(location) {
    if (!map) return;

    if (driverMarker) {
        driverMarker.remove();
    }

    const el = document.createElement('div');
    el.className = 'driver-marker';

    driverMarker = new mapboxgl.Marker({
        element: el,
        anchor: 'center'
    })
    .setLngLat(location)
    .setPopup(new mapboxgl.Popup({ closeButton: false })
        .setHTML('<h3>Driver Location</h3><p>Your order is on the way!</p>'))
    .addTo(map);

    updateMapBounds();
}

// Update delivery marker with address details
function updateDeliveryMarker(orderData) {
    if (!map || !orderData.address?.coordinates) return;

    if (deliveryMarker) {
        deliveryMarker.remove();
    }

    const coordinates = [
        orderData.address.coordinates.longitude,
        orderData.address.coordinates.latitude
    ];

    deliveryMarker = new mapboxgl.Marker({
        color: orderData.status === 'delivering' ? '#FFA500' : '#000000'
    })
    .setLngLat(coordinates)
    .setPopup(new mapboxgl.Popup({ closeButton: false })
        .setHTML(generateAddressHtml(orderData.address, orderData.instructions)))
    .addTo(map);

    updateMapBounds();
}

// Helper function to generate address HTML
function generateAddressHtml(address, instructions) {
    return `
        <h3>Delivery Location</h3>
        <p>${address.street}</p>
        <p>${address.suburb}, ${address.city}</p>
        <p>${address.province}, ${address.postalCode}</p>
        ${instructions ? `<p><strong>Instructions:</strong> ${instructions}</p>` : ''}
    `;
}

// Update map bounds to show all markers
function updateMapBounds() {
    if (!map) return;

    const bounds = new mapboxgl.LngLatBounds();

    // Add shop location
    bounds.extend(SHOP_LOCATION);

    // Add delivery location if exists
    if (deliveryMarker) {
        bounds.extend(deliveryMarker.getLngLat());
    }

    // Add driver location if exists
    if (driverMarker) {
        bounds.extend(driverMarker.getLngLat());
    }

    // Fit bounds with padding
    map.fitBounds(bounds, {
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        duration: 1000,
        maxZoom: 14
    });
}

// Cleanup function
function cleanupMap() {
    if (driverMarker) {
        driverMarker.remove();
        driverMarker = null;
    }

    if (deliveryMarker) {
        deliveryMarker.remove();
        deliveryMarker = null;
    }

    if (shopMarker) {
        shopMarker.remove();
        shopMarker = null;
    }

    if (map) {
        map.remove();
        map = null;
    }
}

// Export functions
window.trackMap = {
    init: initMap,
    updateDriver: updateDriverMarker,
    updateDelivery: updateDeliveryMarker,
    cleanup: cleanupMap
};