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
    { id: 'watchpays', label: 'WW PAY' },
    { id: 'jazpays',   label: 'JJ PAY' },
    { id: 'bondpay',   label: 'BB PAY' },
    { id: 'trx',       label: 'TRX'    },
    { id: 'usdt',      label: 'USDT TRC20' },
];

/* ── Small inline icons — TRX / USDT only, shown after the label ── */
// TRON's brand red, same fixed-color treatment as the Tether mark below —
// the gem silhouette stays, it's just no longer recolored to match the button.
const TrxSVG = ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <polygon points="12,3 22,11 12,21 2,11" fill="#EF0027" />
        <polygon points="12,3 22,11 12,14 2,11" fill="#ff4d5e" />
    </svg>
);
// Tether's own brand mark (green disc, white T with the signature ring
// through the stem) — kept in its true colors rather than recoloring to match
// the button state, same as a Visa/Mastercard mark would stay put on any button.
const UsdtSVG = ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="11" fill="#26A17B" />
        <rect x="7.2" y="6.2" width="9.6" height="3.1" fill="#fff" />
        <rect x="10.4" y="6.2" width="3.2" height="11.6" fill="#fff" />
        <ellipse cx="12" cy="12.3" rx="5.6" ry="1.9" stroke="#fff" strokeWidth="1.3" fill="none" />
    </svg>
);
const ICONS = { trx: TrxSVG, usdt: UsdtSVG };

