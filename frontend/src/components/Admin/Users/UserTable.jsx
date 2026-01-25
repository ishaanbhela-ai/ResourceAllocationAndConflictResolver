import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';

const UserTable = ({ onEdit, refreshTrigger }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 10 });

    useEffect(() => {
        fetchUsers();
    }, [pagination.page, refreshTrigger]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError('');

            // FIXED: Changed from /api/admin/user to /api/admin/users
            const response = await axios.get(
                `/api/admin/users?page=${pagination.page}&limit=${pagination.limit}`
            );

            setUsers(response.data || []);
        } catch (err) {
            console.error('Error fetching users:', err);
            console.error('Error response:', err.response);
            setError('Failed to load users. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getRoleBadge = (role) => {
        return (
            <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${role === 'ADMIN'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-green-100 text-green-800'
                    }`}
            >
                {role}
            </span>
        );
    };

    if (loading && users.length === 0) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading users...</p>
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

    if (users.length === 0) {
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
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                </svg>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Users Found</h3>
                <p className="text-gray-600">Start by creating your first user.</p>
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Employee ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date of Birth
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.map((user) => (
                                <tr key={user.id || user.uuid} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{user.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{user.employee_id}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getRoleBadge(user.role)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{formatDate(user.dob)}</div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex justify-center items-center gap-4">
                <button
                    onClick={() => setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))}
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
                    onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                    disabled={users.length < pagination.limit}
                    className={`px-6 py-2 rounded-lg font-medium transition ${users.length < pagination.limit
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

export default UserTable;