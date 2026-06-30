import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import toast, { Toaster } from 'react-hot-toast';
import BackButton from '../components/BackButton';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import TagIcon from '@mui/icons-material/Tag';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import SearchIcon from '@mui/icons-material/Search';
import CheckIcon from '@mui/icons-material/Check';

const BRAND_GRADIENT = 'linear-gradient(90deg, #d9ad82, #b1835a)';

// Comprehensive list of Indian banks (public, private, small finance, payments)
const INDIAN_BANKS = [
    // Public sector
    'State Bank of India',
    'Bank of Baroda',
    'Bank of India',
    'Bank of Maharashtra',
    'Canara Bank',
    'Central Bank of India',
    'Indian Bank',
    'Indian Overseas Bank',
    'Punjab & Sind Bank',
    'Punjab National Bank',
    'UCO Bank',
    'Union Bank of India',
    // Private sector
    'Axis Bank',
    'Bandhan Bank',
    'Catholic Syrian Bank (CSB Bank)',
    'City Union Bank',
    'DCB Bank',
    'Dhanlaxmi Bank',
    'Federal Bank',
    'HDFC Bank',
    'ICICI Bank',
    'IDBI Bank',
    'IDFC FIRST Bank',
    'IndusInd Bank',
    'Jammu & Kashmir Bank',
    'Karnataka Bank',
    'Karur Vysya Bank',
    'Kotak Mahindra Bank',
    'Nainital Bank',
    'RBL Bank',
    'South Indian Bank',
    'Tamilnad Mercantile Bank',
    'Yes Bank',
    // Small finance banks
    'AU Small Finance Bank',
    'Capital Small Finance Bank',
    'Equitas Small Finance Bank',
    'ESAF Small Finance Bank',
    'Fincare Small Finance Bank',
    'Jana Small Finance Bank',
    'North East Small Finance Bank',
    'Shivalik Small Finance Bank',
    'Suryoday Small Finance Bank',
    'Ujjivan Small Finance Bank',
    'Unity Small Finance Bank',
    'Utkarsh Small Finance Bank',
    // Payments banks
    'Airtel Payments Bank',
    'India Post Payments Bank',
    'Fino Payments Bank',
    'Jio Payments Bank',
    'Paytm Payments Bank',
    // Foreign banks (India operations)
    'Citibank',
    'DBS Bank India',
    'Deutsche Bank',
    'HSBC India',
    'Standard Chartered Bank',
    // Major cooperative / others
    'Saraswat Cooperative Bank',
    'Cosmos Cooperative Bank',
    'SVC Co-operative Bank',
    'Abhyudaya Cooperative Bank',
];

const SkeletonInput = () => (
    <div className="space-y-2">
        <div className="h-3 w-24 bg-gray-200 animate-pulse rounded" />
        <div className="h-12 w-full bg-gray-100 animate-pulse rounded-xl" />
    </div>
);

