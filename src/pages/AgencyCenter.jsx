import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import axios from '../utils/axios';

const BRAND_GRAD = 'linear-gradient(90deg, #d9ad82, #b1835a)';
const BRAND_C    = '#b1835a';
const PAGE_SIZE  = 20;

const DATE_OPTS = [
    { key: 'all',   label: 'All' },
    { key: 'today', label: 'Today' },
    { key: 'week',  label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'last',  label: 'Last Month' },
];

const SOURCE_NOTE = {
    watchpays: 'WatchPay', jazpays: 'JazPay',
    usdt: 'USDT TRC20', trx: 'TRX', gateway: 'Gateway',
};

const txnLabel = (type, source) => {
    if (type === 'withdrawal') return 'Withdrawal';
    if (source === 'admin') return 'Manual Recharge';
    const note = SOURCE_NOTE[source];
    return note ? `Recharge · ${note}` : 'Recharge';
};

const fmtDate = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
};

const inr = (v) =>
    Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function AgencyCenter() {
    const navigate = useNavigate();

    const [stats, setStats]             = useState(null);
    const [txns, setTxns]               = useState([]);
    const [page, setPage]               = useState(1);
    const [hasMore, setHasMore]         = useState(true);
    const [loading, setLoading]         = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch]           = useState('');
    const [dateFilter, setDateFilter]   = useState('all');
    const [typeFilter, setTypeFilter]   = useState('all');
    const [dateOpen, setDateOpen]       = useState(false);

    const sentinelRef = useRef(null);
    const loadingRef  = useRef(false);
    const debounceRef = useRef(null);

    /* ── Stats ── */
    useEffect(() => {
        axios.get('/user/agency/stats').then(r => setStats(r.data.stats)).catch(() => {});
    }, []);

    /* ── Transactions ── */
    const fetchPage = useCallback(async (pg, replace = false) => {
        if (loadingRef.current) return;
        loadingRef.current = true;
        setLoading(true);
        try {
            const { data } = await axios.get('/user/agency/transactions', {
                params: { type: typeFilter, dateFilter, search, page: pg, limit: PAGE_SIZE },
            });
            const rows = data.transactions || [];
            setTxns(prev => replace ? rows : [...prev, ...rows]);
            setHasMore(Boolean(data.hasMore));
            setPage(pg);
        } catch { }
        finally { setLoading(false); loadingRef.current = false; }
    }, [typeFilter, dateFilter, search]);

    useEffect(() => {
        setTxns([]); setPage(1); setHasMore(true);
        fetchPage(1, true);
    }, [fetchPage]);

    useEffect(() => {
        if (!sentinelRef.current || !hasMore) return;
        const obs = new IntersectionObserver(
            e => { if (e[0].isIntersecting && hasMore && !loadingRef.current) fetchPage(page + 1); },
            { rootMargin: '100px' }
        );
        obs.observe(sentinelRef.current);
        return () => obs.disconnect();
    }, [page, hasMore, fetchPage]);

    const handleSearch = (val) => {
        setSearchInput(val);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => setSearch(val.trim()), 400);
    };

    const activeDateLabel = DATE_OPTS.find(d => d.key === dateFilter)?.label || 'All';

    const TABS = [
        { key: 'all',        label: 'All types' },
        { key: 'recharge',   label: 'Recharge record' },
        { key: 'withdrawal', label: 'Withdrawals' },
    ];

    return (
        <div className="flex items-center justify-center min-h-screen" style={{ minHeight: '100dvh', background: '#f7f8ff' }}>
            <div className="w-full lg:max-w-[400px] mx-auto flex flex-col overflow-hidden shadow-2xl" style={{ height: '100dvh', background: '#f7f8ff' }}>

                {/* ── Header (matches Transaction page style) ── */}
                <div className="flex-shrink-0 p-4 flex items-center justify-between text-white" style={{ background: BRAND_GRAD }}>
                    <div className="cursor-pointer flex items-center gap-2" onClick={() => navigate(-1)}>
                        <ArrowBackIosIcon fontSize="small" />
                        <span className="text-sm">Agency Center</span>
                    </div>

                    {/* Date filter pill */}
                    <div className="relative">
                        <button
                            onClick={() => setDateOpen(v => !v)}
                            className="flex items-center gap-1 text-white text-sm font-medium bg-white/20 active:bg-white/30 rounded-full px-3 py-1 transition-colors"
                        >
                            {activeDateLabel}
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                <path d="M6 9l6 6 6-6" stroke="white" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </button>

                        {dateOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setDateOpen(false)} />
                                <div className="absolute right-0 top-9 z-50 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden min-w-[130px]">
                                    {DATE_OPTS.map(d => (
                                        <button
                                            key={d.key}
                                            onClick={() => { setDateFilter(d.key); setDateOpen(false); }}
                                            className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-gray-50"
                                            style={{ color: dateFilter === d.key ? BRAND_C : '#374151', fontWeight: dateFilter === d.key ? 600 : 400 }}
                                        >
                                            {d.label}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* ── Search bar ── */}
                <div className="flex-shrink-0 px-4 py-3 bg-white border-b border-gray-100">
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-4 py-2.5" style={{ borderRadius: '999px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                            <circle cx="11" cy="11" r="7" stroke="#9ca3af" strokeWidth="2" />
                            <path d="M16.5 16.5l4 4" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        <input
                            type="text"
                            value={searchInput}
                            onChange={e => handleSearch(e.target.value)}
                            placeholder="Search subordinate transactions..."
                            className="flex-1 text-xs text-gray-700 bg-transparent outline-none placeholder-gray-400"
                        />
                        {searchInput && (
                            <button onClick={() => { setSearchInput(''); setSearch(''); }} className="flex-shrink-0">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                                    <path d="M6 6l12 12M18 6L6 18" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Type tabs ── */}
                <div className="flex-shrink-0 bg-white border-b border-gray-100">
                    <div className="flex">
                        {TABS.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setTypeFilter(tab.key)}
                                className="flex-1 py-3 text-xs font-semibold transition-colors relative"
                                style={{ color: typeFilter === tab.key ? BRAND_C : '#9ca3af' }}
                            >
                                {tab.label}
                                {typeFilter === tab.key && (
                                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full" style={{ background: BRAND_C }} />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Stats row ── */}
                {stats && (
                    <div className="flex-shrink-0 bg-white border-b border-gray-100 px-4 py-2 flex items-center justify-between">
                        <span className="text-[11px] text-gray-400">{stats.totalSubordinates} subordinates</span>
                        <div className="flex items-center gap-3">
                            <span className="text-[11px] text-gray-400">
                                Recharge <span className="text-emerald-600 font-semibold">₹{inr(stats.totalRecharge)}</span>
                            </span>
                            <span className="text-[11px] text-gray-400">
                                Withdrawal <span className="text-red-500 font-semibold">₹{inr(stats.totalWithdrawal)}</span>
                            </span>
                        </div>
                    </div>
                )}

                {/* ── List ── */}
                <div className="flex-1 min-h-0 overflow-y-auto bg-white" style={{ WebkitOverflowScrolling: 'touch' }}>

                    {!loading && txns.length === 0 && (
                        <div className="text-center py-16 text-gray-400 text-sm">
                            End.
                        </div>
                    )}

                    {txns.map((t, i) => {
                        const isRecharge = t.type === 'recharge';
                        const color = isRecharge ? '#059669' : '#dc2626';
                        const sign  = isRecharge ? '+' : '-';
                        return (
                            <div key={i}>
                                <div className="flex items-start justify-between px-5 py-3.5">
                                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                        <span className="text-sm font-medium text-gray-800 truncate">
                                            {t.username || '—'}
                                        </span>
                                        <span className="text-xs" style={{ color }}>
                                            {txnLabel(t.type, t.source)}
                                        </span>
                                        <span className="text-xs text-gray-400">{fmtDate(t.createdAt)}</span>
                                    </div>
                                    <span className="text-sm font-semibold ml-4 flex-shrink-0" style={{ color }}>
                                        {sign}₹{inr(t.amount)}
                                    </span>
                                </div>
                                <div className="w-[90%] mx-auto border-b border-gray-100" />
                            </div>
                        );
                    })}

                    {loading && (
                        <div className="space-y-0">
                            {[...Array(6)].map((_, i) => (
                                <div key={i}>
                                    <div className="flex items-center justify-between px-5 py-3.5 animate-pulse">
                                        <div className="flex flex-col gap-1.5 flex-1">
                                            <div className="h-3 bg-gray-100 rounded-full w-1/3" />
                                            <div className="h-2.5 bg-gray-100 rounded-full w-1/2" />
                                            <div className="h-2.5 bg-gray-100 rounded-full w-2/5" />
                                        </div>
                                        <div className="h-4 bg-gray-100 rounded-full w-16 ml-4" />
                                    </div>
                                    <div className="w-[90%] mx-auto border-b border-gray-100" />
                                </div>
                            ))}
                        </div>
                    )}

                    {hasMore && <div ref={sentinelRef} className="h-4" />}

                    {!hasMore && txns.length > 0 && (
                        <div className="text-center py-6 text-gray-400 text-sm">End.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
