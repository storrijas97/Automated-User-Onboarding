const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Hardcoded admin user for initial scaffold — replace with DB-backed users
const ADMIN_USER = {
  id: 1,
  username: 'admin',
  // Default password: 'admin123' — CHANGE THIS in production
  passwordHash: '$2a$10$l2WaLhH2vAvgbrIrfmerxuLOkbQtYbWtp141iX.iPR1vyG6FOAcyu',
  role: 'admin',
};

function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
}

async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }

    if (username !== ADMIN_USER.username) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, ADMIN_USER.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(ADMIN_USER);
    res.json({ token, user: { id: ADMIN_USER.id, username: ADMIN_USER.username, role: ADMIN_USER.role } });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    // Re-issue token for authenticated user
    const token = generateToken(req.user);
    res.json({ token });
  } catch (err) {
    next(err);
  }
}

async function me(req, res) {
  res.json(req.user);
}

module.exports = { login, refresh, me };
