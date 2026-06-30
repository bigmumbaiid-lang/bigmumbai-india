import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';
import BackButton from '../../components/BackButton';
import { Lock, KeyRound, Eye, EyeOff } from 'lucide-react';

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

function PasswordField({ name, value, onChange, placeholder, error, icon: Icon, autoComplete }) {
    const [show, setShow] = React.useState(false);
    return (
        <div>
            <div
                className={`flex items-center gap-2.5 px-3.5 rounded-xl border bg-gray-50/70 transition-all
                    ${error
                        ? 'border-red-300 bg-red-50/60 ring-2 ring-red-100'
                        : 'border-gray-200 focus-within:border-[#b1835a] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#d8ab83]/30'}`}
            >
                <Icon size={18} className={error ? 'text-red-400' : 'text-gray-400'} />
                <input
                    type={show ? 'text' : 'password'}
                    name={name}
                    value={value}
                    onChange={onChange}
                    autoComplete={autoComplete}
                    placeholder={placeholder}
                    className="flex-1 py-3.5 bg-transparent text-[15px] text-gray-800 outline-none placeholder-gray-400"
                />
                <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShow((s) => !s)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                    {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
            </div>
            {error && <p className="text-red-500 text-xs mt-1.5 ml-1">{error}</p>}
        </div>
    );
}

function ModifyLoginPassword() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.currentPassword.trim())
            newErrors.currentPassword = 'Please enter current password';
        if (!formData.newPassword.trim())
            newErrors.newPassword = 'Please enter new password';
        if (!formData.confirmPassword.trim())
            newErrors.confirmPassword = 'Please confirm password';
        if (formData.newPassword && formData.confirmPassword &&
            formData.newPassword !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        if (formData.newPassword && formData.newPassword.length < 6) {
            newErrors.newPassword = 'Password must be at least 6 characters';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setLoading(true);
        try {
            const response = await axios.put('/user/change-login-password', formData);
            if (response.data.success) {
                showModal('success', 'Login password updated successfully!', 'Password updated');
                setTimeout(() => navigate('/account-security'), 1500);
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Failed to update password';
            showModal('error', errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const cfg = modal ? MODAL_TYPES[modal.type] || MODAL_TYPES.info : null;

    return (
        <div className="min-h-screen max-h-screen flex items-center justify-center">
            <div className="w-full lg:max-w-[400px] mx-auto h-screen flex flex-col overflow-hidden shadow-2xl border border-gray-300">

                <BackButton label="Account Security" />

                <div className="flex-1 overflow-y-auto bg-white px-5 pt-6">
                    <p className="text-sm text-gray-400 mb-6">
                        Choose a strong password you don't use elsewhere.
                    </p>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <PasswordField
                            name="currentPassword"
                            value={formData.currentPassword}
                            onChange={handleChange}
                            placeholder="Current login password"
                            error={errors.currentPassword}
                            icon={Lock}
                            autoComplete="current-password"
                        />
                        <PasswordField
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleChange}
                            placeholder="New password"
                            error={errors.newPassword}
                            icon={KeyRound}
                            autoComplete="new-password"
                        />
                        <PasswordField
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Confirm new password"
                            error={errors.confirmPassword}
                            icon={KeyRound}
                            autoComplete="new-password"
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-6 py-4 rounded-xl text-white font-semibold text-[15px] shadow-lg shadow-[#b1835a]/25 transition-all active:scale-[0.98] disabled:opacity-60 disabled:shadow-none flex items-center justify-center gap-2"
                            style={{ background: BRAND_GRADIENT }}
                        >
                            {loading ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                    Submitting…
                                </>
                            ) : (
                                'Update Password'
                            )}
                        </button>
                    </form>
                </div>
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
}

export default ModifyLoginPassword;