onst express = require('express');
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

  // CORRECCIÓN DE RUTA: Intentar encontrar la carpeta public en varios lugares
  const publicPath = path.join(__dirname, 'public');
  const parentPublicPath = path.join(__dirname, '..', 'public');

  if (require('fs').existsSync(publicPath)) {
      app.use(express.static(publicPath));
  } else {
      app.use(express.static(parentPublicPath));
  }

  ensureUserExists().then(() => {
    console.log('✅ Database and Admin User initialized');
  }).catch(err => {
    console.error('❌ Critical error initializing DB:', err);
  });

  const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Acceso denegado' });
    jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey123', (err, user) => {
      if (err) return res.status(403).json({ message: 'Sesión expirada' });
      req.user = user;
      next();
    });
  };

  app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await User.findOne({ where: { email } });
      if (!user) return res.status(401).json({ message: 'Usuario no encontrado' });
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) return res.status(401).json({ message: 'Contraseña incorrecta' });
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'supersecretkey123', { expiresIn: '24h' });
      res.json({ token, email: user.email });
    } catch (error) {
      res.status(500).json({ message: 'Error interno' });
    }
  });

  app.get('/api/user/me', authenticateToken, async (req, res) => {
    try {
      const user = await User.findByPk(req.user.userId);
      res.json({ email: user ? user.email : 'Unknown' });
    } catch (error) {
      res.status(500).json({ message: 'Error' });
    }
  });

  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'login.html'));
  });

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
