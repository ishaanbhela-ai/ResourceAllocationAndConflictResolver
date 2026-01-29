import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';

const CreateResourceForm = ({ onClose, onSuccess }) => {
    const [resourceTypes, setResourceTypes] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        type_id: '',
        location: '',
        description: '',
        properties: {},
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [fetchingTypes, setFetchingTypes] = useState(true);
    const [apiError, setApiError] = useState('');
    const [selectedType, setSelectedType] = useState(null);

    useEffect(() => {
        fetchResourceTypes();
    }, []);

    useEffect(() => {
        if (formData.type_id) {
            fetchResourceTypeById(parseInt(formData.type_id));
        } else {
            setSelectedType(null);
            setFormData(prev => ({ ...prev, properties: {} }));
        }
    }, [formData.type_id]);

    const fetchResourceTypeById = async (typeId) => {
        try {
            const response = await axios.get(`/api/resource_types/${typeId}`);

            // Handle different response formats
            let typeData = null;
            if (response.data) {
                // Direct object response
                if (response.data.id) {
                    typeData = response.data;
                }
                // Nested in data property
                else if (response.data.data && response.data.data.id) {
                    typeData = response.data.data;
                }
                // Nested in resource_type property
                else if (response.data.resource_type && response.data.resource_type.id) {
                    typeData = response.data.resource_type;
                }
            }

            if (typeData) {
                setSelectedType(typeData);

                // Initialize properties based on schema_definition (optional)
                const initialProps = {};
                if (typeData.schema_definition) {
                    // Handle if schema_definition is a string (parse it)
                    let schema = typeData.schema_definition;
                    if (typeof schema === 'string') {
                        try {
                            schema = JSON.parse(schema);
                        } catch (e) {
                            console.error('Failed to parse schema_definition:', e);
                            schema = {};
                        }
                    }

                    Object.keys(schema).forEach(key => {
                        initialProps[key] = '';
                    });
                }

                // Set default location to 'Office' for meeting room type
                const typeName = (typeData.type || typeData.name || '').toLowerCase();
                const defaultLocation = typeName.includes('meeting room') ? 'Office' : '';

                setFormData(prev => ({
                    ...prev,
                    properties: initialProps,
                    location: defaultLocation || prev.location
                }));
            } else {
                console.error('Could not extract resource type data from response');
                setSelectedType(null);
            }
        } catch (error) {
            console.error('Failed to fetch resource type details:', error);
            setApiError('Failed to load resource type details. Please try again.');
            setSelectedType(null);
        }
    };

    const fetchResourceTypes = async () => {
        try {
            setFetchingTypes(true);
            const response = await axios.get('/api/resource_types');

            // Handle different response formats
            let types = [];
            if (Array.isArray(response.data)) {
                types = response.data;
            } else if (response.data.resource_types && Array.isArray(response.data.resource_types)) {
                types = response.data.resource_types;
            } else if (response.data.data && Array.isArray(response.data.data)) {
                types = response.data.data;
            }

            setResourceTypes(types);
        } catch (error) {
            console.error('Failed to fetch resource types:', error);
            setApiError('Failed to load resource types. Please try again.');
            setResourceTypes([]);
        } finally {
            setFetchingTypes(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
        setApiError('');
    };

    const handlePropertyChange = (key, value) => {
        setFormData(prev => ({
            ...prev,
            properties: { ...prev.properties, [key]: value },
        }));
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!formData.type_id) {
            newErrors.type_id = 'Type is required';
        }

        if (!formData.location.trim()) {
            newErrors.location = 'Location is required';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Description is required';
        }

        // Validate properties based on schema - All properties are required for all types
        if (selectedType && selectedType.schema_definition) {
            // Handle if schema_definition is a string (parse it)
            let schema = selectedType.schema_definition;
            if (typeof schema === 'string') {
                try {
                    schema = JSON.parse(schema);
                } catch (e) {
                    console.error('Failed to parse schema_definition:', e);
                    schema = {};
                }
            }

            // All properties are required for all resource types
            Object.entries(schema).forEach(([key, type]) => {
                const value = formData.properties[key];
                if (!value || (typeof value === 'string' && !value.trim())) {
                    newErrors[`property_${key}`] = `${formatPropertyLabel(key)} is required`;
                }
            });
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
            // Convert property values to correct types based on schema (if provided)
            let processedProperties = {};
            if (selectedType && selectedType.schema_definition) {
                // Handle if schema_definition is a string (parse it)
                let schema = selectedType.schema_definition;
                if (typeof schema === 'string') {
                    try {
                        schema = JSON.parse(schema);
                    } catch (e) {
                        console.error('Failed to parse schema_definition:', e);
                        schema = {};
                    }
                }

                Object.entries(schema).forEach(([key, type]) => {
                    const value = formData.properties[key];

                    // Skip if value is null, undefined, or empty
                    if (!value || (typeof value === 'string' && !value.trim())) {
                        return;
                    }

                    if (type === 'number' || type === 'integer' || type === 'int') {
                        const numValue = parseInt(value);
                        if (!isNaN(numValue)) {
                            processedProperties[key] = numValue;
                        }
                    } else if (type === 'boolean') {
                        processedProperties[key] = value === 'true' || value === true;
                    } else {
                        // String type
                        const strValue = String(value).trim();
                        if (strValue) {
                            processedProperties[key] = strValue;
                        }
                    }
                });
            }

            // If no properties, send empty object
            if (Object.keys(processedProperties).length === 0) {
                processedProperties = {};
            }

            const payload = {
                name: formData.name.trim(),
                type_id: parseInt(formData.type_id),
                location: formData.location.trim(),
                description: formData.description.trim(),
                properties: processedProperties,
            };

            console.log('=== RESOURCE CREATION DEBUG ===');
            console.log('Form data:', formData);
            console.log('Selected type:', selectedType);
            console.log('Schema definition type:', typeof selectedType?.schema_definition);
            console.log('Schema definition:', selectedType?.schema_definition);
            console.log('Processed properties:', processedProperties);
            console.log('Payload type_id:', parseInt(formData.type_id), 'Type:', typeof parseInt(formData.type_id));
            console.log('Final payload:', JSON.stringify(payload, null, 2));
            console.log('=============================');

            const response = await axios.post('/api/admin/resources', payload);

            console.log('Success! Response:', response.data);
            onSuccess();
            onClose();
        } catch (err) {
            console.error('=== RESOURCE CREATION ERROR ===');
            console.error('Error object:', err);
            console.error('Error response:', err.response?.data);
            console.error('Error status:', err.response?.status);
            console.error('Error headers:', err.response?.headers);
            console.error('Request that failed:', err.config?.data);
            console.error('==============================');

            let errorMessage = 'Failed to create resource';

            if (err.response?.data) {
                if (typeof err.response.data === 'string') {
                    errorMessage = err.response.data;
                } else if (err.response.data.error) {
                    errorMessage = err.response.data.error;
                } else if (err.response.data.message) {
                    errorMessage = err.response.data.message;
                } else {
                    errorMessage = JSON.stringify(err.response.data);
                }
            }

            setApiError(errorMessage);
            setLoading(false);
        }
    };

    const handleBackgroundClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const getInputType = (schemaType) => {
        switch (schemaType) {
            case 'number':
            case 'integer':
                return 'number';
            case 'boolean':
                return 'checkbox';
            default:
                return 'text';
        }
    };

    const formatPropertyLabel = (key) => {
        // Convert snake_case or camelCase to Title Case
        return key
            .replace(/_/g, ' ')
            .replace(/([A-Z])/g, ' $1')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ')
            .trim();
    };

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={handleBackgroundClick}
        >
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">Create Resource</h2>
                    <button
                        onClick={onClose}
                        className="text-white hover:text-gray-200 transition"
                        disabled={loading}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6">
                    {fetchingTypes ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                                <p className="mt-4 text-gray-600">Loading resource types...</p>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {apiError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                    {apiError}
                                </div>
                            )}

                            {/* Resource Type Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Resource Type <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="type_id"
                                    value={formData.type_id}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${errors.type_id ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    disabled={loading}
                                >
                                    <option value="">Select Resource Type</option>
                                    {resourceTypes.map(type => (
                                        <option key={type.id} value={type.id}>
                                            {type.type || type.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.type_id && (
                                    <p className="mt-1 text-sm text-red-600">{errors.type_id}</p>
                                )}
                            </div>

                            {/* Resource Name - Always text input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Resource Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${errors.name ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Enter resource name"
                                    disabled={loading}
                                />
                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                                )}
                            </div>

                            {/* Location */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Location <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${errors.location ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Enter location"
                                    disabled={loading}
                                />
                                {errors.location && (
                                    <p className="mt-1 text-sm text-red-600">{errors.location}</p>
                                )}
                            </div>

                            {/* Description - Now Mandatory */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={3}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none ${errors.description ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Enter description"
                                    disabled={loading}
                                />
                                {errors.description && (
                                    <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                                )}
                            </div>

                            {/* Dynamic Properties Section - All Properties Required */}
                            {selectedType && selectedType.schema_definition && (() => {
                                // Handle if schema_definition is a string (parse it)
                                let schema = selectedType.schema_definition;
                                if (typeof schema === 'string') {
                                    try {
                                        schema = JSON.parse(schema);
                                    } catch (e) {
                                        console.error('Failed to parse schema_definition:', e);
                                        return null;
                                    }
                                }

                                if (!schema || Object.keys(schema).length === 0) {
                                    return null;
                                }

                                return (
                                    <div className="border-t pt-6">
                                        <div className="mb-4">
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {selectedType.type || selectedType.name} Properties
                                            </h3>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Fill in all the required properties for this resource type
                                            </p>
                                        </div>

                                        <div className="space-y-4 bg-blue-50 p-4 rounded-lg">
                                            {Object.entries(schema).map(([key, schemaType]) => (
                                                <div key={key}>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        {formatPropertyLabel(key)}
                                                        <span className="text-red-500 ml-1">*</span>
                                                        <span className="text-xs text-gray-500 ml-2">({schemaType})</span>
                                                    </label>
                                                    <input
                                                        type={getInputType(schemaType)}
                                                        value={formData.properties[key] || ''}
                                                        onChange={(e) => handlePropertyChange(key, e.target.value)}
                                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white ${errors[`property_${key}`] ? 'border-red-500' : 'border-gray-300'
                                                            }`}
                                                        placeholder={`Enter ${formatPropertyLabel(key).toLowerCase()}`}
                                                        disabled={loading}
                                                    />
                                                    {errors[`property_${key}`] && (
                                                        <p className="mt-1 text-sm text-red-600">{errors[`property_${key}`]}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Action Buttons */}
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="submit"
                                    disabled={loading || fetchingTypes}
                                    className={`flex-1 py-3 px-4 rounded-lg font-medium text-white transition ${loading || fetchingTypes
                                        ? 'bg-blue-400 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700'
                                        }`}
                                >
                                    {loading ? 'Creating...' : 'Create Resource'}
                                </button>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={loading}
                                    className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreateResourceForm;