import React from 'react';
import { useNavigate } from 'react-router-dom';
import BookingTable from '../../components/User/MyBookings/BookingTable';

const MyBookingsPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
                        <p className="text-gray-600 mt-2">View and manage your resource bookings</p>
                    </div>
                    <button
                        onClick={() => navigate('/resources')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                    >
                        Browse Resources
                    </button>
                </div>

                {/* Bookings Table */}
                <BookingTable />
            </div>
        </div>
    );
};

export default MyBookingsPage;
