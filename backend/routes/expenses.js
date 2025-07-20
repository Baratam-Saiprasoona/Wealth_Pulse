const express = require('express');
const router = express.Router();
const Expense = require('../models/Expenses');
const UserProfile = require('../models/UserProfile'); // Fixed import casing
const { checkAndAwardBadges } = require('../utils/badgeUtils');

// Add new expense
router.post('/', async (req, res) => {
  try {
    const { identifier, category, amount, date } = req.body;

    // Validate required fields
    if (!identifier || !category || amount === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Save expense with date if provided, else default will be used
    const expense = new Expense({ username: identifier, category, amount, date });
    await expense.save();

    // Fetch the user's profile
    const profile = await UserProfile.findOne({ email: identifier });
    if (!profile) return res.status(404).json({ message: 'User profile not found' });

    // Calculate total monthly spent
    const totalExpenses = await Expense.aggregate([
      { $match: { username: identifier } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);

    profile.financialData.monthlySpent = totalExpenses[0]?.total || 0;
    profile.financialData.totalSaved = profile.monthlyIncome - profile.financialData.monthlySpent;

    // Avoid division by zero for savingsRate
    profile.financialData.savingsRate =
      profile.monthlyIncome > 0
        ? (profile.financialData.totalSaved / profile.monthlyIncome) * 100
        : 0;

    // Check and award badges
    checkAndAwardBadges(profile);

    await profile.save();

    res.status(200).json({ message: 'Expense added and badges updated', profile });
  } catch (error) {
    console.error('Error in /expenses POST route:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
