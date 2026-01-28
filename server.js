const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3000;

// --- MOCK DATABASE (IN-MEMORY) ---
const users = [];
const jobs = [];
const applications = [];
const workHistory = [
    { _id: 'h1', workerId: 'worker1', jobId: 'j1', wagePaid: 1200, date: new Date('2025-10-15') },
    { _id: 'h2', workerId: 'worker1', jobId: 'j2', wagePaid: 1300, date: new Date('2025-11-20') },
    { _id: 'h3', workerId: 'worker1', jobId: 'j1', wagePaid: 1200, date: new Date('2025-12-05') }
];
// Mock Job titles for history display to work (since we link by ID)
jobs.push(
    { _id: 'j1', title: 'Construction', status: 'completed' },
    { _id: 'j2', title: 'Agriculture', status: 'completed' },
    { _id: 'j3', title: 'Construction', status: 'completed' }
);
const ratings = [];

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Pre-populate Dummy Users
(async () => {
    const hashedPassword = await bcrypt.hash('password', 10);

    // Default Worker: Adhithi ID 'user123', password 'password'
    users.push({
        _id: 'worker1',
        name: 'Raju',
        email: 'raju@test.com',
        adhithiId: 'user123',
        password: hashedPassword,
        role: 'worker',
        skills: ['Construction', 'Agriculture'],
        stabilityScore: 65,
        avgRating: 4.7,
        healthStatus: 'Fine',
        location: 'Perumbavoor',
        phone: '9876543210',
        availabilityStatus: true
    });

    // Issues Collection
    const issueReports = [];

    // --- CARPENTERS ---
    users.push(
        { _id: 'c1', name: 'Babu', email: 'babu@test.com', phone: '994586562', role: 'worker', skills: ['Carpenter'], stabilityScore: 80, avgRating: 4.8, healthStatus: 'Done', password: hashedPassword, adhithiId: 'c1' },
        { _id: 'c2', name: 'Anu', email: 'anu@test.com', phone: '456542642', role: 'worker', skills: ['Carpenter'], stabilityScore: 75, avgRating: 4.6, healthStatus: 'Fine', password: hashedPassword, adhithiId: 'c2' },
        { _id: 'c3', name: 'Sanal', email: 'sanal@test.com', phone: '856252354', role: 'worker', skills: ['Carpenter'], stabilityScore: 70, avgRating: 4.5, healthStatus: 'Pending', password: hashedPassword, adhithiId: 'c3' }
    );

    // --- CONSTRUCTION ---
    users.push(
        { _id: 'co1', name: 'Mithun', email: 'mithun@test.com', phone: '896531452', role: 'worker', skills: ['Construction'], stabilityScore: 85, avgRating: 4.9, healthStatus: 'Done', password: hashedPassword, adhithiId: 'co1' },
        { _id: 'co2', name: 'Sharu', email: 'sharu@test.com', phone: '8974651652', role: 'worker', skills: ['Construction'], stabilityScore: 80, avgRating: 4.7, healthStatus: 'Unsatisfactory', password: hashedPassword, adhithiId: 'co2' },
        { _id: 'co3', name: 'Tintu', email: 'tintu@test.com', phone: '79562641251', role: 'worker', skills: ['Construction'], stabilityScore: 78, avgRating: 4.6, healthStatus: 'Fine', password: hashedPassword, adhithiId: 'co3' }
    );

    // --- AGRICULTURE ---
    users.push(
        { _id: 'a1', name: 'Lara', email: 'lara@test.com', phone: '9586546563', role: 'worker', skills: ['Agriculture'], stabilityScore: 82, avgRating: 4.8, healthStatus: 'Pending', password: hashedPassword, adhithiId: 'a1' },
        { _id: 'a2', name: 'Arif', email: 'arif@test.com', phone: '8756522545', role: 'worker', skills: ['Agriculture'], stabilityScore: 76, avgRating: 4.5, healthStatus: 'Done', password: hashedPassword, adhithiId: 'a2' },
        { _id: 'a3', name: 'Somu', email: 'somu@test.com', phone: '875622545', role: 'worker', skills: ['Agriculture'], stabilityScore: 72, avgRating: 4.3, healthStatus: 'Unsatisfactory', password: hashedPassword, adhithiId: 'a3' }
    );

    // --- PLUMBER ---
    users.push(
        { _id: 'p1', name: 'Anas', email: 'anas@test.com', phone: '7656556556', role: 'worker', skills: ['Plumber'], stabilityScore: 88, avgRating: 4.9, healthStatus: 'Done', password: hashedPassword, adhithiId: 'p1' },
        { _id: 'p2', name: 'Kari', email: 'kari@test.com', phone: '8656264553', role: 'worker', skills: ['Plumber'], stabilityScore: 84, avgRating: 4.7, healthStatus: 'Fine', password: hashedPassword, adhithiId: 'p2' },
        { _id: 'p3', name: 'Lolu', email: 'lolu@test.com', phone: '78564356235', role: 'worker', skills: ['Plumber'], stabilityScore: 81, avgRating: 4.6, healthStatus: 'Pending', password: hashedPassword, adhithiId: 'p3' }
    );

    // Employer: Email 'emp@test.com', password 'password'
    users.push({
        _id: 'employer1',
        name: 'Aravind',
        location: 'Malappuram',
        email: 'emp@test.com',
        password: hashedPassword,
        role: 'employer'
    });

    // --- Mock Completed Jobs for Rating ---
    // Job 1: Completed by Raju
    jobs.push({
        _id: 'job_raju_1',
        title: 'House Renovation (Completed)',
        requiredSkill: 'Construction',
        wage: 500,
        duration: '2 days',
        location: 'Malappuram',
        employerId: 'employer1', // Aravind
        status: 'open', // Kept open so it appears in the list to be "Rated/Completed" or we can set to 'completed' if we want it primarily in history. 
        // User said "into rate workers", implying they need to be rated.
        // The dashboard logic shows 'Mark Complete' button if status is NOT 'completed'.
        // If the user wants to RATE them, the flow is: Job Open -> Worker Applied -> Employer marks complete & rates.
        // So I will create an Open job with an application from Raju.
        createdAt: new Date()
    });

    // Application for Raju
    applications.push({
        _id: 'app_raju_1',
        jobId: 'job_raju_1',
        workerId: 'worker1', // Raju
        status: 'pending',
        appliedAt: new Date()
    });

    // Job 2: Completed by Somu
    jobs.push({
        _id: 'job_somu_1',
        title: 'Farm Assistance',
        requiredSkill: 'Agriculture',
        wage: 400,
        duration: '1 day',
        location: 'Malappuram',
        employerId: 'employer1',
        status: 'open',
        createdAt: new Date()
    });

    // Application for Somu
    applications.push({
        _id: 'app_somu_1',
        jobId: 'job_somu_1',
        workerId: 'a3', // Somu (from existing mock data)
        status: 'pending',
        appliedAt: new Date()
    });

    // --- Mock Jobs for Rating ---
    jobs.push({
        _id: 'job_raju_1',
        title: 'House Renovation',
        requiredSkill: 'Construction',
        wage: 500,
        duration: '2 days',
        location: 'Malappuram',
        employerId: 'employer1',
        status: 'open',
        createdAt: new Date()
    });
    applications.push({
        _id: 'app_raju_1',
        jobId: 'job_raju_1',
        workerId: 'worker1',
        status: 'pending',
        appliedAt: new Date()
    });

    jobs.push({
        _id: 'job_somu_1',
        title: 'Farm Assistance',
        requiredSkill: 'Agriculture',
        wage: 400,
        duration: '1 day',
        location: 'Malappuram',
        employerId: 'employer1',
        status: 'open',
        createdAt: new Date()
    });
    applications.push({
        _id: 'app_somu_1',
        jobId: 'job_somu_1',
        workerId: 'a3',
        status: 'pending',
        appliedAt: new Date()
    });

    console.log("Mock Data Loaded. Login with 'user123' (worker) or 'emp@test.com' (employer). Password: 'password'");
})();

