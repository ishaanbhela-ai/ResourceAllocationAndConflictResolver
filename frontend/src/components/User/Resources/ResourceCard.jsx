// FILE: src/components/User/Resources/ResourceCard.jsx (FIXED)
// ============================================================
import React from 'react';
import { useNavigate } from 'react-router-dom';

const ResourceCard = ({ resource }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/resources/${resource.id}`); // FIXED: Added opening parenthesis
    };

    return (
        <div
            onClick={handleClick}
            className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition cursor-pointer border border-gray-200 hover:border-blue-500"
        >
            <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900">{resource.name}</h3>
                <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${resource.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                >
                    {resource.is_active ? 'Active' : 'Inactive'}
                </span>
            </div>

            <div className="space-y-2 mb-3">
                <div className="flex items-center text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm">{resource.location}</span>
                </div>
            </div>

            {/* Properties */}
            {resource.properties && Object.keys(resource.properties).length > 0 && (
                <div className="mb-3">
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

            <div className="pt-3 border-t border-gray-200">
                <span className="text-blue-600 text-sm font-medium hover:text-blue-700">
                    View Details →
                </span>
            </div>
        </div>
    );
};

export default ResourceCard;