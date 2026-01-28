// ============================================================
// FILE: src/pages/Admin/BookingsPage.jsx
// ============================================================
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BookingTable from '../../components/Admin/Bookings/BookingTable';
import ApproveModal from '../../components/Admin/Bookings/ApproveModal';
import RejectModal from '../../components/Admin/Bookings/RejectModal';

const BookingsPage = () => {
    const navigate = useNavigate();
    const [approvingBooking, setApprovingBooking] = useState(null);
    const [rejectingBooking, setRejectingBooking] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const handleSuccess = (message) => {
        setRefreshKey(prev => prev + 1);
        setToastMessage(message || 'Action completed successfully');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4">
            {showToast && (
                <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in z-50">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-medium">{toastMessage}</span>
                </div>
            )}

            <div className="max-w-7xl mx-auto">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Booking Approvals</h1>
                    </div>
                    <button
                        onClick={() => navigate('/admin')}
                        className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
                    >
                        Back to Admin
                    </button>
                </div>

                <BookingTable
                    key={refreshKey}
                    onApprove={setApprovingBooking}
                    onReject={setRejectingBooking}
                />

                {approvingBooking && (
                    <ApproveModal
                        booking={approvingBooking}
                        onClose={() => setApprovingBooking(null)}
                        onSuccess={() => handleSuccess('Booking approved successfully')}
                    />
                )}

                {rejectingBooking && (
                    <RejectModal
                        booking={rejectingBooking}
                        onClose={() => setRejectingBooking(null)}
                        onSuccess={() => handleSuccess('Booking rejected successfully')}
                    />
                )}
            </div>
        </div>
    );
};

export default BookingsPage;
