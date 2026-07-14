import React, { useEffect, useState } from 'react';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../utils/axios';

import openedTreasure from '../assets/openedTreasure.png';
import closedTreasure from '../assets/closedTreasure.png';
import treasureBg from '../assets/treasureBg.png';

// Load avatars (pf1.jpg … pf26.jpg) from assets via webpack's require.context
const avatarContext = require.context('../assets', false, /pf\d+\.jpg$/);
const avatarModules = avatarContext.keys().reduce((acc, key) => {
    acc[key.replace('./', '')] = avatarContext(key);
    return acc;
}, {});

// "pf7.jpg" → bundled URL, or null if there's no match (caller falls back)
const resolveAvatar = (img) => {
    if (!img) return null;
    const n = String(img).match(/\d+/)?.[0];
    if (!n) return null;
    const mod = avatarModules[`pf${n}.jpg`];
    return mod?.default || mod || null;
};

/* -------------------------------------------------------------------------- */
/*  Modal — replaces react-hot-toast. One component, three variants.          */
/* -------------------------------------------------------------------------- */

const VARIANTS = {
    success: {
        ring: 'from-[#ffd86b] to-[#f5a623]',
        iconBg: 'bg-gradient-to-br from-[#ffd86b] to-[#f5a623]',
        accent: 'text-[#e31e2c]',
        icon: (
            <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
            </svg>
        ),
    },
    error: {
        ring: 'from-[#ff6b6b] to-[#e31e2c]',
        iconBg: 'bg-gradient-to-br from-[#ff6b6b] to-[#e31e2c]',
        accent: 'text-[#e31e2c]',
        icon: (
            <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
            </svg>
        ),
    },
    info: {
        ring: 'from-[#7aa7ff] to-[#3b6fe0]',
        iconBg: 'bg-gradient-to-br from-[#7aa7ff] to-[#3b6fe0]',
        accent: 'text-[#3b6fe0]',
        icon: (
            <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 16v-5M12 8h.01" />
                <circle cx="12" cy="12" r="9" />
            </svg>
        ),
    },
};

