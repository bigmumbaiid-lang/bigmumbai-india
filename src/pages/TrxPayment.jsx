import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Copy, Check, RefreshCw, X, Zap, Clock, Globe, ArrowUpRight, Hash, Link2, AlertTriangle, ArrowLeft } from 'lucide-react';
import axios from '../utils/axios';

const POLL_INTERVAL_MS = 10_000;
const BRAND        = 'linear-gradient(135deg, #d9ad82 0%, #b1835a 100%)';
const BRAND_C      = '#b1835a';
const TRX_COLOR    = '#EF0027';
const TRX_GRAD     = 'linear-gradient(135deg, #EF0027 0%, #b30020 100%)';
const SUCCESS_GRAD = 'linear-gradient(135deg, #34d399 0%, #059669 100%)';
const SUCCESS_C    = '#059669';

const TrxLogo = ({ size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <polygon points="50,4 96,28 50,56 4,28" fill="white" opacity="0.95" />
        <polygon points="50,4 96,28 78,90 22,90 4,28" fill="white" opacity="0.12" />
        <line x1="50" y1="56" x2="22" y2="90" stroke="white" strokeWidth="7" strokeLinecap="round" opacity="0.65" />
        <line x1="50" y1="56" x2="78" y2="90" stroke="white" strokeWidth="7" strokeLinecap="round" opacity="0.65" />
    </svg>
);

function useCountdown(expiresAt) {
    const [remaining, setRemaining] = useState(() =>
        expiresAt ? Math.max(0, new Date(expiresAt).getTime() - Date.now()) : 0
    );
    useEffect(() => {
        if (!expiresAt) return;
        const tick = () => setRemaining(Math.max(0, new Date(expiresAt).getTime() - Date.now()));
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [expiresAt]);
    const mins = String(Math.floor(remaining / 60000)).padStart(2, '0');
    const secs = String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0');
    return { remaining, mins, secs };
}

function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text);
    }
    return new Promise((resolve, reject) => {
        const el = document.createElement('textarea');
        el.value = text;
        el.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
        document.body.appendChild(el);
        el.focus();
        el.select();
        try { document.execCommand('copy') ? resolve() : reject(); }
        catch { reject(); }
        finally { document.body.removeChild(el); }
    });
}

