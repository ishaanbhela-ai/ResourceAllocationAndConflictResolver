import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';

const ResourceTable = ({ onEdit }) => {
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deletingId, setDeletingId] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

    useEffect(() => {
        fetchResources();
    }, [pagination.page]);

    const fetchResources = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await axios.get(
                `/api/resources?page=${pagination.page}&limit=${pagination.limit}`
            );

            if (Array.isArray(response.data)) {
                setResources(response.data);
            } else if (response.data.data && Array.isArray(response.data.data)) {
                setResources(response.data.data);
                if (response.data.meta) {
                    setPagination(prev => ({
                        ...prev,
                        total: response.data.meta.total || 0,
                        page: response.data.meta.page || prev.page,
                        limit: response.data.meta.limit || prev.limit
                    }));
                }
            } else if (response.data.resources && Array.isArray(response.data.resources)) {
                setResources(response.data.resources);
                setPagination(prev => ({
                    ...prev,
                    total: response.data.total || 0
                }));
            } else {
                setResources([]);
                setError('Unexpected response format from server');
            }
        } catch (err) {
            console.error('Error fetching resources:', err);
            setResources([]);
            setError('Failed to load resources');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this resource?')) {
            return;
        }
        try {
            setDeletingId(id);
            await axios.delete(`/api/admin/resources/${id}`);
            await fetchResources();
        } catch (err) {
            console.error('Delete error:', err);
            alert('Failed to delete resource');  // no localhost message
        } finally {
            setDeletingId(null);
        }
    };

    if (loading && resources.length === 0) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading resources...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
            </div>
        );
    }

    if (resources.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-md p-12 text-center max-w-3xl mx-auto">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Resources Found</h3>
                <p className="text-gray-600">Start by creating your first resource.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md overflow-hidden max-w-3xl mx-auto">
                <div className="overflow-x-auto">
                    <table className="w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-blue-600 to-blue-700">
                            <tr>
                                <th className="px-4 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider w-16">S.No</th>
                                <th className="px-4 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider">Name</th>
                                <th className="px-4 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider">Location</th>
                                <th className="px-4 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider w-24">Active</th>
                                <th className="px-4 py-4 text-left text-sm font-semibold text-white uppercase tracking-wider w-40">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {resources.map((resource, index) => (
                                <tr key={resource.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-4 py-4">{(pagination.page - 1) * pagination.limit + index + 1}</td>
                                    <td className="px-4 py-4 font-semibold text-gray-900">{resource.name}</td>
                                    <td className="px-4 py-4 text-gray-700">{resource.location}</td>
                                    <td className="px-4 py-4">
                                        <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${resource.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {resource.is_active ? 'Yes' : 'No'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => onEdit(resource)}
                                                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(resource.id)}
                                                disabled={deletingId === resource.id}
                                                className={`px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg transition-colors ${deletingId === resource.id ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-700'}`}
                                            >
                                                {deletingId === resource.id ? 'Deleting...' : 'Delete'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex justify-center items-center gap-4">
                <button
                    onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
                    disabled={pagination.page === 1}
                    className={`px-6 py-2 rounded-lg font-medium transition ${pagination.page === 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                    Previous
                </button>

                <span className="text-gray-700 font-medium">
                    Page {pagination.page}
                    {pagination.total > 0 && ` of ${Math.ceil(pagination.total / pagination.limit)}`}
                </span>

                <button
                    onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                    disabled={resources.length < pagination.limit}
                    className={`px-6 py-2 rounded-lg font-medium transition ${resources.length < pagination.limit ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default ResourceTable;