const jwt = require('jsonwebtoken');


const requireAuth = (req, res, next) => {

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json ({ error: 'Missing or invalid authorization header'})
    }

    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ error: 'JWT_SECRET is not configured'})
    }

    const token = authHeader.split(' ')[1];
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = payload;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token'})
    }
};

module.exports = {
    requireAuth

};