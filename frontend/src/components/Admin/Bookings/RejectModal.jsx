
// ============================================================
// FILE: src/components/Admin/Bookings/RejectModal.jsx
// ============================================================
import React, { useState } from 'react';
import axios from '../../../api/axios';

const RejectModal = ({ booking, onClose, onSuccess }) => {
    const [rejectionReason, setRejectionReason] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState('');

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            setError('Rejection reason is required');
            return;
        }

        setLoading(true);
        setApiError('');

        try {
            await axios.patch(`/api/admin/bookings/${booking.id}/status`, {
                status: 'rejected',
                rejection_reason: rejectionReason,
            });
            onSuccess();
            onClose();
        } catch (err) {
            setApiError(err.response?.data?.message || 'Failed to reject booking');
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">Reject Booking</h2>
                    <button onClick={onClose} className="text-white hover:text-gray-200">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6">
                    {apiError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                            {apiError}
                        </div>
                    )}

                    <div className="mb-6">
                        <div className="bg-gray-50 p-4 rounded-lg space-y-2 mb-4">
                            <div>
                                <span className="text-sm font-medium text-gray-500">Resource:</span>
                                <p className="text-gray-900">{booking.resource_name}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-gray-500">User:</span>
                                <p className="text-gray-900">{booking.user_name}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-gray-500">Time:</span>
                                <p className="text-gray-900">
                                    {new Date(booking.start_time).toLocaleString()} - {new Date(booking.end_time).toLocaleString()}
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Rejection Reason *
                            </label>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => {
                                    setRejectionReason(e.target.value);
                                    setError('');
                                }}
                                rows={4}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none resize-none ${error ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="Please provide a reason for rejection..."
                            />
                            {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={handleReject}
                            disabled={loading}
                            className={`flex-1 py-3 px-4 rounded-lg font-medium text-white transition ${loading ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                                }`}
                        >
                            {loading ? 'Rejecting...' : 'Reject'}
                        </button>
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RejectModal;