// FILE: src/components/Admin/Bookings/BookingTable.jsx
// ============================================================
import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';

const BookingTable = ({ onApprove, onReject }) => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({ page: 1, limit: 10 });
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        fetchBookings();

        // Update current time every minute to check check-in window
        const timer = setInterval(() => {
            setCurrentTime(new Date());
            // Also check for auto-rejections
            checkForAutoRejections();
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

    // Check for bookings that should be auto-rejected
    const checkForAutoRejections = () => {
        setBookings(prevBookings =>
            prevBookings.map(booking => {
                if (booking.status === 'approved' && hasCheckInWindowPassed(booking.start_time || booking.startTime)) {
                    // Update status locally
                    return { ...booking, status: 'not-checked-in' };
                }
                return booking;
            })
        );
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

    // Check if booking is in check-in window (15 minutes from start time)
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
            // Use the correct booking ID field
            const bookingId = booking.id || booking._id;

            const response = await axios.patch(
                `/api/admin/bookings/${bookingId}/checkin`,
                {}, // Empty body
                {
                    headers: {
                        'Content-Type': 'application/json',
                        // Include auth token if needed
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );

            if (response.data.success || response.status === 200) {
                // Update the booking status locally
                setBookings(prevBookings =>
                    prevBookings.map(b =>
                        (b.id || b._id) === bookingId
                            ? { ...b, status: 'checked-in' }
                            : b
                    )
                );
                alert('Check-in successful!');
            }
        } catch (err) {
            console.error('Error checking in:', err);
            if (err.response?.status === 403) {
                alert('Permission denied. Please check your admin privileges.');
            } else if (err.response?.status === 401) {
                alert('Session expired. Please log in again.');
            } else {
                alert(err.response?.data?.message || 'Failed to check in. Please try again.');
            }
        }
    };

    const getStatusBadge = (status) => {
        const statusStyles = {
            pending: 'bg-yellow-400 text-white',
            approved: 'bg-green-500 text-white',
            rejected: 'bg-red-500 text-white',
            cancelled: 'bg-gray-400 text-white',
            'checked-in': 'bg-blue-500 text-white',
            'not-checked-in': 'bg-orange-500 text-white',
        };

        const statusLabels = {
            'checked-in': 'Checked In',
            'not-checked-in': 'Not Checked In',
            'pending': 'Pending',
            'approved': 'Approved',
            'rejected': 'Rejected',
            'cancelled': 'Cancelled',
        };

        const label = statusLabels[status] || (status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown');

        return (
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusStyles[status] || 'bg-gray-500 text-white'}`}>
                {label}
            </span>
        );
    };

    // Filter bookings based on search term
    const filteredBookings = bookings.filter((booking) => {
        if (!searchTerm) return true;

        const searchLower = searchTerm.toLowerCase();
        const resourceName = (booking.resource_name || booking.resource?.name || '').toLowerCase();
        const userName = (booking.user_name || booking.user?.name || '').toLowerCase();
        const status = (booking.status || '').toLowerCase();
        const date = formatDate(booking.start_time || booking.startTime).toLowerCase();

        return resourceName.includes(searchLower) ||
            userName.includes(searchLower) ||
            status.includes(searchLower) ||
            date.includes(searchLower);
    });

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        // Reset to page 1 when searching
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    const clearSearch = () => {
        setSearchTerm('');
        setPagination((prev) => ({ ...prev, page: 1 }));
    };

    if (loading && bookings.length === 0) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="text-gray-600">Loading bookings...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
            </div>
        );
    }

    if (bookings.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No Bookings Found</h3>
                <p className="text-gray-500">No bookings to review at this time.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Search Bar - Compact version on left */}
            <div className="flex items-center">
                <div className="relative w-64">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg
                            className="h-4 w-4 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </div>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={handleSearchChange}
                        placeholder="Search bookings..."
                        className="block w-full pl-9 pr-9 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                    {searchTerm && (
                        <button
                            onClick={clearSearch}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    )}
                </div>
                {searchTerm && (
                    <span className="ml-3 text-sm text-gray-600">
                        {filteredBookings.length} result{filteredBookings.length !== 1 ? 's' : ''}
                    </span>
                )}
            </div>

            {/* No Results Message */}
            {filteredBookings.length === 0 && searchTerm ? (
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
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Results Found</h3>
                    <p className="text-gray-600 mb-4">
                        No bookings match your search for "{searchTerm}"
                    </p>
                    <button
                        onClick={clearSearch}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-200"
                    >
                        Clear Search
                    </button>
                </div>
            ) : (
                <>
                    {/* Table */}
                    <div className="overflow-x-auto shadow-md rounded-lg">
                        <table className="min-w-full bg-white border border-gray-200">
                            <thead className="bg-gray-100 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Resource</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Username</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Start Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">End Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredBookings.map((booking, index) => {
                                    const inCheckInWindow = isInCheckInWindow(booking.start_time || booking.startTime);
                                    const checkInPassed = hasCheckInWindowPassed(booking.start_time || booking.startTime);

                                    // Determine the actual status to display
                                    let displayStatus = booking.status;
                                    if (booking.status === 'approved' && checkInPassed) {
                                        displayStatus = 'not-checked-in';
                                    }

                                    return (
                                        <tr key={booking.id || booking._id} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {(pagination.page - 1) * pagination.limit + index + 1}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {booking.resource_name || booking.resource?.name || 'Unknown'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {booking.user_name || booking.user?.name || 'Unknown User'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatDate(booking.start_time || booking.startTime)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatTime(booking.start_time || booking.startTime)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatTime(booking.end_time || booking.endTime)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(displayStatus)}
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
                                                    <button
                                                        onClick={() => handleCheckIn(booking)}
                                                        className="px-4 py-2 bg-blue-500 text-white rounded font-medium hover:bg-blue-600 transition shadow-sm"
                                                    >
                                                        Check In
                                                        <span className="block text-xs mt-1 opacity-90">(15 min window)</span>
                                                    </button>
                                                )}

                                                {/* Approved but check-in window passed */}
                                                {booking.status === 'approved' && checkInPassed && (
                                                    <div className="text-orange-600 font-medium">
                                                        Not Checked In
                                                        <div className="text-xs text-gray-500 mt-1">Window closed</div>
                                                    </div>
                                                )}

                                                {/* Approved but not yet in check-in window */}
                                                {booking.status === 'approved' && !inCheckInWindow && !checkInPassed && (
                                                    <div className="text-gray-600 text-sm">
                                                        Waiting for check-in time
                                                    </div>
                                                )}

                                                {/* Checked-in status */}
                                                {booking.status === 'checked-in' && (
                                                    <div className="text-blue-600 font-medium flex items-center gap-2">
                                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                        </svg>
                                                        Checked In
                                                    </div>
                                                )}

                                                {/* Other statuses */}
                                                {!['pending', 'approved', 'checked-in'].includes(booking.status) && (
                                                    <div className="text-gray-500 text-sm">
                                                        No actions
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination - Only show if not searching */}
                    {!searchTerm && (
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
                    )}
                </>
            )}
        </div>
    );
};

export default BookingTable;