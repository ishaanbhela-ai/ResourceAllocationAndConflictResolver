// ============================================================
// FILE: src/components/Admin/Resources/CreateResourceForm.jsx
// ============================================================
import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';

const CreateResourceForm = ({ onClose, onSuccess }) => {
    const [resourceTypes, setResourceTypes] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        type_id: '',
        location: '',
        description: '',
        requires_approval: false,
        properties: {},
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState('');
    const [selectedTypeSchema, setSelectedTypeSchema] = useState(null);

    useEffect(() => {
        fetchResourceTypes();
    }, []);

    useEffect(() => {
        if (formData.type_id) {
            const selectedType = resourceTypes.find(t => t.id === parseInt(formData.type_id));
            if (selectedType && selectedType.schema_definition) {
                setSelectedTypeSchema(selectedType.schema_definition);
                // Initialize properties based on schema
                const initialProps = {};
                Object.keys(selectedType.schema_definition).forEach(key => {
                    initialProps[key] = '';
                });
                setFormData(prev => ({ ...prev, properties: initialProps }));
            }
        }
    }, [formData.type_id, resourceTypes]);

    const fetchResourceTypes = async () => {
        try {
            const response = await axios.get('/api/resource_types');
            setResourceTypes(response.data);
        } catch (error) {
            console.error('Failed to fetch resource types:', error);
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

    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.type_id) newErrors.type_id = 'Type is required';
        if (!formData.location.trim()) newErrors.location = 'Location is required';
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
            await axios.post('/api/admin/resources', {
                ...formData,
                type_id: parseInt(formData.type_id),
            });
            onSuccess();
            onClose();
        } catch (err) {
            setApiError(err.response?.data?.message || 'Failed to create resource');
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white">Create Resource</h2>
                    <button onClick={onClose} className="text-white hover:text-gray-200">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {apiError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                                {apiError}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${errors.name ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="Enter resource name"
                            />
                            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                            <select
                                name="type_id"
                                value={formData.type_id}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${errors.type_id ? 'border-red-500' : 'border-gray-300'
                                    }`}
                            >
                                <option value="">Select Type</option>
                                {resourceTypes.map(type => (
                                    <option key={type.id} value={type.id}>{type.type}</option>
                                ))}
                            </select>
                            {errors.type_id && <p className="mt-1 text-sm text-red-600">{errors.type_id}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${errors.location ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="Enter location"
                            />
                            {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                placeholder="Enter description"
                            />
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                name="requires_approval"
                                id="requires_approval"
                                checked={formData.requires_approval}
                                onChange={handleChange}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="requires_approval" className="ml-2 block text-sm text-gray-900">
                                Requires Approval
                            </label>
                        </div>

                        {selectedTypeSchema && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Properties</label>
                                <div className="space-y-3">
                                    {Object.entries(selectedTypeSchema).map(([key, type]) => (
                                        <div key={key}>
                                            <label className="block text-xs text-gray-600 mb-1">{key} ({type})</label>
                                            <input
                                                type={type === 'number' ? 'number' : 'text'}
                                                value={formData.properties[key] || ''}
                                                onChange={(e) => handlePropertyChange(key, e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder={`Enter ${key}`}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-4 pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`flex-1 py-3 px-4 rounded-lg font-medium text-white transition ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                            >
                                {loading ? 'Creating...' : 'Create Resource'}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="flex-1 py-3 px-4 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
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

export default CreateResourceForm;