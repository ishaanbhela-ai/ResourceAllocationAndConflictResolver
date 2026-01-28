import React, { useState } from 'react';
import axios from '../../../api/axios';

const APIDebugger = () => {
    const [response, setResponse] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const testAPI = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get('/api/resource_types');
            console.log('Raw API Response:', res);
            console.log('Response Data:', res.data);
            console.log('Data Type:', typeof res.data);
            console.log('Is Array:', Array.isArray(res.data));

            setResponse({
                raw: res,
                data: res.data,
                dataType: typeof res.data,
                isArray: Array.isArray(res.data),
                dataKeys: res.data ? Object.keys(res.data) : [],
                stringified: JSON.stringify(res.data, null, 2)
            });
        } catch (err) {
            console.error('API Error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">API Response Debugger</h2>

            <button
                onClick={testAPI}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
                {loading ? 'Testing...' : 'Test /api/resource_types'}
            </button>

            {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 font-semibold">Error:</p>
                    <p className="text-red-600 text-sm">{error}</p>
                </div>
            )}

            {response && (
                <div className="mt-4 space-y-4">
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <p className="font-semibold text-gray-900 mb-2">Response Info:</p>
                        <div className="space-y-1 text-sm">
                            <p><strong>Data Type:</strong> {response.dataType}</p>
                            <p><strong>Is Array:</strong> {response.isArray ? 'Yes' : 'No'}</p>
                            <p><strong>Data Keys:</strong> {response.dataKeys.join(', ') || 'None'}</p>
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                        <p className="font-semibold text-gray-900 mb-2">Full Response Data:</p>
                        <pre className="text-xs overflow-auto max-h-96 bg-gray-900 text-green-400 p-3 rounded">
                            {response.stringified}
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
};

export default APIDebugger;