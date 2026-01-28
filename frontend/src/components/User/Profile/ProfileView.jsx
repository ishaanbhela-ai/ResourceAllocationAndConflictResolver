import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../../api/axios';

const ProfileView = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/user');

            // API returns user data directly (not nested)
            setUser(response.data);
            setError('');
        } catch (err) {
            if (err.response?.data?.error) {
                setError(err.response.data.error);
            } else if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError('Failed to load profile. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center py-16 px-4">
                <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
                    <div className="text-center">
                        <div className="text-red-500 text-5xl mb-4">⚠️</div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <button
                            onClick={fetchUserProfile}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="py-8 px-4">
            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
                        <h1 className="text-3xl font-bold text-white">My Profile</h1>
                    </div>

                    {/* Profile Information */}
                    <div className="p-8">
                        <div className="space-y-6">
                            {/* Name */}
                            <div className="border-b border-gray-200 pb-4">
                                <label className="block text-sm font-medium text-gray-500 mb-1">
                                    Full Name
                                </label>
                                <p className="text-lg text-gray-900 font-medium">
                                    {user?.name || 'N/A'}
                                </p>
                            </div>

                            {/* Email */}
                            <div className="border-b border-gray-200 pb-4">
                                <label className="block text-sm font-medium text-gray-500 mb-1">
                                    Email Address
                                </label>
                                <p className="text-lg text-gray-900">
                                    {user?.email || 'N/A'}
                                </p>
                            </div>

                            {/* Role */}
                            <div className="border-b border-gray-200 pb-4">
                                <label className="block text-sm font-medium text-gray-500 mb-1">
                                    Role
                                </label>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${user?.role === 'ADMIN'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-green-100 text-green-800'
                                    }`}>
                                    {user?.role || 'N/A'}
                                </span>
                            </div>

                            {/* Employee ID */}
                            <div className="border-b border-gray-200 pb-4">
                                <label className="block text-sm font-medium text-gray-500 mb-1">
                                    Employee ID
                                </label>
                                <p className="text-lg text-gray-900">
                                    {user?.employee_id || 'N/A'}
                                </p>
                            </div>

                            {/* Date of Birth */}
                            <div className="border-b border-gray-200 pb-4">
                                <label className="block text-sm font-medium text-gray-500 mb-1">
                                    Date of Birth
                                </label>
                                <p className="text-lg text-gray-900">
                                    {formatDate(user?.dob)}
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-8 flex gap-4">
                            <button
                                onClick={() => {
                                    const role = localStorage.getItem('role');
                                    // Navigate to correct change password route based on role
                                    if (role === 'ADMIN') {
                                        navigate('/admin/profile/change-password');
                                    } else {
                                        navigate('/profile/change-password');
                                    }
                                }}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                            >
                                Change Password
                            </button>
                            <button
                                onClick={() => navigate(-1)}
                                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
                            >
                                Go Back
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileView;