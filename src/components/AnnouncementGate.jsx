import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { X, BellRing } from 'lucide-react'
import axiosInstance from '../utils/axios'

// Suppressed on active crypto payment screens — these run their own countdown
// timer for the deposit window, and interrupting with a full-screen modal risks
// the user missing the window or losing their place mid-payment.
const SUPPRESSED_PATH_PREFIXES = ['/usdt-payment', '/trx-payment']

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

function PersonalMessageModal({ message, onMarkRead, onLater, isGlobal }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-8"
            style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className="w-full rounded-3xl overflow-hidden"
                style={{
                    maxWidth: 355,
                    background: '#fff',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.16), 0 4px 14px rgba(177,131,90,0.10)',
                }}>

                {/* Top accent bar */}
                <div className="h-[3px] w-full" style={{ background: 'linear-gradient(90deg,#e2b97a,#b1835a)' }} />

                {/* Header */}
                <div className="relative px-4 pt-5 pb-3 flex items-center gap-3">
                    <div className="shrink-0 h-9 w-9 rounded-xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg,#fdf0e2,#f7dfc0)' }}>
                        <BellRing size={16} style={{ color: '#c49055' }} />
                    </div>
                    <h3 className="flex-1 text-[14px] font-bold text-gray-800 leading-snug pr-5">
                        {message.title}
                    </h3>
                    <button onClick={onLater}
                        className="absolute top-3.5 right-3.5 h-6 w-6 rounded-full flex items-center justify-center"
                        style={{ background: '#f3f4f6' }}>
                        <X size={12} className="text-gray-400" />
                    </button>
                </div>

                {/* Divider */}
                <div className="mx-4 h-px" style={{ background: '#f3f3f3' }} />

                {/* Body */}
                <div className="px-4 py-5">
                    <p className="text-[12.5px] text-gray-500 leading-relaxed whitespace-pre-wrap break-words">
                        {renderContent(message.content)}
                    </p>
                    {message.imageUrl && (
                        <img src={message.imageUrl} alt=""
                            className="mt-3 rounded-xl w-full object-cover" style={{ maxHeight: 160 }} />
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 pb-5 flex gap-2">
                    <button onClick={onLater}
                        className="flex-1 py-2 rounded-xl text-[12.5px] font-semibold transition-colors"
                        style={{ background: '#f5f5f5', color: '#aaa' }}>
                        Later
                    </button>
                    <button onClick={onMarkRead}
                        className="flex-1 py-2 rounded-xl text-[12.5px] font-semibold text-white transition-all"
                        style={{
                            background: 'linear-gradient(135deg,#e2b97a,#b1835a)',
                            boxShadow: '0 3px 10px rgba(177,131,90,0.30)',
                        }}>
                        {isGlobal ? 'Got it' : 'Mark as Read'}
                    </button>
                </div>
            </div>
        </div>
    )
}

const DISMISSED_KEY = 'dismissed_global_announcements'

function getDismissed() {
    try { return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]') } catch { return [] }
}

function addDismissed(id) {
    try {
        const dismissed = getDismissed()
        if (!dismissed.includes(id)) {
            localStorage.setItem(DISMISSED_KEY, JSON.stringify([...dismissed, id]))
        }
    } catch {}
}

// Mounted once at the protected-route layout level (not per-page) so an unread
// announcement interrupts the user on whichever page they're on, not just Home.
export default function AnnouncementGate() {
    const [msgQueue, setMsgQueue] = useState([])
    const [msgIdx, setMsgIdx]     = useState(0)

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const [personalRes, globalRes] = await Promise.all([
                    axiosInstance.get('/announcements/unread-personal'),
                    axiosInstance.get('/announcements/user'),
                ])
                const personal = personalRes.data?.data || []
                const all      = globalRes.data?.data || []
                const dismissed = getDismissed()
                const unseenGlobal = all
                    .filter(a => a.type === 'global' && !dismissed.includes(a._id))
                    .map(a => ({ ...a, _isGlobal: true }))
                setMsgQueue([...unseenGlobal, ...personal])
            } catch {}
        }
        fetchAll()
    }, [])

    const location = useLocation()
    const suppressed = SUPPRESSED_PATH_PREFIXES.some(p => location.pathname.startsWith(p))

    const currentMsg = msgQueue[msgIdx] ?? null

    const handleMarkRead = async () => {
        if (currentMsg._isGlobal) {
            addDismissed(currentMsg._id)
        } else {
            try { await axiosInstance.patch(`/announcements/${currentMsg._id}/read`) } catch {}
        }
        advance()
    }

    const handleLater = () => {
        if (currentMsg?._isGlobal) addDismissed(currentMsg._id)
        advance()
    }

    const advance = () => {
        if (msgIdx + 1 < msgQueue.length) {
            setMsgIdx(i => i + 1)
        } else {
            setMsgQueue([])
        }
    }

    if (!currentMsg || suppressed) return null

    return (
        <PersonalMessageModal
            message={currentMsg}
            onMarkRead={handleMarkRead}
            onLater={handleLater}
            isGlobal={!!currentMsg._isGlobal}
        />
    )
}
