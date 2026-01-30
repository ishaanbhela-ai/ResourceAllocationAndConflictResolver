
import React, { useState } from 'react';
import axios from '../../../api/axios';

const ApproveModal = ({ booking, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState('');

    const handleApprove = async () => {
        setLoading(true);
        setApiError('');

        try {
            await axios.patch(`/api/admin/bookings/${booking.id}/status`, {
                status: 'approved',
                rejection_reason: '',
            });
            onSuccess();
            onClose();
        } catch (err) {
            setApiError(err.response?.data?.message || 'Failed to approve booking');
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">Approve Booking</h2>
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
                        <p className="text-gray-700 mb-4">
                            Are you sure you want to approve this booking?
                        </p>
                        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
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
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={handleApprove}
                            disabled={loading}
                            className={`flex-1 py-3 px-4 rounded-lg font-medium text-white transition ${loading ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                                }`}
                        >
                            {loading ? 'Approving...' : 'Approve'}
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

export default ApproveModal;