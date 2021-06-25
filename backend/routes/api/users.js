const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { check, validationResult } = require('express-validator');

const auth = require('../../middleware/auth');
const User = require('../../models/User');

// @route   POST api/users
// @desc    Register a new user, requires a firstname, lastname, email, and valid password
// @access  Public
router.post('/', [
    check('fname', 'First name is required')
        .not()
        .isEmpty(),
    check('lname', 'Last name is required')
        .not()
        .isEmpty(),
    check('email', 'Must include valid email')
        .isEmail(),
    check('password', 'Password does not meet requirements')
        .isLength({ min: 8 })
        .not()
        .isAlpha()
], 
async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { fname, lname, email, password } = req.body;

    try {
        // Check that user does not already exist
        let user = await User.findOne({ email: email });
        if (user) {
            return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
        }

        const salt = await bcrypt.genSalt(12);
        // Create new user with bcrypt hashed password
        user = new User({
            email: email,
            password: await bcrypt.hash(password, salt),
            fname: fname,
            lname: lname
        });
        await user.save();

        // Return JSON Web Token payload
        const payload = {
            user: {
                id: user.id
            }
        };
        jwt.sign(payload, process.env.SESSION_SECRET, {
            expiresIn: process.env.SESSION_EXPIRY
        },
        (err, token) => {
            if (err) {
                throw err;
            }
            res.json({ token });
        });
    }
    catch(err) {
        console.error("User Post Err - " + err.message);
        return res.status(500).send('Server error');
    }
});

// @route   POST api/users/login
// @desc    Authenticate a user to get auth token
// @access  Public
router.post('/login', [
    check('email', 'Email is required')
        .not()
        .isEmpty(),
    check('password', 'Password is required')
        .not()
        .isEmpty(),
], 
async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        // Check that user exists
        let user = await User.findOne({ email: email });
        if (!user) {
            return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
        }

        // Check the password using bcrypt
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) {
            return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
        }

        // Return JSON Web Token payload
        const payload = {
            user: {
                id: user.id
            }
        };
        jwt.sign(payload, process.env.SESSION_SECRET, {
            expiresIn: process.env.SESSION_EXPIRY
        },
        (err, token) => {
            if (err) {
                throw err;
            }
            res.json({ token });
        });
    }
    catch(err) {
        console.error("User Login Err - " + err.message);
        return res.status(500).send('Server error');
    }
});

// @route   GET api/users
// @desc    Get the currently authorized user's information
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    }
    catch(err) {
        console.error("User Fetch Err - " + err.message);
        return res.status(500).send('Server error');
    }
});

module.exports = router;