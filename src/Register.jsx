import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import { User, Lock, Phone, Gift, Eye, EyeOff } from 'lucide-react';
import axios from './utils/axios';
import Link from '@mui/material/Link';
import { AuthContext } from './context/AuthContext';
import logo from './assets/logo.jpg';

const BRAND_GRADIENT = 'linear-gradient(135deg, rgb(217,173,130) 0%, rgb(177,131,90) 100%)';

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
    const [error, setError] = useState('');

    useEffect(() => {
        if (referralCode) {
            setData((prev) => ({ ...prev, recommendationCode: referralCode }));
        }
    }, [referralCode]);

    const handleInput = (e) => {
        const { name, value } = e.target;
        setData({ ...data, [name]: value });
        setError('');
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
        else if (!/^\d{10}$/.test(data.phoneNumber)) {
            newErrors.phoneNumber = 'Phone number must be exactly 10 digits';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            await axios.post('/user/register', {
                username: data.username.trim(),
                password: data.password,
                phoneNumber: data.phoneNumber,
                referralCode: data.recommendationCode,
            });

            await login({
                username: data.username.trim(),
                password: data.password,
            });

            navigate('/');
        } catch (err) {
            setError(
                err.isRateLimit
                    ? err.message
                    : err.response?.data?.message || 'Registration failed. Please try again.'
            );
            setIsSubmitting(false);
        }
    };

    const fieldWrap = (hasError) =>
        `flex items-center gap-3 px-4 rounded-2xl border-2 transition-all
        ${hasError
            ? 'border-red-300 bg-red-50/40 ring-4 ring-red-100'
            : 'border-gray-200 bg-white focus-within:border-[#b1835a] focus-within:ring-4 focus-within:ring-[#d8ab83]/20'}`;

    const iconChip = (hasError) =>
        `w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${hasError ? 'bg-red-100' : 'bg-[#f0e0c6]'}`;

    return (
        <div
            className="flex items-center justify-center min-h-screen bg-white"
            style={{ minHeight: '100dvh' }}
        >
            <div className="w-full lg:max-w-[400px] mx-auto min-h-screen flex flex-col shadow-2xl border bg-white border-gray-300">
                {/* Header */}
                <div
                    className="h-14 flex items-center px-4 shrink-0"
                    style={{ background: BRAND_GRADIENT }}
                >
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        aria-label="Go back"
                        className="flex items-center text-white"
                    >
                        <ArrowBackIosIcon fontSize="small" />
                        <p className="text-lg ml-1">Register</p>
                    </button>
                    <img src={logo} className="w-24 ml-auto" alt="Big Mumbai" />
                </div>

                {/* Form */}
                <div className="px-5 pt-6">
                    {error && (
                        <div className="mb-4 px-4 py-2.5 rounded-xl bg-red-50 border border-red-200">
                            <p className="text-sm font-medium text-red-600 text-center">{error}</p>
                        </div>
                    )}
                    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>

                        {/* Username */}
                        <div>
                            <label className="text-sm font-medium text-gray-600 mb-1.5 block">Username</label>
                            <div className={fieldWrap(errors.username)}>
                                <div className={iconChip(errors.username)}>
                                    <User size={16} className={errors.username ? 'text-red-500' : 'text-[#b1835a]'} />
                                </div>
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
                                <div className={iconChip(errors.password)}>
                                    <Lock size={16} className={errors.password ? 'text-red-500' : 'text-[#b1835a]'} />
                                </div>
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
                                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 shrink-0"
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
                            <div className={`${fieldWrap(errors.recommendationCode)} ${referralCode ? '!bg-gray-100' : ''}`}>
                                <div className={iconChip(errors.recommendationCode)}>
                                    <Gift size={16} className={errors.recommendationCode ? 'text-red-500' : 'text-[#b1835a]'} />
                                </div>
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
                                <div className={iconChip(errors.phoneNumber)}>
                                    <Phone size={16} className={errors.phoneNumber ? 'text-red-500' : 'text-[#b1835a]'} />
                                </div>
                                <span className="text-[15px] text-gray-500 font-medium pr-2.5 border-r border-[#e9d6ba]">+91</span>
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
                            className="mt-2 py-4 rounded-2xl text-white font-semibold text-[15px] shadow-lg shadow-[#b1835a]/30 transition-all active:scale-[0.98] disabled:opacity-60 disabled:shadow-none flex items-center justify-center gap-2"
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
                    </form>
                </div>

                <p className="text-center text-sm text-gray-500 pt-4 pb-8">
                    Already have an account?{' '}
                    <Link href="/login" className="!text-[#b1835a] font-semibold !no-underline">
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
