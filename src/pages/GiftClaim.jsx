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

    return (
        <div className="min-h-screen flex justify-center overflow-x-hidden">
            <div
                className="w-full max-w-[430px] min-h-screen bg-[#e31e2c] bg-no-repeat"
                style={{
                    backgroundImage: `url(${treasureBg})`,
                    backgroundSize: '100% auto',
                    backgroundPosition: 'top center',
                }}
            >

                {/* Header */}
                <div className="h-14 px-4 flex items-center text-white bg-gradient-to-r from-[#d9ad82] to-[#b1835a] sticky top-0 z-20 shadow-sm">
                    <button onClick={() => navigate('/profile')} className="flex items-center" aria-label="Go back">
                        <ArrowBackIosIcon fontSize="small" />
                    </button>
                    <span className="ml-3 text-base font-medium">Financial assistance</span>
                </div>

                {/* Treasure */}
                <div className="relative h-[260px] flex items-center justify-center overflow-hidden">
                    <div className="absolute left-1/2 top-[34%] -translate-x-1/2 w-[34%] max-w-[180px] z-10">
                        <motion.div
                            animate={isAlreadyClaimed ? {} : { y: [0, -8, 0] }}
                            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                        >
                            <img
                                src={isAlreadyClaimed ? openedTreasure : closedTreasure}
                                alt={isAlreadyClaimed ? 'Opened treasure chest' : 'Closed treasure chest'}
                                className="w-full h-auto drop-shadow-2xl"
                                draggable={false}
                            />
                        </motion.div>
                    </div>
                </div>

                {/* Content */}
                <div className="-mt-8 pb-12 px-4 relative z-0">

                    {isInvalid && (
                        <div className="bg-white rounded-2xl px-6 py-5 text-center shadow-xl mx-auto max-w-[340px]">
                            <p className="text-[#e31e2c] font-semibold text-[17px] leading-tight">
                                This link is invalid or has expired.
                            </p>
                        </div>
                    )}

                    {!isInvalid && isAlreadyClaimed && (
                        <div className="bg-white rounded-2xl px-6 py-5 text-center shadow-xl mx-auto max-w-[340px]">
                            <p className="text-gray-800 font-semibold text-[17px] leading-tight">
                                You've already claimed{' '}
                                <span className="text-[#e31e2c]">₹{giftAmount}</span>
                            </p>
                        </div>
                    )}

                    {!isInvalid && !isAlreadyClaimed && (
                        <motion.button
                            disabled={loading}
                            onClick={getCash}
                            whileTap={{ scale: 0.97 }}
                            animate={loading ? {} : { scale: [1, 1.025, 1] }}
                            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                            className="w-full max-w-[340px] mx-auto flex items-center justify-center gap-2
                                       bg-gradient-to-r from-[#ff2d6b] via-[#ff4d94] to-[#ff2d6b]
                                       text-white font-semibold text-[17px] py-5 rounded-2xl shadow-xl
                                       border border-white/30 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                                        <path className="opacity-90" fill="white" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
                                    </svg>
                                    Claiming…
                                </>
                            ) : (
                                'Get Cash'
                            )}
                        </motion.button>
                    )}

                    {/* Winners */}
                    {!isInvalid && (
                        <div className="mt-8">
                            <div className="flex items-center justify-center gap-4 text-white/90 text-sm font-medium mb-5">
                                <div className="h-px bg-white/40 flex-1" />
                                See if others are lucky
                                <div className="h-px bg-white/40 flex-1" />
                            </div>

                            <div className="bg-white rounded-2xl overflow-hidden shadow-xl">
                                {recentClaims.length === 0 ? (
                                    <p className="px-5 py-8 text-center text-sm text-gray-400">
                                        No claims yet — you could be the first.
                                    </p>
                                ) : (
                                    <AnimatePresence>
                                        {recentClaims.map((winner, idx) => (
                                            <motion.div
                                                key={winner.id ?? idx}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.06 }}
                                                className="flex items-center px-5 py-4 gap-4 border-b border-gray-100 last:border-b-0"
                                            >
                                                <img
                                                    src={resolveAvatar(winner.image) || `https://ui-avatars.com/api/?name=${encodeURIComponent(winner.name ?? 'User')}&background=FFD700&color=333`}
                                                    onError={(e) => {
                                                        e.currentTarget.onerror = null;
                                                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(winner.name ?? 'User')}&background=FFD700&color=333`;
                                                    }}
                                                    alt={winner.name}
                                                    className="w-12 h-12 rounded-full object-cover border-2 border-[#f5c6b0]"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-gray-900 truncate">{winner.name}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        {formatTime(winner.claimedAt)}
                                                    </p>
                                                </div>
                                                <span className="font-bold text-[#e31e2c] text-lg whitespace-nowrap">
                                                    INR {winner.amount ?? giftAmount}
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
