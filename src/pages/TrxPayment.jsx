import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Copy, Check, RefreshCw, Zap, Clock, Globe, ArrowUpRight, Hash, Link2, AlertTriangle, ArrowLeft, ShieldCheck } from 'lucide-react';
import axios from '../utils/axios';

const POLL_INTERVAL_MS = 10_000;
const ORDER_TTL_MS = 15 * 60 * 1000;
const BRAND        = 'linear-gradient(135deg, #d9ad82 0%, #b1835a 100%)';
// Red is kept only for the TRON logo tile and the destructive Cancel action.
const TRX_COLOR    = '#EF0027';
const TRX_GRAD     = 'linear-gradient(135deg, #EF0027 0%, #b30020 100%)';
// Green is the primary UI accent (text, steps, status, QR, amount).
const ACCENT       = '#059669';
const ACCENT_GRAD  = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
const ACCENT_TINT  = '#ecfdf5';
const ACCENT_BORDER = '#a7f3d0';
const SUCCESS_GRAD = 'linear-gradient(135deg, #34d399 0%, #059669 100%)';
const SUCCESS_C    = '#059669';

// Official TRON (TRX) emblem — renders white so it shows on the red tile.
const TrxLogo = ({ size = 32 }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        <path
            fill="white"
            d="M21.932 9.913L7.5 7.257l7.595 19.112 10.583-12.865-3.746-3.591zm-.232 1.17l2.208 2.117-6.038 1.093 3.83-3.21zm-5.142 3.028l-6.364-5.278 10.402 1.914-4.038 3.364zm-.44 1.078l-1.087 8.98-5.115-12.868 6.202 3.888zm1.348.427l5.208-.943-5.997 7.29.789-6.347z"
        />
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

// Ghost copy button — plain accent text + icon, no pill.
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
            className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide transition-all active:scale-95"
            style={{ color: copied ? '#16a34a' : ACCENT }}
        >
            {copied ? <Check size={13} /> : <Copy size={13} />}
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
            className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-all active:scale-90 border"
            style={{
                background: copied ? '#f0fdf4' : '#f9fafb',
                borderColor: copied ? '#86efac' : '#e5e7eb',
                color: copied ? '#16a34a' : '#9ca3af',
            }}
        >
            {copied ? <Check size={12} /> : <Copy size={12} />}
        </button>
    );
}

