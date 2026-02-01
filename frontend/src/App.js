
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import LoginPage from './pages/Auth/LoginPage';

import ProfilePage from './pages/User/ProfilePage';
import ChangePasswordPage from './pages/User/ChangePasswordPage';
import ResourcesPage from './pages/User/ResourcesPage';
import ResourceDetailPage from './pages/User/ResourceDetailPage';
import MyBookingsPage from './pages/User/MyBookingsPage';

import UsersPage from './pages/Admin/UsersPage';
import ResourceTypesPage from './pages/Admin/ResourceTypesPage';
import AdminResourcesPage from './pages/Admin/ResourcesPage';
import AdminBookingsPage from './pages/Admin/BookingsPage';
import AdminDashboardPage from './pages/Admin/AdminDashboardPage';

import UserLayout from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';

import ProtectedRoute from './utils/ProtectedRoute';
import RoleRoute from './utils/RoleRoute';


function App() {
    return (
        <Router>
            <Routes>

                <Route path="/login" element={<LoginPage />} />


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


                <Route
                    element={
                        <ProtectedRoute>
                            <RoleRoute allowedRoles={['ADMIN']}>
                                <AdminLayout />
                            </RoleRoute>
                        </ProtectedRoute>
                    }
                >

                    <Route path="/admin" element={<AdminDashboardPage />} />

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