function BankCard() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        actualName: '',
        ifscCode: '',
        bankName: '',
        bankAccount: '',
        paymentPassword: '',
        confirmPaymentPassword: '',
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [isExisting, setIsExisting] = useState(false);
    const [cardVerified, setCardVerified] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showPw, setShowPw] = useState({ paymentPassword: false, confirmPaymentPassword: false });

    // Bank search dropdown state
    const [bankQuery, setBankQuery] = useState('');
    const [bankOpen, setBankOpen] = useState(false);
    const bankBoxRef = useRef(null);

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
                    setBankQuery(data.bankName || '');
                    setIsExisting(true);
                    setCardVerified(data.isVerified === true);
                }
            } catch (error) {
                console.log("No existing bank card found");
            } finally {
                setPageLoading(false);
            }
        };
        fetchBankCard();
    }, []);

    // Close dropdown when tapping outside
    useEffect(() => {
        const handler = (e) => {
            if (bankBoxRef.current && !bankBoxRef.current.contains(e.target)) {
                setBankOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        document.addEventListener('touchstart', handler);
        return () => {
            document.removeEventListener('mousedown', handler);
            document.removeEventListener('touchstart', handler);
        };
    }, []);

    const handleChange = (e) => {
        if (isExisting) return;
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleBankSearch = (e) => {
        if (isExisting) return;
        const value = e.target.value;
        setBankQuery(value);
        setBankOpen(true);
        // keep formData in sync; if they type a custom name we still capture it
        setFormData(prev => ({ ...prev, bankName: value }));
        if (errors.bankName) setErrors(prev => ({ ...prev, bankName: '' }));
    };

    const selectBank = (bank) => {
        setFormData(prev => ({ ...prev, bankName: bank }));
        setBankQuery(bank);
        setBankOpen(false);
        if (errors.bankName) setErrors(prev => ({ ...prev, bankName: '' }));
    };

    const filteredBanks = INDIAN_BANKS.filter((b) =>
        b.toLowerCase().includes(bankQuery.trim().toLowerCase())
    );

    const validateForm = () => {
        const newErrors = {};
        if (!formData.actualName.trim()) newErrors.actualName = 'Actual name is required';
        if (!formData.ifscCode.trim()) newErrors.ifscCode = 'IFSC Code is required';
        if (!formData.bankName.trim()) newErrors.bankName = 'Bank name is required';
        if (!formData.bankAccount.trim()) newErrors.bankAccount = 'Bank account is required';
        if (!formData.paymentPassword.trim()) {
            newErrors.paymentPassword = 'Please enter payment password';
        } else if (formData.paymentPassword.length < 6) {
            newErrors.paymentPassword = 'Payment password must be at least 6 characters';
        }
        if (!formData.confirmPaymentPassword.trim()) {
            newErrors.confirmPaymentPassword = 'Please confirm payment password';
        } else if (formData.paymentPassword !== formData.confirmPaymentPassword) {
            newErrors.confirmPaymentPassword = 'Passwords do not match';
        }
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
                setTimeout(() => navigate('/profile'), 2000);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit information');
        } finally {
            setLoading(false);
        }
    };

    // Text fields excluding bankName (handled by the searchable dropdown)
    const textFields = [
        { name: 'actualName', label: 'Actual name', placeholder: 'Name as per bank records', Icon: PersonOutlineOutlinedIcon },
        { name: 'ifscCode', label: 'IFSC Code', placeholder: 'e.g. HDFC0001234', Icon: TagIcon },
    ];

    const pwFields = [
        { name: 'paymentPassword', label: 'Password' },
        { name: 'confirmPaymentPassword', label: 'Confirm password' },
    ];

    return (
        <div
            className="flex items-center justify-center min-h-screen"
            style={{ minHeight: '100dvh' }}
        >
            {/* h-screen is the fallback; 100dvh (inline) wins on iOS and tracks the Safari toolbar */}
            <div
                className="w-full lg:max-w-[400px] mx-auto h-screen flex flex-col overflow-hidden shadow-2xl border border-gray-300 bg-[#f7f8ff] relative"
                style={{ height: '100dvh' }}
            >

                {/* Header — wrapped so it can't be compressed by the flex column */}
                <div className="flex-shrink-0">
                    <BackButton label={"Bank Card"} />
                </div>

                {/* Scrollable content. min-h-0 is required for flex children to scroll on iOS */}
                <div
                    className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                >

                    {/* Decorative bank-card hero */}
                    {pageLoading ? (
                        <div className="h-40 w-full bg-gray-200 animate-pulse rounded-2xl" />
                    ) : (
                        <div
                            className="rounded-2xl p-5 text-white relative overflow-hidden shadow-md h-40 flex flex-col justify-between"
                            style={{ background: BRAND_GRADIENT }}
                        >
                            <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
                            <div className="absolute -bottom-10 -left-6 w-28 h-28 rounded-full bg-white/5" />

                            <div className="relative flex items-center justify-between">
                                <span className="text-xs uppercase tracking-widest text-white/80">Linked bank</span>
                                <AccountBalanceIcon sx={{ fontSize: 22 }} className="text-white/90" />
                            </div>

                            <div className="relative">
                                <p className="text-lg font-semibold tracking-wide truncate">
                                    {formData.bankName || 'Your Bank'}
                                </p>
                                <p className="text-sm font-mono tracking-[0.2em] text-white/90 mt-1">
                                    {formData.bankAccount
                                        ? `•••• •••• ${formData.bankAccount.slice(-4)}`
                                        : '•••• •••• ••••'}
                                </p>
                                <p className="text-xs text-white/70 mt-1 truncate">
                                    {formData.actualName || 'Account holder'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Verification status banner */}
                    {!pageLoading && isExisting && (
                        cardVerified ? (
                            <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: 'linear-gradient(135deg,#e8f9ef,#d4f4e2)', border: '1px solid #a3e6bb' }}>
                                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'linear-gradient(135deg,#34d27b,#13a85a)' }}>
                                    <CheckIcon sx={{ fontSize: 16 }} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-green-800 text-sm font-semibold leading-tight">Bank card verified</p>
                                    <p className="text-green-700 text-xs mt-0.5 leading-relaxed">Your bank card has been verified by admin. You can now make withdrawals.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
                                <VerifiedUserIcon className="text-blue-500 shrink-0 mt-0.5" sx={{ fontSize: 20 }} />
                                <p className="text-blue-700 text-sm leading-relaxed">
                                    Your bank card has been submitted. Please wait for admin verification.
                                </p>
                            </div>
                        )
                    )}

                    {/* Bank Information card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                        <h3 className="text-sm font-bold text-gray-800 mb-4">Bank Information</h3>

                        <div className="space-y-4">
                            {pageLoading ? (
                                <>
                                    <SkeletonInput />
                                    <SkeletonInput />
                                    <SkeletonInput />
                                    <SkeletonInput />
                                </>
                            ) : (
                                <>
                                    {/* Actual name */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Actual name</label>
                                        <div
                                            className={`flex items-center gap-2 rounded-xl border px-3 transition-colors
                                                ${errors.actualName
                                                    ? 'border-red-400 bg-red-50'
                                                    : 'border-gray-200 focus-within:border-[#b1835a] bg-gray-50 focus-within:bg-white'}
                                                ${isExisting ? 'opacity-80' : ''}`}
                                        >
                                            <PersonOutlineOutlinedIcon sx={{ fontSize: 18 }} className="text-[#c8a87a] shrink-0" />
                                            <input
                                                type="text"
                                                name="actualName"
                                                value={formData.actualName}
                                                onChange={handleChange}
                                                disabled={isExisting}
                                                className="flex-1 py-3 bg-transparent text-sm text-gray-800 outline-none placeholder-gray-400 disabled:cursor-not-allowed"
                                                placeholder="Name as per bank records"
                                            />
                                        </div>
                                        {errors.actualName && <p className="text-red-500 text-xs mt-1">{errors.actualName}</p>}
                                    </div>

                                    {/* Bank name — searchable dropdown */}
                                    <div ref={bankBoxRef} className="relative">
                                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Bank name</label>
                                        <div
                                            className={`flex items-center gap-2 rounded-xl border px-3 transition-colors
                                                ${errors.bankName
                                                    ? 'border-red-400 bg-red-50'
                                                    : 'border-gray-200 focus-within:border-[#b1835a] bg-gray-50 focus-within:bg-white'}
                                                ${isExisting ? 'opacity-80' : ''}`}
                                        >
                                            <AccountBalanceIcon sx={{ fontSize: 18 }} className="text-[#c8a87a] shrink-0" />
                                            <input
                                                type="text"
                                                value={bankQuery}
                                                onChange={handleBankSearch}
                                                onFocus={() => !isExisting && setBankOpen(true)}
                                                disabled={isExisting}
                                                autoComplete="off"
                                                className="flex-1 py-3 bg-transparent text-sm text-gray-800 outline-none placeholder-gray-400 disabled:cursor-not-allowed"
                                                placeholder="Search your bank"
                                            />
                                            {!isExisting && (
                                                <SearchIcon sx={{ fontSize: 18 }} className="text-gray-400 shrink-0" />
                                            )}
                                        </div>

                                        {/* Dropdown */}
                                        {bankOpen && !isExisting && (
                                            <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-30 max-h-56 overflow-y-auto">
                                                {filteredBanks.length === 0 ? (
                                                    <div className="px-4 py-3 text-sm text-gray-400">
                                                        No match — "{bankQuery}" will be used as entered
                                                    </div>
                                                ) : (
                                                    filteredBanks.map((bank) => {
                                                        const selected = formData.bankName === bank;
                                                        return (
                                                            <button
                                                                key={bank}
                                                                type="button"
                                                                onClick={() => selectBank(bank)}
                                                                className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between active:bg-gray-100 ${
                                                                    selected ? 'bg-[#fff7ef] text-[#b1835a] font-medium' : 'text-gray-700'
                                                                }`}
                                                            >
                                                                <span className="truncate pr-2">{bank}</span>
                                                                {selected && <CheckIcon sx={{ fontSize: 16 }} className="text-[#b1835a] shrink-0" />}
                                                            </button>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        )}
                                        {errors.bankName && <p className="text-red-500 text-xs mt-1">{errors.bankName}</p>}
                                    </div>

                                    {/* IFSC */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1.5">IFSC Code</label>
                                        <div
                                            className={`flex items-center gap-2 rounded-xl border px-3 transition-colors
                                                ${errors.ifscCode
                                                    ? 'border-red-400 bg-red-50'
                                                    : 'border-gray-200 focus-within:border-[#b1835a] bg-gray-50 focus-within:bg-white'}
                                                ${isExisting ? 'opacity-80' : ''}`}
                                        >
                                            <TagIcon sx={{ fontSize: 18 }} className="text-[#c8a87a] shrink-0" />
                                            <input
                                                type="text"
                                                name="ifscCode"
                                                value={formData.ifscCode}
                                                onChange={(e) => {
                                                    if (isExisting) return;
                                                    const upper = e.target.value.toUpperCase();
                                                    setFormData(prev => ({ ...prev, ifscCode: upper }));
                                                    if (errors.ifscCode) setErrors(prev => ({ ...prev, ifscCode: '' }));
                                                }}
                                                disabled={isExisting}
                                                className="flex-1 py-3 bg-transparent text-sm text-gray-800 outline-none placeholder-gray-400 disabled:cursor-not-allowed uppercase"
                                                placeholder="e.g. HDFC0001234"
                                            />
                                        </div>
                                        {errors.ifscCode && <p className="text-red-500 text-xs mt-1">{errors.ifscCode}</p>}
                                    </div>

                                    {/* Bank account number */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1.5">Bank account number</label>
                                        <div
                                            className={`flex items-center gap-2 rounded-xl border px-3 transition-colors
                                                ${errors.bankAccount
                                                    ? 'border-red-400 bg-red-50'
                                                    : 'border-gray-200 focus-within:border-[#b1835a] bg-gray-50 focus-within:bg-white'}
                                                ${isExisting ? 'opacity-80' : ''}`}
                                        >
                                            <CreditCardIcon sx={{ fontSize: 18 }} className="text-[#c8a87a] shrink-0" />
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
                                                className="flex-1 py-3 bg-transparent text-sm text-gray-800 outline-none placeholder-gray-400 disabled:cursor-not-allowed"
                                                placeholder="Enter account number"
                                            />
                                        </div>
                                        {errors.bankAccount && <p className="text-red-500 text-xs mt-1">{errors.bankAccount}</p>}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Payment Password card */}
                    {!pageLoading && !isExisting && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                            <h3 className="text-sm font-bold text-gray-800 mb-1">Set payment password</h3>
                            <p className="text-xs text-gray-400 mb-4">Used to authorize withdrawals. At least 6 characters.</p>

                            <div className="space-y-4">
                                {pwFields.map(({ name, label }) => (
                                    <div key={name}>
                                        <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
                                        <div
                                            className={`flex items-center gap-2 rounded-xl border px-3 transition-colors
                                                ${errors[name]
                                                    ? 'border-red-400 bg-red-50'
                                                    : 'border-gray-200 focus-within:border-[#b1835a] bg-gray-50 focus-within:bg-white'}`}
                                        >
                                            <LockOutlinedIcon sx={{ fontSize: 18 }} className="text-[#c8a87a] shrink-0" />
                                            <input
                                                type={showPw[name] ? 'text' : 'password'}
                                                name={name}
                                                value={formData[name]}
                                                onChange={handleChange}
                                                className="flex-1 py-3 bg-transparent text-sm text-gray-800 outline-none placeholder-gray-400"
                                                placeholder="Enter password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPw(p => ({ ...p, [name]: !p[name] }))}
                                                className="text-gray-400 shrink-0 active:scale-90 transition-transform"
                                                aria-label="Toggle password visibility"
                                            >
                                                {showPw[name]
                                                    ? <VisibilityOffOutlinedIcon sx={{ fontSize: 18 }} />
                                                    : <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />}
                                            </button>
                                        </div>
                                        {errors[name] && <p className="text-red-500 text-xs mt-1">{errors[name]}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Submit button */}
                    {pageLoading ? (
                        <div className="w-full bg-gray-200 animate-pulse rounded-2xl" style={{ height: '52px' }} />
                    ) : !isExisting && (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="w-full py-4 rounded-2xl text-white font-semibold shadow-md transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
                            style={{ background: BRAND_GRADIENT }}
                        >
                            {loading ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                    Processing…
                                </>
                            ) : (
                                'Continue'
                            )}
                        </button>
                    )}

                    <p className="text-[11px] text-gray-400 text-center px-4">
                        Make sure your details exactly match your bank account. They can't be edited after submission.
                    </p>
                </div>

                {/* ── Success modal ── */}
                {showSuccess && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center px-8">
                        <div className="absolute inset-0 bg-black/30 animate-fadeIn" />
                        <div className="relative bg-white rounded-2xl shadow-2xl px-8 py-7 flex flex-col items-center animate-popIn w-full max-w-[280px]">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#d9ad82] to-[#b1835a] flex items-center justify-center mb-4 shadow-lg">
                                <svg className="w-9 h-9 text-white" viewBox="0 0 24 24" fill="none">
                                    <path
                                        d="M5 13l4 4L19 7"
                                        stroke="currentColor"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="animate-drawCheck"
                                    />
                                </svg>
                            </div>
                            <p className="text-gray-800 font-bold text-base">Card linked!</p>
                            <p className="text-gray-400 text-xs mt-1 text-center leading-relaxed">
                                Your bank card was submitted and is pending verification.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <Toaster position="top-center" />

            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes popIn {
                    0%   { opacity: 0; transform: scale(0.8); }
                    60%  { opacity: 1; transform: scale(1.05); }
                    100% { opacity: 1; transform: scale(1); }
                }
                @keyframes drawCheck {
                    from { stroke-dasharray: 30; stroke-dashoffset: 30; }
                    to   { stroke-dasharray: 30; stroke-dashoffset: 0; }
                }
                .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
                .animate-popIn { animation: popIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
                .animate-drawCheck { animation: drawCheck 0.4s ease-out 0.15s both; }
            `}</style>
        </div>
    );
}

export default BankCard;