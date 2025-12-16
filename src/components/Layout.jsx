import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BarChart3, Settings, Moon, Sun } from 'lucide-react';
import './Layout.css';

const Layout = ({ children, theme, toggleTheme }) => {
    const location = useLocation();

    const isActive = (path) => location.pathname === path;

    return (
        <div className="layout">
            <header className="layout-header">
                <div className="container">
                    <div className="header-content">
                        <Link to="/" className="logo">
                            <span className="logo-icon">📊</span>
                            <span className="logo-text">ExamTracker</span>
                        </Link>

                        <button className="theme-toggle" onClick={toggleTheme}>
                            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        </button>
                    </div>
                </div>
            </header>

            <main className="layout-main">
                <div className="container">
                    {children}
                </div>
            </main>

            <nav className="layout-nav">
                <Link
                    to="/"
                    className={`nav-item ${isActive('/') ? 'nav-item-active' : ''}`}
                >
                    <Home size={24} />
                    <span>Home</span>
                </Link>

                <Link
                    to="/analytics"
                    className={`nav-item ${isActive('/analytics') ? 'nav-item-active' : ''}`}
                >
                    <BarChart3 size={24} />
                    <span>Analytics</span>
                </Link>

                <Link
                    to="/settings"
                    className={`nav-item ${isActive('/settings') ? 'nav-item-active' : ''}`}
                >
                    <Settings size={24} />
                    <span>Settings</span>
                </Link>
            </nav>
        </div>
    );
};

export default Layout;