/* ── Modal config ── */
const MODAL_CFG = {
    success: {
        title: 'Success', Icon: Check,
        grad: 'linear-gradient(135deg, #34d399 0%, #059669 100%)',
        ring: '#86efac', shadow: 'rgba(5,150,105,0.35)',
    },
    error: {
        title: 'Please try again', Icon: X,
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

    // title = the main line (what's wrong); msg = the helpful instruction (what to do).
    const toast = useCallback((type, msg, title) => setModal({ type, msg, title: title ?? MODAL_CFG[type]?.title }), []);
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
            } catch { toast('error', 'We couldn’t load your latest balance. Please try again in a moment.', 'Couldn’t refresh balance'); }
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

    // Paint a branded loading screen into the freshly-opened blank tab so the user
    // never stares at a white about:blank while create-order is in flight.
    const writeLoadingTab = (tab, ch) => {
        if (!tab) return;

        // TRX — glossy 3D TRON coin with orbiting sparks, rings & shimmer.
        const trxHtml = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Preparing payment…</title><style>
            *{box-sizing:border-box}
            html,body{height:100%;margin:0}
            body{font-family:'Inter',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;display:flex;justify-content:center;background:linear-gradient(to bottom,#f3f4f6 0%,#e5e7eb 100%)}
            .frame{position:relative;width:100%;min-height:100vh;min-height:100dvh;overflow:hidden;background:linear-gradient(165deg,#ffffff 0%,#f6f7f9 100%);display:flex;flex-direction:column;align-items:center;justify-content:center}
            @media(min-width:1024px){.frame{max-width:400px;border-left:1px solid rgba(0,0,0,.06);border-right:1px solid rgba(0,0,0,.06);box-shadow:0 0 55px rgba(0,0,0,.10)}}
            .amb{position:absolute;border-radius:50%;filter:blur(60px);pointer-events:none}
            .a1{width:240px;height:240px;top:-70px;left:-70px;background:#EF0027;opacity:.10;animation:drift 9s ease-in-out infinite}
            .a2{width:220px;height:220px;bottom:60px;right:-80px;background:#38bdf8;opacity:.10;animation:drift 11s ease-in-out infinite reverse}
            .a3{width:200px;height:200px;bottom:-80px;left:10px;background:#f59e0b;opacity:.08;animation:drift 13s ease-in-out infinite}
            .wave{position:absolute;background:#edeff3;opacity:.75}
            .w1{width:180%;height:40%;top:-17%;right:-40%;border-radius:0 0 55% 45%/0 0 100% 100%;transform:rotate(-6deg)}
            .w2{width:180%;height:38%;bottom:-17%;left:-40%;border-radius:48% 52% 0 0/100% 100% 0 0}
            .stage{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center}
            .badge{position:relative;width:212px;height:212px;display:flex;align-items:center;justify-content:center;margin-bottom:40px}
            .halo{position:absolute;width:202px;height:202px;border-radius:50%;background:radial-gradient(circle,#EF0027,transparent 66%);opacity:.3;filter:blur(18px);animation:halo 2.6s ease-in-out infinite}
            .ringDash{position:absolute;width:198px;height:198px;border-radius:50%;border:2px dashed rgba(239,0,39,.30);animation:spin 15s linear infinite}
            .comet{position:absolute;width:172px;height:172px;border-radius:50%;background:conic-gradient(from 0deg,transparent 0 70%,#ff3b3b 90%,transparent);-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 4px),#000 0);mask:radial-gradient(farthest-side,transparent calc(100% - 4px),#000 0);animation:spin 2.2s linear infinite}
            .orbit{position:absolute;width:208px;height:208px;animation:spin 7s linear infinite}
            .orbit b{position:absolute;top:-4px;left:50%;width:9px;height:9px;border-radius:50%;background:#ff5a6a;box-shadow:0 0 12px 2px rgba(239,0,39,.75);transform:translateX(-50%)}
            .orbit2{position:absolute;width:178px;height:178px;animation:spin 5s linear infinite reverse}
            .orbit2 b{position:absolute;top:-3px;left:50%;width:6px;height:6px;border-radius:50%;background:#fca5a5;box-shadow:0 0 9px 1px rgba(239,0,39,.7);transform:translateX(-50%)}
            .shadow{position:absolute;bottom:22px;left:50%;width:98px;height:20px;border-radius:50%;background:rgba(60,0,10,.5);filter:blur(12px);transform:translateX(-50%);animation:shadowPulse 3.6s ease-in-out infinite}
            .coin{position:relative;width:132px;height:132px;border-radius:50%;overflow:hidden;background:radial-gradient(circle at 38% 30%,#ffffff 0%,#ffdede 16%,#f24b5f 54%,#EF0027 78%,#b30020 100%);box-shadow:0 24px 42px -12px rgba(200,0,25,.5),inset 0 -12px 24px rgba(140,0,15,.45),inset 0 10px 18px rgba(255,255,255,.55);animation:float 3.6s ease-in-out infinite;display:flex;align-items:center;justify-content:center}
            .gloss{position:absolute;top:11%;left:17%;width:56%;height:40%;border-radius:50%;background:radial-gradient(ellipse at center,rgba(255,255,255,.9),rgba(255,255,255,0) 70%);filter:blur(2px)}
            .shine{position:absolute;top:-12%;left:-75%;width:55%;height:124%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.6),transparent);transform:skewX(-16deg);animation:shine 3.4s ease-in-out infinite}
            .emblem{position:relative;z-index:3}
            .title{font-size:30px;line-height:1.14;font-weight:800;letter-spacing:-.5px;text-align:center;margin:0;padding:0 24px;background:linear-gradient(90deg,#0f172a 25%,#64748b 50%,#0f172a 75%);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:sheen 3.2s linear infinite}
            .sub{color:#64748b;font-size:15px;font-weight:500;text-align:center;margin:14px 0 0;padding:0 28px}
            .bar{position:relative;width:160px;height:5px;border-radius:9999px;background:rgba(239,0,39,.12);overflow:hidden;margin-top:30px}
            .bar i{position:absolute;top:0;left:0;height:100%;width:42%;border-radius:9999px;background:linear-gradient(90deg,#ff6b6b,#EF0027);animation:load 1.3s cubic-bezier(.65,0,.35,1) infinite}
            @keyframes spin{to{transform:rotate(360deg)}}
            @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
            @keyframes halo{0%,100%{opacity:.22;transform:scale(1)}50%{opacity:.42;transform:scale(1.1)}}
            @keyframes shine{0%{left:-75%}55%,100%{left:150%}}
            @keyframes shadowPulse{0%,100%{opacity:.5;transform:translateX(-50%) scale(1)}50%{opacity:.3;transform:translateX(-50%) scale(.8)}}
            @keyframes sheen{to{background-position:-200% 0}}
            @keyframes load{0%{left:-42%}100%{left:100%}}
            @keyframes drift{0%,100%{transform:translate(0,0)}50%{transform:translate(16px,20px)}}
            @media(prefers-reduced-motion:reduce){.halo,.ringDash,.comet,.orbit,.orbit2,.coin,.shine,.shadow,.title,.bar i,.amb{animation:none!important}}
        </style></head><body><div class="frame">
        <div class="amb a1"></div><div class="amb a2"></div><div class="amb a3"></div>
        <div class="wave w1"></div><div class="wave w2"></div>
        <div class="stage">
        <div class="badge">
            <div class="halo"></div><div class="ringDash"></div><div class="comet"></div>
            <div class="orbit"><b></b></div><div class="orbit2"><b></b></div>
            <div class="shadow"></div>
            <div class="coin"><div class="gloss"></div><div class="shine"></div>
            <svg class="emblem" width="62" height="62" viewBox="0 0 32 32" fill="none" stroke="#a50f1b" stroke-width="0.7" stroke-linejoin="round"><path d="M21.932 9.913L7.5 7.257l7.595 19.112 10.583-12.865-3.746-3.591zm-.232 1.17l2.208 2.117-6.038 1.093 3.83-3.21zm-5.142 3.028l-6.364-5.278 10.402 1.914-4.038 3.364zm-.44 1.078l-1.087 8.98-5.115-12.868 6.202 3.888zm1.348.427l5.208-.943-5.997 7.29.789-6.347z"/></svg>
            </div>
        </div>
        <p class="title">Preparing your<br>secure payment...</p>
        <p class="sub">Setting up your TRON network deposit address</p>
        <div class="bar"><i></i></div>
        </div>
        </div></body></html>`;

        // USDT — glossy 3D Tether coin with orbiting sparks, rings & shimmer.
        const usdtHtml = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Preparing payment…</title><style>
            *{box-sizing:border-box}
            html,body{height:100%;margin:0}
            body{font-family:'Inter',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;display:flex;justify-content:center;background:linear-gradient(to bottom,#f3f4f6 0%,#e5e7eb 100%)}
            .frame{position:relative;width:100%;min-height:100vh;min-height:100dvh;overflow:hidden;background:linear-gradient(165deg,#ffffff 0%,#f6f7f9 100%);display:flex;flex-direction:column;align-items:center;justify-content:center}
            @media(min-width:1024px){.frame{max-width:400px;border-left:1px solid rgba(0,0,0,.06);border-right:1px solid rgba(0,0,0,.06);box-shadow:0 0 55px rgba(0,0,0,.10)}}
            .amb{position:absolute;border-radius:50%;filter:blur(60px);pointer-events:none}
            .a1{width:240px;height:240px;top:-70px;left:-70px;background:#26a17b;opacity:.11;animation:drift 9s ease-in-out infinite}
            .a2{width:220px;height:220px;bottom:60px;right:-80px;background:#38bdf8;opacity:.10;animation:drift 11s ease-in-out infinite reverse}
            .a3{width:200px;height:200px;bottom:-80px;left:10px;background:#f59e0b;opacity:.08;animation:drift 13s ease-in-out infinite}
            .wave{position:absolute;background:#edeff3;opacity:.75}
            .w1{width:180%;height:40%;top:-17%;right:-40%;border-radius:0 0 55% 45%/0 0 100% 100%;transform:rotate(-6deg)}
            .w2{width:180%;height:38%;bottom:-17%;left:-40%;border-radius:48% 52% 0 0/100% 100% 0 0}
            .stage{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center}
            .badge{position:relative;width:212px;height:212px;display:flex;align-items:center;justify-content:center;margin-bottom:40px}
            .halo{position:absolute;width:202px;height:202px;border-radius:50%;background:radial-gradient(circle,#26a17b,transparent 66%);opacity:.3;filter:blur(18px);animation:halo 2.6s ease-in-out infinite}
            .ringDash{position:absolute;width:198px;height:198px;border-radius:50%;border:2px dashed rgba(38,161,123,.32);animation:spin 15s linear infinite}
            .comet{position:absolute;width:172px;height:172px;border-radius:50%;background:conic-gradient(from 0deg,transparent 0 70%,#34d399 90%,transparent);-webkit-mask:radial-gradient(farthest-side,transparent calc(100% - 4px),#000 0);mask:radial-gradient(farthest-side,transparent calc(100% - 4px),#000 0);animation:spin 2.2s linear infinite}
            .orbit{position:absolute;width:208px;height:208px;animation:spin 7s linear infinite}
            .orbit b{position:absolute;top:-4px;left:50%;width:9px;height:9px;border-radius:50%;background:#34d399;box-shadow:0 0 12px 2px rgba(38,161,123,.75);transform:translateX(-50%)}
            .orbit2{position:absolute;width:178px;height:178px;animation:spin 5s linear infinite reverse}
            .orbit2 b{position:absolute;top:-3px;left:50%;width:6px;height:6px;border-radius:50%;background:#6ee7b7;box-shadow:0 0 9px 1px rgba(38,161,123,.7);transform:translateX(-50%)}
            .shadow{position:absolute;bottom:22px;left:50%;width:98px;height:20px;border-radius:50%;background:rgba(6,50,38,.5);filter:blur(12px);transform:translateX(-50%);animation:shadowPulse 3.6s ease-in-out infinite}
            .coin{position:relative;width:132px;height:132px;border-radius:50%;overflow:hidden;background:radial-gradient(circle at 38% 30%,#ffffff 0%,#d6f5ea 16%,#3fc79e 54%,#26a17b 78%,#1a7a5e 100%);box-shadow:0 24px 42px -12px rgba(20,120,90,.5),inset 0 -12px 24px rgba(10,70,52,.45),inset 0 10px 18px rgba(255,255,255,.55);animation:float 3.6s ease-in-out infinite;display:flex;align-items:center;justify-content:center}
            .gloss{position:absolute;top:11%;left:17%;width:56%;height:40%;border-radius:50%;background:radial-gradient(ellipse at center,rgba(255,255,255,.9),rgba(255,255,255,0) 70%);filter:blur(2px)}
            .shine{position:absolute;top:-12%;left:-75%;width:55%;height:124%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.6),transparent);transform:skewX(-16deg);animation:shine 3.4s ease-in-out infinite}
            .emblem{position:relative;z-index:3}
            .title{font-size:30px;line-height:1.14;font-weight:800;letter-spacing:-.5px;text-align:center;margin:0;padding:0 24px;background:linear-gradient(90deg,#0f172a 25%,#64748b 50%,#0f172a 75%);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:sheen 3.2s linear infinite}
            .sub{color:#64748b;font-size:15px;font-weight:500;text-align:center;margin:14px 0 0;padding:0 28px}
            .bar{position:relative;width:160px;height:5px;border-radius:9999px;background:rgba(38,161,123,.14);overflow:hidden;margin-top:30px}
            .bar i{position:absolute;top:0;left:0;height:100%;width:42%;border-radius:9999px;background:linear-gradient(90deg,#34d399,#26a17b);animation:load 1.3s cubic-bezier(.65,0,.35,1) infinite}
            @keyframes spin{to{transform:rotate(360deg)}}
            @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
            @keyframes halo{0%,100%{opacity:.22;transform:scale(1)}50%{opacity:.42;transform:scale(1.1)}}
            @keyframes shine{0%{left:-75%}55%,100%{left:150%}}
            @keyframes shadowPulse{0%,100%{opacity:.5;transform:translateX(-50%) scale(1)}50%{opacity:.3;transform:translateX(-50%) scale(.8)}}
            @keyframes sheen{to{background-position:-200% 0}}
            @keyframes load{0%{left:-42%}100%{left:100%}}
            @keyframes drift{0%,100%{transform:translate(0,0)}50%{transform:translate(16px,20px)}}
            @media(prefers-reduced-motion:reduce){.halo,.ringDash,.comet,.orbit,.orbit2,.coin,.shine,.shadow,.title,.bar i,.amb{animation:none!important}}
        </style></head><body><div class="frame">
        <div class="amb a1"></div><div class="amb a2"></div><div class="amb a3"></div>
        <div class="wave w1"></div><div class="wave w2"></div>
        <div class="stage">
        <div class="badge">
            <div class="halo"></div><div class="ringDash"></div><div class="comet"></div>
            <div class="orbit"><b></b></div><div class="orbit2"><b></b></div>
            <div class="shadow"></div>
            <div class="coin"><div class="gloss"></div><div class="shine"></div>
            <svg class="emblem" width="60" height="60" viewBox="0 0 100 100" fill="none"><rect x="12" y="14" width="76" height="20" rx="10" fill="#fff" opacity="0.95"/><rect x="40" y="14" width="20" height="58" rx="10" fill="#fff" opacity="0.95"/><rect x="24" y="57" width="52" height="11" rx="5.5" fill="#fff" opacity="0.6"/></svg>
            </div>
        </div>
        <p class="title">Preparing your<br>secure payment...</p>
        <p class="sub">Setting up your TRC20 network deposit address</p>
        <div class="bar"><i></i></div>
        </div>
        </div></body></html>`;

        try {
            tab.document.write(ch === 'usdt' ? usdtHtml : trxHtml);
            tab.document.close();
        } catch { /* cross-origin/blocked — safe to ignore */ }
    };

    const submit = async () => {
        if (!canPay) {
            if (!amount || amount <= 0) {
                toast('warning', 'Enter or tap a quick amount below to continue.', 'Enter a recharge amount');
            } else if (tooLow) {
                toast('warning', `The minimum recharge is ₹${minAmt.toLocaleString('en-IN')}. Please enter a higher amount.`, 'Amount is below the minimum');
            } else if (tooHigh) {
                toast('warning', `The maximum recharge is ₹${maxAmt.toLocaleString('en-IN')}. Please enter a lower amount.`, 'Amount is above the maximum');
            } else {
                toast('warning', `Please enter an amount between ₹${minAmt.toLocaleString('en-IN')} and ₹${maxAmt.toLocaleString('en-IN')}.`, 'Check the amount');
            }
            return;
        }
        setLoading(true);
        try {
            if (channel === 'usdt' || channel === 'trx') {
                // Open blank tab synchronously (before any await) so mobile browsers don't block it
                const tab = window.open('', '_blank');
                writeLoadingTab(tab, channel);
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
                        toast('error', r.data.message || 'We couldn’t set up your deposit just now. Please try again in a moment.', 'Deposit couldn’t start');
                    }
                } catch (e) {
                    tab?.close();
                    throw e;
                }
            } else {
                const r   = await axios.post('/payment/create', { amount, channel });
                const url = r.data.payment_url;
                if (url) { const w = window.open(url, '_blank'); if (!w || w.closed) window.location.href = url; }
                else toast('error', 'We couldn’t open the payment page. Please try again.', 'Payment couldn’t start');
            }
        } catch (e) { toast('error', e.response?.data?.error || e.response?.data?.message || 'Please check your internet connection and try again.', 'Payment couldn’t start'); }
        finally     { setLoading(false); }
    };

    const continuePay = () => { const { order, channel: ch } = pending; setPending(null); openTab(ch, order); };
    const createNew   = async () => {
        const { order, channel: ch } = pending;
        setPending(null); setLoading(true);
        // Open blank tab synchronously before any await so mobile browsers allow it
        const tab = window.open('', '_blank');
        writeLoadingTab(tab, ch);
        try {
            await axios.post(`/${ch}/cancel-order/${order._id}`);
            const r = await axios.post(`/${ch}/create-order`, { inrAmount: amount });
            if (r.data.success) {
                if (tab) tab.location.href = payPath(ch, r.data.order);
                else window.open(payPath(ch, r.data.order), '_blank');
            } else {
                tab?.close();
                toast('error', r.data.message || 'We couldn’t set up your deposit just now. Please try again in a moment.', 'Deposit couldn’t start');
            }
        } catch (e) {
            tab?.close();
            toast('error', e.response?.data?.message || 'Please check your internet connection and try again.', 'Payment couldn’t start');
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
                                // Mirrors the common 5-channel layout (2x2 grid + one
                                // trailing half-width card) so the skeleton doesn't jump
                                // around once the real channels land.
                                <div className="grid grid-cols-2 gap-3 p-4">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} className="h-[52px] rounded-xl bg-gray-100 animate-pulse" />
                                    ))}
                                    <div className="col-span-2 grid grid-cols-2 gap-3">
                                        <div className="h-[52px] rounded-xl bg-gray-100 animate-pulse" />
                                        <div />
                                    </div>
                                </div>
                            ) : (
                            <div className="grid grid-cols-2 gap-3 p-4">
                                {orderedChannels.map((ch, i) => {
                                    const active    = channel === ch.id;
                                    const Icon      = ICONS[ch.id];
                                    // A lone trailing channel spans both columns but keeps
                                    // half width, centered, instead of stretching full-width.
                                    const isLastOdd = orderedChannels.length % 2 === 1 && i === orderedChannels.length - 1;
                                    const card = (
                                        <button
                                            onClick={() => setChannel(ch.id)}
                                            className="w-full flex items-center justify-center gap-1.5 py-3.5 rounded-xl transition-all active:scale-95"
                                            style={{ background: active ? HDR_GRAD : '#f4f4fa' }}
                                        >
                                            <span className="text-sm font-semibold" style={{ color: active ? '#fff' : '#6b7280' }}>
                                                {ch.label}
                                            </span>
                                            {Icon && <Icon size={14} color={active ? '#fff' : '#9ca3af'} />}
                                        </button>
                                    );
                                    return isLastOdd ? (
                                        // Nested grid with the same columns/gap as the parent, so this
                                        // button's width is pixel-identical to a real column above it —
                                        // `w-1/2` of a col-span-2 flex box would measure half of
                                        // (column + gap + column), which is wider than one real column.
                                        <div key={ch.id} className="col-span-2 grid grid-cols-2 gap-3">
                                            {card}
                                            <div />
                                        </div>
                                    ) : (
                                        <div key={ch.id}>{card}</div>
                                    );
                                })}
                            </div>
                            )}
                        </div>

                        {/* ── Amount card ── */}
                        <div className="bg-white rounded-xl shadow-md overflow-hidden">
                            <div className="px-4 pt-4 pb-4">
                                <p className="text-xs font-medium text-gray-400 mb-3">Recharge Amount (INR)</p>

                                {pageLoad ? (
                                    // Quick amounts depend on the deposit config we haven't
                                    // fetched yet, so mirror the real layout's shape (input
                                    // row + 8-pill grid + footer line) with pulse blocks.
                                    <>
                                        <div className="flex items-center gap-1 pb-2 mb-4" style={{ borderBottom: '1.5px solid #e5e7eb' }}>
                                            <div className="h-7 w-24 rounded-md bg-gray-100 animate-pulse" />
                                        </div>
                                        <div className="grid grid-cols-4 gap-2 mb-3">
                                            {Array.from({ length: 8 }).map((_, i) => (
                                                <div key={i} className="h-9 rounded-lg bg-gray-100 animate-pulse" />
                                            ))}
                                        </div>
                                        <div className="h-3 w-28 rounded bg-gray-100 animate-pulse" />
                                    </>
                                ) : (
                                <>
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
                                </>
                                )}
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
