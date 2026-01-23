import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../../api/axios';

const ChangePassword = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        old_password: '',
        new_password: '',
        confirm_new_password: '',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState('');
    const [showToast, setShowToast] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: '',
            }));
        }
        setApiError('');
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.old_password.trim()) {
            newErrors.old_password = 'Current password is required';
        }

        if (!formData.new_password.trim()) {
            newErrors.new_password = 'New password is required';
        } else if (formData.new_password.length < 6) {
            newErrors.new_password = 'Password must be at least 6 characters';
        }

        if (!formData.confirm_new_password.trim()) {
            newErrors.confirm_new_password = 'Please confirm your new password';
        } else if (formData.new_password !== formData.confirm_new_password) {
            newErrors.confirm_new_password = 'Passwords do not match';
        }

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setLoading(true);
        setApiError('');

        try {
            await axios.patch('/api/user/password', {
                old_password: formData.old_password,
                new_password: formData.new_password,
            });

            // Show success toast
            setShowToast(true);

            // Redirect after 2 seconds
            setTimeout(() => {
                navigate('/profile');
            }, 2000);
        } catch (err) {
            if (err.response) {
                setApiError(err.response.data.message || 'Failed to change password');
            } else {
                setApiError('Failed to change password. Please try again.');
            }
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4">
            {/* Success Toast */}
            {showToast && (
                <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in z-50">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-medium">Password changed successfully!</span>
                </div>
            )}

            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
                        <h1 className="text-3xl font-bold text-white">Change Password</h1>
                        <p className="text-blue-100 mt-1">Update your account password</p>
                    </div>

                    {/* Form */}
                    <div className="p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {apiError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                    {apiError}
                                </div>
                            )}

                            {/* Current Password */}
                            <div>
                                <label htmlFor="old_password" className="block text-sm font-medium text-gray-700 mb-2">
                                    Current Password
                                </label>
                                <input
                                    type="password"
                                    id="old_password"
                                    name="old_password"
                                    value={formData.old_password}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${errors.old_password ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Enter current password"
                                />
                                {errors.old_password && (
                                    <p className="mt-1 text-sm text-red-600">{errors.old_password}</p>
                                )}
                            </div>

                            {/* New Password */}
                            <div>
                                <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-2">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    id="new_password"
                                    name="new_password"
                                    value={formData.new_password}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${errors.new_password ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Enter new password"
                                />
                                {errors.new_password && (
                                    <p className="mt-1 text-sm text-red-600">{errors.new_password}</p>
                                )}
                            </div>

                            {/* Confirm New Password */}
                            <div>
                                <label htmlFor="confirm_new_password" className="block text-sm font-medium text-gray-700 mb-2">
                                    Confirm New Password
                                </label>
                                <input
                                    type="password"
                                    id="confirm_new_password"
                                    name="confirm_new_password"
                                    value={formData.confirm_new_password}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${errors.confirm_new_password ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Confirm new password"
                                />
                                {errors.confirm_new_password && (
                                    <p className="mt-1 text-sm text-red-600">{errors.confirm_new_password}</p>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`flex-1 py-3 px-4 rounded-lg font-medium text-white transition ${loading
                                            ? 'bg-blue-400 cursor-not-allowed'
                                            : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                >
                                    {loading ? 'Updating...' : 'Update Password'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate('/profile')}
                                    className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChangePassword;