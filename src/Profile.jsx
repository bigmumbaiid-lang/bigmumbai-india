import React, { useContext } from 'react'
import profileIcon from './assets/profile.jpg'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
import { useEffect, useState, useRef } from 'react'
import axios from './utils/axios'
import { useNavigate } from 'react-router-dom'
import rechargeIcon from './assets/rechargeIcon.png'
import withdrawIcon from './assets/withdrawIcon.png'
import transferIcon from './assets/transferIcon.png'
import { AuthContext } from './context/AuthContext'
import BottomNav from './components/BottomNav'

// Load all avatars from assets via webpack's require.context (Create React App)
const avatarContext = require.context('./assets', false, /pf\d+\.jpg$/)
const avatarModules = avatarContext.keys().reduce((acc, key) => {
    acc[key.replace('./', '')] = avatarContext(key)
    return acc
}, {})

const resolveAvatar = (img) => {
    if (!img) return profileIcon
    const n = String(img).match(/\d+/)?.[0]
    if (!n) return profileIcon
    const mod = avatarModules[`pf${n}.jpg`]
    return mod?.default || mod || profileIcon
}

function Profile() {
    const [profile, setProfile]               = useState(null)
    const { user, logout }                    = useContext(AuthContext)
    const [money, setMoney]                   = useState()
    const [showCopied, setShowCopied]         = useState(false)
    const [showTransferTip, setShowTransferTip] = useState(false)
    const [tipPos, setTipPos]                  = useState({ right: 8, arrowRight: 0, y: 0 })
    const tipTimer                             = useRef(null)
    const transferBtnRef                       = useRef(null)

    const navigate = useNavigate()

    const copyToClipboard = async () => {
        if (!user?.username) return
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(user.username)
            } else {
                const textArea = document.createElement('textarea')
                textArea.value = user.username
                textArea.style.position = 'fixed'
                textArea.style.left = '-999999px'
                document.body.appendChild(textArea)
                textArea.focus()
                textArea.select()
                document.execCommand('copy')
                document.body.removeChild(textArea)
            }
            setShowCopied(true)
            setTimeout(() => setShowCopied(false), 1500)
        } catch (error) {
            console.error('Failed to copy:', error)
        }
    }

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await axios.post('/user/profile')
                setMoney(response.data.user.money)
                setProfile(response.data.user)
            } catch (error) {
                console.log(error)
            }
        }
        fetchProfile()
        return () => clearTimeout(tipTimer.current)
    }, [])

    const handleTransferClick = () => {
        if (user?.role === 'admin') {
            navigate('/transfer')
        } else {
            if (transferBtnRef.current) {
                const rect = transferBtnRef.current.getBoundingClientRect()
                // Right-align tooltip with button's right edge so it extends leftward (no right overflow)
                setTipPos({
                    right:      window.innerWidth - rect.right + 8,
                    arrowRight: rect.width / 2 - 6,
                    y:          rect.top - 10,
                })
            }
            setShowTransferTip(true)
            clearTimeout(tipTimer.current)
            tipTimer.current = setTimeout(() => setShowTransferTip(false), 2500)
        }
    }

    return (
        <div
            className="flex items-center justify-center bg-gray-50 min-h-screen"
            style={{ minHeight: '100dvh' }}
        >
            <div
                className="w-full lg:max-w-[400px] mx-auto h-screen flex flex-col overflow-hidden shadow-2xl border border-gray-300 bg-[#f7f8ff] relative"
                style={{ height: '100dvh' }}
            >

                <div
                    className="flex-1 min-h-0 overflow-y-auto"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                >

                    {/* Gradient header backdrop */}
                    <div
                        className="px-4 pt-5 pb-20 rounded-b-3xl"
                        style={{ background: 'linear-gradient(160deg, #d9ad82 0%, #b1835a 100%)' }}
                    >
                        <div className="flex items-center">
                            <img
                                src={resolveAvatar(profile?.image || user?.image)}
                                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = profileIcon }}
                                className="w-14 h-14 rounded-full border-2 border-white/50 object-cover"
                                alt="profile"
                            />
                            <div
                                onClick={copyToClipboard}
                                className="bg-[#feaa57] backdrop-blur px-3 py-1 flex items-center ml-4 rounded-2xl text-white cursor-pointer active:scale-95 transition-transform"
                            >
                                <span className="mr-1 text-sm font-medium">{user?.username}</span>
                                <svg className="w-4 cursor-pointer" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M13 12.4316V7.8125C13 6.2592 14.2592 5 15.8125 5H40.1875C41.7408 5 43 6.2592 43 7.8125V32.1875C43 33.7408 41.7408 35 40.1875 35H35.5163" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M32.1875 13H7.8125C6.2592 13 5 14.2592 5 15.8125V40.1875C5 41.7408 6.2592 43 7.8125 43H32.1875C33.7408 43 35 41.7408 35 40.1875V15.8125C35 14.2592 33.7408 13 32.1875 13Z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Content pulled up over the gradient */}
                    <div className="px-4 -mt-12 relative">

                        {/* Balance + actions card */}
                        <div className="bg-white py-4 rounded-xl shadow-md">
                            <div className="flex justify-between px-4 items-center">
                                <span className="font-bold text-[#1e2637] text-lg">INR {money ?? 0}.00</span>
                                <div
                                    onClick={() => navigate('/transactions')}
                                    className="bg-[#BA8D63] text-white rounded-full px-3 py-1.5 text-sm cursor-pointer"
                                >
                                    Transaction Record
                                </div>
                            </div>
                            <div className="w-[95%] mx-auto border-b border-gray-200 mt-4"></div>

                            <div className="flex justify-between px-4 pt-4 relative">
                                <div className="flex justify-center items-center flex-col cursor-pointer" onClick={() => navigate('/recharge')}>
                                    <img className="w-10" src={rechargeIcon} alt="recharge" />
                                    <span className="text-sm mt-1">Recharge</span>
                                </div>
                                <div className="flex justify-center items-center flex-col cursor-pointer" onClick={() => navigate('/withdraw')}>
                                    <img className="w-10" src={withdrawIcon} alt="withdraw" />
                                    <span className="text-sm mt-1">Withdraw</span>
                                </div>

                                {/* Transfer button */}
                                <div ref={transferBtnRef} className="flex justify-center items-center flex-col cursor-pointer" onClick={handleTransferClick}>
                                    <img className="w-10" src={transferIcon} alt="transfer" />
                                    <span className="text-sm mt-1">Transfer</span>
                                </div>
                            </div>
                        </div>

                        {/* Menu list card */}
                        <div className="bg-white mt-6 rounded-xl overflow-hidden cursor-pointer">
                            <div className="flex justify-between px-4 py-4" onClick={() => navigate('/agency-center')} style={{ cursor: 'pointer' }}>
                                <span>Agency Center</span>
                                <KeyboardArrowRightIcon sx={{ color: '#9ca3af' }} />
                            </div>
                            <div className="w-[90%] mx-auto border-b border-gray-100"></div>

                            <div className="flex justify-between px-4 py-4" onClick={() => navigate('/announcement')}>
                                <span>Announcement</span>
                                <KeyboardArrowRightIcon sx={{ color: '#9ca3af' }} />
                            </div>
                            <div className="w-[90%] mx-auto border-b border-gray-100"></div>

                            <div className="flex justify-between px-4 py-4" onClick={() => navigate('/betting-history')}>
                                <span>Betting History</span>
                                <KeyboardArrowRightIcon sx={{ color: '#9ca3af' }} />
                            </div>
                            <div className="w-[90%] mx-auto border-b border-gray-100"></div>

                            <div className="flex justify-between px-4 py-4" onClick={() => navigate('/bank-card')}>
                                <span>My Bank Card</span>
                                <KeyboardArrowRightIcon sx={{ color: '#9ca3af' }} />
                            </div>
                            <div className="w-[90%] mx-auto border-b border-gray-100"></div>

                            <div className="flex justify-between px-4 py-4" onClick={() => navigate('/account-security')}>
                                <span>Account Security</span>
                                <KeyboardArrowRightIcon sx={{ color: '#9ca3af' }} />
                            </div>
                            <div className="w-[90%] mx-auto border-b border-gray-100"></div>

                            <div onClick={logout} className="flex justify-between px-4 py-4">
                                <span>Sign Out</span>
                                <KeyboardArrowRightIcon sx={{ color: '#9ca3af' }} />
                            </div>
                        </div>
                    </div>
                </div>

                <BottomNav
                    activeTab="my"
                    onTabChange={(tab) => {
                        console.log('Navigating to:', tab)
                        navigate(`/${tab}`)
                    }}
                />

                {/* Transfer tooltip — right-aligned to button so it extends leftward, never overflows */}
                {showTransferTip && (
                    <div
                        className="fixed z-[9999] pointer-events-none animate-fadeIn"
                        style={{ right: tipPos.right, top: tipPos.y, transform: 'translateY(-100%)' }}
                    >
                        <div className="bg-[#333] text-white text-xs font-medium px-4 py-2.5 rounded-xl whitespace-nowrap text-center shadow-lg">
                            You haven't activated the<br />transfer function yet
                        </div>
                        <div className="absolute top-full w-0 h-0"
                            style={{ right: tipPos.arrowRight, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid #333' }}
                        />
                    </div>
                )}

                {/* Copy success toast */}
                {showCopied && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
                        <div className="absolute inset-0 bg-black/20 animate-fadeIn" />
                        <div className="relative bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl px-8 py-6 flex flex-col items-center animate-popIn">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#d9ad82] to-[#b1835a] flex items-center justify-center mb-3 shadow-lg">
                                <svg className="w-9 h-9 text-white" viewBox="0 0 24 24" fill="none">
                                    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="animate-drawCheck" />
                                </svg>
                            </div>
                            <p className="text-gray-800 font-semibold text-base">Copied!</p>
                            <p className="text-gray-400 text-xs mt-0.5">Username copied to clipboard</p>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes fadeIn    { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes popIn     { 0% { opacity:0; transform:scale(0.8); } 60% { opacity:1; transform:scale(1.05); } 100% { opacity:1; transform:scale(1); } }
                @keyframes drawCheck { from { stroke-dasharray:30; stroke-dashoffset:30; } to { stroke-dasharray:30; stroke-dashoffset:0; } }
                .animate-fadeIn    { animation: fadeIn  0.18s ease-out; }
                .animate-popIn     { animation: popIn   0.35s cubic-bezier(0.34,1.56,0.64,1); }
                .animate-drawCheck { animation: drawCheck 0.4s ease-out 0.15s both; }
            `}</style>
        </div>
    )
}

export default Profile