function Modal({ open, variant = 'info', title, message, actionLabel = 'Got it', onAction, onClose }) {
    const v = VARIANTS[variant] ?? VARIANTS.info;

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-50 flex items-center justify-center px-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    {/* backdrop */}
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

                    {/* card */}
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        className="relative w-full max-w-[320px] rounded-3xl bg-white px-7 pb-7 pt-12 text-center shadow-2xl"
                        initial={{ scale: 0.85, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, y: 10, opacity: 0 }}
                        transition={{ type: 'spring', damping: 22, stiffness: 320 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* floating icon badge */}
                        <motion.div
                            className={`absolute -top-8 left-1/2 -translate-x-1/2 flex h-16 w-16 items-center justify-center rounded-full shadow-lg ring-4 ring-white ${v.iconBg}`}
                            initial={{ scale: 0, rotate: -30 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', damping: 12, stiffness: 240, delay: 0.08 }}
                        >
                            {v.icon}
                        </motion.div>

                        {/* sparkles for the celebratory moment */}
                        {variant === 'success' && (
                            <div className="pointer-events-none absolute inset-x-0 -top-2 flex justify-center gap-6">
                                {[0, 1, 2].map((i) => (
                                    <motion.span
                                        key={i}
                                        className="text-lg"
                                        initial={{ opacity: 0, y: 0, scale: 0.5 }}
                                        animate={{ opacity: [0, 1, 0], y: -18, scale: 1 }}
                                        transition={{ duration: 1.1, delay: 0.2 + i * 0.12, repeat: Infinity, repeatDelay: 1.4 }}
                                    >
                                        ✨
                                    </motion.span>
                                ))}
                            </div>
                        )}

                        {title && (
                            <h3 className="text-[19px] font-bold text-gray-900">{title}</h3>
                        )}
                        {message && (
                            <p className="mt-2 text-[15px] leading-relaxed text-gray-600">{message}</p>
                        )}

                        <button
                            className={`mt-6 w-full rounded-2xl bg-gradient-to-r ${v.ring} py-3.5 text-[16px] font-semibold text-white shadow-md transition-transform active:scale-[0.97]`}
                            onClick={onAction ?? onClose}
                        >
                            {actionLabel}
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/* -------------------------------------------------------------------------- */
/*  GiftClaim                                                                  */
/* -------------------------------------------------------------------------- */

function GiftClaim() {
    const navigate = useNavigate();
    const { giftCode } = useParams();

    const [loading, setLoading] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isAlreadyClaimed, setIsAlreadyClaimed] = useState(false);
    const [recentClaims, setRecentClaims] = useState([]);
    const [giftAmount, setGiftAmount] = useState(0);
    const [isInvalid, setIsInvalid] = useState(false);

    // single source of truth for the modal
    const [modal, setModal] = useState({ open: false });
    const closeModal = () => setModal((m) => ({ ...m, open: false }));

    const fetchGift = async () => {
        try {
            const response = await axios.get(`/gifts/${giftCode}`);
            setIsLoggedIn(response.data.isLoggedIn);
            setIsAlreadyClaimed(response.data.alreadyClaimed);
            setRecentClaims(response.data.recentClaims ?? []);
            setGiftAmount(response.data.gift?.amount ?? 0);
            setIsInvalid(false);
        } catch (error) {
            console.error(error);
            setIsInvalid(true);
        }
    };

    const getCash = async () => {
        if (loading) return;

        if (!isLoggedIn) {
            setModal({
                open: true,
                variant: 'info',
                title: 'Log in to continue',
                message: 'Sign in to your account to claim this reward.',
                actionLabel: 'Log in',
                onAction: () => navigate('/login'),
            });
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`/gifts/${giftCode}`);
            await fetchGift();
            setModal({
                open: true,
                variant: 'success',
                title: 'Congratulations!',
                message: response.data?.message || `You received ₹${giftAmount}.`,
                actionLabel: 'Awesome',
            });
        } catch (error) {
            setModal({
                open: true,
                variant: 'error',
                title: 'Couldn\'t claim this gift',
                message:
                    error.response?.data?.message ||
                    'Something went wrong. Please try again in a moment.',
                actionLabel: 'Close',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (giftCode) fetchGift();
    }, [giftCode]);

    const formatTime = (value) => {
        if (!value) return '';
        return new Date(value)
            .toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
            })
            .replace(/\//g, '-')
            .replace(',', '');
    };

    // Deterministic sparkle field around the chest (stable across renders).
    const sparkles = React.useMemo(
        () =>
            Array.from({ length: 14 }, (_, i) => ({
                id: i,
                left: `${8 + (i * 61) % 84}%`,
                top: `${12 + (i * 37) % 70}%`,
                size: 5 + (i % 4) * 3,
                delay: (i % 7) * 0.35,
                duration: 2 + (i % 5) * 0.4,
            })),
        []
    );

    return (
        <div className="min-h-screen w-full flex justify-center">
            <div
                className="relative w-full max-w-[430px] min-h-screen bg-[#e31e2c] bg-no-repeat shadow-2xl"
                style={{
                    backgroundImage: `url(${treasureBg})`,
                    backgroundSize: '100% auto',
                    backgroundPosition: 'top center',
                }}
            >
                {/* soft red vignette so text stays legible over the artwork */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-[#e31e2c]/10 to-[#c4141f]" />

                {/* Header — sticks to the top of the viewport while scrolling */}
                <header className="sticky top-0 z-30 h-14 px-3 flex items-center text-white
                                   bg-gradient-to-r from-[#e0b184] via-[#c9975f] to-[#a97640]
                                   backdrop-blur-md shadow-md">
                    <button
                        onClick={() => navigate('/profile')}
                        className="flex items-center justify-center h-9 w-9 rounded-full
                                   transition-colors hover:bg-white/15 active:bg-white/25"
                        aria-label="Go back"
                    >
                        <ArrowBackIosIcon fontSize="small" />
                    </button>
                    <span className="ml-1.5 text-[17px] font-semibold tracking-wide drop-shadow-sm">
                        Financial assistance
                    </span>
                </header>

                {/* Treasure */}
                <div className="relative h-[280px] flex items-center justify-center overflow-hidden">
                    {/* pulsing golden halo */}
                    <motion.div
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                                   w-[300px] h-[300px] rounded-full"
                        style={{
                            background:
                                'radial-gradient(circle, rgba(255,214,102,0.55) 0%, rgba(255,170,60,0.28) 38%, rgba(255,170,60,0) 68%)',
                        }}
                        animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                    />

                    {/* slow rotating light rays (hidden once claimed) */}
                    {!isAlreadyClaimed && !isInvalid && (
                        <motion.div
                            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] h-[360px]"
                            style={{
                                background:
                                    'conic-gradient(from 0deg, rgba(255,255,255,0.18) 0deg, transparent 22deg, rgba(255,255,255,0.14) 44deg, transparent 66deg, rgba(255,255,255,0.18) 88deg, transparent 110deg, rgba(255,255,255,0.14) 132deg, transparent 154deg, rgba(255,255,255,0.18) 176deg, transparent 198deg, rgba(255,255,255,0.14) 220deg, transparent 242deg, rgba(255,255,255,0.18) 264deg, transparent 286deg, rgba(255,255,255,0.14) 308deg, transparent 330deg, rgba(255,255,255,0.18) 352deg)',
                                maskImage: 'radial-gradient(circle, black 30%, transparent 70%)',
                                WebkitMaskImage: 'radial-gradient(circle, black 30%, transparent 70%)',
                            }}
                            animate={{ rotate: 360 }}
                            transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
                        />
                    )}

                    {/* floating sparkles */}
                    {sparkles.map((s) => (
                        <motion.span
                            key={s.id}
                            className="absolute rounded-full bg-white"
                            style={{
                                left: s.left,
                                top: s.top,
                                width: s.size,
                                height: s.size,
                                boxShadow: '0 0 8px 2px rgba(255,236,170,0.9)',
                            }}
                            animate={{ opacity: [0, 1, 0], scale: [0.4, 1, 0.4], y: [0, -14, 0] }}
                            transition={{
                                duration: s.duration,
                                repeat: Infinity,
                                delay: s.delay,
                                ease: 'easeInOut',
                            }}
                        />
                    ))}

                    {/* the chest */}
                    <div className="absolute left-1/2 top-[42%] -translate-x-1/2 w-[38%] max-w-[190px] z-10">
                        <motion.div
                            animate={
                                isAlreadyClaimed
                                    ? { y: [0, -4, 0], rotate: [0, 1.5, 0, -1.5, 0] }
                                    : { y: [0, -12, 0] }
                            }
                            transition={{
                                duration: isAlreadyClaimed ? 5 : 2.6,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            }}
                        >
                            <motion.img
                                src={isAlreadyClaimed ? openedTreasure : closedTreasure}
                                alt={isAlreadyClaimed ? 'Opened treasure chest' : 'Closed treasure chest'}
                                className="w-full h-auto"
                                style={{ filter: 'drop-shadow(0 18px 26px rgba(120,30,0,0.55))' }}
                                draggable={false}
                                initial={{ scale: 0.6, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', damping: 14, stiffness: 180 }}
                            />
                        </motion.div>
                    </div>
                </div>

                {/* Content */}
                <div className="-mt-6 pb-16 px-5 relative z-10">

                    {isInvalid && (
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/95 backdrop-blur rounded-3xl px-6 py-6 text-center shadow-2xl mx-auto max-w-[340px]"
                        >
                            <p className="text-[#e31e2c] font-semibold text-[17px] leading-tight">
                                This link is invalid or has expired.
                            </p>
                        </motion.div>
                    )}

                    {!isInvalid && isAlreadyClaimed && (
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ type: 'spring', damping: 18, stiffness: 200 }}
                            className="relative bg-white rounded-3xl px-6 py-6 text-center shadow-2xl mx-auto max-w-[340px] overflow-hidden"
                        >
                            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#ffd86b] to-[#f5a623]" />
                            <p className="text-gray-500 text-[13px] font-medium">You've already claimed</p>
                            <p className="mt-1 text-[34px] font-extrabold leading-none bg-gradient-to-b from-[#ff5a3c] to-[#e31e2c] bg-clip-text text-transparent">
                                ₹{giftAmount}
                            </p>
                        </motion.div>
                    )}

                    {!isInvalid && !isAlreadyClaimed && (
                        <motion.button
                            disabled={loading}
                            onClick={getCash}
                            whileTap={{ scale: 0.96 }}
                            animate={loading ? {} : { scale: [1, 1.03, 1] }}
                            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                            className="relative w-full max-w-[340px] mx-auto flex items-center justify-center gap-2
                                       overflow-hidden bg-gradient-to-r from-[#ff2d6b] via-[#ff5c9d] to-[#ff2d6b]
                                       text-white font-bold text-[18px] py-5 rounded-2xl
                                       shadow-[0_12px_28px_-6px_rgba(255,45,107,0.7)]
                                       border border-white/40 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {/* shimmer sweep */}
                            {!loading && (
                                <motion.span
                                    className="pointer-events-none absolute top-0 left-0 h-full w-1/3
                                               bg-gradient-to-r from-transparent via-white/55 to-transparent -skew-x-12"
                                    initial={{ x: '-150%' }}
                                    animate={{ x: '350%' }}
                                    transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 0.6, ease: 'easeInOut' }}
                                />
                            )}
                            {loading ? (
                                <>
                                    <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                                        <path className="opacity-90" fill="white" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
                                    </svg>
                                    Claiming…
                                </>
                            ) : (
                                <span className="relative">Get Cash</span>
                            )}
                        </motion.button>
                    )}

                    {/* Winners */}
                    {!isInvalid && (
                        <div className="mt-9">
                            <div className="flex items-center justify-center gap-4 text-white text-[13px] font-semibold tracking-wide mb-5">
                                <div className="h-px bg-gradient-to-r from-transparent to-white/50 flex-1" />
                                See if others are lucky
                                <div className="h-px bg-gradient-to-l from-transparent to-white/50 flex-1" />
                            </div>

                            <div className="bg-white rounded-3xl overflow-hidden shadow-2xl">
                                {recentClaims.length === 0 ? (
                                    <p className="px-5 py-10 text-center text-sm text-gray-400">
                                        No claims yet — you could be the first. ✨
                                    </p>
                                ) : (
                                    <AnimatePresence>
                                        {recentClaims.map((winner, idx) => (
                                            <motion.div
                                                key={winner.id ?? idx}
                                                initial={{ opacity: 0, x: -14 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.06 }}
                                                className="flex items-center px-5 py-4 gap-4 border-b border-gray-100 last:border-b-0
                                                           transition-colors hover:bg-amber-50/60"
                                            >
                                                <div className="relative shrink-0">
                                                    <img
                                                        src={resolveAvatar(winner.image) || `https://ui-avatars.com/api/?name=${encodeURIComponent(winner.name ?? 'User')}&background=FFD700&color=333`}
                                                        onError={(e) => {
                                                            e.currentTarget.onerror = null;
                                                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(winner.name ?? 'User')}&background=FFD700&color=333`;
                                                        }}
                                                        alt={winner.name}
                                                        className="w-12 h-12 rounded-full object-cover ring-2 ring-[#ffd86b] ring-offset-2 ring-offset-white"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-gray-900 truncate">{winner.name}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">
                                                        {formatTime(winner.claimedAt)}
                                                    </p>
                                                </div>
                                                <span className="font-extrabold text-[#e31e2c] text-lg whitespace-nowrap">
                                                    ₹{winner.amount ?? giftAmount}
                                                </span>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Modal
                open={modal.open}
                variant={modal.variant}
                title={modal.title}
                message={modal.message}
                actionLabel={modal.actionLabel}
                onAction={modal.onAction ? () => { closeModal(); modal.onAction(); } : closeModal}
                onClose={closeModal}
            />
        </div>
    );
}

export default GiftClaim;
