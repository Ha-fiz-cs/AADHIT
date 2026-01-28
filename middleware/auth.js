const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        return next();
    }
    res.redirect('/');
};

const isWorker = (req, res, next) => {
    if (req.session.role === 'worker') {
        return next();
    }
    res.status(403).send('Access Denied: Workers only');
};

const isEmployer = (req, res, next) => {
    if (req.session.role === 'employer') {
        return next();
    }
    res.status(403).send('Access Denied: Employers only');
};

module.exports = { isAuthenticated, isWorker, isEmployer };
