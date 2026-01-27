// FILE: src/components/Admin/Bookings/BookingTable.jsx (UPDATED WITH CHECK-IN)
// ============================================================
import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';

const BookingTable = ({ onApprove, onReject }) => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 10 });
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        fetchBookings();
        // Update current time every minute to check check-in window
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000); // Update every minute

        return () => clearInterval(timer);
    }, [pagination.page]);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await axios.get(
                `/api/admin/bookings?page=${pagination.page}&limit=${pagination.limit}`
            );

            if (response.data) {
                if (Array.isArray(response.data)) {
                    setBookings(response.data);
                } else if (Array.isArray(response.data.bookings)) {
                    setBookings(response.data.bookings);
                } else if (Array.isArray(response.data.data)) {
                    setBookings(response.data.data);
                } else if (response.data.results && Array.isArray(response.data.results)) {
                    setBookings(response.data.results);
                } else {
                    console.error('Unexpected response format:', response.data);
                    setBookings([]);
                }
            } else {
                setBookings([]);
            }
        } catch (err) {
            setError('Failed to load bookings');
            console.error('Error fetching bookings:', err);
            setBookings([]);
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

    const formatTime = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Check if booking is in check-in window (first 15 minutes from start time)
    const isInCheckInWindow = (startTime) => {
        if (!startTime) return false;
        const start = new Date(startTime);
        const checkInEnd = new Date(start.getTime() + 15 * 60000); // 15 minutes after start
        return currentTime >= start && currentTime <= checkInEnd;
    };

    // Check if check-in window has passed
    const hasCheckInWindowPassed = (startTime) => {
        if (!startTime) return false;
        const start = new Date(startTime);
        const checkInEnd = new Date(start.getTime() + 15 * 60000); // 15 minutes after start
        return currentTime > checkInEnd;
    };

    const handleCheckIn = async (booking) => {
        try {
            const response = await axios.post(`/api/admin/bookings/${booking.id}/checkin`);
            if (response.data.success) {
                // Refresh bookings
                fetchBookings();
                alert('Check-in successful!');
            }
        } catch (err) {
            console.error('Error checking in:', err);
            alert('Failed to check in. Please try again.');
        }
    };

    const getStatusBadge = (status) => {
        const statusStyles = {
            pending: 'bg-yellow-400 text-white',
            approved: 'bg-green-500 text-white',
            rejected: 'bg-red-500 text-white',
            cancelled: 'bg-gray-400 text-white',
            'checked-in': 'bg-blue-500 text-white',
            'auto-rejected': 'bg-orange-500 text-white',
        };

        const statusLabels = {
            'checked-in': 'Checked In',
            'auto-rejected': 'Auto Rejected',
        };

        const label = statusLabels[status] || (status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown');

        return (
            <span className={`px-4 py-2 rounded font-medium text-sm ${statusStyles[status] || 'bg-gray-400 text-white'}`}>
                {label}
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Time</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Time</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {bookings.map((booking, index) => {
                                const inCheckInWindow = isInCheckInWindow(booking.start_time || booking.startTime);
                                const checkInPassed = hasCheckInWindowPassed(booking.start_time || booking.startTime);

                                return (
                                    <tr key={booking.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {(pagination.page - 1) * pagination.limit + index + 1}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {booking.resource_name || booking.resource?.name || 'Unknown'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {booking.user_name || booking.user?.name || 'Unknown User'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {formatDate(booking.start_time || booking.startTime)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {formatTime(booking.start_time || booking.startTime)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {formatTime(booking.end_time || booking.endTime)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(booking.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {/* Pending bookings - Show Approve/Reject */}
                                            {booking.status === 'pending' && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => onApprove(booking)}
                                                        className="px-4 py-2 bg-green-500 text-white rounded font-medium hover:bg-green-600 transition"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => onReject(booking)}
                                                        className="px-4 py-2 bg-red-500 text-white rounded font-medium hover:bg-red-600 transition"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            )}

                                            {/* Approved bookings - Show Check-in button if in window */}
                                            {booking.status === 'approved' && inCheckInWindow && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleCheckIn(booking)}
                                                        className="px-4 py-2 bg-blue-500 text-white rounded font-medium hover:bg-blue-600 transition"
                                                    >
                                                        Check In
                                                    </button>
                                                    <span className="text-xs text-gray-500 self-center">
                                                        (15 min window)
                                                    </span>
                                                </div>
                                            )}

                                            {/* Approved but check-in window passed - Show auto-rejected message */}
                                            {booking.status === 'approved' && checkInPassed && booking.status !== 'checked-in' && (
                                                <span className="text-orange-500 text-sm font-medium">
                                                    Auto Rejected - No Check-in
                                                </span>
                                            )}

                                            {/* Approved but not yet in check-in window */}
                                            {booking.status === 'approved' && !inCheckInWindow && !checkInPassed && (
                                                <span className="text-gray-500 text-sm">
                                                    Waiting for check-in time
                                                </span>
                                            )}

                                            {/* Checked-in status */}
                                            {booking.status === 'checked-in' && (
                                                <span className="text-blue-600 text-sm font-medium">
                                                    User Checked In
                                                </span>
                                            )}

                                            {/* Other statuses */}
                                            {booking.status !== 'pending' &&
                                                booking.status !== 'approved' &&
                                                booking.status !== 'checked-in' && (
                                                    <span className="text-gray-400 text-sm">No actions</span>
                                                )}
                                        </td>
                                    </tr>
                                );
                            })}
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