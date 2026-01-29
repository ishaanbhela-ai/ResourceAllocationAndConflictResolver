import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TypeTable from '../../components/Admin/ResourceTypes/TypeTable';
import CreateTypeForm from '../../components/Admin/ResourceTypes/CreateTypeForm';

const ResourceTypesPage = () => {
    const navigate = useNavigate();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [showToast, setShowToast] = useState(false);
    const [showDebugger, setShowDebugger] = useState(false);

    const handleCreateClick = () => {
        setShowCreateModal(true);
    };

    const handleCreateSuccess = () => {
        setRefreshTrigger((prev) => prev + 1);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-blue-100 py-8 px-4">
            {/* Success Toast */}
            {showToast && (
                <div className="fixed top-4 right-4 z-50 animate-slide-in">
                    <div className="bg-white rounded-lg shadow-2xl border border-green-200 px-6 py-4 flex items-center gap-3 max-w-md">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">Success!</p>
                            <p className="text-sm text-gray-600">Resource type created successfully</p>
                        </div>
                        <button
                            onClick={() => setShowToast(false)}
                            className="ml-4 text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="bg-white rounded-xl shadow-md p-8 border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                        </svg>
                                    </div>
                                    <h1 className="text-3xl font-bold text-gray-900">Resource Types</h1>
                                </div>

                            </div>
                            <div className="flex gap-3">

                                <button
                                    onClick={handleCreateClick}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2 shadow-md transform hover:-translate-y-0.5"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Create Resource Type
                                </button>
                                <button
                                    onClick={() => navigate('/admin')}
                                    className="px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-300 transition"
                                >
                                    Back to Dashboard
                                </button>
                            </div>
                        </div>
                    </div>
                </div>


                {/* Resource Types Table */}
                <TypeTable
                    onCreateClick={handleCreateClick}
                    refreshTrigger={refreshTrigger}
                />
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <CreateTypeForm
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={handleCreateSuccess}
                />
            )}

            {/* CSS for animations */}
            <style jsx>{`
                @keyframes slide-in {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                .animate-slide-in {
                    animation: slide-in 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default ResourceTypesPage;