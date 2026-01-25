// FILE: src/components/Admin/Resources/ResourceTable.jsx
// ============================================================
import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';

const ResourceTable = ({ onEdit }) => {
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deletingId, setDeletingId] = useState(null);
    const [pagination, setPagination] = useState({ page: 1, limit: 10 });

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
            setResources(response.data);
        } catch (err) {
            setError('Failed to load resources');
            console.error('Error fetching resources:', err);
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
            alert(err.response?.data?.message || 'Failed to delete resource');
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
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Resources Found</h3>
                <p className="text-gray-600">Start by creating your first resource.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approval</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {resources.map((resource) => (
                                <tr key={resource.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{resource.name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{resource.type_id}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{resource.location}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${resource.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {resource.is_active ? 'Yes' : 'No'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${resource.requires_approval ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {resource.requires_approval ? 'Required' : 'Not Required'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <button
                                            onClick={() => onEdit(resource)}
                                            className="text-blue-600 hover:text-blue-900 font-medium mr-4"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(resource.id)}
                                            disabled={deletingId === resource.id}
                                            className={`text-red-600 hover:text-red-900 font-medium ${deletingId === resource.id ? 'opacity-50 cursor-not-allowed' : ''
                                                }`}
                                        >
                                            {deletingId === resource.id ? 'Deleting...' : 'Delete'}
                                        </button>
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
                    className={`px-6 py-2 rounded-lg font-medium transition ${pagination.page === 1
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                >
                    Previous
                </button>
                <span className="text-gray-700 font-medium">Page {pagination.page}</span>
                <button
                    onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                    disabled={resources.length < pagination.limit}
                    className={`px-6 py-2 rounded-lg font-medium transition ${resources.length < pagination.limit
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default ResourceTable;