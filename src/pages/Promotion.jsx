import React, { useState, useEffect } from 'react';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import TelegramIcon from '@mui/icons-material/Telegram';
import ShareIcon from '@mui/icons-material/Share';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import BackButton from '../components/BackButton';

function Promotion() {
    const navigate = useNavigate();

    const [referralCode, setReferralCode] = useState('');
    const [referralCount, setReferralCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [copiedMsg, setCopiedMsg] = useState(null);

    const showCopied = (msg) => {
        setCopiedMsg(msg);
        setTimeout(() => setCopiedMsg(null), 1500);
    };

    useEffect(() => {
        const fetchPromotionData = async () => {
            try {
                const profileRes = await axios.post('/user/profile');
                if (profileRes.data?.user?.inviteCode) {
                    setReferralCode(profileRes.data.user.inviteCode);
                }
                const referredRes = await axios.post('/user/referred');
                const total = referredRes.data.total || referredRes.data.users?.length || 0;
                setReferralCount(total);
            } catch (error) {
                console.error('Failed to fetch promotion data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPromotionData();
    }, []);

    const referralLink = `${window.location.origin}/register/${referralCode}`;
    const shareMessage = `🎮 Join me on BigMumbai and start winning! Use my code ${referralCode} to sign up:\n${referralLink}`;

    const copyText = async (text, successMsg) => {
        if (!text) return;
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }
            showCopied(successMsg);
        } catch (err) {
            console.error(err);
        }
    };

    const copyCode = () => copyText(referralCode, 'Code copied!');
    const copyToClipboard = () => copyText(referralLink, 'Referral link copied!');

    const shareWhatsApp = () => {
        window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage)}`, '_blank');
    };
    const shareTelegram = () => {
        window.open(
            `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareMessage)}`,
            '_blank'
        );
    };
    const shareNative = async () => {
        if (navigator.share) {
            try {
                await navigator.share({ title: 'Join BigMumbai', text: shareMessage, url: referralLink });
            } catch { /* user cancelled */ }
        } else {
            copyToClipboard();
        }
    };

    return (
        <div
            className="bg-[#f7f8ff] flex justify-center min-h-screen"
            style={{ minHeight: '100dvh' }}
        >
            {/* h-screen is the fallback; 100dvh (inline) wins on iOS and tracks the Safari toolbar */}
            <div
                className="relative w-full lg:max-w-[400px] mx-auto h-screen flex flex-col overflow-hidden shadow-2xl border border-gray-300 bg-[#f7f8ff]"
                style={{ height: '100dvh' }}
            >

                {/* Header — wrapped so it can't be compressed by the flex column */}
                <div className="flex-shrink-0">
                    <BackButton label={"My promotion"} />
                </div>

                {/* Scrollable content. min-h-0 is required for flex children to scroll on iOS */}
                <div
                    className="flex-1 min-h-0 overflow-y-auto pb-8"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                >

                    {/* ── Content ── */}
                    <div className="px-4 pt-4 space-y-4">

                        {/* Referral code card */}
                        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5">
                            <p className="text-xs text-gray-400 text-center mb-2 uppercase tracking-wider">
                                Your referral code
                            </p>
                            <button
                                onClick={copyCode}
                                disabled={!referralCode || loading}
                                className="w-full bg-[#fff9f0] border-2 border-dashed border-[#e8c89a] rounded-xl py-4 flex items-center justify-center gap-3 active:scale-[0.98] transition-transform disabled:opacity-60"
                            >
                                <span className="text-3xl font-extrabold tracking-[0.15em] text-[#b1835a]">
                                    {loading ? '••••••' : referralCode || '------'}
                                </span>
                                <ContentCopyIcon sx={{ fontSize: 20 }} className="text-[#d8ab83]" />
                            </button>
                            <p className="text-[11px] text-gray-400 text-center mt-2">Tap the code to copy</p>
                        </div>

                        {/* Stats row */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => navigate('/referred-users')}
                                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col items-center active:scale-[0.98] transition-transform"
                            >
                                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center mb-1.5">
                                    <PeopleAltIcon className="text-[#d8ab83]" sx={{ fontSize: 22 }} />
                                </div>
                                <span className="text-2xl font-bold text-gray-800">
                                    {loading ? '—' : referralCount}
                                </span>
                                <span className="text-xs text-gray-400">My referrals</span>
                            </button>

                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col items-center">
                                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center mb-1.5">
                                    <CardGiftcardIcon className="text-emerald-500" sx={{ fontSize: 22 }} />
                                </div>
                                <span className="text-2xl font-bold text-gray-800">∞</span>
                                <span className="text-xs text-gray-400">Rewards</span>
                            </div>
                        </div>

                        {/* Share options */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                            <p className="text-sm font-semibold text-gray-700 mb-3">Share via</p>
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    onClick={shareWhatsApp}
                                    className="flex flex-col items-center gap-1.5 py-2 rounded-xl bg-green-50 active:scale-95 transition-transform"
                                >
                                    <WhatsAppIcon className="text-green-600" />
                                    <span className="text-xs text-gray-600">WhatsApp</span>
                                </button>
                                <button
                                    onClick={shareTelegram}
                                    className="flex flex-col items-center gap-1.5 py-2 rounded-xl bg-sky-50 active:scale-95 transition-transform"
                                >
                                    <TelegramIcon className="text-sky-500" />
                                    <span className="text-xs text-gray-600">Telegram</span>
                                </button>
                                <button
                                    onClick={shareNative}
                                    className="flex flex-col items-center gap-1.5 py-2 rounded-xl bg-gray-50 active:scale-95 transition-transform"
                                >
                                    <ShareIcon className="text-gray-500" />
                                    <span className="text-xs text-gray-600">More</span>
                                </button>
                            </div>

                            {/* Link + copy */}
                            <div className="mt-4">
                                <div className="flex items-center bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                                    <span className="flex-1 px-3 py-2.5 text-xs text-gray-500 truncate">
                                        {referralLink}
                                    </span>
                                    <button
                                        onClick={copyToClipboard}
                                        disabled={!referralCode || loading}
                                        className="px-4 py-2.5 text-white text-sm font-semibold disabled:opacity-60"
                                        style={{ background: 'linear-gradient(90deg, #d9ad82, #b1835a)' }}
                                    >
                                        Copy
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* How it works */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                            <p className="text-sm font-semibold text-gray-700 mb-3">How it works</p>
                            <div className="space-y-3">
                                {[
                                    { n: '1', t: 'Share your code', d: 'Send your referral link to friends' },
                                    { n: '2', t: 'They sign up', d: 'Your friend registers with your code' },
                                    { n: '3', t: 'You earn rewards', d: 'Get bonuses when they play' },
                                ].map((step) => (
                                    <div key={step.n} className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-[#fff3e3] text-[#b1835a] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                                            {step.n}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">{step.t}</p>
                                            <p className="text-xs text-gray-400">{step.d}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

                {/* ── Copy success modal (same as Profile) ── */}
                {copiedMsg && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                        <div className="absolute inset-0 bg-black/20 animate-fadeIn" />
                        <div className="relative bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl px-8 py-6 flex flex-col items-center animate-popIn">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#d9ad82] to-[#b1835a] flex items-center justify-center mb-3 shadow-lg">
                                <svg className="w-9 h-9 text-white" viewBox="0 0 24 24" fill="none">
                                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="animate-drawCheck" />
                                </svg>
                            </div>
                            <p className="text-gray-800 font-semibold text-base">Copied!</p>
                            <p className="text-gray-400 text-xs mt-0.5">{copiedMsg}</p>
                        </div>
                    </div>
                )}

                <style>{`
                    @keyframes fadeIn    { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
                    @keyframes popIn     { 0% { opacity:0; transform:scale(0.8); } 60% { opacity:1; transform:scale(1.05); } 100% { opacity:1; transform:scale(1); } }
                    @keyframes drawCheck { from { stroke-dasharray:30; stroke-dashoffset:30; } to { stroke-dasharray:30; stroke-dashoffset:0; } }
                    .animate-fadeIn    { animation: fadeIn  0.18s ease-out; }
                    .animate-popIn     { animation: popIn   0.35s cubic-bezier(0.34,1.56,0.64,1); }
                    .animate-drawCheck { animation: drawCheck 0.4s ease-out 0.15s both; }
                `}</style>
            </div>
        </div>
    );
}

export default Promotion;