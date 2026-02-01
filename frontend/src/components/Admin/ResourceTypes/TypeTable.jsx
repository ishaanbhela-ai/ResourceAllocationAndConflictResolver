import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';

const TypeTable = ({ onCreateClick, onEdit, refreshTrigger }) => {
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deletingId, setDeletingId] = useState(null);
    const [selectedType, setSelectedType] = useState(null);

    useEffect(() => {
        fetchTypes();
    }, [refreshTrigger]);

    const fetchTypes = async () => {
        try {
            setLoading(true);
            setError('');
            const response = await axios.get('/api/resource_types');
            console.log('API Response:', response.data);
            console.log('Response type:', typeof response.data);

            let typesData = Array.isArray(response.data) ? response.data :
                (response.data.data && Array.isArray(response.data.data)) ? response.data.data :
                    (response.data.resource_types && Array.isArray(response.data.resource_types)) ? response.data.resource_types : [];

            console.log('Parsed types data:', typesData);

            if (typesData.length > 0) {
                console.log('First type object:', typesData[0]);
                console.log('Available keys:', Object.keys(typesData[0]));
            }

            setTypes(typesData);
        } catch (err) {
            console.error('Error fetching resource types:', err);
            console.error('Error response:', err.response?.data);
            setError(err.response?.data?.error || 'Failed to load resource types. Please try again.');
            setTypes([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (typeId, typeName) => {
        if (!window.confirm(`Are you sure you want to delete resource type "${typeName}"? This action cannot be undone.`)) {
            return;
        }

        try {
            setDeletingId(typeId);
            await axios.delete(`/api/admin/resource_types/${typeId}`);
            setSelectedType(null);
            await fetchTypes();
        } catch (err) {
            console.error('Delete error:', err.response?.data);
            alert(err.response?.data?.error || err.response?.data?.message || 'Failed to delete resource type');
        } finally {
            setDeletingId(null);
        }
    };

    const formatPropertyValue = (value) => {
        const typeMap = {
            'string': 'Text',
            'number': 'Number',
            'int': 'Integer',
            'integer': 'Integer',
            'boolean': 'True/False',
            'date': 'Date'
        };
        return typeMap[value] || value;
    };

    const getSchemaFromType = (type) => {
        return type.schema_definition ||
            type.schemaDefinition ||
            type.schema ||
            type.properties ||
            type.attributes ||
            null;
    };

    const renderSchemaProperties = (type) => {
        console.log('Rendering schema for type:', type);

        const schema = getSchemaFromType(type);
        console.log('Schema found:', schema);
        console.log('Schema type:', typeof schema);

        if (!schema) {
            return <span className="text-gray-400 text-sm">No properties defined</span>;
        }

        let schemaObj = schema;
        if (typeof schema === 'string') {
            try {
                schemaObj = JSON.parse(schema);
                console.log('Parsed schema from string:', schemaObj);
            } catch (e) {
                console.error('Failed to parse schema string:', e);
                return <span className="text-gray-400 text-sm">Invalid schema format</span>;
            }
        }

        if (typeof schemaObj !== 'object' || schemaObj === null) {
            return <span className="text-gray-400 text-sm">Invalid schema</span>;
        }

        const entries = Object.entries(schemaObj);
        console.log('Schema entries:', entries);

        if (entries.length === 0) {
            return <span className="text-gray-400 text-sm">No properties defined</span>;
        }

        return (
            <div className="space-y-3">
                {entries.map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            {key}
                        </span>
                        <span className="text-gray-700 font-medium">{formatPropertyValue(value)}</span>
                    </div>
                ))}
            </div>
        );
    };

    const getPropertyCount = (type) => {
        const schema = getSchemaFromType(type);
        if (!schema) return 0;

        try {
            const schemaObj = typeof schema === 'string' ? JSON.parse(schema) : schema;
            return Object.keys(schemaObj || {}).length;
        } catch (e) {
            return 0;
        }
    };

    const handleCardClick = (type) => {
        setSelectedType(type);
    };

    const closeModal = () => {
        setSelectedType(null);
    };

    if (loading && types.length === 0) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="text-center">
                    <div className="relative inline-block">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-600 absolute top-0 left-0"></div>
                    </div>
                    <p className="mt-4 text-gray-600 font-medium">Loading resource types...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg">
                <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div>
                        <p className="font-semibold text-red-800">Error loading resource types</p>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                        <button
                            onClick={fetchTypes}
                            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (types.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-md p-12 text-center border-2 border-dashed border-gray-200">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                        className="w-10 h-10 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                        />
                    </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No Resource Types Yet</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Get started by creating your first resource type. Define custom properties to match your needs.
                </p>
                <button
                    onClick={onCreateClick}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold shadow-md transform hover:-translate-y-0.5"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Your First Resource Type
                </button>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {types.map((type) => {
                    const propertyCount = getPropertyCount(type);

                    return (
                        <div
                            key={type.id}
                            onClick={() => handleCardClick(type)}
                            className="group bg-white/80 backdrop-blur-md rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-200 cursor-pointer"
                        >
                            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-6 py-5 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-bold text-white group-hover:text-blue-50 transition">
                                            {type.type}
                                        </h3>
                                    </div>
                                    <div className="flex items-center text-blue-100 text-sm">
                                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                                        </svg>
                                        {propertyCount} {propertyCount === 1 ? 'property' : 'properties'}
                                    </div>
                                </div>
                            </div>

                            <div className="p-6">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(type.id, type.type);
                                    }}
                                    disabled={deletingId === type.id}
                                    className={`w-full px-4 py-2.5 rounded-lg font-medium transition flex items-center justify-center gap-2 ${deletingId === type.id
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-red-50 text-red-600 hover:bg-red-100'
                                        }`}
                                >
                                    {deletingId === type.id ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            Delete
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal */}
            {selectedType && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={closeModal}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-8 py-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
                            <div className="relative z-10 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">{selectedType.type}</h2>
                                        <p className="text-blue-100 text-sm">Resource Type Details</p>
                                    </div>
                                </div>
                                <button
                                    onClick={closeModal}
                                    className="text-white hover:bg-white/20 rounded-lg p-2 transition"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8">
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    Properties
                                </h3>
                                {renderSchemaProperties(selectedType)}
                            </div>

                            {/* Modal Actions */}
                            <div className="flex gap-3 pt-6 border-t border-gray-200">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(selectedType.id, selectedType.type);
                                    }}
                                    disabled={deletingId === selectedType.id}
                                    className={`flex-1 px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${deletingId === selectedType.id
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-red-50 text-red-600 hover:bg-red-100'
                                        }`}
                                >
                                    {deletingId === selectedType.id ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            Delete Type
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={closeModal}
                                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default TypeTable;