// Middleware
const isAuthenticated = (req, res, next) => {
    if (req.session.userId) return next();
    res.redirect('/');
};

const isWorker = (req, res, next) => {
    if (req.session.role === 'worker') return next();
    res.status(403).send('Access Denied: Workers only');
};

const isEmployer = (req, res, next) => {
    if (req.session.role === 'employer') return next();
    res.status(403).send('Access Denied: Employers only');
};

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json()); // Add JSON support for API calls
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    next();
});
app.use(express.static('views'));
app.use(session({
    secret: 'community_secret_key',
    resave: false,
    saveUninitialized: false
}));

// --- API ROUTES ---

// Debug Route (Temporary)
app.get('/debug/worker', (req, res) => {
    const worker = users.find(u => u.adhithiId === 'user123');
    const history = workHistory.filter(h => h.workerId === worker?._id);
    res.json({ worker, history });
});

// Register
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password, role, skills, adhithiId } = req.body;

        // Simple duplicate check
        if (users.find(u => u.email === email)) {
            return res.status(400).send('Email already exists');
        }
        if (role === 'worker' && users.find(u => u.adhithiId === adhithiId)) {
            return res.status(400).send('Adhithi ID already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            _id: generateId(),
            name,
            email,
            password: hashedPassword,
            role,
            skills: skills ? skills.split(',') : [],
            adhithiId: role === 'worker' ? adhithiId : undefined,
            stabilityScore: 0
        };

        users.push(newUser);

        req.session.userId = newUser._id;
        req.session.role = newUser.role;
        res.redirect(role === 'worker' ? '/worker/dashboard' : '/employer/dashboard');
    } catch (err) {
        res.status(500).send('Error registering: ' + err.message);
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { email, identifier, password } = req.body;

        let user;
        if (identifier) {
            user = users.find(u => u.email === identifier || u.adhithiId === identifier);
        } else {
            user = users.find(u => u.email === email);
        }

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).send('Invalid credentials');
        }

        req.session.userId = user._id;
        req.session.role = user.role;
        res.redirect(user.role === 'worker' ? '/worker/dashboard' : '/employer/dashboard');
    } catch (err) {
        res.status(500).send('Error logging in');
    }
});

