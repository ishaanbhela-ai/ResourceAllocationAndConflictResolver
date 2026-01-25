import React, { useState } from 'react';
import axios from '../../../api/axios';

const CreateTypeForm = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        type: '',
        schema_definition: '',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState('');

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

        if (!formData.type.trim()) {
            newErrors.type = 'Type is required';
        }

        if (!formData.schema_definition.trim()) {
            newErrors.schema_definition = 'Schema definition is required';
        } else {
            try {
                JSON.parse(formData.schema_definition);
            } catch (e) {
                newErrors.schema_definition = 'Invalid JSON format';
            }
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
            const payload = {
                type: formData.type,
                schema_definition: JSON.parse(formData.schema_definition),
            };

            await axios.post('/api/admin/resource_types', payload);
            onSuccess();
            onClose();
        } catch (err) {
            if (err.response) {
                setApiError(err.response.data.error || err.response.data.message || 'Failed to create resource type');
            } else {
                setApiError('Failed to create resource type. Please try again.');
            }
            setLoading(false);
        }
    };

    const loadSampleJSON = () => {
        const sample = {
            capacity: "number",
            equipment: "string",
            floor: "number"
        };
        setFormData((prev) => ({
            ...prev,
            schema_definition: JSON.stringify(sample, null, 2),
        }));
        setErrors((prev) => ({
            ...prev,
            schema_definition: '',
        }));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Create Resource Type</h2>
                        <p className="text-blue-100 text-sm mt-1">Define a new resource type and its schema</p>
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

                        {/* Type */}
                        <div>
                            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                                Type Name
                            </label>
                            <input
                                type="text"
                                id="type"
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${errors.type ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="e.g., Conference Room, Laptop, Vehicle"
                            />
                            {errors.type && (
                                <p className="mt-1 text-sm text-red-600">{errors.type}</p>
                            )}
                        </div>

                        {/* Schema Definition */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label htmlFor="schema_definition" className="block text-sm font-medium text-gray-700">
                                    Schema Definition (JSON)
                                </label>
                                <button
                                    type="button"
                                    onClick={loadSampleJSON}
                                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    Load Sample
                                </button>
                            </div>
                            <textarea
                                id="schema_definition"
                                name="schema_definition"
                                value={formData.schema_definition}
                                onChange={handleChange}
                                rows={12}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none font-mono text-sm ${errors.schema_definition ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder='{"capacity": "number", "equipment": "string"}'
                            />
                            {errors.schema_definition && (
                                <p className="mt-1 text-sm text-red-600">{errors.schema_definition}</p>
                            )}
                            <p className="mt-2 text-xs text-gray-500">
                                Enter a valid JSON object defining the schema for this resource type
                            </p>
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
                                {loading ? 'Creating...' : 'Create Resource Type'}
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
    );
};

export default CreateTypeForm;