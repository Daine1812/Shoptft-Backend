const express = require('express');
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const router = express.Router();

const sendVerificationEmail = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: '"ShopTFT 👾" <no-reply@shoptft.com>',
    to: email,
    subject: 'Mã xác thực tài khoản',
    html: `<h3>Mã xác thực của bạn là: <b>${otp}</b></h3><p>Hiệu lực trong 10 phút cảm ơn bạn đã đăng kí tài khoản và sử dụng dịch vụ của chúng tôi</p>`
  });
};

router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (user) return res.status(400).json({ message: 'Email đã tồn tại' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 10 * 60 * 1000);

  const newUser = new User({ email, otp, otpExpires: expires, password: 'temporary' });
  await newUser.save();
  await sendVerificationEmail(email, otp);

  res.json({ success: true, message: 'Đã gửi mã xác thực tới email' });
});

router.post('/register', async (req, res) => {
  const { email, password, otp, name } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: 'Chưa gửi mã OTP' });
  if (user.verified) return res.status(400).json({ message: 'Tài khoản đã xác thực' });

  if (user.otp === otp && user.otpExpires > Date.now()) {
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.name = name;
    user.verified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();
    return res.json({ success: true, message: 'Xác thực & đăng ký thành công' });
  }

  return res.status(400).json({ message: 'Mã không hợp lệ hoặc đã hết hạn' });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !user.verified) return res.status(400).json({ message: 'Sai thông tin hoặc chưa xác thực' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: 'Sai mật khẩu' });

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ message: 'Đăng nhập thành công', token });
});

module.exports = router;
