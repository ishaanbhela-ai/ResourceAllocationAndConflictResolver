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

    useEffect(() => {
        fetchResources();
    }, []);

    useEffect(() => {
        filterResources();
    }, [searchTerm, resources]);

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
        if (!searchTerm.trim()) {
            setFilteredResources(resources);
            return;
        }

        const searchLower = searchTerm.toLowerCase();
        const filtered = resources.filter(resource => {
            if (resource.name.toLowerCase().includes(searchLower)) return true;

            if (resource.location.toLowerCase().includes(searchLower)) return true;

            if (resource.properties) {
                const propertiesString = JSON.stringify(resource.properties).toLowerCase();
                if (propertiesString.includes(searchLower)) return true;
            }

            return false;
        });

        setFilteredResources(filtered);
    };

    const handleViewDetails = (resourceId) => {
        navigate(`/resources/${resourceId}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 bg-blue-600 rounded-full opacity-20 animate-pulse"></div>
                        </div>
                    </div>
                    <p className="mt-4 text-gray-600 font-medium">Loading resources...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                Available Resources
                            </h1>
                        </div>
                    </div>
                </div>

                <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 p-6 mb-8">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search by name, location, or properties..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-900 placeholder-gray-400 text-lg"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition"
                            >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-medium text-gray-700">
                                {filteredResources.length} {filteredResources.length === 1 ? 'resource' : 'resources'} found
                            </span>
                        </div>
                        {searchTerm && (
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <span>Searching for:</span>
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                                    {searchTerm}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6 shadow-md">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span className="text-red-700 font-medium">{error}</span>
                        </div>
                    </div>
                )}

                {filteredResources.length === 0 ? (
                    <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 p-16 text-center">
                        <div className="max-w-md mx-auto">
                            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Resources Found</h3>
                            <p className="text-gray-600 mb-6">
                                {searchTerm
                                    ? `No resources match "${searchTerm}". Try different keywords.`
                                    : 'No resources available at the moment.'}
                            </p>
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                                >
                                    Clear Search
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredResources.map((resource) => (
                            <div
                                key={resource.id}
                                onClick={() => handleViewDetails(resource.id)}
                                className="group bg-white/80 backdrop-blur-md rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-200 cursor-pointer"
                            >
                                <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-6 py-5 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
                                    <div className="relative z-10">
                                        <h3 className="text-xl font-bold text-white mb-1 group-hover:text-blue-50 transition">
                                            {resource.name}
                                        </h3>
                                        <div className="flex items-center text-blue-100 text-sm">
                                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                            </svg>
                                            {resource.location}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <div className="mb-4">
                                        <span
                                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${resource.is_active
                                                ? 'bg-green-100 text-green-800 border border-green-200'
                                                : 'bg-red-100 text-red-800 border border-red-200'
                                                }`}
                                        >
                                            <span className={`w-2 h-2 rounded-full mr-2 ${resource.is_active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                            {resource.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>

                                    {resource.properties && Object.keys(resource.properties).length > 0 && (
                                        <div className="mb-4">
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                                Properties
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {Object.entries(resource.properties).slice(0, 3).map(([key, value]) => (
                                                    <span
                                                        key={key}
                                                        className="inline-flex items-center bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 shadow-sm"
                                                    >
                                                        <span className="font-semibold mr-1">{key}:</span>
                                                        {String(value)}
                                                    </span>
                                                ))}
                                                {Object.keys(resource.properties).length > 3 && (
                                                    <span className="inline-flex items-center bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-medium border border-blue-200 shadow-sm">
                                                        +{Object.keys(resource.properties).length - 3} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {resource.requires_approval && (
                                        <div>
                                            <span className="inline-flex items-center bg-yellow-100 text-yellow-800 px-3 py-1.5 rounded-lg text-xs font-semibold border border-yellow-200 shadow-sm">
                                                <svg className="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                </svg>
                                                Requires Approval
                                            </span>
                                        </div>
                                    )}
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