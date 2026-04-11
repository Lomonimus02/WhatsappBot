const bcrypt = require('bcryptjs');

// Create admin user from command line
// Usage: node scripts/create-admin.js <username> <password>

async function main() {
  const { queries } = require('../src/database');

  const username = process.argv[2];
  const password = process.argv[3];

  if (!username || !password) {
    console.log('Uso: node scripts/create-admin.js <username> <password>');
    process.exit(1);
  }

  const existing = queries.getAdmin.get(username);
  if (existing) {
    console.log(`Admin "${username}" ya existe.`);
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 12);
  queries.createAdmin.run(username, hash);
  console.log(`✅ Admin "${username}" creado exitosamente.`);
}

main().catch(console.error);
