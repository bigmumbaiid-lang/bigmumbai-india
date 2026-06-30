import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import BannerSlider from '../components/BannerSlider'
import WinningCarousel from '../components/WinningCarousel'
import bigMumbaiLogo from '../assets/bigMumbaiLogo.png'
import minesIcon from '../assets/minesIcon.jpg'
import blackJackIcon from '../assets/blackJackIcon.jpg'
import { Lock, Play, X, Mail } from 'lucide-react'
import axiosInstance from '../utils/axios'
import LotteryIcon from '../assets/lotteryIcons/Lottery.0a2eff85.png'
import WinGoIcon from '../assets/lotteryIcons/5D-WinGO.c1620dae.png'
import CasinoIcon from '../assets/lotteryIcons/AG-Casino.78de020a.png'
import K3SlotsIcon from '../assets/lotteryIcons/K3-Slots.d727226f.png'
import SportsIcon from '../assets/lotteryIcons/3D-Sports.88f7af0e.png'
import PVCIcon from '../assets/lotteryIcons/PVC.128af64d.png'
import FishingIcon from '../assets/lotteryIcons/Fishing.3e646af6.png'
import PopularIcon from '../assets/lotteryIcons/Popular.92462f10.png'

// Parse text and turn URLs into clickable links
const URL_RE = /(https?:\/\/[^\s]+)/g
function renderContent(text) {
    if (!text) return null
    return text.split(URL_RE).map((part, i) =>
        URL_RE.test(part) ? (
            <a key={i} href={part} target="_blank" rel="noopener noreferrer"
                className="font-medium underline underline-offset-2 break-all"
                style={{ color: '#b1835a' }}
                onClick={e => e.stopPropagation()}>
                {part}
            </a>
        ) : <span key={i}>{part}</span>
    )
}

function PersonalMessageModal({ message, onMarkRead, onLater }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)' }}>
            <div className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
                style={{ background: '#fff' }}>
                {/* Header */}
                <div className="relative px-5 pt-5 pb-4"
                    style={{ background: 'linear-gradient(135deg,#d9ad82,#b1835a)' }}>
                    <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                            <Mail size={18} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-white/70 mb-0.5">
                                Personal Message
                            </p>
                            <h3 className="text-base font-bold text-white leading-snug">
                                {message.title}
                            </h3>
                        </div>
                    </div>
                    <button onClick={onLater}
                        className="absolute top-3 right-3 h-7 w-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors">
                        <X size={14} className="text-white" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 py-4">
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap break-words">
                        {renderContent(message.content)}
                    </p>
                    {message.imageUrl && (
                        <img src={message.imageUrl} alt=""
                            className="mt-3 rounded-xl w-full object-cover" style={{ maxHeight: 180 }} />
                    )}
                </div>

                {/* Footer buttons */}
                <div className="px-5 pb-5 flex gap-3">
                    <button onClick={onLater}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors">
                        Later
                    </button>
                    <button onClick={onMarkRead}
                        className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
                        style={{ background: 'linear-gradient(90deg,#d9ad82,#b1835a)' }}>
                        Mark as Read
                    </button>
                </div>
            </div>
        </div>
    )
}

const gameCategories = [
    { icon: LotteryIcon, label: 'Lottery' },
    { icon: WinGoIcon, label: '5D-Win GO' },
    { icon: CasinoIcon, label: 'AG-Casino' },
    { icon: K3SlotsIcon, label: 'K3-Slots' },
    { icon: SportsIcon, label: '3D-Sports' },
    { icon: PVCIcon, label: 'PVC' },
    { icon: FishingIcon, label: 'Fishing' },
    { icon: PopularIcon, label: 'Popular' },
]

