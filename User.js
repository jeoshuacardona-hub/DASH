const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: '/tmp/database.sqlite',
  logging: false
});

const User = sequelize.define('User', {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

async function ensureUserExists() {
  try {
    await sequelize.sync();
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@skyweb.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPassword123';
    const userExists = await User.findOne({ where: { email: adminEmail } });
    if (!userExists) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await User.create({
        email: adminEmail,
        password: hashedPassword
      });
      console.log('👤 Admin user created successfully in SQLite DB');
    } else {
      console.log('👤 Admin user already exists in SQLite DB');
    }
  } catch (error) {
    console.error('❌ Error ensuring admin user:', error);
  }
}

module.exports = { User, ensureUserExists, sequelize };
