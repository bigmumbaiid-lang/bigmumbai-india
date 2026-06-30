import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Copy, Check, RefreshCw, X, Zap, Clock } from 'lucide-react';
import axios from '../utils/axios';

const POLL_INTERVAL_MS = 10_000;
const BRAND       = 'linear-gradient(135deg, #d9ad82 0%, #b1835a 100%)';
const BRAND_C     = '#b1835a';
const USDT_COLOR  = '#26a17b';
const USDT_GRAD   = 'linear-gradient(135deg, #26a17b 0%, #1a7a5e 100%)';

const UsdtLogo = ({ size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <rect x="12" y="14" width="76" height="20" rx="10" fill="white" opacity="0.95" />
        <rect x="40" y="14" width="20" height="58" rx="10" fill="white" opacity="0.95" />
        <rect x="24" y="57" width="52" height="11" rx="5.5" fill="white" opacity="0.55" />
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
                : { background: '#f0fdf8', borderColor: '#a7f3d0', color: USDT_COLOR }
            }
        >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copied!' : label}
        </button>
    );
}

const OUTER = 'flex items-center justify-center bg-gray-50 min-h-screen';
const INNER = 'w-full lg:max-w-[400px] mx-auto h-screen flex flex-col overflow-hidden shadow-2xl border border-gray-200 bg-[#f7f8ff]';

