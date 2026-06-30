import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import { User, Lock, Phone, Gift, Eye, EyeOff } from 'lucide-react';
import axios from './utils/axios';
import Link from '@mui/material/Link';
import { AuthContext } from './context/AuthContext';

const BRAND_GRADIENT = 'linear-gradient(90deg, rgb(217,173,130), rgb(177,131,90))';

const MODAL_TYPES = {
    success: {
        ring: 'from-[#d9ad82] to-[#b1835a]',
        title: 'Success',
        icon: <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="animate-drawCheck" />,
    },
    error: {
        ring: 'from-[#f87171] to-[#dc2626]',
        title: 'Something went wrong',
        icon: <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="animate-drawCheck" />,
    },
    warning: {
        ring: 'from-[#fbbf24] to-[#d97706]',
        title: 'Heads up',
        icon: <path d="M12 7v6m0 4h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="animate-drawCheck" />,
    },
    info: {
        ring: 'from-[#60a5fa] to-[#2563eb]',
        title: 'Notice',
        icon: <path d="M12 11v5m0-9h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="animate-drawCheck" />,
    },
};

const Register = () => {
    const { referralCode } = useParams();
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);

    const [data, setData] = useState({
        username: '',
        password: '',
        phoneNumber: '',
        recommendationCode: '',
    });

    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [modal, setModal] = useState(null);

    const showModal = useCallback((type, message, title) => {
        setModal({ type, message, title: title || MODAL_TYPES[type]?.title });
    }, []);
    const closeModal = useCallback(() => setModal(null), []);

    useEffect(() => {
        if (!modal || modal.type === 'error') return;
        const t = setTimeout(() => setModal(null), 2200);
        return () => clearTimeout(t);
    }, [modal]);

    useEffect(() => {
        if (referralCode) {
            setData((prev) => ({ ...prev, recommendationCode: referralCode }));
        }
    }, [referralCode]);

    const handleInput = (e) => {
        const { name, value } = e.target;
        setData({ ...data, [name]: value });
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!data.username.trim()) newErrors.username = 'Username is required';
        else if (data.username.length < 4 || data.username.length > 16) {
            newErrors.username = '4-16 letters or numbers';
        }
        if (!data.password) newErrors.password = 'Password is required';
        else if (data.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }
        if (!data.recommendationCode) {
            newErrors.recommendationCode = 'Recommendation code is required';
        } else if (!/^\d{6}$/.test(data.recommendationCode)) {
            newErrors.recommendationCode = 'Recommendation code must be 6 digits';
        }
        if (!data.phoneNumber) newErrors.phoneNumber = 'Mobile number is required';
        else if (!/^\d{9,10}$/.test(data.phoneNumber)) {
            newErrors.phoneNumber = 'Phone number must be 9 or 10 digits';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            showModal('warning', 'Please fix the highlighted fields');
            return;
        }

        setIsSubmitting(true);
        try {
            await axios.post('/user/register', {
                username: data.username.trim(),
                password: data.password,
                phoneNumber: data.phoneNumber,
                referralCode: data.recommendationCode,
            });

            showModal('success', 'Welcome aboard! Signing you in…', 'Registration successful');

            await login({
                username: data.username.trim(),
                password: data.password,
            });

            setTimeout(() => navigate('/'), 1200);
        } catch (error) {
            const errorMsg = error.isRateLimit
                ? error.message
                : error.response?.data?.message || 'Registration failed. Please try again.';
            showModal('error', errorMsg);
            setIsSubmitting(false);
        }
    };

    const cfg = modal ? MODAL_TYPES[modal.type] || MODAL_TYPES.info : null;

    const fieldWrap = (hasError) =>
        `flex items-center gap-2.5 px-3.5 rounded-xl border bg-white transition-all
        ${hasError
            ? 'border-red-300 ring-2 ring-red-100'
            : 'border-gray-200 focus-within:border-[#b1835a] focus-within:ring-2 focus-within:ring-[#d8ab83]/30'}`;

    return (
        <div className="min-h-screen bg-white flex justify-center">
            <div className="w-full md:w-[400px] min-h-screen bg-[#faf9f9] flex flex-col">

                {/* Header */}
                <div className="h-14 flex items-center px-4" style={{ background: BRAND_GRADIENT }}>
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="flex items-center text-white"
                    >
                        <ArrowBackIosIcon fontSize="small" />
                        <p className="text-lg ml-1">Register</p>
                    </button>
                </div>

                {/* Form */}
                <form className="flex flex-col gap-4 mt-5 px-4" onSubmit={handleSubmit}>

                    {/* Username */}
                    <div>
                        <label className="text-sm font-medium text-gray-600 mb-1.5 block">Username</label>
                        <div className={fieldWrap(errors.username)}>
                            <User size={18} className={errors.username ? 'text-red-400' : 'text-[#b1835a]'} />
                            <input
                                name="username"
                                value={data.username}
                                onChange={handleInput}
                                autoComplete="username"
                                className="flex-1 py-3.5 bg-transparent text-[15px] text-gray-800 outline-none placeholder-gray-400"
                                placeholder="4-16 letters or numbers"
                            />
                        </div>
                        {errors.username && <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.username}</p>}
                    </div>

                    {/* Password */}
                    <div>
                        <label className="text-sm font-medium text-gray-600 mb-1.5 block">Password</label>
                        <div className={fieldWrap(errors.password)}>
                            <Lock size={18} className={errors.password ? 'text-red-400' : 'text-[#b1835a]'} />
                            <input
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                value={data.password}
                                onChange={handleInput}
                                autoComplete="new-password"
                                className="flex-1 py-3.5 bg-transparent text-[15px] text-gray-800 outline-none placeholder-gray-400"
                                placeholder="At least 6 characters"
                            />
                            <button
                                type="button"
                                tabIndex={-1}
                                onClick={() => setShowPassword((s) => !s)}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                            </button>
                        </div>
                        {errors.password && <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.password}</p>}
                    </div>

                    {/* Recommendation code */}
                    <div>
                        <label className="text-sm font-medium text-gray-600 mb-1.5 block">Recommendation code</label>
                        <div className={`${fieldWrap(errors.recommendationCode)} ${referralCode ? 'bg-gray-100' : ''}`}>
                            <Gift size={18} className={errors.recommendationCode ? 'text-red-400' : 'text-[#b1835a]'} />
                            <input
                                name="recommendationCode"
                                value={data.recommendationCode}
                                onChange={handleInput}
                                readOnly={!!referralCode}
                                inputMode="numeric"
                                maxLength={6}
                                className={`flex-1 py-3.5 bg-transparent text-[15px] outline-none placeholder-gray-400 ${referralCode ? 'text-gray-500' : 'text-gray-800'}`}
                                placeholder="6-digit code"
                            />
                        </div>
                        {errors.recommendationCode && <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.recommendationCode}</p>}
                    </div>

                    {/* Telephone */}
                    <div>
                        <label className="text-sm font-medium text-gray-600 mb-1.5 block">Telephone</label>
                        <div className={fieldWrap(errors.phoneNumber)}>
                            <Phone size={18} className={errors.phoneNumber ? 'text-red-400' : 'text-[#b1835a]'} />
                            <span className="text-[15px] text-gray-500 font-medium pr-2.5 border-r border-gray-200">+91</span>
                            <input
                                name="phoneNumber"
                                value={data.phoneNumber}
                                onChange={handleInput}
                                inputMode="numeric"
                                maxLength={10}
                                autoComplete="tel"
                                className="flex-1 py-3.5 bg-transparent text-[15px] text-gray-800 outline-none placeholder-gray-400"
                                placeholder="Enter mobile number"
                            />
                        </div>
                        {errors.phoneNumber && <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.phoneNumber}</p>}
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="mt-3 py-4 rounded-xl text-white font-semibold text-[15px] shadow-lg shadow-[#b1835a]/25 transition-all active:scale-[0.98] disabled:opacity-60 disabled:shadow-none flex items-center justify-center gap-2"
                        style={{ background: BRAND_GRADIENT }}
                    >
                        {isSubmitting ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                Registering…
                            </>
                        ) : (
                            'Register'
                        )}
                    </button>

                    <p className="text-center text-sm text-gray-500 mt-1">
                        Already have an account?{' '}
                        <Link href="/login" className="!text-[#b1835a] font-semibold !no-underline">
                            Log in
                        </Link>
                    </p>
                </form>
            </div>

            {modal && cfg && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] animate-fadeIn px-8"
                    onClick={closeModal}
                >
                    <div
                        className="relative bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl px-8 py-6 flex flex-col items-center animate-popIn max-w-[300px] w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${cfg.ring} flex items-center justify-center mb-3 shadow-lg`}>
                            <svg className="w-9 h-9 text-white" viewBox="0 0 24 24" fill="none">{cfg.icon}</svg>
                        </div>
                        <p className="text-gray-800 font-semibold text-base text-center">{modal.title}</p>
                        {modal.message && <p className="text-gray-400 text-xs mt-1 text-center">{modal.message}</p>}
                        {modal.type === 'error' && (
                            <button
                                onClick={closeModal}
                                className="mt-4 px-6 py-2 rounded-xl text-white text-sm font-semibold shadow-md active:scale-95 transition-transform"
                                style={{ background: BRAND_GRADIENT }}
                            >
                                Got it
                            </button>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes popIn { 0% { opacity: 0; transform: scale(0.85); } 100% { opacity: 1; transform: scale(1); } }
                @keyframes drawCheck { from { stroke-dasharray: 40; stroke-dashoffset: 40; } to { stroke-dasharray: 40; stroke-dashoffset: 0; } }
                .animate-fadeIn { animation: fadeIn 0.18s ease-out; }
                .animate-popIn { animation: popIn 0.25s cubic-bezier(0.16,1,0.3,1); }
                .animate-drawCheck { animation: drawCheck 0.4s ease-out 0.1s both; }
            `}</style>
        </div>
    );
};

export default Register;