// Inline SVG mines icon
function MinesCardIcon() {
    return (
        <svg viewBox="0 0 160 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <rect width="160" height="100" fill="#1e293b" rx="10" />

            {/* Tile grid — top left */}
            <rect x="8" y="8" width="20" height="18" rx="3" fill="#273449" />
            <rect x="31" y="8" width="20" height="18" rx="3" fill="#273449" />
            <rect x="54" y="8" width="20" height="18" rx="3" fill="#273449" />
            <rect x="8" y="29" width="20" height="18" rx="3" fill="#7f1d1d" stroke="#ef4444" strokeWidth="1" />
            <rect x="31" y="29" width="20" height="18" rx="3" fill="#273449" />
            <rect x="54" y="29" width="20" height="18" rx="3" fill="#273449" />
            <rect x="8" y="50" width="20" height="18" rx="3" fill="#273449" />
            <rect x="31" y="50" width="20" height="18" rx="3" fill="#273449" />
            <rect x="54" y="50" width="20" height="18" rx="3" fill="#273449" />

            {/* Gem on top-right tile */}
            <polygon points="43,12 50,20 43,27 36,20" fill="#34d399" opacity="0.9" />
            <polygon points="43,12 50,20 43,19" fill="#ffffff" fillOpacity="0.3" />

            {/* Small bomb on red tile */}
            <line x1="18" y1="34" x2="18" y2="30" stroke="#374151" strokeWidth="2" strokeLinecap="round" />
            <line x1="13" y1="38" x2="10" y2="38" stroke="#374151" strokeWidth="2" strokeLinecap="round" />
            <line x1="23" y1="38" x2="26" y2="38" stroke="#374151" strokeWidth="2" strokeLinecap="round" />
            <line x1="13" y1="44" x2="10" y2="44" stroke="#374151" strokeWidth="2" strokeLinecap="round" />
            <line x1="23" y1="44" x2="26" y2="44" stroke="#374151" strokeWidth="2" strokeLinecap="round" />
            <line x1="18" y1="48" x2="18" y2="46" stroke="#374151" strokeWidth="2" strokeLinecap="round" />
            <circle cx="18" cy="40" r="7" fill="#111111" />
            <path d="M18 33 Q22 30 25 28" fill="none" stroke="#92400e" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="25.5" cy="27.5" r="2" fill="#fbbf24" />
            <ellipse cx="16" cy="38" rx="2.5" ry="1.5" fill="#ffffff" fillOpacity="0.2" />

            {/* Multiplier text */}
            <text x="68" y="25" fontFamily="system-ui,sans-serif" fontSize="9" fontWeight="700" fill="#34d399">1.00x</text>
            <text x="68" y="40" fontFamily="system-ui,sans-serif" fontSize="9" fontWeight="700" fill="#34d399">2.50x</text>
            <text x="68" y="55" fontFamily="system-ui,sans-serif" fontSize="9" fontWeight="700" fill="#fbbf24">5.10x</text>

            {/* Large bomb — right */}
            <line x1="122" y1="36" x2="122" y2="26" stroke="#4b5563" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="101" y1="52" x2="92" y2="52" stroke="#4b5563" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="143" y1="52" x2="152" y2="52" stroke="#4b5563" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="122" y1="68" x2="122" y2="78" stroke="#4b5563" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="108" y1="38" x2="100" y2="30" stroke="#4b5563" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="136" y1="38" x2="144" y2="30" stroke="#4b5563" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="108" y1="66" x2="100" y2="74" stroke="#4b5563" strokeWidth="3.5" strokeLinecap="round" />
            <line x1="136" y1="66" x2="144" y2="74" stroke="#4b5563" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="122" cy="52" r="20" fill="#1a1a1a" />
            <ellipse cx="116" cy="46" rx="6" ry="4" fill="#ffffff" fillOpacity="0.12" />
            <rect x="119" y="30" width="6" height="8" rx="2" fill="#374151" />
            <path d="M122 30 Q132 22 140 18" fill="none" stroke="#92400e" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="141" cy="17" r="4" fill="#fbbf24" opacity="0.95" />
            <circle cx="141" cy="17" r="2" fill="#ffffff" opacity="0.8" />

            <text x="80" y="93" textAnchor="middle" fontFamily="system-ui,sans-serif" fontSize="11" fontWeight="700" fill="#f1f5f9" letterSpacing="2">MINES</text>
        </svg>
    )
}

