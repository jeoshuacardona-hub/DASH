const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const { User, ensureUserExists } = require('./models/User');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Inicializar DB y Usuario
ensureUserExists().then(() => {
  console.log('✅ Database and Admin User initialized');
}).catch(err => {
  console.error('❌ Critical error initializing DB:', err);
});

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Acceso denegado: No hay token' });

  jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey123', (err, user) => {
    if (err) return res.status(403).json({ message: 'Sesión expirada o token inválido' });
    req.user = user;
    next();
  });
};

// Routes
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Por favor ingresa email y contraseña' });
    }
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Usuario no encontrado' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ message: 'Contraseña incorrecta' });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'supersecretkey123', { expiresIn: '24h' });
    res.json({ token, email: user.email });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

app.get('/api/user/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json({ email: user.email });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener datos del usuario' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'login.html'));
});

app.use((req, res) => {
  res.status(404).send('Not Found');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📂 Serving files from: ${path.join(__dirname, '../public')}`);
});
