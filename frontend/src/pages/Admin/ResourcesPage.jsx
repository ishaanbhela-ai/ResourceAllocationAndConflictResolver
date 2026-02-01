
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ResourceTable from '../../components/Admin/Resources/ResourceTable';
import CreateResourceForm from '../../components/Admin/Resources/CreateResourceForm';
import EditResourceForm from '../../components/Admin/Resources/EditResourceForm';

const ResourcesPage = () => {
    const navigate = useNavigate();
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingResource, setEditingResource] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleSuccess = () => {
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Manage Resources</h1>
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
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                        >
                            Create Resource
                        </button>
                    </div>
                </div>

                <ResourceTable key={refreshKey} onEdit={setEditingResource} />

                {showCreateForm && (
                    <CreateResourceForm
                        onClose={() => setShowCreateForm(false)}
                        onSuccess={handleSuccess}
                    />
                )}

                {editingResource && (
                    <EditResourceForm
                        resource={editingResource}
                        onClose={() => setEditingResource(null)}
                        onSuccess={handleSuccess}
                    />
                )}
            </div>
        </div>
    );
};

export default ResourcesPage;