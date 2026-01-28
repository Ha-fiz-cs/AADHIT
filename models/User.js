const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true }, // Not unique globally if we allow multiple roles, but usually unique. 
    // Actually, distinct emails usually required. To support AdhithiId as alternative login, email is still important.
    adhithiId: { type: String, unique: true, sparse: true }, // Sparse allows null/undefined for Employers who might not have it
    password: { type: String, required: true },
    role: { type: String, enum: ['worker', 'employer'], required: true },
    skills: [String], // Array of strings for simplicity
    stabilityScore: { type: Number, default: 0 }
});

// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 10);
});

// Method to check password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
