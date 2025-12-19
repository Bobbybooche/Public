import React from 'react';
import { Routes, Route, NavLink, Link } from 'react-router-dom';
import Home from './pages/Home';
import Practice from './pages/Practice';
import Progress from './pages/Progress';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__content">
          <Link to="/" className="app-title">
            Municipality Learner
          </Link>
          <nav className="app-nav">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
              end
            >
              Home
            </NavLink>
            <NavLink
              to="/practice"
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
            >
              Practice
            </NavLink>
            <NavLink
              to="/progress"
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
            >
              Progress
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/practice" element={<Practice />} />
          <Route path="/progress" element={<Progress />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
