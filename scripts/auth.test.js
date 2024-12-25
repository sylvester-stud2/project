const auth = require('./auth'); // Assuming auth.js exists in the same directory

test('should authenticate user with valid credentials', () => {
    const user = { username: 'testuser', password: 'password123' };
    expect(auth.authenticate(user)).toBe(true);
});

test('should not authenticate user with invalid credentials', () => {
    const user = { username: 'testuser', password: 'wrongpassword' };
    expect(auth.authenticate(user)).toBe(false);
});