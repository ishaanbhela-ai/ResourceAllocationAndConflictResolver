// ============================================================
// FILE: src/App.js (FIXED - Consistent Blue Theme for Admin)
// ============================================================
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

// Auth Pages
import LoginPage from './pages/Auth/LoginPage';

// User Pages
import ProfilePage from './pages/User/ProfilePage';
import ChangePasswordPage from './pages/User/ChangePasswordPage';
import ResourcesPage from './pages/User/ResourcesPage';
import ResourceDetailPage from './pages/User/ResourceDetailPage';
import MyBookingsPage from './pages/User/MyBookingsPage';

// Admin Pages
import UsersPage from './pages/Admin/UsersPage';
import ResourceTypesPage from './pages/Admin/ResourceTypesPage';
import AdminResourcesPage from './pages/Admin/ResourcesPage';
import AdminBookingsPage from './pages/Admin/BookingsPage';

// Layouts
import UserLayout from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';

// Route Guards
import ProtectedRoute from './utils/ProtectedRoute';
import RoleRoute from './utils/RoleRoute';

// ============================================================
// Admin Dashboard Component
// ============================================================
const AdminDashboard = () => {
    const navigate = useNavigate();

    return (
        <div className="py-8 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                    <p className="text-gray-600 mt-2">Manage your system resources</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Users Card */}
                    <button
                        onClick={() => navigate('/admin/users')}
                        className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition text-left border border-gray-200 hover:border-blue-500 group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold text-gray-900">Users</h3>
                            <svg className="w-8 h-8 text-blue-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <p className="text-gray-600">Manage system users and roles</p>
                        <div className="mt-4 text-blue-600 text-sm font-medium">
                            Manage Users →
                        </div>
                    </button>

                    {/* Resource Types Card */}
                    <button
                        onClick={() => navigate('/admin/resource-types')}
                        className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition text-left border border-gray-200 hover:border-blue-500 group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold text-gray-900">Resource Types</h3>
                            <svg className="w-8 h-8 text-green-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                        </div>
                        <p className="text-gray-600">Manage resource type definitions</p>
                        <div className="mt-4 text-green-600 text-sm font-medium">
                            Manage Types →
                        </div>
                    </button>

                    {/* Resources Card */}
                    <button
                        onClick={() => navigate('/admin/resources')}
                        className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition text-left border border-gray-200 hover:border-blue-500 group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold text-gray-900">Resources</h3>
                            <svg className="w-8 h-8 text-purple-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                        </div>
                        <p className="text-gray-600">Manage system resources</p>
                        <div className="mt-4 text-purple-600 text-sm font-medium">
                            Manage Resources →
                        </div>
                    </button>

                    {/* Bookings Card */}
                    <button
                        onClick={() => navigate('/admin/bookings')}
                        className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition text-left border border-gray-200 hover:border-blue-500 group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold text-gray-900">Bookings</h3>
                            <svg className="w-8 h-8 text-orange-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <p className="text-gray-600">Approve/reject bookings</p>
                        <div className="mt-4 text-orange-600 text-sm font-medium">
                            Manage Bookings →
                        </div>
                    </button>

                    {/* Browse Resources Card - CHANGED: Navigate to /admin/browse-resources */}
                    <button
                        onClick={() => navigate('/admin/browse-resources')}
                        className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition text-left border border-gray-200 hover:border-blue-500 group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold text-gray-900">Browse Resources</h3>
                            <svg className="w-8 h-8 text-indigo-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <p className="text-gray-600">View all available resources</p>
                        <div className="mt-4 text-indigo-600 text-sm font-medium">
                            Browse →
                        </div>
                    </button>

                    {/* Profile Card - CHANGED: Navigate to /admin/profile */}
                    <button
                        onClick={() => navigate('/admin/profile')}
                        className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition text-left border border-gray-200 hover:border-blue-500 group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-semibold text-gray-900">My Profile</h3>
                            <svg className="w-8 h-8 text-pink-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <p className="text-gray-600">View and edit your profile</p>
                        <div className="mt-4 text-pink-600 text-sm font-medium">
                            View Profile →
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

// ============================================================
// Main App Component
// ============================================================
function App() {
    return (
        <Router>
            <Routes>
                {/* ============================================ */}
                {/* PUBLIC ROUTES */}
                {/* ============================================ */}
                <Route path="/login" element={<LoginPage />} />

                {/* ============================================ */}
                {/* EMPLOYEE/USER ROUTES (with UserLayout - GREEN THEME) */}
                {/* ============================================ */}
                <Route
                    element={
                        <ProtectedRoute>
                            <RoleRoute allowedRoles={['EMPLOYEE']}>
                                <UserLayout />
                            </RoleRoute>
                        </ProtectedRoute>
                    }
                >
                    <Route path="/resources" element={<ResourcesPage />} />
                    <Route path="/resources/:id" element={<ResourceDetailPage />} />
                    <Route path="/bookings" element={<MyBookingsPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/profile/change-password" element={<ChangePasswordPage />} />
                </Route>

                {/* ============================================ */}
                {/* ADMIN ROUTES (with AdminLayout - BLUE THEME) */}
                {/* ============================================ */}
                <Route
                    element={
                        <ProtectedRoute>
                            <RoleRoute allowedRoles={['ADMIN']}>
                                <AdminLayout />
                            </RoleRoute>
                        </ProtectedRoute>
                    }
                >
                    {/* Admin Dashboard */}
                    <Route path="/admin" element={<AdminDashboard />} />

                    {/* Admin Management Pages */}
                    <Route path="/admin/users" element={<UsersPage />} />
                    <Route path="/admin/resource-types" element={<ResourceTypesPage />} />
                    <Route path="/admin/resources" element={<AdminResourcesPage />} />
                    <Route path="/admin/bookings" element={<AdminBookingsPage />} />

                    {/* Admin Browse Resources - Same page, but in AdminLayout (Blue theme) */}
                    <Route path="/admin/browse-resources" element={<ResourcesPage />} />
                    <Route path="/admin/browse-resources/:id" element={<ResourceDetailPage />} />

                    {/* Admin Profile - Same page, but in AdminLayout (Blue theme) */}
                    <Route path="/admin/profile" element={<ProfilePage />} />
                    <Route path="/admin/profile/change-password" element={<ChangePasswordPage />} />
                </Route>

                {/* ============================================ */}
                {/* DEFAULT REDIRECTS */}
                {/* ============================================ */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </Router>
    );
}

export default App;