import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import axios from '../utils/axios';
import BackButton from '../components/BackButton';

const BRAND_GRADIENT = 'linear-gradient(90deg, rgb(217,173,130), rgb(177,131,90))';

// ---- modal visual config per type ----
const MODAL_TYPES = {
    success: {
        ring: 'from-[#d9ad82] to-[#b1835a]',
        title: 'Success',
        icon: (
            <path
                d="M5 13l4 4L19 7"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-drawCheck"
            />
        ),
    },
    error: {
        ring: 'from-[#f87171] to-[#dc2626]',
        title: 'Something went wrong',
        icon: (
            <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-drawCheck"
            />
        ),
    },
    warning: {
        ring: 'from-[#fbbf24] to-[#d97706]',
        title: 'Heads up',
        icon: (
            <path
                d="M12 7v6m0 4h.01"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-drawCheck"
            />
        ),
    },
    info: {
        ring: 'from-[#60a5fa] to-[#2563eb]',
        title: 'Notice',
        icon: (
            <path
                d="M12 11v5m0-9h.01"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-drawCheck"
            />
        ),
    },
};

function Withdraw() {
    const navigate = useNavigate();

    const [balance, setBalance] = useState(0);
    const [allowWithdrawal, setAllowWithdrawal] = useState(false);
    const [minWithdrawal, setMinWithdrawal] = useState(100);
    const [hasBankCard, setHasBankCard] = useState(false);
    const [amount, setAmount] = useState('');
    const [paymentPassword, setPaymentPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    // ---- modal state ----
    const [modal, setModal] = useState(null); // { type, title, message }

    const showModal = useCallback((type, message, title) => {
        setModal({ type, message, title: title || MODAL_TYPES[type]?.title });
    }, []);

    const closeModal = useCallback(() => setModal(null), []);

    // auto-dismiss non-error modals
    useEffect(() => {
        if (!modal || modal.type === 'error') return;
        const t = setTimeout(() => setModal(null), 2200);
        return () => clearTimeout(t);
    }, [modal]);

    const fetchProfile = async () => {
        try {
            const response = await axios.post('/user/profile');
            if (response.data.user) {
                setBalance(response.data.user.money || 0);
                setAllowWithdrawal(response.data.user.allowWithdrawal ?? false);
                setMinWithdrawal(response.data.user.minWithdrawal || 100);
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error);
            showModal('error', 'Failed to load profile');
        }
    };

    const fetchBankCardStatus = async () => {
        try {
            const response = await axios.get('/bank-card/get-bank-card');
            const card = response.data?.data;
            setHasBankCard(!!(card && card.bankAccount));
        } catch (error) {
            setHasBankCard(false);
        }
    };

    useEffect(() => {
        const init = async () => {
            await Promise.all([fetchProfile(), fetchBankCardStatus()]);
            setPageLoading(false);
        };
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleAmountChange = (e) => {
        setAmount(e.target.value.replace(/[^0-9]/g, ''));
    };

    const setPercentAmount = (pct) => {
        const val = Math.floor(balance * pct);
        setAmount(String(val));
    };

    const withdrawAmount = Number(amount) || 0;

    const canSubmit =
        !pageLoading &&
        !loading &&
        allowWithdrawal &&
        hasBankCard &&
        !!paymentPassword &&
        withdrawAmount >= minWithdrawal &&
        withdrawAmount <= balance;

    const handleWithdraw = async () => {
        if (!amount || withdrawAmount <= 0) return showModal('warning', 'Please enter a valid amount');
        if (withdrawAmount < minWithdrawal) return showModal('warning', `Minimum withdrawal amount is ₹${minWithdrawal}`);
        if (withdrawAmount > balance) return showModal('warning', 'Insufficient balance');
        if (!allowWithdrawal) return showModal('error', 'Withdrawal is currently disabled by admin');
        if (!hasBankCard) return showModal('warning', 'Please add a bank account first');
        if (!paymentPassword) return showModal('warning', 'Please enter your payment password');

        setLoading(true);
        try {
            const response = await axios.post('/withdrawal/request', {
                amount: withdrawAmount,
                paymentPassword,
            });
            if (response.data.success) {
                showModal('success', response.data.message || 'Withdrawal request submitted successfully!', 'Request submitted');
                setAmount('');
                setPaymentPassword('');
                await fetchProfile();
                setTimeout(() => navigate('/withdrawal-records'), 1500);
            }
        } catch (error) {
            showModal('error', error.response?.data?.message || 'Failed to process withdrawal');
        } finally {
            setLoading(false);
        }
    };

    const inr = (val) => Number(val || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

    const cfg = modal ? MODAL_TYPES[modal.type] || MODAL_TYPES.info : null;

    return (
        <div
            className="flex items-center justify-center bg-gray-50 min-h-screen"
            style={{ minHeight: '100dvh' }}
        >
            <div
                className="w-full lg:max-w-[400px] mx-auto h-screen flex flex-col overflow-hidden shadow-2xl border border-gray-300 bg-[#f7f8ff]"
                style={{ height: '100dvh' }}
            >

                {/* Header */}
                <div className="flex-shrink-0">
                    <BackButton label="Withdrawal" rightLabel="Records" rightTo="/withdrawal-records" />
                </div>

                {/* Scrollable content */}
                <div
                    className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                >

                    {/* Balance card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                        <div className="flex items-center gap-2 mb-1">
                            <AccountBalanceWalletIcon sx={{ fontSize: 18 }} className="text-[#b1835a]" />
                            <span className="text-sm text-gray-500">Available Balance</span>
                        </div>
                        {pageLoading ? (
                            <div className="h-9 w-40 bg-gray-100 animate-pulse rounded-lg" />
                        ) : (
                            <div className="text-3xl font-bold text-gray-900 tracking-tight">₹{inr(balance)}</div>
                        )}

                        {/* status pill */}
                        {!pageLoading && (
                            <div
                                className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${allowWithdrawal ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                    }`}
                            >
                                <span className={`w-1.5 h-1.5 rounded-full ${allowWithdrawal ? 'bg-green-500' : 'bg-red-500'}`} />
                                {allowWithdrawal ? 'Withdrawals open' : 'Withdrawals disabled'}
                            </div>
                        )}
                    </div>

                    {/* Amount input card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                        <label className="block text-xs text-gray-500 font-medium mb-2">Withdrawal Amount</label>
                        <div className="flex items-center border-b-2 border-gray-100 focus-within:border-[#d8ab83] transition-colors pb-2">
                            <span className="text-2xl font-bold text-gray-400 mr-1">₹</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={amount}
                                onChange={handleAmountChange}
                                onKeyDown={(e) => e.key === 'Enter' && canSubmit && handleWithdraw()}
                                placeholder="0"
                                disabled={pageLoading}
                                className="flex-1 text-2xl font-bold text-gray-800 outline-none disabled:bg-transparent placeholder-gray-300"
                            />
                        </div>

                        {/* Quick amount buttons */}
                        <div className="grid grid-cols-4 gap-2 mt-3">
                            {[
                                { label: '25%', pct: 0.25 },
                                { label: '50%', pct: 0.5 },
                                { label: '75%', pct: 0.75 },
                                { label: 'Max', pct: 1 },
                            ].map((q) => (
                                <button
                                    key={q.label}
                                    type="button"
                                    disabled={pageLoading || balance <= 0}
                                    onClick={() => setPercentAmount(q.pct)}
                                    className="py-1.5 rounded-lg bg-[#fff3e3] text-[#b1835a] text-xs font-semibold active:scale-95 transition-transform disabled:opacity-40"
                                >
                                    {q.label}
                                </button>
                            ))}
                        </div>

                        <p className="text-[11px] text-gray-400 mt-2">
                            Minimum withdrawal: <span className="font-semibold text-gray-500">₹{inr(minWithdrawal)}</span>
                        </p>

                        {/* Inline validity hint */}
                        {!pageLoading && amount && withdrawAmount > balance && (
                            <p className="text-[11px] text-red-500 mt-1">Amount exceeds your balance</p>
                        )}
                        {!pageLoading && amount && withdrawAmount > 0 && withdrawAmount < minWithdrawal && (
                            <p className="text-[11px] text-red-500 mt-1">Below the minimum of ₹{inr(minWithdrawal)}</p>
                        )}
                    </div>

                    {/* Payment password OR add-bank-card prompt */}
                    {pageLoading ? (
                        <div className="h-24 w-full bg-white rounded-2xl border border-gray-100 animate-pulse" />
                    ) : hasBankCard ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                            <label className="block text-xs text-gray-500 font-medium mb-2">Payment Password</label>
                            <input
                                type="password"
                                value={paymentPassword}
                                onChange={(e) => setPaymentPassword(e.target.value)}
                                placeholder="Enter payment password"
                                autoComplete="off"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#d8ab83]/40"
                            />
                        </div>
                    ) : (
                        <button
                            onClick={() => navigate('/bank-card')}
                            className="w-full bg-orange-50 border border-orange-200 text-orange-700 p-4 rounded-2xl text-sm flex items-center justify-between active:scale-[0.99] transition-transform"
                        >
                            <span>Add a bank account to withdraw</span>
                            <span className="font-bold">Add now ›</span>
                        </button>
                    )}

                    {/* Submit */}
                    <button
                        onClick={handleWithdraw}
                        disabled={!canSubmit}
                        className="w-full bg-gradient-to-r from-[#d9ad82] to-[#b1835a] disabled:from-gray-300 disabled:to-gray-300 text-white py-4 rounded-2xl font-semibold text-base shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                Processing…
                            </>
                        ) : (
                            'Confirm & Withdraw'
                        )}
                    </button>

                    {!pageLoading && !allowWithdrawal && (
                        <p className="text-center text-red-500 text-xs">
                            Withdrawal feature is currently disabled by admin
                        </p>
                    )}
                </div>
            </div>

            {/* ---- Modal ---- */}
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
                            <svg className="w-9 h-9 text-white" viewBox="0 0 24 24" fill="none">
                                {cfg.icon}
                            </svg>
                        </div>
                        <p className="text-gray-800 font-semibold text-base text-center">{modal.title}</p>
                        {modal.message && (
                            <p className="text-gray-400 text-xs mt-1 text-center">{modal.message}</p>
                        )}

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
                @keyframes popIn {
                    0% { opacity: 0; transform: scale(0.85); }
                    100% { opacity: 1; transform: scale(1); }
                }
                @keyframes drawCheck {
                    from { stroke-dasharray: 40; stroke-dashoffset: 40; }
                    to { stroke-dasharray: 40; stroke-dashoffset: 0; }
                }
                .animate-fadeIn { animation: fadeIn 0.18s ease-out; }
                .animate-popIn { animation: popIn 0.25s cubic-bezier(0.16,1,0.3,1); }
                .animate-drawCheck { animation: drawCheck 0.4s ease-out 0.1s both; }
            `}</style>
        </div>
    );
}

export default Withdraw;