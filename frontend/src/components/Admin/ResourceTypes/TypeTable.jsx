import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';

const TypeTable = ({ onCreateClick, onEdit, refreshTrigger }) => {
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deletingId, setDeletingId] = useState(null);
    const [expandedId, setExpandedId] = useState(null);

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
            await fetchTypes();
        } catch (err) {
            console.error('Delete error:', err.response?.data);
            alert(err.response?.data?.error || err.response?.data?.message || 'Failed to delete resource type');
        } finally {
            setDeletingId(null);
        }
    };

    const toggleExpand = (typeId) => {
        setExpandedId(expandedId === typeId ? null : typeId);
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
            <div className="space-y-2">
                {entries.map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2 text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {key}
                        </span>
                        <span className="text-gray-600">→</span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {types.map((type) => {
                const propertyCount = getPropertyCount(type);

                return (
                    <div
                        key={type.id}
                        className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all border border-gray-100 overflow-hidden"
                    >
                        <div
                            className="aspect-square cursor-pointer hover:bg-gray-50 transition-colors flex flex-col"
                            onClick={() => toggleExpand(type.id)}
                        >
                            <div className="p-4 flex-1 flex flex-col">
                                <div className="flex flex-col items-center text-center mb-3">
                                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-3">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-base font-bold text-gray-900 line-clamp-2">{type.type}</h3>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {propertyCount} {propertyCount === 1 ? 'property' : 'properties'}
                                    </p>
                                </div>

                                <div className="mt-auto flex flex-col gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(type.id, type.type);
                                        }}
                                        disabled={deletingId === type.id}
                                        className={`w-full px-3 py-2 rounded-lg font-medium transition flex items-center justify-center gap-1.5 text-sm ${deletingId === type.id
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-red-50 text-red-600 hover:bg-red-100'
                                            }`}
                                    >
                                        {deletingId === type.id ? (
                                            <>
                                                <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Deleting
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                                Delete
                                            </>
                                        )}
                                    </button>

                                    <div className="text-center text-gray-400">
                                        <svg
                                            className={`w-4 h-4 mx-auto transition-transform ${expandedId === type.id ? 'rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                        <span className="text-xs">View Details</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Expandable Details */}
                        {expandedId === type.id && (
                            <div className="border-t border-gray-200 bg-gray-50 p-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-3">Properties</h4>
                                {renderSchemaProperties(type)}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default TypeTable;