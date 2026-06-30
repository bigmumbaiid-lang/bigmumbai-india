import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import axiosInstance from '../utils/axios';

// Splits text into plain-text and URL parts, returns mixed array
const URL_RE = /(https?:\/\/[^\s]+)/g;

function renderContent(text) {
    if (!text) return null;
    const parts = text.split(URL_RE);
    return parts.map((part, i) =>
        URL_RE.test(part) ? (
            <a
                key={i}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline underline-offset-2 break-all"
                style={{ color: '#b1835a' }}
                onClick={e => e.stopPropagation()}
            >
                {part}
            </a>
        ) : (
            <span key={i}>{part}</span>
        )
    );
}

function fmtDate(raw) {
    if (!raw) return '';
    const d = new Date(raw);
    if (isNaN(d)) return raw;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Bell SVG icon
function BellIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
    );
}

// Mail SVG icon
function MailIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
    );
}

// Empty state
function EmptyState({ message }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#fdf3e8,#f5dfc0)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#d9ad82" strokeWidth="1.5"
                    className="w-8 h-8">
                    <path strokeLinecap="round" strokeLinejoin="round"
                        d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2" />
                </svg>
            </div>
            <p className="text-sm text-gray-400 font-medium">{message}</p>
        </div>
    );
}

function AnnouncementCard({ item, icon: Icon, accentColor }) {
    return (
        <div className="overflow-hidden rounded-2xl shadow-md" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
            {/* Gradient header */}
            <div
                className="flex items-center gap-3 px-4 py-3.5"
                style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)` }}
            >
                <div className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 text-white"
                    style={{ background: 'rgba(255,255,255,0.18)' }}>
                    <Icon />
                </div>
                <h3 className="flex-1 min-w-0 font-bold text-white text-[15px] leading-snug truncate">
                    {item.title}
                </h3>
                <span className="text-[11px] font-semibold text-white/80 shrink-0">
                    {fmtDate(item.date || item.createdAt)}
                </span>
            </div>

            {/* White body */}
            <div className="bg-white px-4 py-4">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                    {renderContent(item.content)}
                </p>
                {item.imageUrl && (
                    <img
                        src={item.imageUrl}
                        alt=""
                        className="mt-3 rounded-xl w-full object-cover"
                        style={{ maxHeight: 220 }}
                    />
                )}
            </div>
        </div>
    );
}

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
            <div
                className="w-full lg:max-w-[400px] mx-auto h-screen flex flex-col overflow-hidden shadow-2xl"
                style={{ height: '100dvh', background: '#f5f5f5' }}
            >
                {/* ── Header ── */}
                <div
                    className="px-3 py-3 flex items-center gap-3 flex-shrink-0 z-10 text-white"
                    style={{ background: 'linear-gradient(90deg, #d9ad82, #b1835a)' }}
                >
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center shrink-0 opacity-90 hover:opacity-100 transition-opacity"
                    >
                        <ArrowBackIosIcon fontSize="small" />
                    </button>

                    <div className="flex-1 flex justify-center">
                        <div
                            className="inline-flex rounded-full overflow-hidden"
                            style={{ border: '1.5px solid rgba(255,255,255,0.7)' }}
                        >
                            {[
                                { key: 'announcement', label: 'Announcement' },
                                { key: 'message',      label: 'My Message' },
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className="px-4 py-1.5 text-xs font-semibold transition-all duration-200"
                                    style={{
                                        background: activeTab === tab.key ? 'white' : 'transparent',
                                        color:      activeTab === tab.key ? '#b1835a' : 'white',
                                    }}
                                >
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
                            <div
                                className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin"
                                style={{ borderColor: '#d9ad82', borderTopColor: 'transparent' }}
                            />
                            <p className="text-sm text-gray-400">Loading…</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12 text-red-400 text-sm">{error}</div>
                    ) : activeTab === 'announcement' ? (
                        <div className="space-y-4">
                            {announcements.length === 0 ? (
                                <EmptyState message="No announcements available" />
                            ) : (
                                announcements.map(item => (
                                    <AnnouncementCard
                                        key={item._id}
                                        item={item}
                                        icon={BellIcon}
                                        accentColor="#b1835a"
                                    />
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {messages.length === 0 ? (
                                <EmptyState message="No personal messages yet" />
                            ) : (
                                messages.map(item => (
                                    <AnnouncementCard
                                        key={item._id}
                                        item={item}
                                        icon={MailIcon}
                                        accentColor="#7c6fd4"
                                    />
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
