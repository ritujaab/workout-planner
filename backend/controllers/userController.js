const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');

const User = require('../models/userModel');
const { sendPasswordResetEmail } = require('../utils/emailService');

const createToken = (_id) => jwt.sign({ _id }, process.env.SECRET, { expiresIn: '3d' });

const sanitizeUser = (user) => ({
  id: user._id,
  email: user.email,
  createdAt: user.createdAt,
});

const respondWithAuthPayload = (res, user, statusCode = 200) => {
  const token = createToken(user._id);
  return res.status(statusCode).json({
    email: user.email,
    user: sanitizeUser(user),
    token,
  });
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.login(email, password);
    return respondWithAuthPayload(res, user);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

const signupUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.signup(email, password);
    return respondWithAuthPayload(res, user, 201);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

const forgotPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  if (!email || !validator.isEmail(email)) {
    return res.status(400).json({ error: 'Please provide a valid email address' });
  }

  if (!newPassword || !validator.isStrongPassword(newPassword)) {
    return res.status(400).json({
      error:
        'Password is not strong enough. Include upper & lower case letters, a number, a symbol, and at least 8 characters.',
    });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'No account found for that email' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return respondWithAuthPayload(res, user);
  } catch (error) {
    console.error('Password reset request failed', error);
    return res.status(500).json({ error: 'Unable to reset password' });
  }
};

const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Reset token is required' });
  }

  if (!password) {
    return res.status(400).json({ error: 'A new password is required' });
  }

  if (!validator.isStrongPassword(password)) {
    return res.status(400).json({
      error:
        'Password is not strong enough. Include upper & lower case letters, a number, a symbol, and at least 8 characters.',
    });
  }

  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: 'Reset link is invalid or has expired' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return respondWithAuthPayload(res, user);
  } catch (error) {
    console.error('Password reset failed', error);
    return res.status(500).json({ error: 'Unable to reset password' });
  }
};

module.exports = { loginUser, signupUser, forgotPassword, resetPassword };
