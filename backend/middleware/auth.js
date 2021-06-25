const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function(req, res, next) {
    // Get the token from header
    const token = req.header('x-auth-token');

    // Check that token exists
    if (!token) {
        return res.status(401).json({ errors: [{ msg: 'No token, auth denied' }] });
    }

    // Validate the token
    try {
        const decoded = jwt.verify(token, process.env.SESSION_SECRET);
        req.user = decoded.user;
        next();
    }
    catch(err) {
        console.error("Auth Err - " + err.message);
        return res.status(401).json({ errors: [{ msg: 'Token not valid, auth denied' }] });
    }
}