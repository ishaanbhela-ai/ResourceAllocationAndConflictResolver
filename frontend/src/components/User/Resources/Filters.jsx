// ============================================================
// FILE: src/components/User/Resources/Filters.jsx (FIXED)
// ============================================================
import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';

const Filters = ({ onFilterChange, filters }) => {
    const [resourceTypes, setResourceTypes] = useState([]); // Initialize as empty array
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchResourceTypes();
    }, []);

    const fetchResourceTypes = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/resource-types', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Handle different response structures
            if (response.data) {
                if (Array.isArray(response.data)) {
                    setResourceTypes(response.data);
                }
                else if (Array.isArray(response.data.resourceTypes)) {
                    setResourceTypes(response.data.resourceTypes);
                }
                else if (Array.isArray(response.data.data)) {
                    setResourceTypes(response.data.data);
                }
                else if (response.data.results && Array.isArray(response.data.results)) {
                    setResourceTypes(response.data.results);
                }
                else {
                    console.error('Unexpected response format:', response.data);
                    setResourceTypes([]);
                }
            } else {
                setResourceTypes([]);
            }
        } catch (error) {
            console.error('Error fetching resource types:', error);
            setResourceTypes([]); // Set to empty array on error
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        const newFilters = {
            ...filters,
            [name]: value,
        };
        onFilterChange(newFilters);
    };

    const handleReset = () => {
        onFilterChange({
            type_id: '',
            location: '',
            prop_capacity: '',
        });
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
                <button
                    onClick={handleReset}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                    Reset Filters
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Resource Type Filter */}
                <div>
                    <label htmlFor="type_id" className="block text-sm font-medium text-gray-700 mb-2">
                        Resource Type
                    </label>
                    <select
                        id="type_id"
                        name="type_id"
                        value={filters.type_id}
                        onChange={handleFilterChange}
                        disabled={loading}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                        <option value="">All Types</option>
                        {loading ? (
                            <option disabled>Loading...</option>
                        ) : (
                            resourceTypes.map((type) => (
                                <option key={type.id} value={type.id}>
                                    {type.name}
                                </option>
                            ))
                        )}
                    </select>
                </div>

                {/* Location Filter */}
                <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                        Location
                    </label>
                    <input
                        type="text"
                        id="location"
                        name="location"
                        value={filters.location}
                        onChange={handleFilterChange}
                        placeholder="Enter location..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    />
                </div>

                {/* Capacity Filter */}
                <div>
                    <label htmlFor="prop_capacity" className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Capacity
                    </label>
                    <input
                        type="number"
                        id="prop_capacity"
                        name="prop_capacity"
                        value={filters.prop_capacity}
                        onChange={handleFilterChange}
                        placeholder="Enter capacity..."
                        min="0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    />
                </div>
            </div>
        </div>
    );
};

export default Filters;