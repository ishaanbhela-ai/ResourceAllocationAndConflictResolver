
// FILE: src/components/Admin/Bookings/BookingTable.jsx
// ============================================================
import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';

const BookingTable = ({ onApprove, onReject }) => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 10 });

    useEffect(() => {
        fetchBookings();
    }, [pagination.page]);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await axios.get(
                `/api/admin/bookings?page=${pagination.page}&limit=${pagination.limit}`
            );
            setBookings(response.data);
        } catch (err) {
            setError('Failed to load bookings');
            console.error('Error fetching bookings:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (status) => {
        const statusColors = {
            pending: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
            cancelled: 'bg-gray-100 text-gray-800',
        };

        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100 text-gray-800'
                }`}>
                {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'}
            </span>
        );
    };

    if (loading && bookings.length === 0) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading bookings...</p>
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

    if (bookings.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Bookings Found</h3>
                <p className="text-gray-600">No bookings to review at this time.</p>
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Time</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Time</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {bookings.map((booking) => (
                                <tr key={booking.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {booking.resource_name || 'Unknown'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {booking.user_name || 'Unknown User'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {formatDateTime(booking.start_time)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {formatDateTime(booking.end_time)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(booking.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {booking.status === 'pending' && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => onApprove(booking)}
                                                    className="text-green-600 hover:text-green-900 font-medium"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => onReject(booking)}
                                                    className="text-red-600 hover:text-red-900 font-medium"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        )}
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
                    disabled={bookings.length < pagination.limit}
                    className={`px-6 py-2 rounded-lg font-medium transition ${bookings.length < pagination.limit
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

export default BookingTable;