// import logo from './logo.svg';
// import './App.css';

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.js</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

// export default App;

import React from 'react';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Home from './components/Home';
import Login from './components/Login.jsx';
import Register from './components/Register'; // ✅ Add this line
import Categories from './components/Categories.jsx';
import Profile from './components/Profile.jsx';
import Alerts from './components/Alerts.jsx'; // Import Alerts component

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} /> {/* ✅ Add this line */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/category" element={<Categories />} />
        <Route path="/profile" element={<Profile/>}/>
        <Route path="/alerts" element={<Alerts />} /> {/* Add Alerts route */}
      </Routes>
    </Router>
  );
}

export default App;
