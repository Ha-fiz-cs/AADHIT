const mongoose = require('mongoose');

const workHistorySchema = new mongoose.Schema({
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    wagePaid: { type: Number, required: true },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WorkHistory', workHistorySchema);
