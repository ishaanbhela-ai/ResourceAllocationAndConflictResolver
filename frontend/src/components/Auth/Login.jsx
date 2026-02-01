import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from '../../api/axios';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: '',
            }));
        }
        setApiError('');
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!formData.password.trim()) {
            newErrors.password = 'Password is required';
        }

        return newErrors;
    };

    const handleSubmit = async () => {
        console.log('handleSubmit called'); // Debug log

        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            console.log('Validation errors:', validationErrors); // Debug log
            return;
        }

        setLoading(true);
        setApiError('');

        try {
            console.log('Sending login request...'); // Debug log
            const response = await axios.post('/api/auth/login', {
                email: formData.email,
                password: formData.password,
            });

            console.log('Login response:', response); // Debug log

            const { token, user } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('role', user.role);

            const from = location.state?.from?.pathname;

            if (from && from !== '/login') {
                navigate(from, { replace: true });
            } else {
                if (user.role === 'ADMIN') {
                    navigate('/admin', { replace: true });
                } else {
                    navigate('/resources', { replace: true });
                }
            }
        } catch (error) {
            console.log('Login error caught:', error); // Debug log

            if (error.response) {
                const errorMsg = error.response.data.message || 'Invalid email or password';
                console.log('Setting API error:', errorMsg); // Debug log
                setApiError(errorMsg);
            } else if (error.request) {
                setApiError('No response from server. Please check your connection.');
            } else {
                setApiError('An error occurred. Please try again.');
            }
        } finally {
            setLoading(false);
            console.log('Login attempt finished'); // Debug log
        }
    };

    return (
        <div className="min-h-screen flex">
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700">
                <svg className="absolute top-0 left-0 w-full" viewBox="0 0 500 150" preserveAspectRatio="none" style={{ height: '200px' }}>
                    <path d="M0,100 C150,120 350,0 500,50 L500,0 L0,0 Z" fill="white" opacity="0.9"></path>
                </svg>

                <div className="relative z-10 flex items-center justify-center w-full h-full p-12">
                    <div className="text-center text-white space-y-6">
                        <h2 className="text-5xl font-bold">Welcome Back!</h2>
                        <p className="text-xl leading-relaxed opacity-90 max-w-md mx-auto">
                            Streamline your resources with our powerful platform
                        </p>
                    </div>
                </div>

                <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 500 150" preserveAspectRatio="none" style={{ height: '200px' }}>
                    <path d="M0,50 C150,100 350,20 500,70 L500,150 L0,150 Z" fill="white" opacity="0.1"></path>
                </svg>

                <div className="absolute top-10 right-10 w-32 h-32 bg-white rounded-full opacity-10"></div>
                <div className="absolute bottom-20 left-10 w-24 h-24 bg-white rounded-full opacity-10"></div>
            </div>

            <div className="w-full lg:w-1/2 flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4">
                <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 md:p-12">
                    <div className="mb-10">
                        <h1 className="text-4xl font-bold text-gray-800 mb-2">Hello!</h1>
                        <p className="text-gray-600">Sign in to your account</p>
                    </div>

                    {/* Error messages displayed here - outside the Hello section */}
                    {(errors.email || errors.password || apiError) && (
                        <div className="mb-6 space-y-2">
                            {errors.email && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                                    {errors.email}
                                </div>
                            )}
                            {errors.password && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                                    {errors.password}
                                </div>
                            )}
                            {apiError && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                                    {apiError}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="space-y-6">
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                                </svg>
                            </div>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={`w-full pl-20 pr-4 py-4 bg-gradient-to-r from-blue-50 to-blue-100/50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-400 focus:outline-none transition text-gray-700 placeholder-gray-400 ${errors.email ? 'ring-2 ring-red-400' : ''
                                    }`}
                                placeholder="E-mail"
                                autoComplete="email"
                            />
                        </div>

                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                </svg>
                            </div>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className={`w-full pl-20 pr-14 py-4 bg-gradient-to-r from-blue-50 to-blue-100/50 border-0 rounded-2xl focus:ring-2 focus:ring-blue-400 focus:outline-none transition text-gray-700 placeholder-gray-400 ${errors.password ? 'ring-2 ring-red-400' : ''
                                    }`}
                                placeholder="Password"
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-600 focus:outline-none transition"
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                )}
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleSubmit();
                            }}
                            disabled={loading}
                            className={`w-full py-4 px-6 rounded-2xl font-semibold text-white text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg ${loading
                                ? 'bg-blue-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600'
                                }`}
                        >
                            {loading ? 'SIGNING IN...' : 'SIGN IN'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;