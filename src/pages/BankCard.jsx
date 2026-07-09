import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import BackButton from '../components/BackButton';
import { User, Landmark, CreditCard, Hash, Lock, Eye, EyeOff, ShieldCheck, Check, AlertTriangle } from 'lucide-react';

const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const validateIFSC = (code) => IFSC_RE.test(code);

const BRAND_GRADIENT = 'linear-gradient(135deg, #e2b97a 0%, #b1835a 100%)';

const SkeletonInput = () => (
    <div className="space-y-1">
        <div className="h-2.5 w-16 bg-gray-100 animate-pulse rounded-full" />
        <div className="h-11 w-full bg-gray-100 animate-pulse rounded-2xl" />
    </div>
);

function InputRow({ icon: Icon, error, disabled, verified, children }) {
    const state = error ? 'error' : verified ? 'verified' : disabled ? 'disabled' : 'default';
    const STYLES = {
        error:    { wrap: 'border-rose-300 bg-rose-50/50',       chip: 'bg-rose-100',    iconColor: '#e11d48' },
        verified: { wrap: 'border-emerald-300 bg-emerald-50/40', chip: 'bg-emerald-100', iconColor: '#059669' },
        disabled: { wrap: 'border-gray-100 bg-gray-50',          chip: 'bg-gray-100',    iconColor: '#9ca3af' },
        default:  {
            wrap: 'border-gray-200 bg-white focus-within:border-[#c8962a] focus-within:shadow-[0_0_0_3px_rgba(200,150,42,0.1)]',
            chip: 'bg-[#faf3e9]', iconColor: '#c8962a',
        },
    }[state];

    return (
        <div className={`flex items-center gap-2.5 rounded-2xl border px-3 h-11 transition-all duration-150 ${STYLES.wrap}`}>
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-colors duration-150 ${STYLES.chip}`}>
                <Icon size={15} color={STYLES.iconColor} />
            </div>
            {children}
        </div>
    );
}

function SectionDivider({ label }) {
    return (
        <div className="flex items-center gap-2 py-1">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-[9px] font-semibold text-gray-300 uppercase tracking-[0.15em]">{label}</span>
            <div className="flex-1 h-px bg-gray-100" />
        </div>
    );
}

function BankCard() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        actualName: '', ifscCode: '', bankName: '',
        bankAccount: '', paymentPassword: '', confirmPaymentPassword: '',
    });

    const [errors, setErrors]         = useState({});
    const [loading, setLoading]       = useState(false);
    const [isExisting, setIsExisting] = useState(false);
    const [cardVerified, setCardVerified] = useState(false);
    const [pageLoading, setPageLoading]   = useState(true);
    const [loadError, setLoadError]       = useState(false);
    const [showSuccess, setShowSuccess]   = useState(false);
    const [errorMsg, setErrorMsg]         = useState('');
    const [showPw, setShowPw] = useState({ paymentPassword: false, confirmPaymentPassword: false });

    // IFSC lookup state
    const [ifscLookup, setIfscLookup] = useState(null);   // { branch, city } on success
    const [ifscLoading, setIfscLoading] = useState(false);

    const fetchBankCard = async () => {
        setPageLoading(true);
        setLoadError(false);
        try {
            const response = await axios.get('/bank-card/get-bank-card');
            if (response.data.success && response.data.data) {
                const data = response.data.data;
                setFormData({
                    actualName: data.actualName || '',
                    ifscCode: data.ifscCode || '',
                    bankName: data.bankName || '',
                    bankAccount: data.bankAccount || '',
                    paymentPassword: '',
                    confirmPaymentPassword: '',
                });
                setIsExisting(true);
                setCardVerified(data.isVerified === true);
                // show branch info for existing card
                if (data.ifscCode) {
                    setIfscLookup({ branch: '', city: '' });
                }
            }
        } catch (error) {
            // A real failure (network/timeout/server error) — surface it instead of
            // silently rendering the "add new card" form, which would be misleading
            // for a user who already has a card on file.
            if (error.response && error.response.status !== 401 && error.response.status !== 403) {
                setLoadError(true);
            } else if (!error.response) {
                setLoadError(true);
            }
        } finally {
            setPageLoading(false);
        }
    };

    useEffect(() => {
        fetchBankCard();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleChange = (e) => {
        if (isExisting) return;
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleIFSCChange = async (e) => {
        if (isExisting) return;
        const upper = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        setFormData(prev => ({ ...prev, ifscCode: upper, bankName: '' }));
        setIfscLookup(null);
        if (errors.ifscCode) setErrors(prev => ({ ...prev, ifscCode: '' }));

        if (upper.length !== 11) return;

        if (!validateIFSC(upper)) {
            setErrors(prev => ({ ...prev, ifscCode: 'Invalid IFSC code' }));
            return;
        }

        setIfscLoading(true);
        try {
            const res = await fetch(`https://ifsc.razorpay.com/${upper}`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            setFormData(prev => ({ ...prev, bankName: data.BANK }));
            setIfscLookup({ branch: data.BRANCH, city: data.CITY });
            setErrors(prev => ({ ...prev, ifscCode: '', bankName: '' }));
        } catch {
            setErrors(prev => ({ ...prev, ifscCode: 'IFSC not found — check and retry' }));
        } finally {
            setIfscLoading(false);
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.actualName.trim())             newErrors.actualName = 'Required';
        if (!formData.ifscCode.trim())               newErrors.ifscCode = 'Required';
        else if (!validateIFSC(formData.ifscCode))  newErrors.ifscCode = 'Invalid IFSC code';
        if (!formData.bankName.trim())               newErrors.bankName = 'Please enter a valid IFSC to auto-fill bank name';
        if (!formData.bankAccount.trim())            newErrors.bankAccount = 'Required';
        if (!formData.paymentPassword.trim())        newErrors.paymentPassword = 'Required';
        else if (formData.paymentPassword.length < 6) newErrors.paymentPassword = 'Min 6 characters';
        if (!formData.confirmPaymentPassword.trim()) newErrors.confirmPaymentPassword = 'Required';
        else if (formData.paymentPassword !== formData.confirmPaymentPassword)
            newErrors.confirmPaymentPassword = 'Passwords do not match';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isExisting || !validateForm()) return;
        setLoading(true);
        try {
            const response = await axios.post('/bank-card/set-bank-card', formData);
            if (response.data.success) {
                setIsExisting(true);
                setShowSuccess(true);
                setTimeout(() => navigate('/profile'), 2200);
            }
        } catch (error) {
            setErrorMsg(error.response?.data?.message || 'Failed to submit information');
        } finally {
            setLoading(false);
        }
    };

    const ifscVerified = !!ifscLookup && !errors.ifscCode;

    return (
        <div className="flex items-center justify-center min-h-screen" style={{ minHeight: '100dvh' }}>
            <div
                className="w-full lg:max-w-[400px] mx-auto h-screen flex flex-col overflow-hidden shadow-2xl border border-gray-200"
                style={{ height: '100dvh', background: '#f8fafc' }}
            >
                {/* Header */}
                <div className="flex-shrink-0">
                    <BackButton label="Bank Card" />
                </div>

                {/* Scrollable body */}
                <div
                    className="flex-1 min-h-0 overflow-y-auto px-4 pt-3 pb-3 space-y-3"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                >
                    {!pageLoading && loadError ? (
                        <div className="flex flex-col items-center justify-center text-center px-4 py-16">
                            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                                style={{ background: '#fff7ed', border: '2px solid #fed7aa' }}>
                                <AlertTriangle size={24} color="#f97316" />
                            </div>
                            <p className="text-gray-800 font-bold text-[14px]">Couldn't load your bank card</p>
                            <p className="text-gray-500 text-[11.5px] mt-2 leading-relaxed max-w-[240px]">
                                Check your connection and try again.
                            </p>
                            <button
                                onClick={fetchBankCard}
                                className="mt-5 px-6 py-2.5 rounded-xl text-white text-[13px] font-semibold transition-all active:scale-[0.98]"
                                style={{ background: BRAND_GRADIENT }}
                            >
                                Retry
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Bank card */}
                            {pageLoading ? (
                                <div className="h-[176px] w-full bg-gray-100 animate-pulse rounded-3xl" />
                            ) : (
                                <div
                                    className="rounded-3xl p-5 text-white relative overflow-hidden"
                                    style={{ background: BRAND_GRADIENT, minHeight: 176, boxShadow: '0 16px 32px -12px rgba(177,131,90,0.45)' }}
                                >
                                    {/* Soft decorative circles — plain, no blend modes */}
                                    <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/10 pointer-events-none" />
                                    <div className="absolute -bottom-12 -left-8 w-32 h-32 rounded-full bg-black/10 pointer-events-none" />

                                    {/* Top row: bank icon + name, status pill */}
                                    <div className="relative flex items-center justify-between gap-3 mb-6">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                                                <Landmark size={18} />
                                            </div>
                                            <p className="font-bold text-[15px] leading-tight truncate" title={formData.bankName || 'Your Bank'}>
                                                {formData.bankName || 'Your Bank'}
                                            </p>
                                        </div>
                                        {isExisting && (
                                            <span
                                                className="shrink-0 text-[9.5px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full"
                                                style={cardVerified
                                                    ? { background: 'rgba(74,222,128,0.25)', color: '#f0fdf4' }
                                                    : { background: 'rgba(251,191,36,0.25)', color: '#fffbeb' }
                                                }
                                            >
                                                {cardVerified ? 'Verified' : 'Pending'}
                                            </span>
                                        )}
                                    </div>

                                    {/* Account number */}
                                    <p className="relative font-mono text-[20px] font-semibold tracking-widest mb-6">
                                        {formData.bankAccount
                                            ? `•••• •••• •••• ${formData.bankAccount.slice(-4)}`
                                            : '•••• •••• •••• ••••'}
                                    </p>

                                    {/* Bottom row: holder + IFSC */}
                                    <div className="relative flex items-end justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-[9px] text-white/70 uppercase tracking-widest leading-none">Card Holder</p>
                                            <p className="text-[12.5px] font-semibold mt-1 truncate" title={formData.actualName || 'Account holder'}>
                                                {formData.actualName || 'Account holder'}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-[9px] text-white/70 uppercase tracking-widest leading-none">IFSC</p>
                                            <p className="text-[12px] font-mono font-semibold mt-1">
                                                {formData.ifscCode || '----------'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Verification banner */}
                            {!pageLoading && isExisting && (
                                cardVerified ? (
                                    <div className="rounded-xl px-3.5 py-2.5 flex items-center gap-2.5"
                                        style={{ background: '#f0fdf6', border: '1px solid #bbf7d0' }}>
                                        <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                                            style={{ background: 'linear-gradient(135deg,#4ade80,#16a34a)' }}>
                                            <Check size={13} className="text-white" />
                                        </div>
                                        <div>
                                            <p className="text-green-800 text-[11px] font-semibold leading-none">Verified</p>
                                            <p className="text-green-700 text-[10px] mt-0.5">Admin verified</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-xl px-3.5 py-2.5 flex items-center gap-2.5"
                                        style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                                        <ShieldCheck size={16} className="text-blue-400 shrink-0" />
                                        <p className="text-blue-700 text-[10px] leading-relaxed">
                                            Card submitted · pending admin verification
                                        </p>
                                    </div>
                                )
                            )}

                            {/* Unified form card */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 space-y-3">

                                {pageLoading ? (
                                    <><SkeletonInput /><SkeletonInput /><SkeletonInput /><SkeletonInput /></>
                                ) : (
                                    <>
                                        {/* Actual name */}
                                        <div>
                                            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                                                Actual Name
                                            </label>
                                            <InputRow icon={User} error={errors.actualName} disabled={isExisting}>
                                                <input
                                                    type="text"
                                                    name="actualName"
                                                    value={formData.actualName}
                                                    onChange={handleChange}
                                                    disabled={isExisting}
                                                    className="flex-1 bg-transparent text-[13px] text-gray-800 outline-none placeholder-gray-300 disabled:cursor-not-allowed"
                                                    placeholder="Name as per bank records"
                                                />
                                            </InputRow>
                                            {errors.actualName && <p className="text-rose-500 text-[10px] mt-0.5">{errors.actualName}</p>}
                                        </div>

                                        {/* IFSC — drives bank name auto-fill */}
                                        <div>
                                            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                                                IFSC Code
                                            </label>
                                            <InputRow icon={Hash} error={errors.ifscCode} disabled={isExisting} verified={ifscVerified}>
                                                <input
                                                    type="text"
                                                    name="ifscCode"
                                                    value={formData.ifscCode}
                                                    onChange={handleIFSCChange}
                                                    disabled={isExisting}
                                                    maxLength={11}
                                                    className="flex-1 bg-transparent text-[13px] text-gray-800 outline-none placeholder-gray-300 disabled:cursor-not-allowed uppercase tracking-wider"
                                                    placeholder="e.g. HDFC0001234"
                                                />
                                                {ifscLoading && (
                                                    <span className="w-3.5 h-3.5 border-2 border-gray-200 border-t-[#b1835a] rounded-full animate-spin shrink-0" />
                                                )}
                                                {ifscVerified && !ifscLoading && (
                                                    <Check size={14} color="#10b981" style={{ flexShrink: 0 }} />
                                                )}
                                            </InputRow>
                                            {errors.ifscCode && <p className="text-rose-500 text-[10px] mt-0.5">{errors.ifscCode}</p>}
                                            {ifscVerified && ifscLookup?.branch && (
                                                <p className="text-emerald-600 text-[10px] mt-0.5 font-medium">
                                                    {ifscLookup.branch}{ifscLookup.city ? `, ${ifscLookup.city}` : ''}
                                                </p>
                                            )}
                                        </div>

                                        {/* Bank name — auto-filled, read-only */}
                                        <div>
                                            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                                                Bank Name
                                                <span className="ml-1.5 normal-case font-normal text-gray-300">(auto-filled from IFSC)</span>
                                            </label>
                                            <InputRow icon={Landmark} error={errors.bankName} disabled verified={ifscVerified && !!formData.bankName}>
                                                <input
                                                    type="text"
                                                    value={formData.bankName}
                                                    readOnly
                                                    className="flex-1 bg-transparent text-[13px] text-gray-600 outline-none placeholder-gray-300 cursor-default"
                                                    placeholder="Filled automatically"
                                                />
                                            </InputRow>
                                            {errors.bankName && <p className="text-rose-500 text-[10px] mt-0.5">{errors.bankName}</p>}
                                        </div>

                                        {/* Bank account number */}
                                        <div>
                                            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                                                Account Number
                                            </label>
                                            <InputRow icon={CreditCard} error={errors.bankAccount} disabled={isExisting}>
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    name="bankAccount"
                                                    value={formData.bankAccount}
                                                    onChange={(e) => {
                                                        if (isExisting) return;
                                                        const digits = e.target.value.replace(/[^0-9]/g, '');
                                                        setFormData(prev => ({ ...prev, bankAccount: digits }));
                                                        if (errors.bankAccount) setErrors(prev => ({ ...prev, bankAccount: '' }));
                                                    }}
                                                    disabled={isExisting}
                                                    className="flex-1 bg-transparent text-[13px] text-gray-800 outline-none placeholder-gray-300 disabled:cursor-not-allowed"
                                                    placeholder="Enter account number"
                                                />
                                            </InputRow>
                                            {errors.bankAccount && <p className="text-rose-500 text-[10px] mt-0.5">{errors.bankAccount}</p>}
                                        </div>

                                        {/* Password fields — new users only */}
                                        {!isExisting && (
                                            <>
                                                <SectionDivider label="Security" />

                                                {[
                                                    { name: 'paymentPassword', label: 'Payment Password', placeholder: 'Min 6 characters' },
                                                    { name: 'confirmPaymentPassword', label: 'Confirm Password', placeholder: 'Re-enter password' },
                                                ].map(({ name, label, placeholder }) => (
                                                    <div key={name}>
                                                        <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
                                                            {label}
                                                        </label>
                                                        <InputRow icon={Lock} error={errors[name]}>
                                                            <input
                                                                type={showPw[name] ? 'text' : 'password'}
                                                                name={name}
                                                                value={formData[name]}
                                                                onChange={handleChange}
                                                                className="flex-1 bg-transparent text-[13px] text-gray-800 outline-none placeholder-gray-300"
                                                                placeholder={placeholder}
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowPw(p => ({ ...p, [name]: !p[name] }))}
                                                                className="shrink-0 active:scale-90 transition-transform"
                                                                style={{ color: '#d1d5db' }}
                                                                aria-label="Toggle visibility"
                                                            >
                                                                {showPw[name]
                                                                    ? <EyeOff size={16} />
                                                                    : <Eye size={16} />}
                                                            </button>
                                                        </InputRow>
                                                        {errors[name] && <p className="text-rose-500 text-[10px] mt-0.5">{errors[name]}</p>}
                                                    </div>
                                                ))}
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Fixed bottom bar */}
                {!pageLoading && !isExisting && !loadError && (
                    <div className="flex-shrink-0 px-4 pt-2 pb-4 bg-white border-t border-gray-100">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="w-full py-3.5 rounded-2xl text-white text-[13.5px] font-bold transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
                            style={{ background: BRAND_GRADIENT, boxShadow: '0 10px 24px rgba(177,131,90,0.32)' }}
                        >
                            {loading ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                    Processing…
                                </>
                            ) : 'Continue'}
                        </button>
                        <p className="text-[12px] text-gray-400 text-center mt-2 leading-relaxed">
                            Details must match your bank account exactly.
                        </p>
                    </div>
                )}

                {/* Success modal */}
                {showSuccess && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-8">
                        <div className="absolute inset-0 bg-black/25 animate-fadeIn" />
                        <div className="relative bg-white rounded-3xl shadow-2xl px-8 py-8 flex flex-col items-center animate-popIn w-full max-w-[290px]">
                            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                                style={{ background: BRAND_GRADIENT }}>
                                <Check size={26} className="text-white" strokeWidth={3} />
                            </div>
                            <p className="text-gray-800 font-bold text-[15px]">Card Linked!</p>
                            <p className="text-gray-400 text-[11.5px] mt-1.5 text-center leading-relaxed">
                                Submitted and pending admin verification.
                            </p>
                        </div>
                    </div>
                )}

                {/* Error modal */}
                {errorMsg && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-8">
                        <div className="absolute inset-0 bg-black/25 animate-fadeIn" onClick={() => setErrorMsg('')} />
                        <div className="relative bg-white rounded-3xl shadow-2xl px-7 py-7 flex flex-col items-center animate-popIn w-full max-w-[290px]">
                            <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center mb-4"
                                style={{ background: '#fff7ed', border: '2px solid #fed7aa' }}>
                                <AlertTriangle size={22} color="#f97316" />
                            </div>
                            <p className="text-gray-800 font-bold text-[14px] text-center">Unable to Continue</p>
                            <p className="text-gray-500 text-[11.5px] mt-2 text-center leading-relaxed px-1">{errorMsg}</p>
                            <button
                                onClick={() => setErrorMsg('')}
                                className="mt-5 w-full py-2.5 rounded-xl text-white text-[13px] font-semibold transition-all active:scale-[0.98]"
                                style={{ background: BRAND_GRADIENT }}
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
                @keyframes popIn {
                    0%   { opacity: 0; transform: scale(0.85) }
                    65%  { opacity: 1; transform: scale(1.03) }
                    100% { opacity: 1; transform: scale(1) }
                }
                .animate-fadeIn { animation: fadeIn 0.2s ease-out }
                .animate-popIn  { animation: popIn 0.32s cubic-bezier(0.34,1.56,0.64,1) }
            `}</style>
        </div>
    );
}

export default BankCard;
