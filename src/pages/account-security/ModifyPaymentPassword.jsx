import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../utils/axios';
import BackButton from '../../components/BackButton';
import { AuthContext } from '../../context/AuthContext';
import { Lock, KeyRound, Eye, EyeOff, CreditCard, CheckCircle2, XCircle, ShieldAlert } from 'lucide-react';

const BRAND       = 'rgb(177,131,90)';
const BRAND_LIGHT = 'rgb(253,246,237)';
const BRAND_GRAD  = 'linear-gradient(135deg, rgb(217,173,130), rgb(177,131,90))';

/* ── password field ──────────────────────────────────────────── */
function PasswordField({ label, name, value, onChange, placeholder, error, icon: Icon, autoComplete, hint }) {
    const [show, setShow] = useState(false);
    return (
        <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
            <div className={`flex items-center gap-2.5 px-3.5 rounded-xl border transition-all bg-white
                ${error
                    ? 'border-red-300 ring-2 ring-red-100'
                    : 'border-gray-200 focus-within:border-[#b1835a] focus-within:ring-2 focus-within:ring-[#d8ab83]/25'}`}>
                <Icon size={16} className={error ? 'text-red-400 shrink-0' : 'text-gray-400 shrink-0'} />
                <input
                    type={show ? 'text' : 'password'}
                    name={name}
                    value={value}
                    onChange={onChange}
                    autoComplete={autoComplete}
                    placeholder={placeholder}
                    className="flex-1 py-3 bg-transparent text-sm text-gray-800 outline-none placeholder-gray-400"
                />
                <button type="button" tabIndex={-1} onClick={() => setShow(s => !s)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 shrink-0">
                    {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
            </div>
            {error && <p className="text-red-500 text-xs flex items-center gap-1"><XCircle size={11} />{error}</p>}
            {hint && !error && <p className="text-gray-400 text-xs">{hint}</p>}
        </div>
    );
}

/* ── modal ───────────────────────────────────────────────────── */
const MODAL_TYPES = {
    success: { ring: 'from-[#d9ad82] to-[#b1835a]', title: 'Password Updated',
        icon: <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="animate-drawCheck" /> },
    error:   { ring: 'from-[#f87171] to-[#dc2626]', title: 'Something went wrong',
        icon: <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="animate-drawCheck" /> },
    warning: { ring: 'from-[#fbbf24] to-[#d97706]', title: 'Heads up',
        icon: <path d="M12 7v6m0 4h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="animate-drawCheck" /> },
};

function ModifyPaymentPassword() {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [form, setForm]     = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [errors, setErrors] = useState({});
    const [loading, setLoading]   = useState(false);
    const [checking, setChecking] = useState(true);
    const [modal, setModal]   = useState(null);

    const showModal  = useCallback((type, message, title) =>
        setModal({ type, message, title: title || MODAL_TYPES[type]?.title }), []);
    const closeModal = useCallback(() => setModal(null), []);

    useEffect(() => {
        if (!modal || modal.type === 'error') return;
        const t = setTimeout(() => setModal(null), 2200);
        return () => clearTimeout(t);
    }, [modal]);

    useEffect(() => {
        let cancelled = false;
        const check = async (attempt = 1) => {
            try {
                const res  = await axios.get('/bank-card/get-bank-card');
                const card = res.data?.data ?? res.data?.bankCard ?? res.data;
                const has  = !!card && typeof card === 'object' && (card.bankAccount || card._id);
                if (cancelled) return;
                if (has) { setChecking(false); }
                else {
                    showModal('warning', 'Please add a bank card first');
                    setTimeout(() => navigate('/account-security', { replace: true }), 1400);
                }
            } catch (err) {
                if (cancelled) return;
                if (err?.response?.status === 401 && attempt < 3) {
                    setTimeout(() => check(attempt + 1), 400); return;
                }
                navigate('/account-security', { replace: true });
            }
        };
        check();
        return () => { cancelled = true; };
    }, [navigate, showModal]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(p => ({ ...p, [name]: value }));
        if (errors[name]) setErrors(p => ({ ...p, [name]: '' }));
    };

    const validate = () => {
        const e = {};
        if (!form.currentPassword)  e.currentPassword = 'Enter your current payment password';
        if (!form.newPassword)       e.newPassword     = 'Enter a new payment password';
        else if (form.newPassword.length < 4) e.newPassword = 'Must be at least 4 characters';
        if (!form.confirmPassword)   e.confirmPassword = 'Confirm your new password';
        else if (form.newPassword !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
        setErrors(e);
        return !Object.keys(e).length;
    };

    const handleSubmit = async (ev) => {
        ev.preventDefault();
        if (!validate()) return;
        setLoading(true);
        try {
            const { data } = await axios.post('/bank-card/update-payment-password', {
                currentPassword: form.currentPassword,
                newPassword:     form.newPassword,
            });
            if (data.success) {
                showModal('success', 'Your payment password has been changed.');
                setTimeout(() => navigate('/account-security'), 1600);
            }
        } catch (err) {
            showModal('error', err.response?.data?.message || 'Failed to update password');
            setLoading(false);
        }
    };

    const cfg = modal ? MODAL_TYPES[modal.type] || MODAL_TYPES.error : null;

    if (checking) return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <span className="w-6 h-6 border-2 border-gray-200 border-t-[#b1835a] rounded-full animate-spin" />
            {modal && cfg && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] px-8">
                    <div className="bg-white rounded-2xl shadow-2xl px-8 py-7 flex flex-col items-center max-w-[300px] w-full">
                        <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${cfg.ring} flex items-center justify-center mb-3`}>
                            <svg className="w-9 h-9 text-white" viewBox="0 0 24 24" fill="none">{cfg.icon}</svg>
                        </div>
                        <p className="text-gray-800 font-bold text-base text-center">{modal.title}</p>
                        {modal.message && <p className="text-gray-400 text-xs mt-1.5 text-center">{modal.message}</p>}
                    </div>
                </div>
            )}
            <style>{`@keyframes drawCheck{from{stroke-dasharray:40;stroke-dashoffset:40}to{stroke-dasharray:40;stroke-dashoffset:0}}.animate-drawCheck{animation:drawCheck 0.4s ease-out 0.1s both}`}</style>
        </div>
    );

    return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#f5f6fa' }}>
            <div className="w-full lg:max-w-[400px] mx-auto h-screen flex flex-col overflow-hidden shadow-2xl border border-gray-200 bg-white">

                <BackButton label="Modify Payment Password" />

                <div className="flex-1 overflow-y-auto">

                    <form onSubmit={handleSubmit} className="px-5 pt-5 pb-8 space-y-4">

                        <PasswordField label="Current Payment Password" name="currentPassword"
                            value={form.currentPassword} onChange={handleChange}
                            placeholder="Enter current password"
                            error={errors.currentPassword} icon={Lock}
                            autoComplete="current-password" />

                        <PasswordField label="New Payment Password" name="newPassword"
                            value={form.newPassword} onChange={handleChange}
                            placeholder="Enter new password"
                            error={errors.newPassword} icon={KeyRound}
                            autoComplete="new-password"
                            hint="Minimum 4 characters" />

                        <PasswordField label="Confirm New Password" name="confirmPassword"
                            value={form.confirmPassword} onChange={handleChange}
                            placeholder="Re-enter new password"
                            error={errors.confirmPassword} icon={KeyRound}
                            autoComplete="new-password" />

                        {/* match indicator */}
                        {form.newPassword && form.confirmPassword && (
                            <div className={`flex items-center gap-1.5 text-xs font-medium ${form.newPassword === form.confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
                                {form.newPassword === form.confirmPassword
                                    ? <><CheckCircle2 size={13} />Passwords match</>
                                    : <><XCircle size={13} />Passwords don't match</>}
                            </div>
                        )}

                        {/* warning notice */}
                        <div className="flex items-start gap-3 rounded-xl p-3.5" style={{ background: BRAND_LIGHT }}>
                            <ShieldAlert size={16} className="shrink-0 mt-0.5" style={{ color: BRAND }} />
                            <div>
                                <p className="text-xs font-semibold" style={{ color: BRAND }}>Keep it safe</p>
                                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                                    Never share your payment password with anyone. This password protects your funds.
                                </p>
                            </div>
                        </div>

                        <button type="submit" disabled={loading}
                            className="w-full py-3.5 rounded-xl text-white font-semibold text-sm shadow-lg transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
                            style={{ background: BRAND_GRAD, boxShadow: '0 4px 14px rgba(177,131,90,0.35)' }}>
                            {loading
                                ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Updating…</>
                                : 'Update Payment Password'}
                        </button>
                    </form>
                </div>
            </div>

            {modal && cfg && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] animate-fadeIn px-8" onClick={closeModal}>
                    <div className="relative bg-white rounded-2xl shadow-2xl px-8 py-7 flex flex-col items-center animate-popIn max-w-[300px] w-full" onClick={e => e.stopPropagation()}>
                        <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${cfg.ring} flex items-center justify-center mb-3 shadow-lg`}>
                            <svg className="w-9 h-9 text-white" viewBox="0 0 24 24" fill="none">{cfg.icon}</svg>
                        </div>
                        <p className="text-gray-800 font-bold text-base text-center">{modal.title}</p>
                        {modal.message && <p className="text-gray-400 text-xs mt-1.5 text-center leading-relaxed">{modal.message}</p>}
                        {modal.type === 'error' && (
                            <button onClick={closeModal}
                                className="mt-4 px-6 py-2.5 rounded-xl text-white text-sm font-semibold active:scale-95 transition-transform"
                                style={{ background: BRAND_GRAD }}>
                                Got it
                            </button>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn    { from { opacity:0 } to { opacity:1 } }
                @keyframes popIn     { 0% { opacity:0; transform:scale(0.88) } 100% { opacity:1; transform:scale(1) } }
                @keyframes drawCheck { from { stroke-dasharray:40; stroke-dashoffset:40 } to { stroke-dasharray:40; stroke-dashoffset:0 } }
                .animate-fadeIn    { animation: fadeIn  0.18s ease-out }
                .animate-popIn     { animation: popIn   0.25s cubic-bezier(0.16,1,0.3,1) }
                .animate-drawCheck { animation: drawCheck 0.4s ease-out 0.1s both }
            `}</style>
        </div>
    );
}

export default ModifyPaymentPassword;