export default function UsdtPayment() {
    const { orderId } = useParams();
    const { state }   = useLocation();
    const navigate    = useNavigate();

    const [order, setOrder]             = useState(state?.order || null);
    const [status, setStatus]           = useState('pending');
    const [loading, setLoading]         = useState(!state?.order);
    const [creditedInr, setCreditedInr] = useState(null);
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
        (async () => {
            try {
                const res = await axios.get(`/usdt/check-order/${orderId}`);
                if (res.data.success) {
                    setStatus(res.data.status);
                    if (res.data.status === 'completed') setCreditedInr(res.data.inrAmount);
                    if (res.data.status === 'pending') {
                        setOrder({
                            walletAddress:      res.data.walletAddress,
                            expectedUsdtAmount: res.data.expectedUsdtAmount,
                            inrAmount:          res.data.inrAmount,
                            expiresAt:          res.data.expiresAt,
                        });
                    }
                }
            } catch { } finally { setLoading(false); }
        })();
    }, [orderId, order]);

    const poll = useCallback(async () => {
        try {
            const res = await axios.get(`/usdt/check-order/${orderId}`);
            if (!res.data.success) return;
            if (res.data.status === 'completed') {
                setStatus('completed');
                setCreditedInr(res.data.inrAmount);
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
            const res = await axios.get(`/usdt/order-balance/${orderId}`);
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
            await axios.post(`/usdt/cancel-order/${orderId}`);
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
                    <div className="w-8 h-8 border-2 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: USDT_COLOR }} />
                </div>
            </div>
        </div>
    );

    if (status === 'completed') return (
        <div className={OUTER} style={{ minHeight: '100dvh' }}>
            <div className={INNER} style={{ height: '100dvh' }}>
                <div className="flex-1 flex flex-col items-center justify-center px-8 gap-5">
                    <div className="relative flex items-center justify-center">
                        <div className="absolute w-32 h-32 rounded-full opacity-20 blur-2xl" style={{ background: BRAND }} />
                        <div className="relative w-24 h-24 rounded-full flex items-center justify-center shadow-lg" style={{ background: BRAND }}>
                            <Check size={40} className="text-white" strokeWidth={3} />
                        </div>
                    </div>
                    <div className="text-center space-y-2">
                        <p className="text-gray-800 text-2xl font-extrabold tracking-tight">Payment Received!</p>
                        {creditedInr && (
                            <p className="text-2xl font-bold" style={{ color: BRAND_C }}>
                                +₹{Number(creditedInr).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </p>
                        )}
                        <p className="text-gray-400 text-sm">Confirmed on the TRON network.</p>
                    </div>
                    <button
                        onClick={closeTab}
                        className="px-10 py-3.5 rounded-2xl text-white font-bold text-sm shadow-lg active:scale-[0.97] transition-transform mt-2"
                        style={{ background: BRAND }}
                    >
                        Done
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
    const usdtAmount    = order?.expectedUsdtAmount || 0;
    const inrAmount     = order?.inrAmount || 0;
    const qrUrl         = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=${encodeURIComponent(walletAddress)}`;

    return (
        <div className={OUTER} style={{ minHeight: '100dvh' }}>
            <div className={INNER} style={{ height: '100dvh' }}>

                {/* Header */}
                <div className="flex-shrink-0 bg-white border-b border-gray-100 flex items-center justify-between px-4 py-3.5">
                    <button
                        onClick={closeTab}
                        className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition-transform bg-gray-50 border border-gray-200"
                    >
                        <X size={16} className="text-gray-600" />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center shadow-sm" style={{ background: USDT_GRAD }}>
                            <UsdtLogo size={16} />
                        </div>
                        <p className="text-gray-800 font-bold text-base">USDT Payment</p>
                    </div>
                    <div
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border"
                        style={isUrgent
                            ? { background: '#fff1f2', borderColor: '#fecaca', color: '#ef4444' }
                            : { background: '#f0fdf8', borderColor: '#a7f3d0', color: USDT_COLOR }
                        }
                    >
                        <Clock size={11} />
                        {mins}:{secs}
                    </div>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3" style={{ WebkitOverflowScrolling: 'touch' }}>

                    {/* Hero banner */}
                    <div className="rounded-2xl p-4 text-white relative overflow-hidden" style={{ background: USDT_GRAD }}>
                        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/10" />
                        <div className="absolute -bottom-5 -left-4 w-24 h-24 rounded-full bg-black/10" />
                        <div className="relative flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(4px)' }}>
                                <UsdtLogo size={36} />
                            </div>
                            <div>
                                <p className="text-white font-bold text-lg leading-tight">Send USDT</p>
                                <p className="text-white/70 text-xs mt-1">TRC20 network only</p>
                                <span className="mt-2 inline-block text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-white/20 text-white">
                                    TETHER · TRC20
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Address card */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Wallet Address</span>
                            <CopyBtn text={walletAddress} />
                        </div>
                        <p className="text-gray-700 text-[13px] font-mono font-semibold break-all leading-relaxed bg-gray-50 rounded-xl p-3 border border-gray-100">
                            {walletAddress}
                        </p>
                    </div>

                    {/* QR code */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col items-center gap-3">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide self-start">Scan QR Code</span>
                        <div className="p-3 rounded-2xl" style={{ border: '2px solid #a7f3d0' }}>
                            <img src={qrUrl} alt="Wallet QR" width={180} height={180} className="block rounded-lg" />
                        </div>
                        <p className="text-[11px] text-gray-400">Scan with your crypto wallet app</p>
                    </div>

                    {/* Amount card */}
                    <div className="bg-white rounded-2xl border shadow-sm p-4" style={{ borderColor: '#a7f3d0' }}>
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Amount to Send</span>
                            <CopyBtn text={String(usdtAmount)} label="Copy amount" />
                        </div>
                        <div className="flex items-end gap-2 mb-2">
                            <span className="text-3xl font-extrabold text-gray-800 tracking-tight">{usdtAmount}</span>
                            <span className="text-base font-bold mb-0.5" style={{ color: USDT_COLOR }}>USDT</span>
                        </div>
                        <div className="h-px bg-gray-100 my-3" />
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: BRAND }}>
                                <Zap size={12} className="text-white" />
                            </div>
                            <p className="text-sm font-semibold text-gray-600">
                                ₹{Number(inrAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })} will be credited instantly
                            </p>
                        </div>
                    </div>

                    {/* Live balance */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span
                                className="w-2 h-2 rounded-full animate-pulse"
                                style={{ background: liveBalance > 0 ? '#16a34a' : '#a7f3d0' }}
                            />
                            <span className="text-sm text-gray-500 font-medium">Received at address</span>
                        </div>
                        <span className={`font-bold text-sm ${liveBalance > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                            {liveBalance === null ? '—' : `${liveBalance.toFixed(6)} USDT`}
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
