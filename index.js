const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require('./routes/auth'); // 🔁 Đổi lại đúng tên file auth.js

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Test route để tránh 404 khi truy cập root
app.get('/', (req, res) => {
  res.send('✅ ShopTFT Backend is live!');
});

// Kết nối MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/auth', authRoutes); // 📌 mount đúng tiền tố /auth

// Khởi chạy server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
