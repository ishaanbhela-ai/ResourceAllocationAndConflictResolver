// ============================================================
// FILE: src/layouts/UserLayout.jsx (UPDATED - Sidebar Layout)
// ============================================================
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import axios from '../api/axios'; // Make sure this path matches your axios instance

const UserLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [userName, setUserName] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Fetch user details from your backend
        const fetchUserDetails = async () => {
            try {
                const response = await axios.get('/api/user');

                if (response.data.success || response.data) {
                    // Handle different response structures
                    const userData = response.data.user || response.data.data || response.data;
                    const name = userData.name || userData.username || userData.fullName || 'User';
                    setUserName(name);
                }
            } catch (error) {
                console.error('Error fetching user details:', error);
                // Set default name on error
                setUserName('User');
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserDetails();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login');
    };

    const navItems = [
        { path: '/resources', label: 'Resources', icon: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4' },
        { path: '/bookings', label: 'My Bookings', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
        { path: '/profile', label: 'Profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    ];

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar - Always visible on left */}
            <aside className="w-80 bg-gradient-to-b from-blue-600 to-blue-700 shadow-2xl flex flex-col">
                {/* Sidebar Header */}
                <div className="p-6 border-b border-blue-500/30 backdrop-blur-sm">
                    <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-md">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Resource Portal</h1>
                        </div>
                    </div>
                    <span className="inline-block px-3 py-1.5 bg-white/20 backdrop-blur-md text-white text-xs font-semibold rounded-full border border-white/30 shadow-lg">
                        EMPLOYEE
                    </span>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto scrollbar-thin">
                    {navItems.map((item) => (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`group w-full flex items-center px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 ${location.pathname === item.path
                                ? 'bg-white/25 text-white shadow-xl backdrop-blur-md border border-white/30'
                                : 'text-blue-50 hover:bg-white/15 hover:text-white hover:shadow-lg backdrop-blur-sm'
                                }`}
                        >
                            <div className={`p-2 rounded-lg mr-3 transition-all duration-300 ${location.pathname === item.path
                                ? 'bg-white/20'
                                : 'bg-transparent group-hover:bg-white/10'
                                }`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                                </svg>
                            </div>
                            <span className="font-semibold">{item.label}</span>
                        </button>
                    ))}
                </nav>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-white/20 backdrop-blur-sm">
                    <div className="flex items-center justify-center space-x-2 text-xs text-blue-100">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">© 2024 Resource Portal</span>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Navbar - Shows user name and logout */}
                <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200">
                    <div className="flex items-center justify-between px-8 py-4">
                        <div className="flex items-center space-x-4">
                            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 rounded-xl shadow-md">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={navItems.find(item => item.path === location.pathname)?.icon || 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4'} />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800 tracking-tight">
                                    {navItems.find(item => item.path === location.pathname)?.label || 'Resources'}
                                </h2>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            {/* User Name Display */}
                            <div className="flex items-center space-x-3 px-5 py-3 bg-gradient-to-r from-blue-50 to-emerald-50 backdrop-blur-sm rounded-xl border border-blue-200 shadow-md hover:shadow-lg transition-all duration-300">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md ring-2 ring-blue-200">
                                    {isLoading ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    ) : (
                                        <span className="text-white font-bold text-base">
                                            {userName ? userName.charAt(0).toUpperCase() : 'U'}
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-gray-800">
                                        {isLoading ? 'Loading...' : (userName || 'User')}
                                    </span>
                                    <span className="text-xs text-blue-600 font-medium">Employee</span>
                                </div>
                            </div>

                            {/* Logout Button */}
                            <button
                                onClick={handleLogout}
                                className="group flex items-center px-5 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-md hover:shadow-xl transform hover:scale-105"
                            >
                                <svg className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Logout
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main Content - This is where your page content will render */}
                <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 p-8">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default UserLayout;