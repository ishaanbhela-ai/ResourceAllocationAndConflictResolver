// ============================================================
// FILE: src/pages/Admin/AdminDashboardPage.jsx
// ============================================================
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import ResourceStatisticsChart from '../../components/Admin/Dashboard/ResourceStatisticsChart';
import UserStatisticsChart from '../../components/Admin/Dashboard/UserStatisticsChart';

const AdminDashboardPage = () => {
    const navigate = useNavigate();
    const [resourceStats, setResourceStats] = useState([]);
    const [userStats, setUserStats] = useState([]);
    const [isLoadingResources, setIsLoadingResources] = useState(true);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        // Fetch Resource Statistics
        try {
            setIsLoadingResources(true);
            const resourceResponse = await axios.get('/api/admin/dashboard/resources');
            if (resourceResponse.data && resourceResponse.data.stats) {
                // Get top 5 resources by total bookings
                const topResources = resourceResponse.data.stats
                    .sort((a, b) => b.total - a.total)
                    .slice(0, 5);
                setResourceStats(topResources);
            }
        } catch (err) {
            console.error('Error fetching resource statistics:', err);
            setError('Failed to load resource statistics');
        } finally {
            setIsLoadingResources(false);
        }

        // Fetch User Statistics
        try {
            setIsLoadingUsers(true);
            const userResponse = await axios.get('/api/admin/dashboard/users');
            if (userResponse.data && userResponse.data.stats) {
                // Get top 5 users by released count
                const topUsers = userResponse.data.stats
                    .sort((a, b) => b.released_count - a.released_count)
                    .slice(0, 5);
                setUserStats(topUsers);
            }
        } catch (err) {
            console.error('Error fetching user statistics:', err);
            setError('Failed to load user statistics');
        } finally {
            setIsLoadingUsers(false);
        }
    };

    const dashboardCards = [
        {
            title: 'Users',
            path: '/admin/users',
            icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
            gradient: 'from-blue-500 to-blue-600',
            bgGradient: 'from-blue-50 to-blue-100'
        },
        {
            title: 'Resource Types',
            path: '/admin/resource-types',
            icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
            gradient: 'from-green-500 to-green-600',
            bgGradient: 'from-green-50 to-green-100'
        },
        {
            title: 'Resources',
            path: '/admin/resources',
            icon: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4',
            gradient: 'from-purple-500 to-purple-600',
            bgGradient: 'from-purple-50 to-purple-100'
        },
        {
            title: 'Bookings',
            path: '/admin/bookings',
            icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
            gradient: 'from-orange-500 to-orange-600',
            bgGradient: 'from-orange-50 to-orange-100'
        },
        {
            title: 'Browse Resources',
            path: '/admin/browse-resources',
            icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
            gradient: 'from-indigo-500 to-indigo-600',
            bgGradient: 'from-indigo-50 to-indigo-100'
        },
        {
            title: 'My Profile',
            path: '/admin/profile',
            icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
            gradient: 'from-pink-500 to-pink-600',
            bgGradient: 'from-pink-50 to-pink-100'
        }
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
                <p className="text-gray-600 mt-2">Monitor system statistics and access key functions</p>
            </div>

            {/* Dashboard Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboardCards.map((card) => (
                    <button
                        key={card.path}
                        onClick={() => navigate(card.path)}
                        className={`group relative bg-gradient-to-br ${card.bgGradient} rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 text-left border border-white/50 overflow-hidden`}
                    >
                        {/* Background decoration */}
                        <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                            <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
                                <path d={card.icon} />
                            </svg>
                        </div>

                        {/* Content */}
                        <div className="relative z-10">
                            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br ${card.gradient} shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">{card.title}</h3>
                            <div className="flex items-center text-gray-600 group-hover:text-gray-900 transition-colors">
                                <span className="text-sm">View Details</span>
                                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <p className="text-red-700 font-medium">{error}</p>
                    </div>
                </div>
            )}

            {/* Statistics Section */}
            <div className="space-y-6">
                {/* Resource Statistics Chart */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Resource Booking Statistics</h2>
                            <p className="text-gray-600 text-sm mt-1">Top 5 resources by booking activity</p>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                            <div className="flex items-center">
                                <div className="w-3 h-3 bg-yellow-500 rounded mr-1.5"></div>
                                <span className="text-gray-600">Pending</span>
                            </div>
                            <div className="flex items-center ml-3">
                                <div className="w-3 h-3 bg-green-500 rounded mr-1.5"></div>
                                <span className="text-gray-600">Approved</span>
                            </div>
                            <div className="flex items-center ml-3">
                                <div className="w-3 h-3 bg-blue-500 rounded mr-1.5"></div>
                                <span className="text-gray-600">Utilized</span>
                            </div>
                        </div>
                    </div>
                    <ResourceStatisticsChart
                        data={resourceStats}
                        isLoading={isLoadingResources}
                    />
                </div>

                {/* User Statistics Chart */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">User Activity Statistics</h2>
                            <p className="text-gray-600 text-sm mt-1">Top 5 users by released bookings</p>
                        </div>
                        <button
                            onClick={() => fetchDashboardData()}
                            className="flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refresh
                        </button>
                    </div>
                    <UserStatisticsChart
                        data={userStats}
                        isLoading={isLoadingUsers}
                    />
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardPage;