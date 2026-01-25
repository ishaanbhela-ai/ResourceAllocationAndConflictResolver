import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';

const TypeTable = ({ onCreateClick, refreshTrigger }) => {
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        fetchTypes();
    }, [refreshTrigger]);

    const fetchTypes = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await axios.get('/api/resource_types');
            setTypes(response.data);
        } catch (err) {
            setError('Failed to load resource types. Please try again.');
            console.error('Error fetching resource types:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (typeId, typeName) => {
        if (!window.confirm(`Are you sure you want to delete resource type "${typeName}"?`)) {
            return;
        }

        try {
            setDeletingId(typeId);
            await axios.delete(`/api/admin/resources/${typeId}`);
            await fetchTypes();
        } catch (err) {
            alert(err.response?.data?.error || err.response?.data?.message || 'Failed to delete resource type');
        } finally {
            setDeletingId(null);
        }
    };

    const formatJSON = (json) => {
        try {
            return JSON.stringify(json, null, 2);
        } catch (e) {
            return 'Invalid JSON';
        }
    };

    if (loading && types.length === 0) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading resource types...</p>
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

    if (types.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <svg
                    className="w-16 h-16 text-gray-400 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                </svg>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Resource Types Found</h3>
                <p className="text-gray-600 mb-4">Get started by creating your first resource type.</p>
                <button
                    onClick={onCreateClick}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Create Resource Type
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Schema Definition
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {types.map((type) => (
                                <tr key={type.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{type.id}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{type.type}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <details className="cursor-pointer">
                                            <summary className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                                                View Schema
                                            </summary>
                                            <pre className="mt-2 bg-gray-50 p-3 rounded text-xs overflow-x-auto border border-gray-200">
                                                {formatJSON(type.schema_definition)}
                                            </pre>
                                        </details>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <button
                                            onClick={() => handleDelete(type.id, type.type)}
                                            disabled={deletingId === type.id}
                                            className={`text-red-600 hover:text-red-900 font-medium ${deletingId === type.id ? 'opacity-50 cursor-not-allowed' : ''
                                                }`}
                                        >
                                            {deletingId === type.id ? 'Deleting...' : 'Delete'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TypeTable;