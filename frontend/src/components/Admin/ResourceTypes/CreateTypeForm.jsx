import React, { useState } from 'react';
import axios from '../../../api/axios';

const CreateTypeForm = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        type: '',
    });
    const [properties, setProperties] = useState([]);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState('');
    const [showPropertyForm, setShowPropertyForm] = useState(false);

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

    const addProperty = () => {
        setProperties([...properties, { key: '', type: 'string', id: Date.now() }]);
        setShowPropertyForm(true);
    };

    const updateProperty = (id, field, value) => {
        setProperties(properties.map(prop =>
            prop.id === id ? { ...prop, [field]: value } : prop
        ));
    };

    const removeProperty = (id) => {
        setProperties(properties.filter(prop => prop.id !== id));
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.type.trim()) {
            newErrors.type = 'Type name is required';
        }

        const propertyKeys = new Set();
        properties.forEach((prop, index) => {
            if (!prop.key.trim()) {
                newErrors[`property_${prop.id}`] = 'Property name is required';
            } else if (propertyKeys.has(prop.key)) {
                newErrors[`property_${prop.id}`] = 'Duplicate property name';
            } else {
                propertyKeys.add(prop.key);
            }
        });

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
            const schema_definition = {};
            properties.forEach(prop => {
                if (prop.key.trim()) {
                    schema_definition[prop.key] = prop.type;
                }
            });

            const payload = {
                type: formData.type,
                schema_definition: schema_definition,
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

    const loadSampleProperties = () => {
        setProperties([
            { key: 'capacity', type: 'number', id: Date.now() },
            { key: 'equipment', type: 'string', id: Date.now() + 1 },
            { key: 'floor', type: 'number', id: Date.now() + 2 }
        ]);
        setShowPropertyForm(true);
    };

    const handleBackgroundClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const dataTypes = [
        { value: 'string', label: 'Text' },
        { value: 'number', label: 'Number' },
        { value: 'int', label: 'Integer' },
        { value: 'boolean', label: 'True/False' },
        { value: 'date', label: 'Date' },
    ];

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={handleBackgroundClick}
        >
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Create Resource Type</h2>
                        <p className="text-blue-100 text-sm mt-1">Define a new resource type with custom properties</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-white/20 p-1 rounded-lg transition"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {apiError && (
                            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
                                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <span>{apiError}</span>
                            </div>
                        )}

                        <div>
                            <label htmlFor="type" className="block text-sm font-semibold text-gray-700 mb-2">
                                Resource Type Name *
                            </label>
                            <input
                                type="text"
                                id="type"
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition ${errors.type ? 'border-red-500' : 'border-gray-200'
                                    }`}
                                placeholder="e.g., Conference Room, Laptop, Vehicle"
                            />
                            {errors.type && (
                                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {errors.type}
                                </p>
                            )}
                        </div>

                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-800">Properties</h3>
                                    <p className="text-sm text-gray-600 mt-1">Define custom properties for this resource type</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={loadSampleProperties}
                                    className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                    Load Sample
                                </button>
                            </div>

                            {properties.length > 0 && (
                                <div className="space-y-3 mb-4">
                                    {properties.map((prop, index) => (
                                        <div key={prop.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                                            <div className="flex items-start gap-3">
                                                <div className="flex-1 grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                                            Property Name *
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={prop.key}
                                                            onChange={(e) => updateProperty(prop.id, 'key', e.target.value)}
                                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm ${errors[`property_${prop.id}`] ? 'border-red-500' : 'border-gray-300'
                                                                }`}
                                                            placeholder="e.g., capacity, location"
                                                        />
                                                        {errors[`property_${prop.id}`] && (
                                                            <p className="mt-1 text-xs text-red-600">{errors[`property_${prop.id}`]}</p>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-gray-600 mb-1">
                                                            Data Type *
                                                        </label>
                                                        <select
                                                            value={prop.type}
                                                            onChange={(e) => updateProperty(prop.id, 'type', e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                                                        >
                                                            {dataTypes.map(dt => (
                                                                <option key={dt.value} value={dt.value}>{dt.label}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeProperty(prop.id)}
                                                    className="mt-6 text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition"
                                                    title="Remove property"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={addProperty}
                                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition flex items-center justify-center gap-2 font-medium"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add Property
                            </button>

                            {properties.length === 0 && (
                                <p className="text-sm text-gray-500 text-center mt-3">
                                    Click "Add Property" to define custom properties for this resource type
                                </p>
                            )}
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`flex-1 py-3 px-4 rounded-lg font-semibold text-white transition shadow-md ${loading
                                    ? 'bg-blue-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 transform hover:-translate-y-0.5'
                                    }`}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creating...
                                    </span>
                                ) : (
                                    'Create Resource Type'
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition disabled:opacity-50"
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