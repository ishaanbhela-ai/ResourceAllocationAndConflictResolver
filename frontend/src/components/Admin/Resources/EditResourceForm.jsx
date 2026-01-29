import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';

const EditResourceForm = ({ resource, onClose, onSuccess }) => {
    const [resourceTypes, setResourceTypes] = useState([]);
    const [formData, setFormData] = useState({
        name: resource.name || '',
        type_id: resource.type_id || '',
        location: resource.location || '',
        description: resource.description || '',
        is_active: resource.is_active !== undefined ? resource.is_active : true,
        properties: resource.properties || {},
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [fetchingTypes, setFetchingTypes] = useState(true);
    const [apiError, setApiError] = useState('');
    const [selectedType, setSelectedType] = useState(null);

    // Resource name suggestions based on type
    const resourceNameSuggestions = {
        'meeting room': ['Topaz', 'Emerald', 'Sapphire', 'Citrine'],
        'laptop': ['Windows', 'Mac OS', 'Linux', 'Ubuntu'],
        'turf': ['Turf A', 'Turf B', 'Turf C', 'Turf D'],
    };

    useEffect(() => {
        fetchResourceTypes();
    }, []);

    useEffect(() => {
        if (formData.type_id) {
            fetchResourceTypeById(parseInt(formData.type_id));
        } else {
            setSelectedType(null);
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

                // Merge existing properties with schema definition
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

                    const mergedProps = { ...formData.properties };
                    Object.keys(schema).forEach(key => {
                        if (!(key in mergedProps)) {
                            mergedProps[key] = '';
                        }
                    });

                    // Set default location to 'Office' for meeting room type if location is empty
                    const typeName = (typeData.type || typeData.name || '').toLowerCase();
                    const shouldSetDefaultLocation = typeName.includes('meeting room') && !formData.location.trim();

                    setFormData(prev => ({
                        ...prev,
                        properties: mergedProps,
                        location: shouldSetDefaultLocation ? 'Office' : prev.location
                    }));
                } else {
                    // Set default location to 'Office' for meeting room type if location is empty
                    const typeName = (typeData.type || typeData.name || '').toLowerCase();
                    const shouldSetDefaultLocation = typeName.includes('meeting room') && !formData.location.trim();

                    if (shouldSetDefaultLocation) {
                        setFormData(prev => ({ ...prev, location: 'Office' }));
                    }
                }
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
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
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

    const getNameSuggestions = () => {
        if (!selectedType) return [];

        const typeName = (selectedType.type || selectedType.name || '').toLowerCase();

        // Find matching suggestions
        for (const [key, suggestions] of Object.entries(resourceNameSuggestions)) {
            if (typeName.includes(key)) {
                return suggestions;
            }
        }

        return [];
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

        // Validate properties based on schema - Make compulsory for meeting room
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

            // Check if this is a meeting room type
            const typeName = (selectedType.type || selectedType.name || '').toLowerCase();
            const isMeetingRoom = true

            // For meeting room, all properties are required
            if (isMeetingRoom) {
                Object.entries(schema).forEach(([key, type]) => {
                    const value = formData.properties[key];
                    if (!value || (typeof value === 'string' && !value.trim())) {
                        newErrors[`property_${key}`] = `${formatPropertyLabel(key)} is required`;
                    }
                });
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
                is_active: Boolean(formData.is_active),
                properties: processedProperties,
            };

            console.log('=== RESOURCE UPDATE DEBUG ===');
            console.log('Resource ID:', resource.id);
            console.log('Form data:', formData);
            console.log('Selected type:', selectedType);
            console.log('Processed properties:', processedProperties);
            console.log('Final payload:', JSON.stringify(payload, null, 2));
            console.log('=============================');

            const response = await axios.put(`/api/admin/resources/${resource.id}`, payload);

            console.log('Success! Response:', response.data);
            onSuccess();
            onClose();
        } catch (err) {
            console.error('=== RESOURCE UPDATE ERROR ===');
            console.error('Error object:', err);
            console.error('Error response:', err.response?.data);
            console.error('Error status:', err.response?.status);
            console.error('==============================');

            let errorMessage = 'Failed to update resource';

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

    const nameSuggestions = getNameSuggestions();

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={handleBackgroundClick}
        >
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">Edit Resource</h2>
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

                            {/* Resource Name - Dropdown if suggestions available, text input otherwise */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Resource Name <span className="text-red-500">*</span>
                                </label>
                                {nameSuggestions.length > 0 ? (
                                    <select
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${errors.name ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        disabled={loading}
                                    >
                                        <option value="">Select Resource Name</option>
                                        {nameSuggestions.map((suggestion, index) => (
                                            <option key={index} value={suggestion}>
                                                {suggestion}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
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
                                )}
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

                            {/* Dynamic Properties Section - Now Optional */}
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

                                // Check if this is a meeting room type
                                const typeName = (selectedType.type || selectedType.name || '').toLowerCase();
                                const isMeetingRoom = true

                                return (
                                    <div className="border-t pt-6">
                                        <div className="mb-4">
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {selectedType.type || selectedType.name} Properties
                                            </h3>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {isMeetingRoom
                                                    ? 'Fill in all the required properties for this resource type'
                                                    : 'Update the specific properties for this resource type (optional)'
                                                }
                                            </p>
                                        </div>

                                        <div className="space-y-4 bg-blue-50 p-4 rounded-lg">
                                            {Object.entries(schema).map(([key, schemaType]) => (
                                                <div key={key}>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        {formatPropertyLabel(key)}
                                                        {isMeetingRoom && <span className="text-red-500 ml-1">*</span>}
                                                        <span className="text-xs text-gray-500 ml-2">
                                                            ({schemaType}) {!isMeetingRoom && '- Optional'}
                                                        </span>
                                                    </label>
                                                    <input
                                                        type={getInputType(schemaType)}
                                                        value={formData.properties[key] || ''}
                                                        onChange={(e) => handlePropertyChange(key, e.target.value)}
                                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white ${errors[`property_${key}`] ? 'border-red-500' : 'border-gray-300'
                                                            }`}
                                                        placeholder={`Enter ${formatPropertyLabel(key).toLowerCase()}${isMeetingRoom ? '' : ' (optional)'}`}
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

                            {/* Is Active Checkbox */}
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="is_active"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={handleChange}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    disabled={loading}
                                />
                                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                                    Is Active
                                </label>
                            </div>

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
                                    {loading ? 'Updating...' : 'Update Resource'}
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

export default EditResourceForm;