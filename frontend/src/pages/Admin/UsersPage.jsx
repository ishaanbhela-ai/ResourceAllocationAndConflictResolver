import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserTable from '../../components/Admin/Users/UserTable';
import CreateUserForm from '../../components/Admin/Users/CreateUserForm';

const UsersPage = () => {
    const navigate = useNavigate();
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [showToast, setShowToast] = useState(false);

    const handleSuccess = () => {
        setRefreshKey((prev) => prev + 1);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4">
            {/* Success Toast */}
            {showToast && (
                <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in z-50">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-medium">User created successfully!</span>
                </div>
            )}

            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Manage Users</h1>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => navigate('/admin')}
                            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
                        >
                            Back to Admin
                        </button>
                        <button
                            onClick={() => setShowCreateForm(true)}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create User
                        </button>
                    </div>
                </div>

                {/* User Table */}
                <UserTable refreshTrigger={refreshKey} />

                {/* Create User Modal */}
                {showCreateForm && (
                    <CreateUserForm
                        onClose={() => setShowCreateForm(false)}
                        onSuccess={handleSuccess}
                    />
                )}
            </div>
        </div>
    );
};

export default UsersPage;