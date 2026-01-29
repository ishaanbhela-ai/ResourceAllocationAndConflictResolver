// ============================================================
// FILE: src/components/Admin/Dashboard/UserStatisticsChart.jsx
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

const UserStatisticsChart = ({ data, isLoading }) => {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading user statistics...</p>
                </div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-gray-600 font-medium">No user statistics available</p>
                    <p className="text-gray-500 text-sm mt-2">Statistics will appear here once users release bookings</p>
                </div>
            </div>
        );
    }

    // Color palette for each user
    const colors = [
        { bg: 'rgba(16, 185, 129, 0.8)', border: 'rgb(16, 185, 129)' },      // Emerald
        { bg: 'rgba(20, 184, 166, 0.8)', border: 'rgb(20, 184, 166)' },      // Teal
        { bg: 'rgba(6, 182, 212, 0.8)', border: 'rgb(6, 182, 212)' },        // Cyan
        { bg: 'rgba(14, 165, 233, 0.8)', border: 'rgb(14, 165, 233)' },      // Sky
        { bg: 'rgba(99, 102, 241, 0.8)', border: 'rgb(99, 102, 241)' }       // Indigo
    ];

    // Prepare data for Chart.js
    const chartData = {
        labels: data.map(item => item.user_name),
        datasets: [
            {
                label: 'Released Bookings',
                data: data.map(item => item.released_count),
                backgroundColor: data.map((_, index) => colors[index % colors.length].bg),
                borderColor: data.map((_, index) => colors[index % colors.length].border),
                borderWidth: 2,
                borderRadius: 8,
                barThickness: 60
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
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
                callbacks: {
                    label: function (context) {
                        const count = context.parsed.y;
                        return `Released: ${count} ${count === 1 ? 'booking' : 'bookings'}`;
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
        }
    };

    // Calculate totals
    const totalReleased = data.reduce((sum, item) => sum + item.released_count, 0);

    return (
        <div className="space-y-6">

            {/* Summary Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-gray-200">
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-5 border border-emerald-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-emerald-700 text-xs font-semibold uppercase tracking-wide mb-1">Total Released</p>
                            <p className="text-3xl font-bold text-emerald-900">{totalReleased}</p>
                            <p className="text-emerald-600 text-sm mt-1">Total bookings released</p>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 rounded-xl shadow-md">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-5 border border-blue-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-700 text-xs font-semibold uppercase tracking-wide mb-1">Active Users</p>
                            <p className="text-3xl font-bold text-blue-900">{data.length}</p>
                            <p className="text-blue-600 text-sm mt-1">Users with releases</p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl shadow-md">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
            {/* Chart Container */}
            <div className="h-96">
                <Bar data={chartData} options={options} />
            </div>




        </div>
    );
};

export default UserStatisticsChart;