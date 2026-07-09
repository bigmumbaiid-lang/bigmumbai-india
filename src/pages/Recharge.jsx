import React, { useEffect, useState, useCallback } from 'react';
import axios from '../utils/axios';
import BottomNav from '../components/BottomNav';
import BackButton from '../components/BackButton';
import { useNavigate } from 'react-router-dom';
import { Check, X, AlertTriangle } from 'lucide-react';

const DEFAULT_AMOUNTS    = [100, 500, 1000, 2000, 5000, 10000, 20000, 50000];
const DEFAULT_LIMITS = {
    watchpays: { min: 100,  max: 80_000   },
    jazpays:   { min: 100,  max: 80_000   },
    bondpay:   { min: 100,  max: 80_000   },
    trx:       { min: 100,  max: 1_000_000 },
    usdt:      { min: 5000, max: 1_000_000 },
};
const HDR_GRAD       = 'linear-gradient(160deg, #d9ad82 0%, #b1835a 100%)';
const BRAND_C        = '#b1835a';
const BTN_C          = '#BA8D63';

/* ── Channels ── */
const CHANNELS = [
    { id: 'watchpays', label: 'Watch Pay',  sub: 'Gateway',      g1: '#8b5cf6', g2: '#6d28d9' },
    { id: 'jazpays',   label: 'Jaz Pay',    sub: 'Gateway',      g1: '#3b82f6', g2: '#1d4ed8' },
    { id: 'bondpay',   label: 'BondPay',    sub: 'Gateway',      g1: '#fb923c', g2: '#c2410c' },
    { id: 'trx',       label: 'TRX',        sub: 'TRON Network', g1: '#ef4444', g2: '#b91c1c' },
    { id: 'usdt',      label: 'USDT TRC20', sub: 'Tether',       g1: '#10b981', g2: '#047857' },
];

/* ── Channel icons ── */
const WatchSVG = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="6" width="20" height="13" rx="3" fill="white" opacity="0.9" />
        <circle cx="12" cy="12.5" r="2.8" fill="#8b5cf6" />
        <circle cx="12" cy="12.5" r="1.1" fill="white" />
        <rect x="8" y="3" width="8" height="3" rx="1.5" fill="white" opacity="0.45" />
    </svg>
);
const JazSVG = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="6" width="20" height="13" rx="3" fill="white" opacity="0.9" />
        <rect x="2" y="10.5" width="20" height="2.5" fill="#3b82f6" opacity="0.22" />
        <rect x="4" y="15" width="7" height="1.4" rx="0.7" fill="#3b82f6" opacity="0.55" />
        <rect x="19" y="14" width="2.5" height="2.5" rx="0.5" fill="#3b82f6" opacity="0.75" />
    </svg>
);
const BondSVG = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="6" width="20" height="13" rx="3" fill="white" opacity="0.9" />
        <circle cx="12" cy="12.5" r="3.2" fill="none" stroke="#c2410c" strokeWidth="1.6" opacity="0.9" />
        <path d="M10.4 12.6l1.1 1.1 2.1-2.3" stroke="#c2410c" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.95" />
    </svg>
);
const TrxSVG = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <polygon points="12,3 22,11 12,21 2,11" fill="white" opacity="0.3" />
        <polygon points="12,3 22,11 12,14 2,11" fill="white" opacity="0.95" />
    </svg>
);
const UsdtSVG = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="5" width="16" height="3.5" rx="1.75" fill="white" />
        <rect x="10.25" y="5" width="3.5" height="11.5" rx="1.75" fill="white" />
        <rect x="7.5" y="17.5" width="9" height="1.8" rx="0.9" fill="white" opacity="0.6" />
    </svg>
);
const ICONS = { watchpays: WatchSVG, jazpays: JazSVG, bondpay: BondSVG, trx: TrxSVG, usdt: UsdtSVG };

