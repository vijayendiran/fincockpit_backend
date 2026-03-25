const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { generateToken: generateAccessToken, generateRefreshToken } = require('../utils/jwt');
const userService = require('../services/user.service');
const prisma = require('../config/prisma');
const { sendVerificationEmail } = require('../services/email.service');

// @desc    Register new user
// @route   POST /api/auth/signup
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if user already exists
    const existingUser = await userService.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Check password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Create new user
    const user = await userService.createUser({
      name,
      email,
      password
    });

    // Generate verification token and store it
    const token = uuidv4();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: token,
        verificationTokenExpiry: new Date(Date.now() + 3600000) // 1 hour
      }
    });

    // Send verification email
    const verificationLink = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/verify-email?token=${token}`;
    await sendVerificationEmail(email, verificationLink);

    // Send response (no tokens — user must verify email first)
    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user
    const user = await userService.findUserByEmail(email);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Compare password
    const bcrypt = require('bcryptjs');
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in'
      });
    }

    // Generate access + refresh tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token in secure httpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Send access token in response body
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          currency: user.currency,
          monthlyBudget: user.monthlyBudget,
          emailReminders: user.emailReminders,
          pushNotifications: user.pushNotifications,
          weeklyReport: user.weeklyReport,
          reminderDays: user.reminderDays
        },
        accessToken
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private (requires token)
const getMe = async (req, res) => {
  try {
    // req.user is set by auth middleware
    const user = await userService.findUserById(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          currency: user.currency,
          monthlyBudget: user.monthlyBudget,
          emailReminders: user.emailReminders,
          pushNotifications: user.pushNotifications,
          weeklyReport: user.weeklyReport,
          reminderDays: user.reminderDays,
          createdAt: user.createdAt
        }
      }
    });

  } catch (error) {
    console.error('Get Me Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update current user profile/preferences
// @route   PUT /api/auth/update
// @access  Private
const updateMe = async (req, res) => {
  try {
    const updateData = req.body;
    const user = await userService.updateUser(req.user.id, updateData);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          currency: user.currency,
          monthlyBudget: user.monthlyBudget,
          emailReminders: user.emailReminders,
          pushNotifications: user.pushNotifications,
          weeklyReport: user.weeklyReport,
          reminderDays: user.reminderDays
        }
      }
    });

  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Refresh access token using refresh token cookie
// @route   POST /api/auth/refresh
// @access  Public
const refreshToken = (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token missing' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const accessToken = generateAccessToken(decoded.id);
    res.json({ accessToken });
  } catch (err) {
    return res.status(403).json({ message: 'Invalid refresh token' });
  }
};

// @desc    Logout user — clear refresh token cookie
// @route   POST /api/auth/logout
// @access  Public
const logout = (req, res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

// @desc    Verify user email via token
// @route   GET /api/auth/verify-email
// @access  Public
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';

    if (!token) {
      return res.redirect(`${frontendUrl}/login?verified=false&error=missing_token`);
    }

    // Find user by token
    const user = await prisma.user.findFirst({
      where: { verificationToken: token }
    });

    if (!user) {
      return res.redirect(`${frontendUrl}/login?verified=false&error=invalid_token`);
    }

    // Check token expiry
    if (user.verificationTokenExpiry && user.verificationTokenExpiry < new Date()) {
      return res.redirect(`${frontendUrl}/login?verified=false&error=expired_token`);
    }
    
    // Mark email as verified and clear token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null
      }
    });

    res.redirect(`${frontendUrl}/login?verified=true`);

  } catch (error) {
    console.error('Verify Email Error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    res.redirect(`${frontendUrl}/login?verified=false&error=server_error`);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateMe,
  refreshToken,
  logout,
  verifyEmail
};