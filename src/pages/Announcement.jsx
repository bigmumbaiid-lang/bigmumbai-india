import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import axiosInstance from '../utils/axios';

const URL_RE = /(https?:\/\/[^\s]+)/g;

function renderContent(text) {
    if (!text) return null;
    return text.split(URL_RE).map((part, i) =>
        URL_RE.test(part) ? (
            <a key={i} href={part} target="_blank" rel="noopener noreferrer"
                className="font-medium underline underline-offset-2 break-all"
                style={{ color: '#b1835a' }}
                onClick={e => e.stopPropagation()}>
                {part}
            </a>
        ) : <span key={i}>{part}</span>
    );
}

function fmtDate(raw) {
    if (!raw) return '';
    const d = new Date(raw);
    if (isNaN(d)) return raw;
    return d.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' });
}

function EmptyState({ message, isAlert }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: isAlert ? 'rgba(251,191,36,0.1)' : 'linear-gradient(135deg,#fdf3e8,#f5dfc0)' }}>
                {isAlert ? (
                    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8">
                        <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                            stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="#d9ad82" strokeWidth="1.5" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round"
                            d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                )}
            </div>
            <p className="text-[13px] text-gray-400 font-medium">{message}</p>
        </div>
    );
}

function MessageCard({ item, accentColor, iconColor, iconBg, renderIcon }) {
    return (
        <div className="bg-white rounded-2xl overflow-hidden flex"
            style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.07)', border: '1px solid rgba(0,0,0,0.05)' }}>
            <div className="w-1 shrink-0" style={{ background: accentColor }} />
            <div className="flex-1 min-w-0">
                <div className="px-4 pt-3.5 pb-3 flex items-start gap-3">
                    <div className="shrink-0 h-9 w-9 rounded-xl flex items-center justify-center mt-0.5"
                        style={{ background: iconBg }}>
                        {renderIcon(iconColor)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-[14px] font-bold text-gray-800 leading-snug">{item.title}</h3>
                        <span className="text-[11px] text-gray-400 mt-0.5 block">{fmtDate(item.date || item.createdAt)}</span>
                    </div>
                </div>
                <div className="mx-4 h-px" style={{ background: '#f3f4f6' }} />
                <div className="px-4 py-3.5">
                    <p className="text-[13px] text-gray-600 leading-relaxed whitespace-pre-wrap break-words">
                        {renderContent(item.content)}
                    </p>
                    {item.imageUrl && (
                        <img src={item.imageUrl} alt="" className="mt-3 rounded-xl w-full object-cover" style={{ maxHeight: 200 }} />
                    )}
                </div>
            </div>
        </div>
    );
}

const bellIcon = (color) => (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
);

const alertIcon = (color) => (
    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
        <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
            stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const AnnouncementCard = ({ item }) => (
    <MessageCard item={item}
        accentColor="linear-gradient(180deg,#e2b97a,#b1835a)"
        iconColor="#b1835a"
        iconBg="rgba(217,173,130,0.15)"
        renderIcon={bellIcon} />
);

const AlertCard = ({ item }) => (
    <MessageCard item={item}
        accentColor="linear-gradient(180deg,#f97316,#ea580c)"
        iconColor="#f97316"
        iconBg="rgba(249,115,22,0.1)"
        renderIcon={alertIcon} />
);

export default function Announcement() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('announcement');
    const [announcements, setAnnouncements] = useState([]);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const res = await axiosInstance.get('/announcements/user');
                const data = res.data.data || res.data || [];
                setAnnouncements(data.filter(i => i.type === 'global'));
                setMessages(data.filter(i => i.type === 'personal'));
            } catch (err) {
                console.error(err);
                setError('Failed to load announcements');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <div className="flex items-center justify-center min-h-screen" style={{ minHeight: '100dvh' }}>
            <div className="w-full lg:max-w-[400px] mx-auto h-screen flex flex-col overflow-hidden shadow-2xl"
                style={{ height: '100dvh', background: '#f7f8fa' }}>

                {/* ── Header ── */}
                <div className="px-3 py-3 flex items-center gap-3 flex-shrink-0 z-10 text-white"
                    style={{ background: 'linear-gradient(90deg,#d9ad82,#b1835a)' }}>
                    <button onClick={() => navigate(-1)} className="flex items-center shrink-0 opacity-90 hover:opacity-100 transition-opacity">
                        <ArrowBackIosIcon fontSize="small" />
                    </button>

                    <div className="flex-1 flex justify-center">
                        <div className="inline-flex rounded-full overflow-hidden"
                            style={{ border: '1.5px solid rgba(255,255,255,0.7)' }}>
                            {[
                                { key: 'announcement', label: 'Announcement' },
                                { key: 'message',      label: 'My Message'   },
                            ].map(tab => (
                                <button key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className="px-4 py-1.5 text-xs font-semibold transition-all duration-200"
                                    style={{
                                        background: activeTab === tab.key ? 'white' : 'transparent',
                                        color:      activeTab === tab.key ? '#b1835a' : 'white',
                                    }}>
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="w-5 shrink-0" />
                </div>

                {/* ── Content ── */}
                <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-3">
                            <div className="h-8 w-8 rounded-full border-2 animate-spin"
                                style={{ borderColor: '#d9ad82', borderTopColor: 'transparent' }} />
                            <p className="text-[13px] text-gray-400">Loading…</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 text-red-400 text-sm">{error}</div>
                    ) : activeTab === 'announcement' ? (
                        <div className="space-y-3">
                            {announcements.length === 0
                                ? <EmptyState message="No announcements yet" isAlert={false} />
                                : announcements.map(item => <AnnouncementCard key={item._id} item={item} />)
                            }
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {messages.length === 0
                                ? <EmptyState message="No system alerts" isAlert={true} />
                                : messages.map(item => <AlertCard key={item._id} item={item} />)
                            }
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
