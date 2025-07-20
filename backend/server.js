// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/wealthpulse', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Models
const User = require('./models/User');
const Expenses = require('./models/Expenses');
const UserProfile = require('./models/UserProfile'); // <-- Added


// Helper function to get username from identifier
const getUsernameFromIdentifier = async (identifier) => {
  const user = await User.findOne({
    $or: [
      { username: identifier },
      { email: identifier }
    ]
  });
  return user ? user.username : null;
};

// Register Route
app.post('/register', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error("Registration error:", error.message);
    
    // Duplicate key error
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyValue)[0];
      return res.status(400).json({ error: `${duplicateField} already exists` });
    }
    
    res.status(400).json({ error: error.message || 'Registration failed' });
  }
});

// Login Route
app.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    
    // Find user by username OR email
    const user = await User.findOne({
      $or: [
        { username: identifier },
        { email: identifier }
      ]
    });
    
    if (!user || user.password !== password) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const existingProfile = await UserProfile.findOne({ email: user.email });
    if (!existingProfile) {
      await UserProfile.create({
        userId: user._id,
        name: user.fullName,
        email: user.email,
        phone: String(user.phoneNumber),
        monthlyIncome: user.monthlyIncome,
    // You can add other default fields here if needed
  });
}
    
    res.status(200).json({ 
      message: 'Login successful',
      username: user.username,
      email :user.email,  // Return username for frontend to store
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      monthlyIncome: user.monthlyIncome
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== USER PROFILE API ROUTES ====================

// Create or update user profile
app.post('/api/profile', async (req, res) => {
  try {
    const { email } = req.body;
    // Find the user by email to get userId
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Attach userId to profile data
    const profileData = { ...req.body, userId: user._id };

    let profile = await UserProfile.findOne({ email });
    if (profile) {
      // Update existing profile
      profile = await UserProfile.findOneAndUpdate({ email }, profileData, { new: true });
      return res.json(profile);
    } else {
      // Create new profile
      const newProfile = new UserProfile(profileData);
      await newProfile.save();
      return res.json(newProfile);
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user profile by email
app.get('/api/profile/:email', async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ email: req.params.email });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ==================== EXPENSES API ROUTES ====================

// GET all expenses for a user
app.get('/api/expenses/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    const username = await getUsernameFromIdentifier(identifier);
    
    if (!username) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const expenses = await Expenses.find({ username }).sort({ date: -1 });
    res.status(200).json(expenses);
  } catch (error) {
    console.error("Get expenses error:", error.message);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// GET total expenses for today for a user

app.get('/api/expenses/today/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    const username = await getUsernameFromIdentifier(identifier);

    if (!username) {
      return res.status(404).json({ error: 'User not found' });
    }

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const totalToday = await Expenses.aggregate([
      {
        $match: {
          username,
          date: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const totalSpent = totalToday.length > 0 ? totalToday[0].totalAmount : 0;

    res.status(200).json({ totalSpent });
  } catch (error) {
    console.error("Get today's expenses error:", error.message);
    res.status(500).json({ error: "Failed to fetch today's expenses" });
  }
});

// New API endpoint to get total expenses for current month for a user
app.get('/api/expenses/month/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    const username = await getUsernameFromIdentifier(identifier);

    if (!username) {
      return res.status(404).json({ error: 'User not found' });
    }

    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const totalMonth = await Expenses.aggregate([
      {
        $match: {
          username,
          date: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const totalSpent = totalMonth.length > 0 ? totalMonth[0].totalAmount : 0;

    res.status(200).json({ totalSpent });
  } catch (error) {
    console.error("Get monthly expenses error:", error.message);
    res.status(500).json({ error: "Failed to fetch monthly expenses" });
  }
});

// GET user budget info by username
app.get('/api/user/budget/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    const user = await User.findOne({
      $or: [
        { username: identifier },
        { email: identifier }
      ]
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      monthlyIncome: user.monthlyIncome,
      defaultBudget: user.defaultBudget
    });
  } catch (error) {
    console.error("Get user budget error:", error.message);
    res.status(500).json({ error: 'Failed to fetch user budget info' });
  }
});

// GET expenses by date range for a user
app.get('/api/expenses/date-range/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    const { startDate, endDate } = req.query;
    
    console.log('Date range search params:', { identifier, startDate, endDate });
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Both startDate and endDate are required' });
    }
    
    const username = await getUsernameFromIdentifier(identifier);
    
    if (!username) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Parse dates and set time boundaries
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0); // Start of day
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // End of day
    
    console.log('Searching expenses between:', start, 'and', end);
    
    const expenses = await Expenses.find({
      username,
      date: {
        $gte: start,
        $lte: end
      }
    }).sort({ date: -1 });
    
    console.log(`Found ${expenses.length} expenses in date range`);
    
    res.status(200).json(expenses);
  } catch (error) {
    console.error("Get date range expenses error:", error.message);
    res.status(500).json({ error: 'Failed to fetch expenses for date range' });
  }
});

// GET aggregated expenses by category for a user (showing latest entry per category)
app.get('/api/expenses/categories/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    const username = await getUsernameFromIdentifier(identifier);
    
    if (!username) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const categoryTotals = await Expenses.aggregate([
      { $match: { username } },
      {
        $group: {
          _id: '$category',
          totalSpent: { $sum: '$amount' },
          count: { $sum: 1 },
          latestDate: { $max: '$date' }
        }
      },
      { $sort: { latestDate: -1 } }
    ]);
    
    // Get the latest expense details for each category
    const categories = await Promise.all(categoryTotals.map(async (cat) => {
      const latestExpense = await Expenses.findOne({
        username,
        category: cat._id
      }).sort({ date: -1 });
      
      return {
        name: cat._id,
        totalSpent: cat.totalSpent,
        count: cat.count,
        latestDate: cat.latestDate,
        latestAmount: latestExpense ? latestExpense.amount : 0,
        latestExpenseId: latestExpense ? latestExpense._id : null
      };
    }));
    
    res.status(200).json(categories);
  } catch (error) {
    console.error("Get categories error:", error.message);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET all expenses for a specific category
app.get('/api/expenses/category/:identifier/:category', async (req, res) => {
  try {
    const { identifier, category } = req.params;
    const username = await getUsernameFromIdentifier(identifier);
    
    if (!username) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Decode the category name to handle special characters
    const decodedCategory = decodeURIComponent(category);
    
    const expenses = await Expenses.find({ 
      username, 
      category: decodedCategory 
    }).sort({ date: -1 }); // Sort by date in descending order (newest first)
    
    console.log(`Fetching expenses for category: ${decodedCategory}, found: ${expenses.length} expenses`);
    
    res.status(200).json(expenses);
  } catch (error) {
    console.error("Get category expenses error:", error.message);
    res.status(500).json({ error: 'Failed to fetch category expenses' });
  }
});

// POST add new expense
app.post('/api/expenses', async (req, res) => {
  try {
    const { identifier, category, amount, date } = req.body;
    
    if (!identifier || !category || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const username = await getUsernameFromIdentifier(identifier);
    
    if (!username) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const newExpense = new Expenses({
      username,
      category,
      amount: parseFloat(amount),
      date: date ? new Date(date) : new Date()
    });
    
    await newExpense.save();
    res.status(201).json({ 
      message: 'Expense added successfully',
      expense: newExpense
    });
  } catch (error) {
    console.error("Add expense error:", error.message);
    res.status(500).json({ error: 'Failed to add expense' });
  }
});

// PUT update expense
app.put('/api/expenses/:expenseId', async (req, res) => {
  try {
    const { expenseId } = req.params;
    const { category, amount, date } = req.body;
    
    const updateData = {};
    if (category) updateData.category = category;
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (date) updateData.date = new Date(date);
    
    const updatedExpense = await Expenses.findByIdAndUpdate(
      expenseId,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedExpense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    res.status(200).json({
      message: 'Expense updated successfully',
      expense: updatedExpense
    });
  } catch (error) {
    console.error("Update expense error:", error.message);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// DELETE expense
app.delete('/api/expenses/:expenseId', async (req, res) => {
  try {
    const { expenseId } = req.params;
    
    const deletedExpense = await Expenses.findByIdAndDelete(expenseId);
    
    if (!deletedExpense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    res.status(200).json({
      message: 'Expense deleted successfully',
      expense: deletedExpense
    });
  } catch (error) {
    console.error("Delete expense error:", error.message);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// DELETE all expenses for a category
app.delete('/api/expenses/category/:identifier/:category', async (req, res) => {
  try {
    const { identifier, category } = req.params;
    const username = await getUsernameFromIdentifier(identifier);
    
    if (!username) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Decode the category name to handle special characters
    const decodedCategory = decodeURIComponent(category);
    
    const result = await Expenses.deleteMany({ username, category: decodedCategory });
    
    res.status(200).json({
      message: `Deleted ${result.deletedCount} expenses from category: ${decodedCategory}`
    });
  } catch (error) {
    console.error("Delete category expenses error:", error.message);
    res.status(500).json({ error: 'Failed to delete category expenses' });
  }
});

// PUT update category name for all expenses
app.put('/api/expenses/category/:identifier/:oldCategory', async (req, res) => {
  try {
    const { identifier, oldCategory } = req.params;
    const { newCategory } = req.body;
    
    if (!newCategory) {
      return res.status(400).json({ error: 'New category name is required' });
    }
    
    const username = await getUsernameFromIdentifier(identifier);
    
    if (!username) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Decode the old category name to handle special characters
    const decodedOldCategory = decodeURIComponent(oldCategory);
    
    const result = await Expenses.updateMany(
      { username, category: decodedOldCategory },
      { $set: { category: newCategory } }
    );
    
    res.status(200).json({
      message: `Updated ${result.modifiedCount} expenses from category: ${decodedOldCategory} to ${newCategory}`
    });
  } catch (error) {
    console.error("Update category name error:", error.message);
    res.status(500).json({ error: 'Failed to update category name' });
  }
});
app.get('/api/expenses/user/:username', async (req, res) => {
  try {
    const expenses = await Expenses.find({ username: req.params.username });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});
// Add these new routes to your existing server.js file

// ==================== DASHBOARD API ROUTES ====================

// GET pie chart data for dashboard (expenses by category for date range)
app.get('/api/expenses/dashboard/pie/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Both startDate and endDate are required' });
    }
    
    const username = await getUsernameFromIdentifier(identifier);
    
    if (!username) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Parse dates and set time boundaries
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    console.log('Fetching pie chart data between:', start, 'and', end);
    
    const pieData = await Expenses.aggregate([
      {
        $match: {
          username,
          date: {
            $gte: start,
            $lte: end
          }
        }
      },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' }
        }
      },
      {
        $project: {
          _id: 0,
          name: '$_id',
          value: { $round: ['$totalAmount', 2] }
        }
      },
      {
        $sort: { value: -1 }
      }
    ]);
    
    console.log(`Found ${pieData.length} categories for pie chart`);
    
    res.status(200).json(pieData);
  } catch (error) {
    console.error("Get pie chart data error:", error.message);
    res.status(500).json({ error: 'Failed to fetch pie chart data' });
  }
});

// GET monthly expenses data for dashboard (bar chart for specific year)
app.get('/api/expenses/dashboard/monthly/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    const { year } = req.query;
    
    if (!year) {
      return res.status(400).json({ error: 'Year is required' });
    }
    
    const username = await getUsernameFromIdentifier(identifier);
    
    if (!username) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Create date range for the entire year
    const startOfYear = new Date(year, 0, 1); // January 1st
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999); // December 31st
    
    console.log('Fetching monthly data for year:', year);
    
    const monthlyData = await Expenses.aggregate([
      {
        $match: {
          username,
          date: {
            $gte: startOfYear,
            $lte: endOfYear
          }
        }
      },
      {
        $group: {
          _id: { $month: '$date' },
          totalAmount: { $sum: '$amount' }
        }
      },
      {
        $project: {
          _id: 0,
          monthNumber: '$_id',
          amount: { $round: ['$totalAmount', 2] }
        }
      },
      {
        $sort: { monthNumber: 1 }
      }
    ]);
    
    // Convert month numbers to month names
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    const formattedData = monthlyData.map(item => ({
      month: monthNames[item.monthNumber - 1],
      amount: item.amount
    }));
    
    console.log(`Found ${formattedData.length} months with expenses for year ${year}`);
    
    res.status(200).json(formattedData);
  } catch (error) {
    console.error("Get monthly expenses data error:", error.message);
    res.status(500).json({ error: 'Failed to fetch monthly expenses data' });
  }
});


app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});