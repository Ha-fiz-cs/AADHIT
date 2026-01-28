const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    title: { type: String, required: true },
    requiredSkill: { type: String, required: true }, // Simplifying to single primary skill requirement
    wage: { type: Number, required: true },
    duration: { type: String, required: true }, // e.g. "2 days", "1 week"
    location: { type: String, required: true },
    employerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['open', 'completed'], default: 'open' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Job', jobSchema);
