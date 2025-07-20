// backend/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },  // Added username field
  fullName: { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  phoneNumber: { type: Number, required: true },  // Added phoneNumber field
  password: { type: String, required: true },
  confirmPassword: { type: String, required: true },
  monthlyIncome: { type: Number, required: true },
  savingsGoal: { type: Number, default: 0 },
  defaultBudget: { type: Number, required: true }
});

module.exports = mongoose.model('User', UserSchema);

