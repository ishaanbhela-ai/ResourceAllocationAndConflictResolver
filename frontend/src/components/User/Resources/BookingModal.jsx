// ============================================================
// FILE: src/components/User/Resources/BookingModal.jsx (UPDATED)
// ============================================================
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../../api/axios';

const BookingModal = ({ resource, onClose }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        start_time: '',
        end_time: '',
        purpose: '',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState('');
    const [showToast, setShowToast] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: '',
            }));
        }
        setApiError('');
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.start_time) {
            newErrors.start_time = 'Start time is required';
        }

        if (!formData.end_time) {
            newErrors.end_time = 'End time is required';
        }

        if (formData.start_time && formData.end_time) {
            const start = new Date(formData.start_time);
            const end = new Date(formData.end_time);
            if (end <= start) {
                newErrors.end_time = 'End time must be after start time';
            }
        }

        if (!formData.purpose.trim()) {
            newErrors.purpose = 'Purpose is required';
        }

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setLoading(true);
        setApiError('');

        try {
            await axios.post('/api/bookings', {
                resource_id: resource.id,
                start_time: formData.start_time,
                end_time: formData.end_time,
                purpose: formData.purpose,
            });

            // Show success toast
            setShowToast(true);

            // Close modal and redirect after short delay
            setTimeout(() => {
                onClose();
                navigate('/bookings');
            }, 1500);
        } catch (err) {
            if (err.response) {
                setApiError(err.response.data.message || 'Failed to create booking');
            } else {
                setApiError('Failed to create booking. Please try again.');
            }
            setLoading(false);
        }
    };

    return (
        <>
            {/* Success Toast */}
            {showToast && (
                <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in z-50">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-medium">Booking created successfully!</span>
                </div>
            )}

            {/* Modal */}
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Book Resource</h2>
                            <p className="text-blue-100 text-sm mt-1">{resource.name}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-gray-200 transition"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Form */}
                    <div className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {apiError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                    {apiError}
                                </div>
                            )}

                            {/* Start Time */}
                            <div>
                                <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-2">
                                    Start Time
                                </label>
                                <input
                                    type="datetime-local"
                                    id="start_time"
                                    name="start_time"
                                    value={formData.start_time}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${errors.start_time ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                />
                                {errors.start_time && (
                                    <p className="mt-1 text-sm text-red-600">{errors.start_time}</p>
                                )}
                            </div>

                            {/* End Time */}
                            <div>
                                <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 mb-2">
                                    End Time
                                </label>
                                <input
                                    type="datetime-local"
                                    id="end_time"
                                    name="end_time"
                                    value={formData.end_time}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${errors.end_time ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                />
                                {errors.end_time && (
                                    <p className="mt-1 text-sm text-red-600">{errors.end_time}</p>
                                )}
                            </div>

                            {/* Purpose */}
                            <div>
                                <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-2">
                                    Purpose
                                </label>
                                <textarea
                                    id="purpose"
                                    name="purpose"
                                    value={formData.purpose}
                                    onChange={handleChange}
                                    rows={4}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none ${errors.purpose ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Describe the purpose of this booking..."
                                />
                                {errors.purpose && (
                                    <p className="mt-1 text-sm text-red-600">{errors.purpose}</p>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`flex-1 py-3 px-4 rounded-lg font-medium text-white transition ${loading
                                            ? 'bg-blue-400 cursor-not-allowed'
                                            : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                >
                                    {loading ? 'Creating Booking...' : 'Create Booking'}
                                </button>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={loading}
                                    className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default BookingModal;