function CopyBtn({ text, label = 'Copy' }) {
    const [copied, setCopied] = useState(false);
    const t = useRef(null);
    const go = () => copyText(text).then(() => {
        setCopied(true);
        clearTimeout(t.current);
        t.current = setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
    return (
        <button
            onClick={go}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 border"
            style={copied
                ? { background: '#f0fdf4', borderColor: '#86efac', color: '#16a34a' }
                : { background: '#fff5f0', borderColor: '#ffd0c8', color: TRX_COLOR }
            }
        >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copied!' : label}
        </button>
    );
}

function CopyIconBtn({ text }) {
    const [copied, setCopied] = useState(false);
    const t = useRef(null);
    const go = () => copyText(text).then(() => {
        setCopied(true);
        clearTimeout(t.current);
        t.current = setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
    return (
        <button
            onClick={go}
            className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-90"
            style={{ background: copied ? '#f0fdf4' : '#f9fafb', color: copied ? '#16a34a' : '#9ca3af' }}
        >
            {copied ? <Check size={12} /> : <Copy size={12} />}
        </button>
    );
}

const OUTER = 'flex items-center justify-center bg-gray-50 min-h-screen';
const INNER = 'w-full lg:max-w-[400px] mx-auto h-screen flex flex-col overflow-hidden shadow-2xl border border-gray-200 bg-[#f7f8ff]';

export default function TrxPayment() {
    const { orderId } = useParams();
    const { state }   = useLocation();
    const navigate    = useNavigate();

    const [order, setOrder]             = useState(state?.order || null);
    const [status, setStatus]           = useState('pending');
    const [loading, setLoading]         = useState(!state?.order);
    const [creditedInr, setCreditedInr]       = useState(null);
    const [creditedTrx, setCreditedTrx]       = useState(null);
    const [creditedTxId, setCreditedTxId]     = useState(null);
    const [liveBalance, setLiveBalance] = useState(null);
    const [showCancel, setShowCancel]   = useState(false);
    const [cancelling, setCancelling]   = useState(false);
    const pollRef    = useRef(null);
    const balanceRef = useRef(null);

    const closeTab = () => {
        if (window.opener) window.close();
        else navigate('/recharge', { replace: true });
    };

    useEffect(() => {
        if (order) return;
        const fetchOrder = () => axios.get(`/trx/check-order/${orderId}`);
        (async () => {
            let res;
            try {
                res = await fetchOrder();
            } catch (err) {
                // A real "not found" (404) means the link is genuinely invalid.
                // Anything else (network blip, timeout, transient 5xx) deserves one
                // retry before we tell the user the link is bad — a single dropped
                // request on a flaky mobile connection shouldn't read as "invalid".
                if (err.response && err.response.status !== 404) {
                    try {
                        await new Promise(r => setTimeout(r, 800));
                        res = await fetchOrder();
                    } catch { setStatus('invalid'); setLoading(false); return; }
                } else {
                    setStatus('invalid'); setLoading(false); return;
                }
            }
            if (res.data.success) {
                setStatus(res.data.status);
                if (res.data.status === 'completed') {
                    setCreditedInr(res.data.inrAmount);
                    setCreditedTrx(res.data.expectedTrxAmount);
                    setCreditedTxId(res.data.txId);
                }
                if (res.data.status === 'pending') {
                    setOrder({
                        walletAddress:     res.data.walletAddress,
                        expectedTrxAmount: res.data.expectedTrxAmount,
                        inrAmount:         res.data.inrAmount,
                        expiresAt:         res.data.expiresAt,
                    });
                }
            } else {
                setStatus('invalid');
            }
            setLoading(false);
        })();
    }, [orderId, order]);

    const poll = useCallback(async () => {
        try {
            const res = await axios.get(`/trx/check-order/${orderId}`);
            if (!res.data.success) return;
            if (res.data.status === 'completed') {
                setStatus('completed');
                setCreditedInr(res.data.inrAmount);
                setCreditedTrx(res.data.expectedTrxAmount);
                setCreditedTxId(res.data.txId);
                clearInterval(pollRef.current);
            } else if (res.data.status === 'expired' || res.data.status === 'cancelled') {
                setStatus('expired');
                clearInterval(pollRef.current);
            }
        } catch { }
    }, [orderId]);

    useEffect(() => {
        if (status !== 'pending') return;
        poll();
        pollRef.current = setInterval(poll, POLL_INTERVAL_MS);
        return () => clearInterval(pollRef.current);
    }, [status, poll]);

    const checkBalance = useCallback(async () => {
        try {
            const res = await axios.get(`/trx/order-balance/${orderId}`);
            if (res.data.success) setLiveBalance(res.data.balance);
        } catch { }
    }, [orderId]);

    useEffect(() => {
        if (status !== 'pending') return;
        checkBalance();
        balanceRef.current = setInterval(checkBalance, 15_000);
        return () => clearInterval(balanceRef.current);
    }, [status, checkBalance]);

    const handleCancel = async () => {
        setCancelling(true);
        try {
            await axios.post(`/trx/cancel-order/${orderId}`);
            clearInterval(pollRef.current);
            clearInterval(balanceRef.current);
            closeTab();
        } catch {
            setCancelling(false);
            setShowCancel(false);
        }
    };

    const { remaining, mins, secs } = useCountdown(order?.expiresAt);
    const isUrgent = remaining > 0 && remaining < 5 * 60 * 1000;

    if (loading) return (
        <div className={OUTER} style={{ minHeight: '100dvh' }}>
            <div className={INNER} style={{ height: '100dvh' }}>
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: TRX_COLOR }} />
                </div>
            </div>
        </div>
    );

    if (status === 'completed') return (
        <div className={OUTER} style={{ minHeight: '100dvh' }}>
            <div className={INNER} style={{ height: '100dvh' }}>
                <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 relative overflow-hidden">
                    {/* Ambient glows */}
                    <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: SUCCESS_GRAD }} />
                    <div className="absolute -bottom-20 -right-16 w-64 h-64 rounded-full opacity-15 blur-3xl pointer-events-none" style={{ background: TRX_GRAD }} />

                    {/* Success badge */}
                    <div className="animate-popIn relative flex items-center justify-center mb-5 shrink-0">
                        <div className="absolute w-32 h-32 rounded-full opacity-20 blur-2xl" style={{ background: SUCCESS_GRAD }} />
                        <div className="absolute w-24 h-24 rounded-full" style={{ border: '2px solid #86efac' }} />
                        <div className="relative w-[72px] h-[72px] rounded-full flex items-center justify-center" style={{ background: SUCCESS_GRAD, boxShadow: '0 10px 26px rgba(5,150,105,0.35)' }}>
                            <Check size={32} className="text-white" strokeWidth={3} />
                        </div>
                    </div>

                    <p className="animate-fadeUp text-gray-800 text-lg font-semibold">Payment Successful</p>
                    <p className="animate-fadeUp text-gray-400 text-xs mt-1 mb-5">Confirmed on the TRON network</p>

                    {/* Receipt card */}
                    <div className="animate-fadeUp relative z-10 w-full bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                        <div className="h-1.5" style={{ background: TRX_GRAD }} />

                        <div className="px-6 pt-5 pb-4 text-center">
                            {creditedInr != null && (
                                <p className="text-3xl font-semibold tracking-tight" style={{ color: SUCCESS_C }}>
                                    +₹{Number(creditedInr).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </p>
                            )}
                            <p className="text-gray-400 text-xs mt-1">credited to your balance</p>
                        </div>

                        <div className="mx-6 border-t border-dashed border-gray-200" />

                        <div className="px-6 py-4 space-y-3.5">
                            <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2 text-gray-400"><Globe size={14} /> Network</span>
                                <span className="font-medium text-gray-700">TRX · TRON</span>
                            </div>
                            {creditedTrx != null && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-2 text-gray-400"><ArrowUpRight size={14} /> Amount Sent</span>
                                    <span className="font-medium text-gray-700">{Number(creditedTrx).toFixed(4)} TRX</span>
                                </div>
                            )}
                            <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2 text-gray-400"><Hash size={14} /> Order ID</span>
                                <span className="flex items-center gap-2">
                                    <span className="font-mono font-medium text-gray-700" title={orderId}>{orderId.slice(0, 6)}…{orderId.slice(-6)}</span>
                                    <CopyIconBtn text={orderId} />
                                </span>
                            </div>
                            {creditedTxId && (
                                <div className="flex items-center justify-between text-sm gap-3">
                                    <span className="flex items-center gap-2 text-gray-400 shrink-0"><Link2 size={14} /> Tx Hash</span>
                                    <span className="flex items-center gap-2 min-w-0">
                                        <span className="font-mono font-medium text-gray-700 truncate" title={creditedTxId}>
                                            {creditedTxId.slice(0, 6)}…{creditedTxId.slice(-6)}
                                        </span>
                                        <CopyIconBtn text={creditedTxId} />
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={closeTab}
                        className="animate-fadeUp relative z-10 w-full mt-6 px-10 py-3.5 rounded-2xl text-white font-medium text-sm shadow-lg active:scale-[0.97] transition-transform"
                        style={{ background: TRX_GRAD, boxShadow: '0 8px 20px rgba(239,0,39,0.25)' }}
                    >
                        Done
                    </button>
                </div>

                <style>{`
                    @keyframes popIn  { 0%{opacity:0;transform:scale(.5)} 60%{opacity:1;transform:scale(1.06)} 100%{transform:scale(1)} }
                    @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
                    .animate-popIn  { animation:popIn .5s cubic-bezier(.34,1.56,.64,1) both; }
                    .animate-fadeUp { animation:fadeUp .4s ease-out .15s both; }
                `}</style>
            </div>
        </div>
    );

    if (status === 'invalid') return (
        <div className={OUTER} style={{ minHeight: '100dvh' }}>
            <div className={INNER} style={{ height: '100dvh' }}>
                <div className="flex-1 flex flex-col items-center justify-center px-8 gap-5">
                    <div className="w-24 h-24 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center">
                        <AlertTriangle size={36} className="text-red-400" />
                    </div>
                    <div className="text-center space-y-2">
                        <p className="text-gray-800 text-2xl font-semibold">Invalid Payment Link</p>
                        <p className="text-gray-400 text-sm">This payment link is invalid or no longer exists. Please start a new recharge.</p>
                    </div>
                    <button
                        onClick={closeTab}
                        className="flex items-center gap-2 px-10 py-3.5 rounded-2xl text-white font-medium text-sm shadow-lg active:scale-[0.97] transition-transform"
                        style={{ background: BRAND }}
                    >
                        <ArrowLeft size={16} /> Go Back
                    </button>
                </div>
            </div>
        </div>
    );

    const timerExpired = !loading && order && remaining === 0 && new Date(order.expiresAt) <= new Date();
    if (status === 'expired' || timerExpired) return (
        <div className={OUTER} style={{ minHeight: '100dvh' }}>
            <div className={INNER} style={{ height: '100dvh' }}>
                <div className="flex-1 flex flex-col items-center justify-center px-8 gap-5">
                    <div className="w-24 h-24 rounded-full bg-red-50 border-2 border-red-200 flex items-center justify-center">
                        <RefreshCw size={36} className="text-red-400" />
                    </div>
                    <div className="text-center space-y-2">
                        <p className="text-gray-800 text-2xl font-extrabold">Order Expired</p>
                        <p className="text-gray-400 text-sm">This payment order has timed out. Please create a new one.</p>
                    </div>
                    <button
                        onClick={closeTab}
                        className="px-10 py-3.5 rounded-2xl text-white font-bold text-sm shadow-lg active:scale-[0.97] transition-transform"
                        style={{ background: BRAND }}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        </div>
    );

    const walletAddress = order?.walletAddress || '';
    const trxAmount     = order?.expectedTrxAmount || 0;
    const inrAmount     = order?.inrAmount || 0;
    const qrUrl         = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=${encodeURIComponent(walletAddress)}`;

    return (
        <div className={OUTER} style={{ minHeight: '100dvh' }}>
            <div className={INNER} style={{ height: '100dvh' }}>

                {/* Header */}
                <div
                    className="flex-shrink-0 bg-white flex items-center justify-between px-4 py-3.5 relative z-10"
                    style={{ boxShadow: '0 1px 0 rgba(0,0,0,0.05)' }}
                >
                    <button
                        onClick={closeTab}
                        className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform bg-gray-50 border border-gray-200"
                    >
                        <X size={16} className="text-gray-600" />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center shadow-sm" style={{ background: TRX_GRAD }}>
                            <TrxLogo size={16} />
                        </div>
                        <p className="text-gray-800 font-bold text-base">TRX Payment</p>
                    </div>
                    <div
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${isUrgent ? 'animate-pulse' : ''}`}
                        style={isUrgent
                            ? { background: '#fff1f2', borderColor: '#fecaca', color: '#ef4444' }
                            : { background: '#fff5f0', borderColor: '#ffd0c8', color: TRX_COLOR }
                        }
                    >
                        <Clock size={11} />
                        {mins}:{secs}
                    </div>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3" style={{ WebkitOverflowScrolling: 'touch' }}>

                    {/* Hero banner */}
                    <div className="rounded-2xl p-4 text-white relative overflow-hidden" style={{ background: TRX_GRAD }}>
                        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10" />
                        <div className="absolute -bottom-5 -left-4 w-24 h-24 rounded-full bg-black/10" />
                        <div
                            className="absolute inset-0 opacity-[0.06] pointer-events-none"
                            style={{ backgroundImage: 'repeating-linear-gradient(45deg, white 0, white 1px, transparent 1px, transparent 12px)' }}
                        />
                        <div className="relative flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)' }}>
                                <TrxLogo size={38} />
                            </div>
                            <div>
                                <p className="text-white font-bold text-lg leading-tight">Send TRX</p>
                                <span className="mt-2 inline-block text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-white/20 text-white tracking-wide">
                                    TRON NETWORK
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Deposit address card — QR + wallet address */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="h-1" style={{ background: TRX_GRAD }} />
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Deposit Address</span>
                                <CopyBtn text={walletAddress} />
                            </div>

                            <div className="flex flex-col items-center gap-3 py-1">
                                <div className="p-3 rounded-2xl" style={{ border: '2px solid #fecaca' }}>
                                    <img src={qrUrl} alt="Wallet QR" width={168} height={168} className="block rounded-lg" />
                                </div>
                                <p className="text-[11px] text-gray-400">Scan with your crypto wallet app</p>
                            </div>

                            <div className="h-px bg-gray-100 my-3.5" />

                            <p className="text-gray-700 text-[12.5px] font-mono font-semibold break-all leading-relaxed bg-gray-50 rounded-xl p-3 border border-gray-100 text-center">
                                {walletAddress}
                            </p>
                        </div>
                    </div>

                    {/* Amount card */}
                    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden" style={{ borderColor: '#fecaca' }}>
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Amount to Send</span>
                                <CopyBtn text={String(trxAmount)} label="Copy amount" />
                            </div>
                            <div className="flex items-end gap-2">
                                <span className="text-3xl font-extrabold text-gray-800 tracking-tight">{trxAmount}</span>
                                <span className="text-base font-bold mb-0.5" style={{ color: TRX_COLOR }}>TRX</span>
                            </div>
                        </div>
                        <div className="px-4 py-3 flex items-center gap-2" style={{ background: '#fff8f6', borderTop: '1px solid #fecaca' }}>
                            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: BRAND }}>
                                <Zap size={12} className="text-white" />
                            </div>
                            <p className="text-sm font-semibold text-gray-600">
                                ₹{Number(inrAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })} will be credited instantly
                            </p>
                        </div>
                    </div>

                    {/* Live balance */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span
                                className="w-2 h-2 rounded-full animate-pulse"
                                style={{ background: liveBalance > 0 ? '#16a34a' : '#fca5a5' }}
                            />
                            <span className="text-sm text-gray-500 font-medium">Received at address</span>
                        </div>
                        <span className={`font-bold text-sm ${liveBalance > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                            {liveBalance === null ? '—' : `${liveBalance.toFixed(4)} TRX`}
                        </span>
                    </div>

                    {/* Cancel button */}
                    <button
                        onClick={() => setShowCancel(true)}
                        className="w-full py-3 rounded-2xl text-gray-400 text-sm font-medium border border-gray-200 bg-white active:scale-[0.98] transition-all mb-2"
                    >
                        Cancel order
                    </button>
                </div>
            </div>

            {showCancel && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] px-8">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-[300px] flex flex-col items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                            <RefreshCw size={24} className="text-red-400" />
                        </div>
                        <div className="text-center">
                            <p className="text-gray-800 font-bold text-base">Cancel this order?</p>
                            <p className="text-gray-400 text-xs mt-1">This address will be released and you can create a new deposit request.</p>
                        </div>
                        <div className="flex gap-3 w-full">
                            <button
                                onClick={() => setShowCancel(false)}
                                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium"
                            >
                                Keep
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={cancelling}
                                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold bg-red-400 disabled:opacity-60"
                            >
                                {cancelling ? 'Cancelling…' : 'Yes, cancel'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
