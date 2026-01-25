import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../../api/axios';
import BookingModal from './BookingModal';

const ResourceDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [resource, setResource] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showBookingModal, setShowBookingModal] = useState(false);

    useEffect(() => {
        fetchResourceDetail();
    }, [id]);

    const fetchResourceDetail = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await axios.get(`/api/resources/${id}`);
            setResource(response.data);
        } catch (err) {
            setError('Failed to load resource details. Please try again.');
            console.error('Error fetching resource:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatProperties = (properties) => {
        try {
            return JSON.stringify(properties, null, 2);
        } catch (e) {
            return 'Invalid JSON';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading resource details...</p>
                </div>
            </div>
        );
    }

    if (error || !resource) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
                <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
                    <div className="text-center">
                        <div className="text-red-500 text-5xl mb-4">⚠️</div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <button
                            onClick={() => navigate('/resources')}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Back to Resources
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Approval Banner */}
                {resource.requires_approval && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-yellow-700 font-medium">
                                    Requires admin approval
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Card */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-white">{resource.name}</h1>
                                <p className="text-blue-100 mt-1">{resource.location}</p>
                            </div>
                            <span
                                className={`px-4 py-2 rounded-full text-sm font-medium ${resource.is_active
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}
                            >
                                {resource.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="p-8">
                        <div className="space-y-6">
                            {/* Type ID */}
                            <div className="border-b border-gray-200 pb-4">
                                <label className="block text-sm font-medium text-gray-500 mb-1">
                                    Resource Type ID
                                </label>
                                <p className="text-lg text-gray-900">{resource.type_id}</p>
                            </div>

                            {/* Location */}
                            <div className="border-b border-gray-200 pb-4">
                                <label className="block text-sm font-medium text-gray-500 mb-1">
                                    Location
                                </label>
                                <p className="text-lg text-gray-900">{resource.location}</p>
                            </div>

                            {/* Description */}
                            <div className="border-b border-gray-200 pb-4">
                                <label className="block text-sm font-medium text-gray-500 mb-1">
                                    Description
                                </label>
                                <p className="text-gray-900">
                                    {resource.description || 'No description available'}
                                </p>
                            </div>

                            {/* Properties */}
                            <div className="border-b border-gray-200 pb-4">
                                <label className="block text-sm font-medium text-gray-500 mb-2">
                                    Properties
                                </label>
                                <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm text-gray-900 border border-gray-200">
                                    {formatProperties(resource.properties)}
                                </pre>
                            </div>

                            {/* Requires Approval */}
                            <div className="border-b border-gray-200 pb-4">
                                <label className="block text-sm font-medium text-gray-500 mb-1">
                                    Requires Approval
                                </label>
                                <p className="text-lg text-gray-900">
                                    {resource.requires_approval ? 'Yes' : 'No'}
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-8 flex gap-4">
                            {resource.is_active && (
                                <button
                                    onClick={() => setShowBookingModal(true)}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                                >
                                    Book Resource
                                </button>
                            )}
                            <button
                                onClick={() => navigate('/resources')}
                                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
                            >
                                Back to List
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Booking Modal */}
            {showBookingModal && (
                <BookingModal
                    resource={resource}
                    onClose={() => setShowBookingModal(false)}
                />
            )}
        </div>
    );
};

export default ResourceDetail;
