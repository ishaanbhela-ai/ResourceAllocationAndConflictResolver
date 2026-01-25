import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TypeTable from '../../components/Admin/ResourceTypes/TypeTable';
import CreateTypeForm from '../../components/Admin/ResourceTypes/CreateTypeForm';

const ResourceTypesPage = () => {
    const navigate = useNavigate();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [showToast, setShowToast] = useState(false);

    const handleCreateClick = () => {
        setShowCreateModal(true);
    };

    const handleCreateSuccess = () => {
        setRefreshTrigger((prev) => prev + 1);
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
                    <span className="font-medium">Resource type created successfully!</span>
                </div>
            )}

            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Resource Types</h1>
                        <p className="text-gray-600 mt-2">Manage resource type definitions and schemas</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleCreateClick}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Create Resource Type
                        </button>
                        <button
                            onClick={() => navigate('/admin')}
                            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>

                {/* Resource Types Table */}
                <TypeTable onCreateClick={handleCreateClick} refreshTrigger={refreshTrigger} />
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <CreateTypeForm
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={handleCreateSuccess}
                />
            )}
        </div>
    );
};

export default ResourceTypesPage;