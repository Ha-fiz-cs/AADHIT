const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    employerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    score: { type: Number, required: true, min: 1, max: 5 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Rating', ratingSchema);
