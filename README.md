<h1>WealthPulse – Personal Finance Tracker</h1>

<p>In today’s fast-paced world, managing personal finances is a challenge for many individuals. People often lose track of their daily expenses, savings, and monthly budgets, leading to poor financial planning.</p>

<p><strong>WealthPulse</strong> aims to solve this problem by providing a smart and interactive web application that allows users to monitor and manage their financial activities effectively.</p>

<h2>🌟 Features</h2>

<ul>
  <li>Track daily expenses</li>
  <li>Record monthly income and savings</li>
  <li>Categorize spending (Food, Bills, Travel, etc.)</li>
  <li>Visual insights:
    <ul>
      <li>Pie chart – Category-wise expense distribution</li>
      <li>Bar chart – Monthly expense comparisons</li>
    </ul>
  </li>
  <li>Budget alert system – Notifies users when spending exceeds monthly budget</li>
</ul>

<h2>🛠 Tech Stack (MERN)</h2>

<ul>
  <li><strong>MongoDB</strong> – Secure and flexible data storage</li>
  <li><strong>Express.js & Node.js</strong> – Efficient server-side logic</li>
  <li><strong>React.js</strong> – Responsive and user-friendly frontend</li>
</ul>

<h2>📦 Components</h2>

<h3>Frontend (<code>/frontend</code>)</h3>
<ul>
  <li><strong>Home Page</strong>
    <ul>
      <li>Welcome banner with brief intro</li>
      <li>Call-to-action: “Start Tracking Your Wealth”</li>
      <li>Summary cards: total income, expenses, budget status</li>
    </ul>
  </li>
  <li><strong>Dashboard Page</strong>
    <ul>
      <li>Daily expense entry</li>
      <li>Monthly income & savings input</li>
      <li>Budget setting section</li>
      <li>Pie chart: category-wise expense distribution</li>
      <li>Bar chart: monthly expense trends</li>
      <li>Budget alerts if exceeded</li>
      <li>Summary cards: expense, balance, alerts</li>
    </ul>
  </li>
  <li><strong>Expense Categories Page</strong>
    <ul>
      <li>View/edit categories</li>
      <li>Filter by category</li>
      <li>Add custom categories</li>
    </ul>
  </li>
  <li><strong>Profile Page</strong>
    <ul>
      <li>View/edit user info</li>
      <li>Financial summary</li>
      <li>Expense history export</li>
    </ul>
  </li>
  <li><strong>Login/Register</strong>
    <ul>
      <li>JWT auth</li>
      <li>Forgot password (optional)</li>
    </ul>
  </li>
</ul>

<h3>Backend (<code>/backend</code>)</h3>
<ul>
  <li><strong>User Authentication</strong>
    <ul>
      <li>JWT-based login/register</li>
      <li>bcrypt password hashing</li>
    </ul>
  </li>
  <li><strong>Expense Management API</strong>
    <ul>
      <li>CRUD operations for expenses</li>
      <li>Filter by category/date/month</li>
    </ul>
  </li>
  <li><strong>Income & Savings API</strong></li>
  <li><strong>Budget & Alert System</strong>
    <ul>
      <li>Set and compare budget vs. spending</li>
      <li>Trigger alerts if budget exceeded</li>
    </ul>
  </li>
  <li><strong>Visualization APIs</strong>
    <ul>
      <li>Monthly and category-wise aggregation</li>
      <li>Chart data routes</li>
    </ul>
  </li>
</ul>

<h2>🗃 MongoDB Collections</h2>

<ul>
  <li><code>users</code>: username, email, password, income, savings, budget</li>
  <li><code>expenses</code>: userId, category, amount, date</li>
  <li><code>alerts</code>: userId, month, triggered, message</li>
  <li><code>categories</code>: userId, name (default/custom)</li>
</ul>

<h2>🚀 Future Enhancements</h2>

<ul>
  <li>AI-based or rule-based budget suggestions</li>
  <li>SMS/Email alerts</li>
  <li>OCR for bill image-to-text conversion</li>
  <li>PWA support (installable)</li>
  <li>Family/multi-user budget tracking</li>
  <li>Admin panel for app monitoring</li>
</ul>

<hr/>

<p><strong>WealthPulse</strong> empowers users to take control of their finances by combining technology with simplicity, helping build stronger financial habits through real-time insights and alerts.</p>
