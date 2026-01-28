import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../../api/axios';

const ResourceList = () => {
    const navigate = useNavigate();
    const [resources, setResources] = useState([]);
    const [filteredResources, setFilteredResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [propertySearch, setPropertySearch] = useState('');

    useEffect(() => {
        fetchResources();
    }, []);

    useEffect(() => {
        filterResources();
    }, [searchTerm, propertySearch, resources]);

    const fetchResources = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/resources');
            const resourceData = Array.isArray(response.data)
                ? response.data
                : response.data.resources || response.data.data || [];
            setResources(resourceData);
            setFilteredResources(resourceData);
        } catch (err) {
            setError('Failed to load resources');
            console.error('Error fetching resources:', err);
        } finally {
            setLoading(false);
        }
    };

    const filterResources = () => {
        let filtered = resources;

        // Filter by name or location
        if (searchTerm) {
            filtered = filtered.filter(resource =>
                resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                resource.location.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by property
        if (propertySearch) {
            filtered = filtered.filter(resource => {
                const properties = resource.properties || {};
                const propertiesString = JSON.stringify(properties).toLowerCase();
                return propertiesString.includes(propertySearch.toLowerCase());
            });
        }

        setFilteredResources(filtered);
    };

    const handleViewDetails = (resourceId) => {
        navigate(`/resources/${resourceId}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading resources...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Available Resources</h1>
                    <p className="text-gray-600">Browse and book available resources</p>
                </div>

                {/* Search and Filter Section */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Search by Name/Location */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Search by Name or Location
                            </label>
                            <input
                                type="text"
                                placeholder="Search resources..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Search by Property */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Search by Property
                            </label>
                            <input
                                type="text"
                                placeholder="e.g., capacity, projector, wifi..."
                                value={propertySearch}
                                onChange={(e) => setPropertySearch(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Results Count and Reset */}
                    <div className="mt-4 flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            Showing {filteredResources.length} of {resources.length} resources
                        </div>
                        {(searchTerm || propertySearch) && (
                            <button
                                onClick={() => {
                                    setSearchTerm('');
                                    setPropertySearch('');
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition"
                            >
                                Reset Filters
                            </button>
                        )}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6">
                        {error}
                    </div>
                )}

                {/* Resources Grid */}
                {filteredResources.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <div className="text-gray-400 text-5xl mb-4">🔍</div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Resources Found</h3>
                        <p className="text-gray-600">
                            {searchTerm || propertySearch
                                ? 'Try adjusting your search filters'
                                : 'No resources available at the moment'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredResources.map((resource) => (
                            <div
                                key={resource.id}
                                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
                            >
                                {/* Card Header */}
                                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                                    <h3 className="text-xl font-bold text-white">{resource.name}</h3>
                                    <p className="text-blue-100 text-sm mt-1">{resource.location}</p>
                                </div>

                                {/* Card Body */}
                                <div className="p-6">
                                    {/* Status Badge */}
                                    <div className="mb-4">
                                        <span
                                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${resource.is_active
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}
                                        >
                                            {resource.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>

                                    {/* Properties */}
                                    {resource.properties && Object.keys(resource.properties).length > 0 && (
                                        <div className="mb-4">
                                            <p className="text-xs font-medium text-gray-500 mb-2">Properties:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {Object.entries(resource.properties).slice(0, 3).map(([key, value]) => (
                                                    <span
                                                        key={key}
                                                        className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                                                    >
                                                        {key}: {String(value)}
                                                    </span>
                                                ))}
                                                {Object.keys(resource.properties).length > 3 && (
                                                    <span className="inline-block bg-gray-100 text-gray-500 px-2 py-1 rounded text-xs">
                                                        +{Object.keys(resource.properties).length - 3} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Approval Badge */}
                                    {resource.requires_approval && (
                                        <div className="mb-4">
                                            <span className="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                                                Requires Approval
                                            </span>
                                        </div>
                                    )}

                                    {/* Action Button */}
                                    <button
                                        onClick={() => handleViewDetails(resource.id)}
                                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResourceList;