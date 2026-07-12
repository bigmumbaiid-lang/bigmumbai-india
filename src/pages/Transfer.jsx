import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Eye, EyeOff, User, AlertTriangle, CheckCircle } from 'lucide-react';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import axios from '../utils/axios';
import { AuthContext } from '../context/AuthContext';

const BRAND = 'linear-gradient(90deg, rgb(217,173,130), rgb(177,131,90))';
const QUICK = [1000, 1088, 2088, 5000,7000,10000,14000,15000,20000,28000,30000,42000];

const SHELL = 'flex items-center justify-center min-h-screen';
const INNER = 'w-full lg:max-w-[400px] mx-auto h-screen flex flex-col overflow-hidden shadow-2xl border border-gray-300';

function Transfer() {
    const navigate = useNavigate();
    const { user, setUser } = useContext(AuthContext);

    const [info, setInfo] = useState(null);
    const [loadingInfo, setLoadingInfo] = useState(true);

    const [toUsername, setToUsername] = useState('');
    const [amount, setAmount] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        if (user && user.role !== 'admin') navigate(-1);
    }, [user, navigate]);

    useEffect(() => {
        if (!user || user.role !== 'admin') return;
        (async () => {
            try {
                const res = await axios.get('/transfers/info');
                setInfo(res.data.data);
            } catch {
                setError('Failed to load transfer info.');
            } finally {
                setLoadingInfo(false);
            }
        })();
    }, [user]);

    if (!user || user.role !== 'admin') return null;

    const handleQuick = (v) => { setAmount(String(v)); setError(''); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!toUsername.trim()) { setError('Please enter the recipient account name.'); return; }
        if (!amount || Number(amount) <= 0) { setError('Please enter a valid amount.'); return; }
        if (!password) { setError('Please enter your payment password.'); return; }

        setSubmitting(true);
        try {
            const res = await axios.post('/transfers/send', {
                toUsername: toUsername.trim(),
                amount:     Number(amount),
                password,
            });
            setSuccess(res.data.data);
            if (setUser) setUser(prev => prev ? { ...prev, money: res.data.data.newBalance } : prev);
            setInfo(prev => prev ? { ...prev, balance: res.data.data.newBalance, sentCount: (prev.sentCount || 0) + 1 } : prev);
            setToUsername('');
            setAmount('');
            setPassword('');
        } catch (err) {
            setError(err.response?.data?.message || 'Transfer failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingInfo) {
        return (
            <div className={SHELL} style={{ minHeight: '100dvh' }}>
                <div className={INNER} style={{ height: '100dvh' }}>

                    {/* Header */}
                    <div className="p-4 text-white flex items-center justify-between flex-shrink-0 z-10" style={{ background: BRAND }}>
                        <div className="cursor-pointer flex items-center gap-2" onClick={() => navigate(-1)}>
                            <ArrowBackIosIcon fontSize="small" />
                            <span className="text-sm">Transfer</span>
                        </div>
                        <div className="text-sm text-white/90">Records</div>
                    </div>

                    <div className="flex-1 min-h-0 overflow-y-auto px-4 py-5 space-y-4" style={{ background: '#f7f8ff' }}>

                        {/* Balance card skeleton */}
                        <div
                            className="relative overflow-hidden rounded-3xl p-5 text-white shadow-xl"
                            style={{ background: 'linear-gradient(135deg, #d9ad82 0%, #8f5c34 100%)' }}
                        >
                            <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/10" />
                            <div className="absolute -right-2 bottom-0 w-20 h-20 rounded-full bg-white/5" />
                            <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.15em] mb-2 relative">Available Balance</p>
                            <div className="h-7 w-40 rounded-lg bg-white/20 animate-pulse relative" />
                            <div className="mt-4 grid grid-cols-2 gap-3 relative">
                                <div className="bg-white/10 backdrop-blur rounded-2xl px-3 py-2.5 border border-white/10">
                                    <p className="text-white/50 text-[10px] font-medium mb-1.5">Transfer Attempts</p>
                                    <div className="h-5 w-8 rounded bg-white/20 animate-pulse" />
                                </div>
                                <div className="bg-white/10 backdrop-blur rounded-2xl px-3 py-2.5 border border-white/10">
                                    <p className="text-white/50 text-[10px] font-medium mb-1.5">Transfer Quota</p>
                                    <div className="h-5 w-20 rounded bg-white/20 animate-pulse" />
                                </div>
                            </div>
                        </div>

                        {/* Form skeleton */}
                        <div className="space-y-3">
                            <div>
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.12em] mb-2 px-1">To Account</p>
                                <div className="h-[52px] rounded-2xl bg-white shadow-sm border border-gray-100" />
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.12em] mb-2 px-1">Amount</p>
                                <div className="h-[52px] rounded-2xl bg-white shadow-sm border border-gray-100 mb-2.5" />
                                <div className="grid grid-cols-4 gap-2">
                                    {QUICK.map(v => (
                                        <div key={v} className="h-9 rounded-xl bg-gray-100 animate-pulse" />
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.12em] mb-2 px-1">Payment Password</p>
                                <div className="h-[52px] rounded-2xl bg-white shadow-sm border border-gray-100" />
                            </div>
                            <div className="w-full h-[52px] rounded-2xl bg-gray-100 animate-pulse mt-1" />
                        </div>

                    </div>
                </div>
            </div>
        );
    }

    if (!info?.canTransfer) {
        return (
            <div className={SHELL} style={{ minHeight: '100dvh' }}>
                <div className={INNER} style={{ height: '100dvh' }}>
                    <div className="p-4 text-white flex items-center justify-between flex-shrink-0 z-10" style={{ background: BRAND }}>
                        <div className="cursor-pointer flex items-center gap-2" onClick={() => navigate(-1)}>
                            <ArrowBackIosIcon fontSize="small" />
                            <span className="text-sm">Transfer</span>
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4">
                        <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center">
                            <AlertTriangle size={32} className="text-amber-500" />
                        </div>
                        <p className="text-gray-700 font-semibold text-lg text-center">Transfer Unavailable</p>
                        <p className="text-gray-500 text-sm text-center">Your account is not authorised to transfer funds.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={SHELL} style={{ minHeight: '100dvh' }}>
            <div className={INNER} style={{ height: '100dvh' }}>

                {/* Header */}
                <div className="p-4 text-white flex items-center justify-between flex-shrink-0 z-10" style={{ background: BRAND }}>
                    <div className="cursor-pointer flex items-center gap-2" onClick={() => navigate(-1)}>
                        <ArrowBackIosIcon fontSize="small" />
                        <span className="text-sm">Transfer</span>
                    </div>
                    <div
                        className="cursor-pointer text-sm text-white/90"
                        onClick={() => navigate('/transfer-records')}
                    >
                        Records
                    </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto px-4 py-5 space-y-4" style={{ WebkitOverflowScrolling: 'touch', background: '#f7f8ff' }}>

                    {/* Balance card */}
                    <div
                        className="relative overflow-hidden rounded-3xl p-5 text-white shadow-xl"
                        style={{ background: 'linear-gradient(135deg, #d9ad82 0%, #8f5c34 100%)' }}
                    >
                        <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/10" />
                        <div className="absolute -right-2 bottom-0 w-20 h-20 rounded-full bg-white/5" />
                        <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.15em] mb-1 relative">Available Balance</p>
                        <p className="text-[28px] font-extrabold tracking-tight relative">
                            ₹{(info.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                        <div className="mt-4 grid grid-cols-2 gap-3 relative">
                            <div className="bg-white/10 backdrop-blur rounded-2xl px-3 py-2.5 border border-white/10">
                                <p className="text-white/50 text-[10px] font-medium">Transfer Attempts</p>
                                <p className="text-white font-bold text-xl leading-tight mt-0.5">{info.sentCount ?? 0}</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur rounded-2xl px-3 py-2.5 border border-white/10">
                                <p className="text-white/50 text-[10px] font-medium">Transfer Quota</p>
                                <p className="text-white font-bold text-base leading-tight mt-0.5">
                                    {info.quota.min.toLocaleString('en-US')} – {info.quota.max.toLocaleString('en-US')}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Success banner */}
                    {success && (
                        <div className="relative overflow-hidden rounded-2xl shadow-lg" style={{ background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' }}>
                            <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-20" style={{ background: '#059669' }} />
                            <div className="relative flex items-start gap-3 px-4 py-4">
                                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 shadow-md">
                                    <CheckCircle size={20} className="text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-emerald-900 font-bold text-sm tracking-wide">Transfer Successful!</p>
                                    <p className="text-emerald-700 text-xs mt-1 font-medium">
                                        ₹{success.amount.toLocaleString('en-US')} sent to{' '}
                                        <span className="font-bold">@{success.toUsername}</span>
                                    </p>
                                    <p className="text-emerald-500 text-[10px] mt-1 font-mono tracking-wide">{success.reference}</p>
                                </div>
                                <button
                                    onClick={() => setSuccess(null)}
                                    className="shrink-0 w-6 h-6 rounded-full bg-emerald-200 hover:bg-emerald-300 flex items-center justify-center text-emerald-700 text-sm transition-colors"
                                >&times;</button>
                            </div>
                        </div>
                    )}

                    {/* Error banner */}
                    {error && (
                        <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3.5 flex items-start gap-2.5 shadow-sm">
                            <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
                            <p className="text-red-500 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-3">

                        {/* To Account */}
                        <div>
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.12em] mb-2 px-1">To Account</p>
                            <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 shadow-sm border border-gray-100 focus-within:border-[#c9956a] focus-within:shadow-[0_0_0_3px_rgba(201,149,106,0.15)] transition-all">
                                <div className="w-8 h-8 rounded-full bg-[#fdf3ea] flex items-center justify-center shrink-0">
                                    <User size={15} className="text-[#b1835a]" />
                                </div>
                                <input
                                    value={toUsername}
                                    onChange={e => { setToUsername(e.target.value); setError(''); setSuccess(null); }}
                                    placeholder="Enter account username"
                                    className="flex-1 bg-transparent text-gray-800 text-sm font-medium outline-none placeholder-gray-300"
                                    autoComplete="off"
                                    autoCapitalize="none"
                                />
                            </div>
                        </div>

                        {/* Amount */}
                        <div>
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.12em] mb-2 px-1">Amount</p>
                            <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 shadow-sm border border-gray-100 focus-within:border-[#c9956a] focus-within:shadow-[0_0_0_3px_rgba(201,149,106,0.15)] transition-all mb-2.5">
                                <div className="w-8 h-8 rounded-full bg-[#fdf3ea] flex items-center justify-center shrink-0">
                                    <span className="text-[#b1835a] font-extrabold text-sm">₹</span>
                                </div>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={e => { setAmount(e.target.value); setError(''); setSuccess(null); }}
                                    placeholder="0.00"
                                    min={info.quota.min}
                                    max={info.quota.max}
                                    className="flex-1 bg-transparent text-gray-800 text-xl font-bold outline-none placeholder-gray-200"
                                />
                                {amount && (
                                    <button type="button" onClick={() => setAmount('')}
                                        className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 text-sm transition-colors">
                                        ×
                                    </button>
                                )}
                            </div>

                            {/* Quick amounts */}
                            <div className="grid grid-cols-4 gap-2">
                                {QUICK.map(v => {
                                    const active = Number(amount) === v;
                                    return (
                                        <button
                                            key={v} type="button" onClick={() => handleQuick(v)}
                                            className={`py-2.5 rounded-xl text-xs font-bold transition-all ${active ? 'text-white shadow-md shadow-[#b1835a]/30' : 'bg-white border border-gray-100 text-gray-500 shadow-sm hover:border-[#c9956a] hover:text-[#b1835a]'}`}
                                            style={active ? { background: 'linear-gradient(135deg,#d9ad82,#b1835a)' } : {}}
                                        >
                                            {v.toLocaleString('en-US')}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Payment password */}
                        <div>
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.12em] mb-2 px-1">Payment Password</p>
                            <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 shadow-sm border border-gray-100 focus-within:border-[#c9956a] focus-within:shadow-[0_0_0_3px_rgba(201,149,106,0.15)] transition-all">
                                <div className="w-8 h-8 rounded-full bg-[#fdf3ea] flex items-center justify-center shrink-0">
                                    <svg viewBox="0 0 20 20" fill="none" stroke="#b1835a" strokeWidth="1.7" className="w-4 h-4">
                                        <rect x="4" y="9" width="12" height="8" rx="1.5" />
                                        <path d="M7 9V6a3 3 0 016 0v3" strokeLinecap="round" />
                                    </svg>
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => { setPassword(e.target.value); setError(''); }}
                                    placeholder="Enter your login password"
                                    autoComplete="current-password"
                                    className="flex-1 bg-transparent text-gray-800 text-sm font-medium outline-none placeholder-gray-300"
                                />
                                <button type="button" tabIndex={-1} onClick={() => setShowPassword(s => !s)}
                                    className="text-gray-300 hover:text-gray-500 transition-colors">
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            <p className="text-[11px] text-gray-400 mt-1.5 px-1">Your login password is used to confirm this transfer.</p>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full py-4 rounded-2xl text-white font-bold text-sm tracking-widest uppercase shadow-lg shadow-[#b1835a]/30 transition-all active:scale-[0.98] disabled:opacity-60 disabled:shadow-none flex items-center justify-center gap-2 mt-1"
                            style={{ background: 'linear-gradient(135deg, #d9ad82 0%, #b1835a 100%)' }}
                        >
                            {submitting ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                    Processing…
                                </>
                            ) : (
                                <>
                                    <Send size={15} />
                                    Confirm Transfer
                                </>
                            )}
                        </button>

                        <p className="text-center text-[11px] text-gray-400 pb-2">
                            Transfers are instant and cannot be reversed.<br />Please double-check the recipient.
                        </p>
                    </form>

                </div>
            </div>
        </div>
    );
}

export default Transfer;