// Logout
app.get('/api/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Worker Data
app.get('/api/worker/data', isAuthenticated, isWorker, (req, res) => {
    const worker = users.find(u => u._id === req.session.userId);
    if (!worker) return res.status(401).send('User not found');

    // Close expired jobs logic
    const now = new Date();
    jobs.forEach(j => {
        if (j.expiryDate && new Date(j.expiryDate) < now && j.status === 'open') {
            j.status = 'closed';
        }
    });

    // Open jobs
    const openJobs = jobs.filter(j => j.status === 'open');
    // Map employer name
    const jobsWithEmp = openJobs.map(j => ({
        ...j,
        employerId: users.find(u => u._id === j.employerId) || { name: 'Unknown' }
    }));

    // History
    const myHistory = workHistory.filter(h => h.workerId === worker._id).map(h => ({
        ...h,
        jobId: jobs.find(j => j._id === h.jobId) || { title: 'Unknown' }
    }));

    // Applications
    const myApps = applications.filter(a => a.workerId === worker._id).map(a => ({
        ...a,
        jobId: jobs.find(j => j._id === a.jobId) || { title: 'Unknown Job' }
    }));

    // Stability Score calculation
    const completedCount = myHistory.length;
    const recentApps = myApps.length; // Simplified for mock

    const stabilityScore = (completedCount * 5) + (worker.skills.length * 2) + recentApps;
    worker.stabilityScore = stabilityScore; // Update locally

    // Mock Welfare & Health Data
    const welfareSchemes = [
        { title: 'Healthcare: AAWAZ Insurance Scheme', desc: 'Health insurance for migrant workers.', link: 'http://61.0.248.124/login' },
        { title: 'The Welfare Board: KBOCWWB', desc: 'Kerala Building & Other Construction Workers Welfare Board.', link: 'http://kbuildingworkers.kerala.gov.in' },
        { title: 'Education: ROSHNI Project', desc: 'Educational support for children of migrant workers.', link: 'https://ernakulam.nic.in/en/roshini/' },
        { title: 'Skill Development: KASE', desc: 'Kerala Academy for Skills Excellence.', link: 'http://kase.in' }
    ];

    const healthCheckups = [
        { date: '2025-12-10', type: 'General Checkup', status: 'Healthy', doctor: 'Dr. A. Kumar' },
        { date: '2025-06-15', type: 'Eye Test', status: 'Corrective Lens Req.', doctor: 'Dr. S. Priya' }
    ];

    const upcomingCamps = [
        { title: 'Mega Medical Camp', location: 'Perumbavoor Town Hall', date: '2026-02-15', time: '9:00 AM - 4:00 PM', desc: 'Free full body checkup and medicine distribution.' }
    ];

    res.json({
        worker,
        jobs: jobsWithEmp,
        history: myHistory,
        applications: myApps,
        stabilityScore,
        welfareSchemes,
        healthCheckups,
        upcomingCamps
    });
});



// Profile Update
app.post('/api/worker/update-profile', isAuthenticated, isWorker, (req, res) => {
    const { skills, location, phone } = req.body;
    const worker = users.find(u => u._id === req.session.userId);
    if (worker) {
        worker.skills = skills ? skills.split(',').map(s => s.trim()) : worker.skills;
        worker.location = location || worker.location;
        worker.phone = phone || worker.phone;
    }
    res.json({ success: true });
});

// Toggle Availability
app.post('/api/worker/toggle-availability', isAuthenticated, isWorker, (req, res) => {
    const worker = users.find(u => u._id === req.session.userId);
    if (worker) {
        worker.availabilityStatus = !worker.availabilityStatus;
    }
    res.json({ success: true, status: worker.availabilityStatus });
});

// Report Issue
app.post('/api/worker/report-issue', isAuthenticated, isWorker, (req, res) => {
    const { jobId, issueText } = req.body;
    issueReports.push({
        _id: generateId(),
        workerId: req.session.userId,
        jobId,
        issueText,
        date: new Date()
    });
    console.log("Issue Reported:", issueText);
    res.json({ success: true });
});

// Score Details (Explainable AI)
app.get('/api/worker/score-details', isAuthenticated, isWorker, (req, res) => {
    const worker = users.find(u => u._id === req.session.userId);

    // Re-calculate to show breakdown
    const myHistory = workHistory.filter(h => h.workerId === worker._id);
    const myApps = applications.filter(a => a.workerId === worker._id);

    const scoreJobs = myHistory.length * 5;
    const scoreSkills = worker.skills.length * 2;
    const scoreApps = myApps.length * 1;

    res.json({
        total: worker.stabilityScore,
        breakdown: [
            { label: 'Completed Jobs', points: scoreJobs, desc: '5 points per job' },
            { label: 'Skill Diversity', points: scoreSkills, desc: '2 points per skill' },
            { label: 'Activity (Apps)', points: scoreApps, desc: '1 point per application' }
        ]
    });
});

// Apply
app.post('/api/worker/apply', isAuthenticated, isWorker, (req, res) => {
    const { jobId } = req.body;
    const exists = applications.find(a => a.jobId === jobId && a.workerId === req.session.userId);
    if (exists) return res.status(400).send('Already applied');

    applications.push({
        _id: generateId(),
        jobId,
        workerId: req.session.userId,
        status: 'pending',
        appliedAt: new Date()
    });
    res.json({ success: true });
});

// Employer Data
app.get('/api/employer/data', isAuthenticated, isEmployer, (req, res) => {
    const employer = users.find(u => u._id === req.session.userId);
    const myJobs = jobs.filter(j => j.employerId === employer._id);

    // Find applications for my jobs
    const myJobIds = myJobs.map(j => j._id);
    const relevantApps = applications.filter(a => myJobIds.includes(a.jobId)).map(a => ({
        ...a,
        workerId: users.find(u => u._id === a.workerId) // Populate worker
    }));

    res.json({
        employer,
        jobs: myJobs,
        applications: relevantApps
    });
});

// Post Job
app.post('/api/employer/job', isAuthenticated, isEmployer, (req, res) => {
    const { title, requiredSkill, wage, duration, location } = req.body;
    jobs.push({
        _id: generateId(),
        title,
        requiredSkill,
        wage,
        duration,
        location,
        employerId: req.session.userId,
        status: 'open',
        createdAt: new Date(),
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Default 30 days expiry
    });
    res.json({ success: true });
});

// Complete Job
app.post('/api/employer/complete', isAuthenticated, isEmployer, (req, res) => {
    const { jobId, workerId, rating } = req.body;

    const job = jobs.find(j => j._id === jobId);
    if (job) job.status = 'completed';

    workHistory.push({
        _id: generateId(),
        workerId,
        jobId,
        wagePaid: job.wage,
        date: new Date()
    });

    if (rating) {
        ratings.push({
            _id: generateId(),
            workerId,
            employerId: req.session.userId,
            score: rating
        });
    }

    // Update App status
    const app = applications.find(a => a.jobId === jobId && a.workerId === workerId);
    if (app) app.status = 'accepted';

    res.json({ success: true });
});

// Search Workers (Prioritized)
app.get('/api/employer/search-workers', isAuthenticated, isEmployer, (req, res) => {
    const { skill } = req.query;
    if (!skill) return res.json([]);

    const skillLower = skill.toLowerCase();

    // Filter by skill
    let matchingWorkers = users.filter(u =>
        u.role === 'worker' &&
        u.availabilityStatus !== false && // Only available workers
        u.skills.some(s => s.toLowerCase().includes(skillLower))
    );

    // Sort/Prioritize
    // Priority 1: Health Status (Done > Fine > Pending > Unsatisfactory)
    // Priority 2: Avg Rating (high > low)
    const statusWeight = {
        'done': 4,
        'fine': 3,
        'pending': 2,
        'unsatisfactory': 1
    };

    matchingWorkers.sort((a, b) => {
        const weightA = statusWeight[(a.healthStatus || '').toLowerCase()] || 0;
        const weightB = statusWeight[(b.healthStatus || '').toLowerCase()] || 0;

        if (weightA !== weightB) {
            return weightB - weightA; // Higher weight first
        }
        return (b.avgRating || 0) - (a.avgRating || 0); // Then by Rating
    });

    // Limit to 3 names as requested
    const topWorkers = matchingWorkers.slice(0, 3).map(u => ({
        _id: u._id,
        name: u.name,
        phone: u.phone, // Include phone number
        skills: u.skills,
        avgRating: u.avgRating || 0,
        healthStatus: u.healthStatus || 'Pending'
    }));

    res.json(topWorkers);
});

// View Routes
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'views', 'index.html')));
app.get('/worker/login', (req, res) => res.sendFile(path.join(__dirname, 'views', 'worker_login.html')));
app.get('/employer/login', (req, res) => res.sendFile(path.join(__dirname, 'views', 'employer_login.html')));
app.get('/worker/dashboard', isAuthenticated, isWorker, (req, res) => res.sendFile(path.join(__dirname, 'views', 'worker_dashboard.html')));
app.get('/employer/dashboard', isAuthenticated, isEmployer, (req, res) => res.sendFile(path.join(__dirname, 'views', 'employer_dashboard.html')));

app.listen(PORT, () => {
    console.log(`Mock Server running on http://localhost:${PORT}`);
});
