import React from 'react';
import { useNavigate } from 'react-router-dom';

const ResourceCard = ({ resource }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/resources/${resource.id}`);
    };

    return (
        <div
            onClick={handleClick}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer border border-gray-200 hover:border-blue-500"
        >
            <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">{resource.name}</h3>
                <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${resource.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                >
                    {resource.is_active ? 'Active' : 'Inactive'}
                </span>
            </div>

            <div className="space-y-2">
                <div className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm">{resource.location}</span>
                </div>

                <div className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span className="text-sm">Type ID: {resource.type_id}</span>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
                <span className="text-blue-600 text-sm font-medium hover:text-blue-700">
                    View Details →
                </span>
            </div>
        </div>
    );
};

export default ResourceCard;