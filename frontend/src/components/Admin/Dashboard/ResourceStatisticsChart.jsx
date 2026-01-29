// ============================================================
// FILE: src/components/Admin/Dashboard/ResourceStatisticsChart.jsx
// ============================================================
import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const ResourceStatisticsChart = ({ data, isLoading }) => {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading resource statistics...</p>
                </div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p className="text-gray-600 font-medium">No resource statistics available</p>
                    <p className="text-gray-500 text-sm mt-2">Statistics will appear here once bookings are made</p>
                </div>
            </div>
        );
    }

    // Prepare data for Chart.js
    const chartData = {
        labels: data.map(item => item.resource_name),
        datasets: [
            {
                label: 'Pending',
                data: data.map(item => item.pending),
                backgroundColor: 'rgba(234, 179, 8, 0.8)',
                borderColor: 'rgb(234, 179, 8)',
                borderWidth: 1,
                borderRadius: 6,
                barThickness: 40
            },
            {
                label: 'Approved',
                data: data.map(item => item.approved),
                backgroundColor: 'rgba(34, 197, 94, 0.8)',
                borderColor: 'rgb(34, 197, 94)',
                borderWidth: 1,
                borderRadius: 6,
                barThickness: 40
            },
            {
                label: 'Utilized',
                data: data.map(item => item.utilized),
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                borderColor: 'rgb(59, 130, 246)',
                borderWidth: 1,
                borderRadius: 6,
                barThickness: 40
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: {
                        size: 12,
                        weight: '600'
                    }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                titleFont: {
                    size: 14,
                    weight: 'bold'
                },
                bodyFont: {
                    size: 13
                },
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                displayColors: true,
                callbacks: {
                    label: function (context) {
                        return `${context.dataset.label}: ${context.parsed.y}`;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    font: {
                        size: 12,
                        weight: '500'
                    },
                    color: '#6B7280'
                }
            },
            y: {
                beginAtZero: true,
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)',
                    drawBorder: false
                },
                ticks: {
                    font: {
                        size: 12
                    },
                    color: '#6B7280',
                    stepSize: 1
                }
            }
        },
        interaction: {
            mode: 'index',
            intersect: false
        }
    };

    // Calculate totals
    const totalPending = data.reduce((sum, item) => sum + item.pending, 0);
    const totalApproved = data.reduce((sum, item) => sum + item.approved, 0);
    const totalUtilized = data.reduce((sum, item) => sum + item.utilized, 0);
    const grandTotal = data.reduce((sum, item) => sum + item.total, 0);

    return (
        <div className="space-y-6">
            {/* Chart Container */}
            <div className="h-96">
                <Bar data={chartData} options={options} />
            </div>

            {/* Summary Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-gray-200">
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-yellow-700 text-xs font-semibold uppercase tracking-wide">Pending</p>
                            <p className="text-2xl font-bold text-yellow-900 mt-1">{totalPending}</p>
                        </div>
                        <div className="bg-yellow-500 p-3 rounded-lg shadow-sm">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-700 text-xs font-semibold uppercase tracking-wide">Approved</p>
                            <p className="text-2xl font-bold text-green-900 mt-1">{totalApproved}</p>
                        </div>
                        <div className="bg-green-500 p-3 rounded-lg shadow-sm">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-700 text-xs font-semibold uppercase tracking-wide">Utilized</p>
                            <p className="text-2xl font-bold text-blue-900 mt-1">{totalUtilized}</p>
                        </div>
                        <div className="bg-blue-500 p-3 rounded-lg shadow-sm">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-700 text-xs font-semibold uppercase tracking-wide">Total</p>
                            <p className="text-2xl font-bold text-purple-900 mt-1">{grandTotal}</p>
                        </div>
                        <div className="bg-purple-500 p-3 rounded-lg shadow-sm">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResourceStatisticsChart;