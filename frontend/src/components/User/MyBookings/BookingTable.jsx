import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';

const BookingTable = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [cancellingId, setCancellingId] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
    });

    useEffect(() => {
        fetchBookings();
    }, [pagination.page]);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await axios.get(
                `/api/bookings?page=${pagination.page}&limit=${pagination.limit}`
            );
            setBookings(Array.isArray(response.data.data) ? response.data.data : []);
        } catch (err) {
            setError('Failed to load bookings. Please try again.');
            console.error('Error fetching bookings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (bookingId) => {
        if (!window.confirm('Are you sure you want to cancel this booking?')) {
            return;
        }

        try {
            setCancellingId(bookingId);
            await axios.patch(`/api/bookings/${bookingId}/cancel`);
            await fetchBookings();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to cancel booking');
        } finally {
            setCancellingId(null);
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

    const formatTime = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusButton = (status) => {
        const statusConfig = {
            pending: {
                gradient: 'bg-gradient-to-r from-amber-400 to-orange-500',
                shadow: 'shadow-amber-200',
                label: 'Pending'
            },
            approved: {
                gradient: 'bg-gradient-to-r from-emerald-400 to-green-500',
                shadow: 'shadow-green-200',
                label: 'Approved'
            },
            rejected: {
                gradient: 'bg-gradient-to-r from-rose-400 to-red-500',
                shadow: 'shadow-red-200',
                label: 'Rejected'
            },
            cancelled: {
                gradient: 'bg-gradient-to-r from-slate-400 to-gray-500',
                shadow: 'shadow-gray-200',
                label: 'Cancelled'
            }
        };

        const config = statusConfig[status] || statusConfig.pending;

        return (
            <button
                disabled
                className={`${config.gradient} ${config.shadow} shadow-lg text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide cursor-default transition-all hover:scale-105`}
            >
                {config.label}
            </button>
        );
    };

    const handleNextPage = () => {
        setPagination((prev) => ({ ...prev, page: prev.page + 1 }));
    };

    const handlePrevPage = () => {
        setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }));
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
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                </svg>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Bookings Found</h3>
                <p className="text-gray-600">You haven't made any bookings yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gradient-to-r from-blue-600 to-indigo-600">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    Resource Name
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    Start Time
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    End Time
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {bookings.map((booking) => (
                                <tr key={booking.id} className="hover:bg-blue-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-semibold text-gray-900">
                                            {booking.resource_name || 'Unknown Resource'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-700">
                                            {formatDate(booking.start_time)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-700">
                                            {formatTime(booking.start_time)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-700">
                                            {formatTime(booking.end_time)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusButton(booking.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {booking.status === 'pending' ? (
                                            <button
                                                onClick={() => handleCancel(booking.id)}
                                                disabled={cancellingId === booking.id}
                                                className={`px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all shadow-lg ${cancellingId === booking.id
                                                        ? 'bg-gray-400 cursor-not-allowed shadow-gray-200'
                                                        : 'bg-gradient-to-r from-rose-500 to-red-600 text-white hover:from-rose-600 hover:to-red-700 hover:scale-105 shadow-red-200'
                                                    }`}
                                            >
                                                {cancellingId === booking.id ? 'Cancelling...' : 'Cancel'}
                                            </button>
                                        ) : booking.status === 'approved' || booking.status === 'cancelled' || booking.status === 'rejected' ? (
                                            <button
                                                disabled
                                                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide shadow-lg shadow-green-200 cursor-default hover:scale-105 transition-all"
                                            >
                                                Done
                                            </button>
                                        ) : null}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <div className="flex justify-center items-center gap-4">
                <button
                    onClick={handlePrevPage}
                    disabled={pagination.page === 1}
                    className={`px-6 py-3 rounded-lg font-bold uppercase tracking-wide transition-all shadow-lg ${pagination.page === 1
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-gray-100'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:scale-105 shadow-blue-200'
                        }`}
                >
                    ← Previous
                </button>
                <span className="text-gray-700 font-bold bg-white px-6 py-3 rounded-lg shadow-md">
                    Page {pagination.page}
                </span>
                <button
                    onClick={handleNextPage}
                    disabled={bookings.length < pagination.limit}
                    className={`px-6 py-3 rounded-lg font-bold uppercase tracking-wide transition-all shadow-lg ${bookings.length < pagination.limit
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-gray-100'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:scale-105 shadow-blue-200'
                        }`}
                >
                    Next →
                </button>
            </div>
        </div>
    );
};

export default BookingTable;