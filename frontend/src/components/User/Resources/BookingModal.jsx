
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../../api/axios';

const BookingModal = ({ resource, onClose }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        date: '',
        start_time: '',
        end_time: '',
        purpose: '',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState('');
    const [suggestedSlots, setSuggestedSlots] = useState([]);
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
        setSuggestedSlots([]);
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.date) {
            newErrors.date = 'Date is required';
        }

        if (!formData.start_time) {
            newErrors.start_time = 'Start time is required';
        }

        if (!formData.end_time) {
            newErrors.end_time = 'End time is required';
        }

        if (formData.start_time && formData.end_time) {
            if (formData.end_time <= formData.start_time) {
                newErrors.end_time = 'End time must be after start time';
            }
        }

        if (!formData.purpose.trim()) {
            newErrors.purpose = 'Purpose is required';
        }

        return newErrors;
    };

    const parseSuggestedSlots = (errorMessage) => {
        if (!errorMessage) return [];

        const slotsMatch = errorMessage.match(/Suggested slots:([\s\S]*)/);
        if (!slotsMatch) return [];

        const slots = slotsMatch[1]
            .split('\n')
            .map(slot => slot.trim())
            .filter(slot => slot.length > 0);

        return slots;
    };

    const extractMainError = (errorMessage) => {
        if (!errorMessage) return 'Failed to create booking';

        const mainErrorMatch = errorMessage.match(/^(.*?)(?:Suggested slots:|$)/s);
        if (mainErrorMatch) {
            return mainErrorMatch[1].trim().replace(/\.$/, '');
        }

        return errorMessage;
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
        setSuggestedSlots([]);

        try {
            await axios.post('/api/bookings', {
                resource_id: resource.id,
                start_time: `${formData.date}T${formData.start_time}:00+05:30`,
                end_time: `${formData.date}T${formData.end_time}:00+05:30`,
                purpose: formData.purpose,
            });

            setShowToast(true);

            setTimeout(() => {
                onClose();
                navigate('/bookings');
            }, 1500);
        } catch (err) {
            console.error('Booking error:', err.response);

            if (err.response?.data?.error) {
                const fullError = err.response.data.error;
                const mainError = extractMainError(fullError);
                const slots = parseSuggestedSlots(fullError);

                setApiError(mainError);
                setSuggestedSlots(slots);
            } else if (err.response?.data?.message) {
                const fullError = err.response.data.message;
                const mainError = extractMainError(fullError);
                const slots = parseSuggestedSlots(fullError);

                setApiError(mainError);
                setSuggestedSlots(slots);
            } else {
                setApiError('Failed to create booking. Please try again.');
            }

            setLoading(false);
        }
    };

    const selectSuggestedSlot = (slotText) => {
        try {
            const timeMatch = slotText.match(/(\d{1,2}:\d{2})/);
            const dateMatch = slotText.match(/(\d{1,2})\s+(\w+)/);

            if (timeMatch && dateMatch) {
                const time = timeMatch[1];
                const day = dateMatch[1];
                const month = dateMatch[2];

                const monthMap = {
                    'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
                    'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
                    'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
                };

                const currentYear = new Date().getFullYear();
                const monthNum = monthMap[month] || '01';
                const dayNum = day.padStart(2, '0');

                setFormData(prev => ({
                    ...prev,
                    date: `${currentYear}-${monthNum}-${dayNum}`,
                    start_time: time,
                }));

                setApiError('');
                setSuggestedSlots([]);
            }
        } catch (error) {
            console.error('Error parsing suggested slot:', error);
        }
    };

    return (
        <>
            {showToast && (
                <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 animate-slide-in z-50">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-medium">Booking created successfully!</span>
                </div>
            )}

            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
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

                    <div className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {apiError && (
                                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                                    <div className="flex items-start">
                                        <svg className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-red-800">
                                                Booking Failed
                                            </h3>
                                            <p className="mt-1 text-sm text-red-700">
                                                {apiError}
                                            </p>

                                            {suggestedSlots.length > 0 && (
                                                <div className="mt-4">
                                                    <p className="text-sm font-medium text-red-800 mb-2">
                                                        Available time slots:
                                                    </p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {suggestedSlots.map((slot, index) => (
                                                            <button
                                                                key={index}
                                                                type="button"
                                                                onClick={() => selectSuggestedSlot(slot)}
                                                                className="px-3 py-2 bg-white border border-red-300 text-red-700 rounded-md text-sm font-medium hover:bg-red-50 transition-colors"
                                                            >
                                                                {slot}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <p className="mt-2 text-xs text-red-600">
                                                        Click a slot to auto-fill the date and time
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                                    Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    id="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${errors.date ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                />
                                {errors.date && (
                                    <p className="mt-1 text-sm text-red-600">{errors.date}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-2">
                                        Start Time <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="time"
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

                                <div>
                                    <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 mb-2">
                                        End Time <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="time"
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
                            </div>

                            <div>
                                <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-2">
                                    Purpose <span className="text-red-500">*</span>
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

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`flex-1 py-3 px-4 rounded-lg font-medium text-white transition ${loading
                                        ? 'bg-blue-400 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Creating Booking...
                                        </span>
                                    ) : (
                                        'Create Booking'
                                    )}
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