/* ── Modal config ── */
const MODAL_CFG = {
    success: {
        title: 'Success', Icon: Check,
        grad: 'linear-gradient(135deg, #34d399 0%, #059669 100%)',
        ring: '#86efac', shadow: 'rgba(5,150,105,0.35)',
    },
    error: {
        title: 'Something went wrong', Icon: X,
        grad: 'linear-gradient(135deg, #f87171 0%, #dc2626 100%)',
        ring: '#fca5a5', shadow: 'rgba(220,38,38,0.3)',
    },
    warning: {
        title: 'Heads up', Icon: AlertTriangle,
        grad: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
        ring: '#fde68a', shadow: 'rgba(217,119,6,0.3)',
    },
};

/* ══════════════════════════════════════════════════ */
export default function Recharge() {
    const navigate = useNavigate();

    const [money,      setMoney]     = useState(0);
    const [custom,     setCustom]    = useState('');
    const [channel,    setChannel]   = useState('watchpays');
    const [loading,    setLoading]   = useState(false);
    const [pageLoad,   setPageLoad]  = useState(true);
    const [modal,      setModal]     = useState(null);
    const [pending,    setPending]   = useState(null);
    const [depConfig,  setDepConfig] = useState({});

    const toast = useCallback((type, msg) => setModal({ type, msg, title: MODAL_CFG[type]?.title }), []);
    const clear  = useCallback(() => setModal(null), []);

    useEffect(() => {
        if (!modal || modal.type === 'error') return;
        const t = setTimeout(clear, 2400);
        return () => clearTimeout(t);
    }, [modal, clear]);

    useEffect(() => {
        (async () => {
            try {
                const [profileRes, configRes] = await Promise.all([
                    axios.post('/user/profile'),
                    axios.get('/deposit-config').catch(() => ({ data: { data: {} } })),
                ]);
                setMoney(profileRes.data.user?.money || 0);
                setDepConfig(configRes.data.data || {});
            } catch { toast('error', 'Failed to load balance'); }
            finally { setPageLoad(false); }
        })();
    }, [toast]);

    const amount   = Number(custom) || 0;
    const fmt      = v => Number(v || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

    // Apply channel order + filter hidden channels
    const orderedChannels = (() => {
        const order = depConfig?.channelOrder;
        const base  = (order?.length === CHANNELS.length ? order : CHANNELS.map(c => c.id))
            .map(id => CHANNELS.find(c => c.id === id))
            .filter(Boolean);
        return base.filter(c => depConfig?.[c.id]?.enabled !== false);
    })();

    const chCfg    = depConfig?.[channel] || {};
    const amounts  = chCfg.amounts?.length ? chCfg.amounts : DEFAULT_AMOUNTS;
    const minAmt   = chCfg.min  != null ? chCfg.min  : (DEFAULT_LIMITS[channel]?.min  ?? 100);
    const maxAmt   = chCfg.max  != null ? chCfg.max  : (DEFAULT_LIMITS[channel]?.max  ?? 1_000_000);

    // Reset channel selection if current channel was hidden
    useEffect(() => {
        if (orderedChannels.length && !orderedChannels.find(c => c.id === channel)) {
            setChannel(orderedChannels[0].id);
        }
    }, [orderedChannels.map(c => c.id).join(',')]); // eslint-disable-line

    const tooLow   = amount > 0 && amount < minAmt;
    const tooHigh  = amount > 0 && amount > maxAmt;
    const canPay   = amount >= minAmt && amount <= maxAmt;

    const payPath  = (ch, order) => ch === 'usdt' ? `/usdt-payment/${order._id}` : `/trx-payment/${order._id}`;
    const openTab  = (ch, order) => window.open(payPath(ch, order), '_blank');

    const submit = async () => {
        if (!canPay) return;
        setLoading(true);
        try {
            if (channel === 'usdt' || channel === 'trx') {
                // Open blank tab synchronously (before any await) so mobile browsers don't block it
                const tab = window.open('', '_blank');
                try {
                    const pr = await axios.get(`/${channel}/my-pending`);
                    if (pr.data.order) {
                        tab?.close();
                        setPending({ order: pr.data.order, channel });
                        setLoading(false);
                        return;
                    }
                    const r = await axios.post(`/${channel}/create-order`, { inrAmount: amount });
                    if (r.data.success) {
                        if (tab) tab.location.href = payPath(channel, r.data.order);
                        else window.open(payPath(channel, r.data.order), '_blank');
                    } else {
                        tab?.close();
                        toast('error', r.data.message || 'Failed to create order.');
                    }
                } catch (e) {
                    tab?.close();
                    throw e;
                }
            } else {
                const r   = await axios.post('/payment/create', { amount, channel });
                const url = r.data.payment_url;
                if (url) { const w = window.open(url, '_blank'); if (!w || w.closed) window.location.href = url; }
                else toast('error', 'No payment URL received.');
            }
        } catch (e) { toast('error', e.response?.data?.error || e.response?.data?.message || 'Payment failed. Try again.'); }
        finally     { setLoading(false); }
    };

    const continuePay = () => { const { order, channel: ch } = pending; setPending(null); openTab(ch, order); };
    const createNew   = async () => {
        const { order, channel: ch } = pending;
        setPending(null); setLoading(true);
        // Open blank tab synchronously before any await so mobile browsers allow it
        const tab = window.open('', '_blank');
        try {
            await axios.post(`/${ch}/cancel-order/${order._id}`);
            const r = await axios.post(`/${ch}/create-order`, { inrAmount: amount });
            if (r.data.success) {
                if (tab) tab.location.href = payPath(ch, r.data.order);
                else window.open(payPath(ch, r.data.order), '_blank');
            } else {
                tab?.close();
                toast('error', r.data.message || 'Failed.');
            }
        } catch (e) {
            tab?.close();
            toast('error', e.response?.data?.message || 'Failed.');
        }
        finally { setLoading(false); }
    };

    const mcfg = modal ? MODAL_CFG[modal.type] || MODAL_CFG.error : null;

    return (
        <div className="flex items-center justify-center bg-gray-50 min-h-screen" style={{ minHeight: '100dvh' }}>
            <div
                className="w-full lg:max-w-[400px] mx-auto h-screen flex flex-col overflow-hidden shadow-2xl border border-gray-300 bg-[#f7f8ff] relative"
                style={{ height: '100dvh' }}
            >
                {/* Plain white header */}
                <div className="flex-shrink-0">
                    <BackButton
                        label="Recharge"
                        rightLabel="Records"
                        rightTo="/recharge-records"
                    />
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>

                    <div className="px-4 pt-4 pb-6 space-y-4">

                        {/* Balance card */}
                        <div className="rounded-2xl p-5 relative overflow-hidden"
                            style={{ background: 'linear-gradient(135deg, #d4a96a 0%, #b8793c 55%, #96581e 100%)', minHeight: 120 }}>

                            {/* Decorative circles */}
                            <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
                            <div className="absolute top-6 right-14 w-16 h-16 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
                            <div className="absolute -bottom-6 -right-4 w-28 h-28 rounded-full" style={{ background: 'rgba(0,0,0,0.06)' }} />

                            {/* Shine strip */}
                            <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'rgba(255,255,255,0.25)' }} />

                            {/* Icon + label */}
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                                        <rect x="2" y="7" width="20" height="14" rx="3" stroke="white" strokeWidth="1.8" />
                                        <path d="M16 14a1 1 0 1 1 2 0 1 1 0 0 1-2 0z" fill="white" />
                                        <path d="M2 11h20" stroke="white" strokeWidth="1.8" />
                                    </svg>
                                </div>
                                <span className="text-white/80 text-sm font-medium">Balance</span>
                            </div>

                            {/* Amount */}
                            {pageLoad
                                ? <div className="h-8 w-40 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.2)' }} />
                                : <p className="text-white font-bold tracking-tight" style={{ fontSize: 26 }}>
                                    INR {Number(money || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </p>
                            }

                            {/* Card-style dots */}
                            <div className="absolute bottom-4 right-5 flex items-center gap-2.5" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 18, letterSpacing: 3 }}>
                                <span>••••</span>
                                <span>••••</span>
                            </div>
                        </div>

                        {/* ── Payment Method card ── */}
                        <div className="bg-white rounded-xl shadow-md overflow-hidden">
                            <div className="px-4 pt-3 pb-1">
                                <p className="text-xs font-medium text-gray-400 mb-2">Payment Method</p>
                            </div>

                            <div className="w-[90%] mx-auto border-b border-gray-100" />

                            {pageLoad ? (
                                // How many channels end up visible depends on config we
                                // haven't fetched yet, so this doesn't try to mimic
                                // individual cards — just a generic loading block sized
                                // to roughly where the grid will land.
                                <div className="p-4">
                                    <div className="h-[168px] w-full rounded-xl bg-gray-100 animate-pulse" />
                                </div>
                            ) : (
                            <div className="grid grid-cols-2 gap-0">
                                {orderedChannels.map((ch, i) => {
                                    const active    = channel === ch.id;
                                    const Icon      = ICONS[ch.id];
                                    // A lone trailing channel is centered in its own full-width row
                                    // (same card size as the rest) instead of leaving an empty gap.
                                    const isLastOdd = orderedChannels.length % 2 === 1 && i === orderedChannels.length - 1;
                                    const isRight   = !isLastOdd && i % 2 === 1;
                                    const isBottom  = i >= 2;
                                    const card = (
                                        <button
                                            onClick={() => setChannel(ch.id)}
                                            className={`flex flex-col items-center gap-1.5 py-3 px-3 transition-all active:scale-95 relative ${isLastOdd ? 'w-1/2' : 'w-full'}`}
                                            style={{
                                                background: active ? '#fdf6ee' : 'white',
                                                borderRight: isRight ? 'none' : '1px solid #f3f3f3',
                                            }}
                                        >
                                            {/* Icon badge */}
                                            <div
                                                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                                                style={{
                                                    background: `linear-gradient(135deg, ${ch.g1}, ${ch.g2})`,
                                                    boxShadow: active ? `0 3px 8px ${ch.g1}55` : `0 2px 6px ${ch.g1}30`,
                                                }}
                                            >
                                                <Icon />
                                            </div>

                                            <div className="text-center">
                                                <p className="text-xs font-semibold" style={{ color: active ? BRAND_C : '#1e2637' }}>
                                                    {ch.label}
                                                </p>
                                                <p style={{ fontSize: 10, color: active ? '#c4956a' : '#9ca3af' }}>
                                                    {ch.sub}
                                                </p>
                                            </div>

                                            {/* Active indicator dot */}
                                            {active && (
                                                <div
                                                    className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                                                    style={{ background: BRAND_C }}
                                                />
                                            )}
                                        </button>
                                    );
                                    return isLastOdd ? (
                                        <div key={ch.id} className="col-span-2 flex justify-start" style={{ borderTop: '1px solid #f3f3f3' }}>
                                            {card}
                                        </div>
                                    ) : (
                                        <div key={ch.id} style={{ borderTop: isBottom ? '1px solid #f3f3f3' : 'none' }}>
                                            {card}
                                        </div>
                                    );
                                })}
                            </div>
                            )}
                        </div>

                        {/* ── Amount card ── */}
                        <div className="bg-white rounded-xl shadow-md overflow-hidden">
                            <div className="px-4 pt-4 pb-4">
                                <p className="text-xs font-medium text-gray-400 mb-3">Recharge Amount (INR)</p>

                                {/* Amount input */}
                                <div className="flex items-center gap-1 pb-2 mb-4" style={{ borderBottom: `1.5px solid ${(tooLow || tooHigh) ? '#ef4444' : amount > 0 ? BRAND_C : '#e5e7eb'}` }}>
                                    <span className="text-2xl font-semibold" style={{ color: (tooLow || tooHigh) ? '#ef4444' : amount > 0 ? BRAND_C : '#d1d5db' }}>₹</span>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={custom}
                                        onChange={e => setCustom(e.target.value.replace(/[^0-9]/g, ''))}
                                        onKeyDown={e => e.key === 'Enter' && submit()}
                                        placeholder="0"
                                        disabled={pageLoad}
                                        className="flex-1 text-2xl font-semibold outline-none bg-transparent placeholder-gray-200"
                                        style={{ color: (tooLow || tooHigh) ? '#ef4444' : '#1e2637' }}
                                    />
                                    {custom && (
                                        <button
                                            onClick={() => setCustom('')}
                                            className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                                            style={{ background: '#f3f4f6' }}
                                        >
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                                                <path d="M6 6l12 12M18 6L6 18" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" />
                                            </svg>
                                        </button>
                                    )}
                                </div>

                                {/* Quick amounts */}
                                <div className="grid grid-cols-4 gap-2 mb-3">
                                    {amounts.map(amt => {
                                        const sel = amount === amt;
                                        return (
                                            <button
                                                key={amt}
                                                onClick={() => setCustom(String(amt))}
                                                className="py-2 text-sm rounded-lg transition-all active:scale-95"
                                                style={{
                                                    fontWeight: sel ? 600 : 400,
                                                    background: sel ? '#fdf6ee' : '#f9fafb',
                                                    color:      sel ? BRAND_C  : '#4b5563',
                                                    border:     sel ? `1.5px solid ${BRAND_C}` : '1.5px solid #f3f4f6',
                                                }}
                                            >
                                                {amt.toLocaleString('en-US')}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-400">
                                        ₹{minAmt} – ₹{maxAmt}
                                    </span>
                                    {tooLow  && <span className="text-xs font-medium" style={{ color: '#ef4444' }}>Amount too low</span>}
                                    {tooHigh && <span className="text-xs font-medium" style={{ color: '#ef4444' }}>Max ₹{maxAmt}</span>}
                                </div>
                            </div>

                        </div>

                        {/* Standalone recharge button */}
                        <button
                            onClick={submit}
                            disabled={loading || pageLoad}
                            className="w-full py-4 rounded-2xl text-white font-semibold shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                            style={{ background: HDR_GRAD }}
                        >
                            {loading ? (
                                <>
                                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                    Processing…
                                </>
                            ) : (
                                `Recharge${amount ? ` ₹${fmt(amount)}` : ''}`
                            )}
                        </button>

                    </div>
                </div>

                <BottomNav activeTab="recharge" onTabChange={tab => navigate(`/${tab}`)} />
            </div>

            {/* ── Outstanding order bottom sheet ── */}
            {pending && (() => {
                const { order, channel: ch } = pending;
                const isUsdt    = ch === 'usdt';
                const cryptoAmt = isUsdt ? order.expectedUsdtAmount : order.expectedTrxAmount;
                const symbol    = isUsdt ? 'USDT' : 'TRX';
                const minsLeft  = Math.max(0, Math.ceil((new Date(order.expiresAt) - Date.now()) / 60000));
                return (
                    <div
                        className="fixed inset-0 z-50 flex items-end justify-center animate-fadeIn"
                        style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)' }}
                        onClick={() => setPending(null)}
                    >
                        <div
                            className="w-full lg:max-w-[400px] bg-white rounded-t-3xl shadow-2xl px-4 pt-2 pb-8 animate-slideUp relative"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-5" />
                            <button
                                onClick={() => setPending(null)}
                                className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center"
                                style={{ background: '#f3f4f6' }}
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                    <path d="M6 6l12 12M18 6L6 18" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" />
                                </svg>
                            </button>

                            <div className="flex justify-center mb-4">
                                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                                    style={{ background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', boxShadow: '0 6px 18px rgba(251,191,36,0.3)' }}>
                                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="2" />
                                        <path d="M12 8v5m0 3h.01" stroke="white" strokeWidth="2" strokeLinecap="round" />
                                    </svg>
                                </div>
                            </div>

                            <p className="text-center font-semibold text-[#1e2637] text-base mb-1">Outstanding Order</p>
                            <p className="text-center text-gray-400 text-sm mb-4">
                                You have an active <span className="font-medium text-gray-600">{symbol}</span> order pending payment.
                            </p>

                            <div className="rounded-xl p-4 mb-4 space-y-2.5" style={{ background: '#fffbf2', border: '1px solid #f0e0b0' }}>
                                {[
                                    ['INR Amount',         `₹${fmt(order.inrAmount)}`],
                                    [`${symbol} to Send`,  `${parseFloat(Number(cryptoAmt || 0).toFixed(4))} ${symbol}`],
                                ].map(([k, v]) => (
                                    <div key={k} className="flex justify-between text-sm">
                                        <span className="text-gray-400">{k}</span>
                                        <span className="font-medium text-[#1e2637]">{v}</span>
                                    </div>
                                ))}
                                <div className="border-t border-[#f0e0b0] pt-2.5 flex justify-between text-sm">
                                    <span className="text-gray-400">Expires in</span>
                                    <span className="font-medium" style={{ color: minsLeft <= 5 ? '#ef4444' : '#10b981' }}>
                                        {minsLeft} min{minsLeft !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={createNew}
                                className="w-full py-3.5 rounded-xl text-white font-semibold text-sm mb-2.5 active:scale-[0.98] transition-transform"
                                style={{ background: HDR_GRAD, boxShadow: '0 4px 14px rgba(177,131,90,0.3)' }}
                            >Create New Order</button>
                            <button
                                onClick={continuePay}
                                className="w-full py-3 rounded-xl font-medium text-sm active:scale-[0.98] transition-transform"
                                style={{ background: '#f9fafb', color: '#4b5563', border: '1px solid #f3f4f6' }}
                            >Complete Previous Payment</button>
                        </div>
                    </div>
                );
            })()}

            {/* ── Alert modal ── */}
            {modal && mcfg && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center animate-fadeIn px-8"
                    style={{ background: 'rgba(15,15,20,0.45)', backdropFilter: 'blur(3px)' }}
                    onClick={clear}
                >
                    <div
                        className="relative bg-white rounded-3xl shadow-2xl px-7 py-7 flex flex-col items-center max-w-[300px] w-full animate-popIn overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Ambient glow behind icon */}
                        <div
                            className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full opacity-25 blur-2xl pointer-events-none"
                            style={{ background: mcfg.grad }}
                        />

                        {/* Icon badge */}
                        <div className="relative flex items-center justify-center mb-4">
                            <div className="absolute w-20 h-20 rounded-full" style={{ border: `2px solid ${mcfg.ring}` }} />
                            <div
                                className="relative w-16 h-16 rounded-full flex items-center justify-center animate-popIn"
                                style={{ background: mcfg.grad, boxShadow: `0 10px 24px ${mcfg.shadow}` }}
                            >
                                <mcfg.Icon size={28} className="text-white" strokeWidth={2.5} />
                            </div>
                        </div>

                        <p className="relative font-bold text-[#1e2637] text-[15px] text-center mb-1.5">{modal.title}</p>
                        {modal.msg && <p className="relative text-gray-400 text-[13px] text-center leading-relaxed">{modal.msg}</p>}

                        <button
                            onClick={clear}
                            className="relative mt-5 w-full py-3 rounded-2xl text-white text-sm font-semibold active:scale-95 transition-transform"
                            style={{ background: mcfg.grad, boxShadow: `0 8px 20px ${mcfg.shadow}` }}
                        >Got it</button>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
                @keyframes slideUp   { from{transform:translateY(100%)} to{transform:translateY(0)} }
                @keyframes popIn     { from{opacity:0;transform:scale(.9)} to{opacity:1;transform:scale(1)} }
                .animate-fadeIn    { animation:fadeIn  .18s ease-out; }
                .animate-slideUp   { animation:slideUp .3s cubic-bezier(.16,1,.3,1); }
                .animate-popIn     { animation:popIn   .25s cubic-bezier(.16,1,.3,1); }
                .animate-spin      { animation:spin .7s linear infinite; }
                @keyframes spin    { to{transform:rotate(360deg)} }
            `}</style>
        </div>
    );
}
