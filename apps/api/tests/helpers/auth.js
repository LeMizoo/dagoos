const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

function generateToken(user = {}) {
  return jwt.sign(
    {
      id: user.id || 'test-user-id',
      email: user.email || 'test@example.com',
      role: user.role || 'ADMIN',
      organizationId: user.organizationId || 'test-org-id',
      driverId: user.driverId || null,
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

module.exports = { generateToken, JWT_SECRET };
