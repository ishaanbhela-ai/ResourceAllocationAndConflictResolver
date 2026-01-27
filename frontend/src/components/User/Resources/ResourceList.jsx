import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';
import ResourceCard from './ResourceCard';
import Filters from './Filters';

const ResourceList = () => {
    const [resources, setResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filters, setFilters] = useState({
        type_id: '',
        location: '',
        prop_capacity: '',
    });
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
    });

    useEffect(() => {
        fetchResources();
    }, [pagination.page, filters]);

    const fetchResources = async () => {
        try {
            setLoading(true);
            setError('');

            // Build query params only for provided filters
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
            });

            if (filters.type_id) params.append('type_id', filters.type_id);
            if (filters.location) params.append('location', filters.location);
            if (filters.prop_capacity) params.append('prop_capacity', filters.prop_capacity);

            const response = await axios.get(`/api/resources?${params.toString()}`);
            setResources(response.data);
        } catch (err) {
            setError('Failed to load resources. Please try again.');
            console.error('Error fetching resources:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        setPagination((prev) => ({ ...prev, page: 1 })); // Reset to page 1 on filter change
    };

    const handleNextPage = () => {
        setPagination((prev) => ({ ...prev, page: prev.page + 1 }));
    };

    const handlePrevPage = () => {
        setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }));
    };

    if (loading && resources.length === 0) {
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
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Available Resources</h1>
                    <p className="text-gray-600 mt-2">Browse and book available resources</p>
                </div>

                {/* Filters */}
                <Filters onFilterChange={handleFilterChange} filters={filters} />

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {/* Resource Cards Grid */}
                {resources.length === 0 && !loading ? (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Resources Found</h3>
                        <p className="text-gray-600">Try adjusting your filters to see more results.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {resources.map((resource) => (
                                <ResourceCard key={resource.id} resource={resource} />
                            ))}
                        </div>

                        {/* Pagination */}
                        <div className="mt-8 flex justify-center items-center gap-4">
                            <button
                                onClick={handlePrevPage}
                                disabled={pagination.page === 1}
                                className={`px-6 py-2 rounded-lg font-medium transition ${pagination.page === 1
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                            >
                                Previous
                            </button>
                            <span className="text-gray-700 font-medium">Page {pagination.page}</span>
                            <button
                                onClick={handleNextPage}
                                disabled={resources.length < pagination.limit}
                                className={`px-6 py-2 rounded-lg font-medium transition ${resources.length < pagination.limit
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                            >
                                Next
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ResourceList;