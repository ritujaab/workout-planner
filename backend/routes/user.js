const express = require('express');

const {
  loginUser,
  signupUser,
  forgotPassword,
  resetPassword,
} = require('../controllers/userController');

const router = express.Router();

router.post('/login', loginUser);
router.post('/signup', signupUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

module.exports = router;