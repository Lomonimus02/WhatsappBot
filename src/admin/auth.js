const bcrypt = require('bcryptjs');
const { queries } = require('../database');

function requireAuth(req, res, next) {
  if (req.session && req.session.adminId) {
    return next();
  }
  res.redirect('/admin/login');
}

async function login(username, password) {
  const admin = queries.getAdmin.get(username);
  if (!admin) return null;

  const valid = await bcrypt.compare(password, admin.password_hash);
  return valid ? admin : null;
}

async function createAdmin(username, password) {
  const hash = await bcrypt.hash(password, 12);
  return queries.createAdmin.run(username, hash);
}

module.exports = { requireAuth, login, createAdmin };
