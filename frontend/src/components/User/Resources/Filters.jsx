import React, { useState, useEffect } from 'react';
import axios from '../../../api/axios';

const Filters = ({ onFilterChange, filters }) => {
    const [resourceTypes, setResourceTypes] = useState([]);
    const [localFilters, setLocalFilters] = useState({
        type_id: filters.type_id || '',
        location: filters.location || '',
        prop_capacity: filters.prop_capacity || '',
    });

    useEffect(() => {
        fetchResourceTypes();
    }, []);

    const fetchResourceTypes = async () => {
        try {
            const response = await axios.get('/api/resource_types');
            setResourceTypes(response.data);
        } catch (error) {
            console.error('Failed to fetch resource types:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setLocalFilters((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleApply = () => {
        onFilterChange(localFilters);
    };

    const handleReset = () => {
        const resetFilters = {
            type_id: '',
            location: '',
            prop_capacity: '',
        };
        setLocalFilters(resetFilters);
        onFilterChange(resetFilters);
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Resource Type */}
                <div>
                    <label htmlFor="type_id" className="block text-sm font-medium text-gray-700 mb-2">
                        Resource Type
                    </label>
                    <select
                        id="type_id"
                        name="type_id"
                        value={localFilters.type_id}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                        <option value="">All Types</option>
                        {resourceTypes.map((type) => (
                            <option key={type.id} value={type.id}>
                                {type.type}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Location */}
                <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                        Location
                    </label>
                    <input
                        type="text"
                        id="location"
                        name="location"
                        value={localFilters.location}
                        onChange={handleChange}
                        placeholder="Enter location"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                </div>

                {/* Capacity */}
                <div>
                    <label htmlFor="prop_capacity" className="block text-sm font-medium text-gray-700 mb-2">
                        Capacity
                    </label>
                    <input
                        type="text"
                        id="prop_capacity"
                        name="prop_capacity"
                        value={localFilters.prop_capacity}
                        onChange={handleChange}
                        placeholder="Enter capacity"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-4">
                <button
                    onClick={handleApply}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                >
                    Apply Filters
                </button>
                <button
                    onClick={handleReset}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
                >
                    Reset
                </button>
            </div>
        </div>
    );
};

export default Filters;