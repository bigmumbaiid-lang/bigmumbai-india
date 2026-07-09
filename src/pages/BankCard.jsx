import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import BackButton from '../components/BackButton';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import TagIcon from '@mui/icons-material/Tag';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import CheckIcon from '@mui/icons-material/Check';

const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const validateIFSC = (code) => IFSC_RE.test(code);

const BRAND_GRADIENT = 'linear-gradient(135deg, #e2b97a 0%, #b1835a 100%)';

const SkeletonInput = () => (
    <div className="space-y-1">
        <div className="h-2.5 w-16 bg-gray-100 animate-pulse rounded-full" />
        <div className="h-10 w-full bg-gray-100 animate-pulse rounded-xl" />
    </div>
);

function InputRow({ icon: Icon, error, disabled, verified, children }) {
    return (
        <div className={`flex items-center gap-2.5 rounded-xl border px-3 h-10 transition-all duration-150
            ${error
                ? 'border-rose-300 bg-rose-50/60'
                : verified
                    ? 'border-emerald-300 bg-emerald-50/40'
                    : disabled
                        ? 'border-gray-100 bg-gray-50'
                        : 'border-gray-200 bg-gray-50 focus-within:border-[#c8962a] focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(200,150,42,0.08)]'
            }`}
        >
            <Icon sx={{ fontSize: 16 }} style={{ color: error ? '#f87171' : verified ? '#10b981' : '#c8a87a', flexShrink: 0 }} />
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
    const [showSuccess, setShowSuccess]   = useState(false);
    const [errorMsg, setErrorMsg]         = useState('');
    const [showPw, setShowPw] = useState({ paymentPassword: false, confirmPaymentPassword: false });

    // IFSC lookup state
    const [ifscLookup, setIfscLookup] = useState(null);   // { branch, city } on success
    const [ifscLoading, setIfscLoading] = useState(false);

    useEffect(() => {
        const fetchBankCard = async () => {
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
            } catch {
                // no card yet
            } finally {
                setPageLoading(false);
            }
        };
        fetchBankCard();
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
                className="w-full lg:max-w-[400px] mx-auto h-screen flex flex-col overflow-hidden shadow-2xl border border-gray-200 relative"
                style={{ height: '100dvh', background: '#f8fafc' }}
            >
                {/* Ambient backdrop glow */}
                <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full opacity-25 blur-3xl pointer-events-none" style={{ background: BRAND_GRADIENT }} />
                <div className="absolute top-40 -right-20 w-48 h-48 rounded-full opacity-15 blur-3xl pointer-events-none" style={{ background: BRAND_GRADIENT }} />

                {/* ── Header ── */}
                <div className="flex-shrink-0 relative z-10">
                    <BackButton label="Bank Card" />
                </div>

                {/* ── Scrollable body ── */}
                <div
                    className="flex-1 min-h-0 overflow-y-auto px-4 pt-3 pb-3 space-y-3 relative z-10"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                >
                    {/* ── Bank card mockup ── */}
                    {pageLoading ? (
                        <div className="h-[190px] w-full bg-gray-100 animate-pulse rounded-3xl" />
                    ) : (
                        <div
                            className="rounded-3xl p-5 text-white relative overflow-hidden"
                            style={{
                                background: 'linear-gradient(150deg, #191531 0%, #26204a 45%, #3d2a5e 85%, #4a2d5f 100%)',
                                minHeight: 190,
                                boxShadow: '0 20px 45px -14px rgba(25,15,45,0.55)',
                            }}
                        >
                            {/* Decorative glow + shine */}
                            <div className="absolute -bottom-16 -right-10 w-48 h-48 rounded-full bg-white/[0.06] pointer-events-none" />
                            <div className="absolute -top-14 -left-10 w-40 h-40 rounded-full bg-white/[0.04] pointer-events-none" />
                            <div className="absolute top-0 left-0 right-0 h-px bg-white/10" />

                            {/* Top row: label + bank name */}
                            <div className="relative flex items-start justify-between mb-7">
                                <span className="text-[12px] text-white/50 lowercase tracking-wide">
                                    bank card{isExisting && (cardVerified ? ' · verified' : ' · pending')}
                                </span>
                                <span className="text-[15px] font-extrabold tracking-wide truncate max-w-[150px] text-right">
                                    {(formData.bankName || 'BANK').toUpperCase()}
                                </span>
                            </div>

                            {/* Chip */}
                            <div className="relative w-10 h-7 rounded-md flex flex-col justify-center gap-[3px] px-1.5 mb-6"
                                style={{ background: 'linear-gradient(135deg, #cfe8ad, #9dc97a)' }}>
                                <div className="h-[2px] w-full bg-black/20 rounded-full" />
                                <div className="h-[2px] w-full bg-black/20 rounded-full" />
                                <div className="h-[2px] w-full bg-black/20 rounded-full" />
                            </div>

                            {/* Account number */}
                            <div className="relative flex justify-between mb-6 pr-1">
                                {(formData.bankAccount
                                    ? ['••••', '••••', '••••', formData.bankAccount.slice(-4)]
                                    : ['••••', '••••', '••••', '••••']
                                ).map((g, i) => (
                                    <span key={i} className="font-mono text-[19px] font-semibold tracking-widest text-white/95">{g}</span>
                                ))}
                            </div>

                            {/* Bottom row: IFSC info + brand mark */}
                            <div className="relative flex items-end justify-between">
                                <div>
                                    <p className="text-[9px] text-white/45 uppercase tracking-widest leading-none">IFSC</p>
                                    <p className="text-[12px] font-mono font-semibold text-white/85 mt-1.5">
                                        <span className="text-white/40 mr-1">▸</span>
                                        {formData.ifscCode || '----------'}
                                    </p>
                                </div>
                                <div className="flex items-center shrink-0">
                                    <div className="w-7 h-7 rounded-full opacity-90" style={{ background: '#e2b97a' }} />
                                    <div className="w-7 h-7 rounded-full opacity-80 -ml-3" style={{ background: '#b1835a', mixBlendMode: 'plus-lighter' }} />
                                </div>
                            </div>

                            {/* Corner accent */}
                            <span className="absolute bottom-4 left-5 text-white/25 text-sm">◂</span>
                        </div>
                    )}

                    {/* ── Verification banner ── */}
                    {!pageLoading && isExisting && (
                        cardVerified ? (
                            <div className="rounded-xl px-3.5 py-2.5 flex items-center gap-2.5"
                                style={{ background: '#f0fdf6', border: '1px solid #bbf7d0' }}>
                                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                                    style={{ background: 'linear-gradient(135deg,#4ade80,#16a34a)' }}>
                                    <CheckIcon sx={{ fontSize: 13 }} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-green-800 text-[11px] font-semibold leading-none">Verified</p>
                                    <p className="text-green-700 text-[10px] mt-0.5">Admin verified · withdrawals enabled</p>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-xl px-3.5 py-2.5 flex items-center gap-2.5"
                                style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
                                <VerifiedUserIcon sx={{ fontSize: 16 }} className="text-blue-400 shrink-0" />
                                <p className="text-blue-700 text-[10px] leading-relaxed">
                                    Card submitted · pending admin verification
                                </p>
                            </div>
                        )
                    )}

                    {/* ── Unified form card ── */}
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
                                    <InputRow icon={PersonOutlineOutlinedIcon} error={errors.actualName} disabled={isExisting}>
                                        <input
                                            type="text"
                                            name="actualName"
                                            value={formData.actualName}
                                            onChange={handleChange}
                                            disabled={isExisting}
                                            className="flex-1 bg-transparent text-[12.5px] text-gray-800 outline-none placeholder-gray-300 disabled:cursor-not-allowed"
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
                                    <InputRow icon={TagIcon} error={errors.ifscCode} disabled={isExisting} verified={ifscVerified}>
                                        <input
                                            type="text"
                                            name="ifscCode"
                                            value={formData.ifscCode}
                                            onChange={handleIFSCChange}
                                            disabled={isExisting}
                                            maxLength={11}
                                            className="flex-1 bg-transparent text-[12.5px] text-gray-800 outline-none placeholder-gray-300 disabled:cursor-not-allowed uppercase tracking-wider"
                                            placeholder="e.g. HDFC0001234"
                                        />
                                        {ifscLoading && (
                                            <span className="w-3.5 h-3.5 border-2 border-gray-200 border-t-[#b1835a] rounded-full animate-spin shrink-0" />
                                        )}
                                        {ifscVerified && !ifscLoading && (
                                            <CheckIcon sx={{ fontSize: 14 }} style={{ color: '#10b981', flexShrink: 0 }} />
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
                                    <InputRow icon={AccountBalanceIcon} error={errors.bankName} disabled verified={ifscVerified && !!formData.bankName}>
                                        <input
                                            type="text"
                                            value={formData.bankName}
                                            readOnly
                                            className="flex-1 bg-transparent text-[12.5px] text-gray-600 outline-none placeholder-gray-300 cursor-default"
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
                                    <InputRow icon={CreditCardIcon} error={errors.bankAccount} disabled={isExisting}>
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
                                            className="flex-1 bg-transparent text-[12.5px] text-gray-800 outline-none placeholder-gray-300 disabled:cursor-not-allowed"
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
                                                <InputRow icon={LockOutlinedIcon} error={errors[name]}>
                                                    <input
                                                        type={showPw[name] ? 'text' : 'password'}
                                                        name={name}
                                                        value={formData[name]}
                                                        onChange={handleChange}
                                                        className="flex-1 bg-transparent text-[12.5px] text-gray-800 outline-none placeholder-gray-300"
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
                                                            ? <VisibilityOffOutlinedIcon sx={{ fontSize: 16 }} />
                                                            : <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />}
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
                </div>

                {/* ── Fixed bottom bar ── */}
                {!pageLoading && !isExisting && (
                    <div className="flex-shrink-0 px-4 pt-2 pb-4 bg-white border-t border-gray-100">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="w-full py-3 rounded-2xl text-white text-[13.5px] font-bold shadow-md transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
                            style={{ background: BRAND_GRADIENT }}
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

                {/* ── Success modal ── */}
                {showSuccess && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center px-8">
                        <div className="absolute inset-0 bg-black/25 animate-fadeIn" />
                        <div className="relative bg-white rounded-3xl shadow-2xl px-8 py-8 flex flex-col items-center animate-popIn w-full max-w-[290px]">
                            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                                style={{ background: BRAND_GRADIENT }}>
                                <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none">
                                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5"
                                        strokeLinecap="round" strokeLinejoin="round" className="animate-drawCheck" />
                                </svg>
                            </div>
                            <p className="text-gray-800 font-bold text-[15px]">Card Linked!</p>
                            <p className="text-gray-400 text-[11.5px] mt-1.5 text-center leading-relaxed">
                                Submitted and pending admin verification.
                            </p>
                        </div>
                    </div>
                )}

                {/* ── Error modal ── */}
                {errorMsg && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center px-8">
                        <div className="absolute inset-0 bg-black/25 animate-fadeIn" onClick={() => setErrorMsg('')} />
                        <div className="relative bg-white rounded-3xl shadow-2xl px-7 py-7 flex flex-col items-center animate-popIn w-full max-w-[290px]">
                            <div className="w-[52px] h-[52px] rounded-full flex items-center justify-center mb-4"
                                style={{ background: '#fff7ed', border: '2px solid #fed7aa' }}>
                                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
                                    <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                                        stroke="#f97316" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
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
                @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
                @keyframes popIn {
                    0%   { opacity: 0; transform: scale(0.85) }
                    65%  { opacity: 1; transform: scale(1.03) }
                    100% { opacity: 1; transform: scale(1) }
                }
                @keyframes drawCheck {
                    from { stroke-dasharray: 30; stroke-dashoffset: 30 }
                    to   { stroke-dasharray: 30; stroke-dashoffset: 0 }
                }
                .animate-fadeIn   { animation: fadeIn 0.2s ease-out }
                .animate-popIn    { animation: popIn 0.32s cubic-bezier(0.34,1.56,0.64,1) }
                .animate-drawCheck { animation: drawCheck 0.4s ease-out 0.15s both }
            `}</style>
        </div>
    );
}

export default BankCard;
