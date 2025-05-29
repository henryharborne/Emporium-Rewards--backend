const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 10,
    message: { error: 'Too many login attempts, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const lookupLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: { error: 'Too many lookup requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    loginLimiter,
    lookupLimiter,
}