const OUTER = 'flex items-center justify-center bg-gradient-to-b from-gray-50 via-gray-100 to-gray-200 min-h-screen';
const INNER = 'relative w-full lg:max-w-[400px] mx-auto h-screen flex flex-col overflow-hidden shadow-2xl border border-gray-200/70 bg-white';

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
                // A cancelled order has no live deposit details — treat it like an
                // expired one so we don't fall through to a blank "pending" screen.
                setStatus(res.data.status === 'cancelled' ? 'expired' : res.data.status);
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

    // Once the address holds the FULL expected amount (≥99.9%, matching the
    // backend threshold), the backend is about to complete the order — the tx
    // index just lags a few seconds behind. Poll the status aggressively during
    // that window so the success screen appears almost immediately. A partial /
    // underpaid balance is NOT treated as detected, since it won't be credited.
    const _expectedTrx    = order?.expectedTrxAmount || 0;
    const balanceDetected = liveBalance != null && _expectedTrx > 0 && liveBalance >= _expectedTrx * 0.999;

    useEffect(() => {
        if (status !== 'pending') return;
        poll();
        pollRef.current = setInterval(poll, balanceDetected ? 3000 : POLL_INTERVAL_MS);
        return () => clearInterval(pollRef.current);
    }, [status, poll, balanceDetected]);

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
                <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">

                    {/* Success badge */}
                    <div className="animate-popIn relative flex items-center justify-center mb-5 shrink-0">
                        <div className="absolute w-24 h-24 rounded-full opacity-25 blur-xl" style={{ background: SUCCESS_GRAD }} />
                        <div
                            className="relative w-[76px] h-[76px] rounded-3xl flex items-center justify-center"
                            style={{ background: SUCCESS_GRAD, boxShadow: '0 14px 30px rgba(5,150,105,0.32)' }}
                        >
                            <Check size={36} className="text-white" strokeWidth={3} />
                        </div>
                    </div>

                    <p className="animate-fadeUp text-gray-800 text-lg font-semibold">Payment Successful</p>
                    <p className="animate-fadeUp text-gray-400 text-xs mt-1 mb-5">Confirmed on the TRON network</p>

                    {/* Receipt card */}
                    <div className="animate-fadeUp w-full bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden">
                        <div className="h-1.5" style={{ background: ACCENT_GRAD }} />

                        <div className="px-6 pt-5 pb-4 text-center">
                            {creditedInr != null && (
                                <p className="text-3xl font-bold tracking-tight" style={{ color: SUCCESS_C }}>
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
                        className="animate-fadeUp w-full mt-6 px-10 py-3.5 rounded-xl text-white font-semibold text-sm active:scale-[0.98] transition-transform"
                        style={{ background: ACCENT_GRAD, boxShadow: '0 10px 24px rgba(5,150,105,0.24)' }}
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
                    <div className="w-20 h-20 rounded-3xl bg-red-50 border border-red-200 flex items-center justify-center">
                        <AlertTriangle size={34} className="text-red-400" />
                    </div>
                    <div className="text-center space-y-2">
                        <p className="text-gray-800 text-2xl font-semibold">Invalid Payment Link</p>
                        <p className="text-gray-400 text-sm">This payment link is invalid or no longer exists. Please start a new recharge.</p>
                    </div>
                    <button
                        onClick={closeTab}
                        className="flex items-center gap-2 px-10 py-3.5 rounded-xl text-white font-semibold text-sm active:scale-[0.98] transition-transform"
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
                    <div className="w-20 h-20 rounded-3xl bg-red-50 border border-red-200 flex items-center justify-center">
                        <RefreshCw size={34} className="text-red-400" />
                    </div>
                    <div className="text-center space-y-2">
                        <p className="text-gray-800 text-2xl font-semibold">Order Expired</p>
                        <p className="text-gray-400 text-sm">This payment order has timed out. Please create a new one.</p>
                    </div>
                    <button
                        onClick={closeTab}
                        className="px-10 py-3.5 rounded-xl text-white font-semibold text-sm active:scale-[0.98] transition-transform"
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
    // ecc=H (high error correction) so the centered TRON logo doesn't break scanning.
    const qrUrl         = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&ecc=H&data=${encodeURIComponent(walletAddress)}`;

    // Interpret the on-chain balance against what's expected:
    //  • sufficient → enough received, backend is about to credit (reassure)
    //  • underpaid  → funds arrived but below the required amount (tell them how
    //                 much more to send — the backend sums top-ups, so it works)
    const requiredTrx = trxAmount * 0.999; // matches backend acceptance threshold (full amount)
    const hasFunds    = liveBalance != null && liveBalance > 0;
    const sufficient  = hasFunds && liveBalance >= requiredTrx;
    const underpaid   = hasFunds && liveBalance < requiredTrx;
    const shortfall   = underpaid ? Math.max(0, trxAmount - liveBalance) : 0;
    const detected    = sufficient;

    const progressPct = Math.max(0, Math.min(100, (remaining / ORDER_TTL_MS) * 100));
    const activeStep  = detected ? 1 : 0; // 0 = waiting, 1 = confirming, 2 = credited (success screen)
    const steps       = ['Send', 'Confirm', 'Credited'];

    // Status pill tone — green for listening/detected, amber for underpaid.
    const statusMsg = detected
        ? 'Payment detected — confirming…'
        : underpaid
            ? `Underpaid — send ${shortfall.toFixed(2)} TRX more`
            : 'Listening for your transfer…';
    const statusBg   = underpaid ? '#fffbeb' : 'linear-gradient(135deg, #ecfdf5 0%, #eff6ff 100%)';
    const statusDot  = underpaid ? '#f59e0b' : '#10b981';
    const statusText = underpaid ? '#d97706' : '#047857';

    return (
        <div className={OUTER} style={{ minHeight: '100dvh' }}>
            <div className={INNER} style={{ height: '100dvh' }}>

                {/* Soft multi-colour ambient glows so the page isn't plain white (z-0) */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
                    <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full blur-3xl" style={{ background: '#10b981', opacity: 0.12 }} />
                    <div className="absolute top-1/3 -right-20 w-64 h-64 rounded-full blur-3xl" style={{ background: '#38bdf8', opacity: 0.11 }} />
                    <div className="absolute top-2/3 -left-16 w-56 h-56 rounded-full blur-3xl" style={{ background: '#f59e0b', opacity: 0.09 }} />
                    <div className="absolute -bottom-20 right-1/4 w-60 h-60 rounded-full blur-3xl" style={{ background: '#a855f7', opacity: 0.08 }} />
                </div>

                {/* Header */}
                <div className="flex-shrink-0 bg-white/80 backdrop-blur flex items-center gap-3 px-3 h-[68px] border-b border-gray-100 relative z-10">
                    <button
                        onClick={closeTab}
                        className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 transition-all hover:bg-gray-100 text-gray-500"
                        aria-label="Back"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className="relative w-11 h-11 rounded-xl flex items-center justify-center shadow-sm overflow-hidden shrink-0" style={{ background: TRX_GRAD }}>
                        <TrxLogo size={30} />
                        <span className="trx-shine absolute inset-y-0 -left-1/2 w-1/2 pointer-events-none"
                            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)', transform: 'skewX(-18deg)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-gray-900 font-bold text-[17px] leading-tight">TRX Payment</p>
                        <p className="text-[11.5px] font-semibold leading-tight mt-0.5">
                            <span className="text-gray-400">TRON Network</span>
                            <span style={{ color: ACCENT }}> • Mainnet</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-1 text-[15px] font-bold tabular-nums pr-1" style={{ color: isUrgent ? '#ef4444' : '#9ca3af' }}>
                        <Clock size={13} />
                        {mins}:{secs}
                    </div>
                </div>

                {/* Countdown progress — thin, drains as the window closes */}
                <div className="flex-shrink-0 h-[3px] bg-gray-100 overflow-hidden relative z-10">
                    <div
                        className="h-full transition-[width] duration-1000 ease-linear"
                        style={{ width: `${progressPct}%`, background: isUrgent ? '#ef4444' : ACCENT_GRAD }}
                    />
                </div>

                {/* Scrollable content */}
                <div className="trx-scroll flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4 relative z-10" style={{ WebkitOverflowScrolling: 'touch' }}>

                    {/* Status pill */}
                    <div className="trx-rise relative overflow-hidden rounded-lg px-4 py-3 flex items-center justify-center gap-2.5" style={{ background: statusBg, animationDelay: '0s' }}>
                        {/* sheen sweep */}
                        <span className="trx-statusshine pointer-events-none absolute inset-y-0 -left-1/3 w-1/3"
                            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)', transform: 'skewX(-18deg)' }} />
                        {/* sonar dot */}
                        <span className="relative z-10 flex h-2.5 w-2.5 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: statusDot }} />
                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: statusDot }} />
                        </span>
                        <p className="relative z-10 text-[13.5px] font-semibold" style={{ color: statusText }}>{statusMsg}</p>
                    </div>

                    {/* Stepper */}
                    <div className="trx-rise flex items-start px-1 pt-1" style={{ animationDelay: '.05s' }}>
                        {steps.map((label, i) => {
                            const done = i < activeStep;
                            const active = i === activeStep;
                            return (
                                <React.Fragment key={label}>
                                    <div className="flex-1 flex flex-col items-center">
                                        <div
                                            className={`w-10 h-10 rounded-lg flex items-center justify-center text-base font-bold transition-colors ${active ? 'trx-step-pulse' : ''}`}
                                            style={
                                                done || active
                                                    ? { background: ACCENT_GRAD, color: '#fff' }
                                                    : { background: '#e9ebef', color: '#9ca3af' }
                                            }
                                        >
                                            {done ? <Check size={17} strokeWidth={3} /> : i + 1}
                                        </div>
                                        <span
                                            className="mt-2 text-[10px] font-bold uppercase tracking-widest leading-none transition-colors"
                                            style={{ color: done || active ? ACCENT : '#9ca3af' }}
                                        >
                                            {label}
                                        </span>
                                    </div>
                                    {i < steps.length - 1 && (
                                        <div className="flex-1 h-[2px] mt-5 mx-2 relative overflow-hidden bg-gray-200 rounded-full">
                                            <div
                                                className={i === activeStep ? 'trx-flow' : ''}
                                                style={{
                                                    position: 'absolute', inset: 0,
                                                    background: i < activeStep
                                                        ? ACCENT
                                                        : i === activeStep
                                                            ? `linear-gradient(90deg, ${ACCENT}, transparent)`
                                                            : 'transparent',
                                                }}
                                            />
                                        </div>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>

                    {/* Deposit address card — QR + wallet address */}
                    <div className="trx-rise bg-white rounded-xl border border-gray-100 shadow-sm p-4" style={{ animationDelay: '.1s' }}>
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">TRX Deposit</span>
                            <CopyBtn text={walletAddress} />
                        </div>

                        <div className="flex flex-col items-center gap-3">
                            <div className="relative p-3 bg-white rounded-xl overflow-hidden" style={{ border: `1px solid ${ACCENT_BORDER}`, boxShadow: '0 6px 18px -12px rgba(5,150,105,0.30)' }}>
                                <img src={qrUrl} alt="Wallet QR" width={180} height={180} className="block rounded-md" />
                                {/* animated scan line */}
                                <div
                                    className="trx-scan pointer-events-none absolute left-3 right-3 h-[2px]"
                                    style={{ background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)`, boxShadow: `0 0 8px ${ACCENT}` }}
                                />
                                {/* TRON logo in the QR centre */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center"
                                        style={{ background: TRX_GRAD, border: '3px solid #fff', boxShadow: '0 3px 10px rgba(239,0,39,0.35)' }}
                                    >
                                        <TrxLogo size={19} />
                                    </div>
                                </div>
                            </div>
                            <p className="text-[11.5px] text-gray-400 font-medium">Scan with any TRON-compatible wallet</p>
                        </div>

                        <p className="mt-4 text-gray-700 text-[12.5px] font-mono font-semibold break-all leading-relaxed bg-gray-50 rounded-lg px-3 py-3 border border-gray-100 text-center">
                            {walletAddress}
                        </p>
                    </div>

                    {/* Amount card */}
                    <div className="trx-rise bg-white rounded-xl border border-gray-100 shadow-sm p-4" style={{ animationDelay: '.16s' }}>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-[13px] text-gray-400 font-medium">Amount to Send</p>
                            <CopyBtn text={String(trxAmount)} label="Copy" />
                        </div>
                        <div className="flex items-end justify-between">
                            <div className="flex items-baseline gap-2">
                                <span
                                    className="text-[38px] leading-none font-extrabold tracking-tight tabular-nums"
                                    style={{ backgroundImage: 'linear-gradient(135deg, #334155 0%, #0f172a 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}
                                >
                                    {trxAmount}
                                </span>
                                <span className="text-xl font-extrabold" style={{ color: ACCENT }}>TRX</span>
                            </div>
                            <div className="text-right">
                                <p className="text-[17px] font-bold leading-none text-gray-900">
                                    ₹{Number(inrAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-[11px] font-bold mt-1 flex items-center justify-end gap-1" style={{ color: '#d97706' }}>
                                    <Zap size={11} /> Instant Credit
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Received row */}
                    <div className="trx-rise flex items-center justify-between px-1" style={{ animationDelay: '.22s' }}>
                        <span className="text-sm text-gray-500 font-medium">Received at this address</span>
                        <span
                            className="text-sm font-bold tabular-nums"
                            style={{ color: detected ? SUCCESS_C : underpaid ? '#d97706' : '#9ca3af' }}
                        >
                            {liveBalance === null ? '—' : `${liveBalance.toFixed(4)} TRX`}
                        </span>
                    </div>

                    {/* Cancel button */}
                    <button
                        onClick={() => setShowCancel(true)}
                        className="trx-rise w-full py-3.5 rounded-lg text-sm font-bold border bg-white active:scale-[0.99] transition-all hover:bg-red-50"
                        style={{ borderColor: '#fecaca', color: TRX_COLOR, animationDelay: '.28s' }}
                    >
                        Cancel Order
                    </button>

                    {/* Trust footer */}
                    <div className="trx-rise flex items-center justify-center gap-1.5 pt-1 pb-4 text-gray-400" style={{ animationDelay: '.34s' }}>
                        <ShieldCheck size={13} />
                        <span className="text-[11px] font-medium">Secured on TRON Mainnet · credited automatically</span>
                    </div>
                </div>

                <style>{`
                    @keyframes trxScan  { 0%{top:12px} 50%{top:calc(100% - 14px)} 100%{top:12px} }
                    @keyframes trxShine { 0%{left:-60%} 55%,100%{left:160%} }
                    @keyframes trxFlow  { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
                    @keyframes trxDot   { 0%,100%{opacity:.4;transform:scale(.75)} 50%{opacity:1;transform:scale(1)} }
                    @keyframes trxStep  { 0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,.45)} 70%{box-shadow:0 0 0 6px rgba(16,185,129,0)} }
                    @keyframes trxRise  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
                    @keyframes trxStatusShine { 0%{left:-40%} 60%,100%{left:135%} }
                    .trx-statusshine { animation:trxStatusShine 3s ease-in-out infinite; }
                    .trx-rise  { animation:trxRise .5s cubic-bezier(.22,1,.36,1) both; }
                    .trx-scroll::-webkit-scrollbar { width:0; height:0; }
                    .trx-scroll { scrollbar-width:none; -ms-overflow-style:none; }
                    .trx-scan  { animation:trxScan 2.6s ease-in-out infinite; }
                    .trx-shine { animation:trxShine 4.5s ease-in-out infinite; }
                    .trx-flow  { animation:trxFlow 1.3s linear infinite; }
                    .trx-dot   { animation:trxDot 1.1s ease-in-out infinite; }
                    .trx-step-pulse { animation:trxStep 1.6s ease-out infinite; }
                    @media (prefers-reduced-motion: reduce) {
                        .trx-scan,.trx-shine,.trx-flow,.trx-dot,.trx-step-pulse,.trx-statusshine,.animate-ping { animation:none !important; }
                        .trx-rise { animation:none !important; opacity:1 !important; transform:none !important; }
                    }
                `}</style>
            </div>

            {showCancel && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] px-8">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-[300px] flex flex-col items-center gap-4 border border-gray-100">
                        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
                            <RefreshCw size={24} className="text-red-400" />
                        </div>
                        <div className="text-center">
                            <p className="text-gray-800 font-bold text-base">Cancel this order?</p>
                            <p className="text-gray-400 text-xs mt-1">This address will be released and you can create a new deposit request.</p>
                        </div>
                        <div className="flex gap-3 w-full">
                            <button
                                onClick={() => setShowCancel(false)}
                                className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50"
                            >
                                Keep
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={cancelling}
                                className="flex-1 py-2.5 rounded-lg text-white text-sm font-semibold bg-red-500 disabled:opacity-60"
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
