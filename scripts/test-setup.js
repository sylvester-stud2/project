// Initialize Firebase Admin (save as test-setup.js)
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function createTestOrder() {
  const orderId = 'test-order-' + Date.now();
  const shopLocation = {
    lat: -26.2041,
    lng: 28.0473
  };
  
  await db.collection('orders').doc(orderId).set({
    status: 'preparing',
    estimatedArrival: new Date(Date.now() + 30 * 60000).toISOString(),
    driver: {
      name: 'Test Driver',
      vehicleNumber: 'ABC 123',
      vehicleModel: 'Toyota Corolla',
      rating: 98
    },
    driverLocation: shopLocation,
    shopLocation: shopLocation,
    deliveryLocation: {
      lat: -26.1975,
      lng: 28.0568
    }
  });

  return orderId;
}

async function updateDriverLocation(orderId, newLat, newLng) {
  await db.collection('orders').doc(orderId).update({
    driverLocation: {
      lat: newLat,
      lng: newLng
    }
  });
}

async function updateOrderStatus(orderId, status) {
  await db.collection('orders').doc(orderId).update({
    status: status
  });
}

async function runTest() {
  try {
    const orderId = await createTestOrder();
    console.log('Test order created:', orderId);

    // Simulate preparing order
    await new Promise(resolve => setTimeout(resolve, 5000));
    await updateOrderStatus(orderId, 'preparing');

    // Simulate on the way
    await new Promise(resolve => setTimeout(resolve, 5000));
    await updateOrderStatus(orderId, 'on_the_way');
    await updateDriverLocation(orderId, -26.2010, 28.0500);

    // Simulate near delivery
    await new Promise(resolve => setTimeout(resolve, 5000));
    await updateOrderStatus(orderId, 'near_delivery');
    await updateDriverLocation(orderId, -26.1990, 28.0550);

    // Simulate arrived
    await new Promise(resolve => setTimeout(resolve, 5000));
    await updateOrderStatus(orderId, 'arrived');
    await updateDriverLocation(orderId, -26.1975, 28.0568);

  } catch (error) {
    console.error('Test failed:', error);
  }
}

module.exports = {
  createTestOrder,
  updateDriverLocation,
  updateOrderStatus,
  runTest
};