function Home() {
    const navigate = useNavigate()
    const [msgQueue, setMsgQueue] = useState([])   // unread personal messages
    const [msgIdx, setMsgIdx]     = useState(0)    // which one is showing

    useEffect(() => {
        axiosInstance.get('/announcements/unread-personal')
            .then(res => { if (res.data?.data?.length) setMsgQueue(res.data.data) })
            .catch(() => {})
    }, [])

    const currentMsg = msgQueue[msgIdx] ?? null

    const handleMarkRead = async () => {
        try {
            await axiosInstance.patch(`/announcements/${currentMsg._id}/read`)
        } catch {}
        advance()
    }

    const handleLater = () => advance()

    const advance = () => {
        if (msgIdx + 1 < msgQueue.length) {
            setMsgIdx(i => i + 1)
        } else {
            setMsgQueue([])
        }
    }

    return (
        <>
        {currentMsg && (
            <PersonalMessageModal
                message={currentMsg}
                onMarkRead={handleMarkRead}
                onLater={handleLater}
            />
        )}
        <div
            className="flex items-center justify-center min-h-screen"
            style={{ minHeight: '100dvh' }}
        >
            {/* h-screen is the fallback; 100dvh (inline) wins on iOS and tracks
                the Safari toolbar so the bottom nav stays in the visible area. */}
            <div
                className="w-full lg:max-w-[400px] mx-auto h-screen flex flex-col overflow-hidden shadow-2xl border bg-white border-gray-300"
                style={{ height: '100dvh' }}
            >

                {/* Header — fixed flex row OUTSIDE the scroll area so it stays pinned */}
                <div className="flex items-center bg-white px-3 py-2 border-b border-gray-100 shrink-0 z-20">
                    <img src={bigMumbaiLogo} className="w-40" alt="Big Mumbai" />
                </div>

                {/* Scrollable content. min-h-0 is required for flex children to scroll on iOS */}
                <div
                    className="flex-1 min-h-0 overflow-y-auto p-3"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                >

                    {/* Banner Slider */}
                    <BannerSlider />

                    {/* Announcement Bar */}
                    <div className="flex items-center justify-between bg-white border border-[#e8d9c0] rounded-full px-3 py-1.5 my-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <svg className="w-4 h-4 text-[#c8a87a] shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                            </svg>
                            <div className="overflow-hidden flex-1">
                                <p className="text-xs text-gray-600 whitespace-nowrap animate-marquee">
                                    1、Welcome to BigMumbai
                                </p>
                            </div>
                        </div>
                        <button
                            className="ml-2 shrink-0 bg-gradient-to-r from-[#d4a85a] to-[#c8962a] text-white text-xs font-semibold px-4 py-1 rounded-full"
                            onClick={() => navigate('/announcement')}
                        >
                            Detail
                        </button>
                    </div>

                    {/* Game Category Icons Grid */}
                    <div className="mt-2 p-3">
                        <div className="grid grid-cols-4 gap-y-4">
                            {gameCategories.map(({ icon, label }) => (
                                <button
                                    key={label}
                                    className="flex flex-col items-center gap-1 group"
                                    onClick={() => console.log('Navigate to', label)}
                                >
                                    <img
                                        src={icon}
                                        alt={label}
                                        className="w-12 h-12 object-contain group-active:scale-95 transition-transform"
                                    />
                                    <span className="text-[11px] text-gray-600 font-medium text-center leading-tight">
                                        {label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-100 mx-3 mt-1 mb-3" />

                    {/* ── Games Section ── */}
                    <div className="px-3">
                        <h2 className="text-sm font-bold text-gray-800 text-center mb-3 tracking-wide">
                            Games
                        </h2>

                        <div className="flex justify-center mb-3">
                            <div className="w-10 h-0.5 rounded-full bg-gradient-to-r from-emerald-400 to-green-300" />
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            {/* Mines game card */}
                            <button
                                onClick={() => navigate('/mines')}
                                className="group relative flex flex-col rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg active:scale-95 transition-all duration-200 bg-white"
                            >
                                <div className="relative w-full aspect-square bg-[#1e293b] overflow-hidden">
                                    <img
                                        src={minesIcon}
                                        alt="Mines"
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <span className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                                            <Play size={16} className="text-gray-800 fill-gray-800 ml-0.5" />
                                        </span>
                                    </div>
                                </div>
                                <div className="px-2 py-2 text-center">
                                    <span className="text-[11px] font-bold text-gray-700">Mines</span>
                                </div>
                            </button>

                            {/* Blackjack game card */}
                            <button
                                onClick={() => navigate('/blackjack')}
                                className="group relative flex flex-col rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg active:scale-95 transition-all duration-200 bg-white"
                            >
                                <div className="relative w-full aspect-square bg-[#0c3528] overflow-hidden">
                                    <img
                                        src={blackJackIcon}
                                        alt="Blackjack"
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <span className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                                            <Play size={16} className="text-gray-800 fill-gray-800 ml-0.5" />
                                        </span>
                                    </div>
                                </div>
                                <div className="px-2 py-2 text-center">
                                    <span className="text-[11px] font-bold text-gray-700">Black Jack</span>
                                </div>
                            </button>

                            {/* Placeholder card */}
                            <div className="flex flex-col rounded-2xl overflow-hidden border border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100">
                                <div className="relative w-full aspect-square flex flex-col items-center justify-center gap-1.5">
                                    <span className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-100">
                                        <Lock size={18} className="text-gray-400" />
                                    </span>
                                    <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wide">Coming soon</span>
                                </div>
                                <div className="px-2 py-2 text-center">
                                    <span className="text-[11px] font-bold text-gray-300">—</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-100 mx-3 mt-4 mb-2" />

                    {/* ── Winning Info + Today's Earnings Chart ── */}
                    <WinningCarousel />

                </div>

                <BottomNav
                    activeTab="/"
                    onTabChange={(tab) => {
                        console.log("Navigating to:", tab)
                        navigate(`/${tab}`)
                    }}
                />
            </div>
        </div>
        </>
    )
}

export default Home