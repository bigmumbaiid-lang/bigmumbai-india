import React, { useEffect, useState, useRef, useCallback } from 'react';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import TuneIcon from '@mui/icons-material/Tune';
import CheckIcon from '@mui/icons-material/Check';
import axios from '../utils/axios';
import { useNavigate } from 'react-router-dom';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

// Small channel marks — same fixed-brand-color treatment as the Recharge page's
// channel selector (not recolored to match surrounding text, like a Visa/Mastercard mark).
const TrxSVG = ({ size = 13 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <polygon points="12,3 22,11 12,21 2,11" fill="#EF0027" />
        <polygon points="12,3 22,11 12,14 2,11" fill="#ff4d5e" />
    </svg>
);
const UsdtSVG = ({ size = 13 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="11" fill="#26A17B" />
        <rect x="7.2" y="6.2" width="9.6" height="3.1" fill="#fff" />
        <rect x="10.4" y="6.2" width="3.2" height="11.6" fill="#fff" />
        <ellipse cx="12" cy="12.3" rx="5.6" ry="1.9" stroke="#fff" strokeWidth="1.3" fill="none" />
    </svg>
);
const CHANNEL_ICONS = { trx: TrxSVG, usdt: UsdtSVG };

// Filter options — value is sent to the API as ?type=, 'all' omits the param
const FILTERS = [
    { value: 'all', label: 'All transactions' },
    { value: 'payment', label: 'Recharge' },
    { value: 'withdrawal', label: 'Withdrawal' },
    { value: 'transfer', label: 'Transfer' },
    { value: 'gift', label: 'Gift' },
    { value: 'mines', label: 'Mines Game' },
    { value: 'blackjack', label: 'Blackjack' },   // <-- add this
];

function Transaction() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);

    const [filter, setFilter] = useState('all');
    const [filterOpen, setFilterOpen] = useState(false);

    const navigate = useNavigate();
    const observer = useRef();

    const activeFilter = FILTERS.find(f => f.value === filter) || FILTERS[0];

    const fetchTransactions = useCallback(async (pageNum, append = false, type = 'all') => {
        try {
            const typeParam = type !== 'all' ? `&type=${type}` : '';
            const response = await axios.get(`/payment?page=${pageNum}&limit=15${typeParam}`);

            const newTransactions = response.data?.transactions || [];

            setTransactions(prev => (append ? [...prev, ...newTransactions] : newTransactions));
            setHasMore(response.data?.pagination?.hasMore ?? newTransactions.length === 15);
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
            setHasMore(false);
        }
    }, []);

    const loadMore = useCallback(async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        const nextPage = page + 1;
        await fetchTransactions(nextPage, true, filter);
        setPage(nextPage);
        setLoadingMore(false);
    }, [loadingMore, hasMore, page, filter, fetchTransactions]);

    const lastElementRef = useCallback(node => {
        if (loadingMore) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                loadMore();
            }
        });

        if (node) observer.current.observe(node);
    }, [loadingMore, hasMore, loadMore]);

    // Initial load + refetch whenever the filter changes
    useEffect(() => {
        const run = async () => {
            setLoading(true);
            setPage(1);
            setHasMore(true);
            await fetchTransactions(1, false, filter);
            setLoading(false);
        };
        run();
    }, [filter, fetchTransactions]);

    // Clean up observer on unmount
    useEffect(() => {
        return () => observer.current?.disconnect();
    }, []);

    const selectFilter = (value) => {
        setFilterOpen(false);
        if (value !== filter) setFilter(value); // triggers the effect above
    };

    const getTransactionDisplay = (item) => {
        const amt = Number(item.amount || 0);
        if (item.type === 'payment') {
            return {
                title: item.title || 'Recharge',
                icon: CHANNEL_ICONS[item.channel] || null,
                amount: `+${amt.toFixed(2)}`,
                amountColor: 'text-[#03a112]',
            };
        }
        else if (item.type === 'withdrawal') {
            return { title: 'Withdrawal', amount: `-${Math.abs(amt).toFixed(2)}`, amountColor: 'text-red-500' };
        }
        else if (item.type === 'transfer') {
            const isCredit = amt >= 0;
            return {
                title: item.title || (item.transferType === 'increase' ? 'Manual Recharge' : 'Deduction'),
                amount: isCredit ? `+${amt.toFixed(2)}` : `-${Math.abs(amt).toFixed(2)}`,
                amountColor: isCredit ? 'text-[#03a112]' : 'text-red-500',
                titleColor: isCredit ? 'text-gray-800' : 'text-red-500',
            };
        }
        else if (item.type === 'gift') {
            return { title: item.giftName || 'Gift Claim', amount: `+${amt.toFixed(2)}`, amountColor: 'text-[#03a112]' };
        }
        else if (item.type === 'mines') {
            return {
                title: 'Mines Game',
                amount: amt >= 0 ? `+${amt.toFixed(2)}` : `-${Math.abs(amt).toFixed(2)}`,
                amountColor: amt >= 0 ? 'text-[#03a112]' : 'text-red-500',
            };
        }
        else if (item.type === 'blackjack') {
            return {
                title: 'Blackjack',
                amount: amt >= 0 ? `+${amt.toFixed(2)}` : `-${Math.abs(amt).toFixed(2)}`,
                amountColor: amt >= 0 ? 'text-[#03a112]' : 'text-red-500',
            };
        }
        return { title: 'Unknown', amount: '0.00', amountColor: 'text-gray-500' };
    };

    // Reusable header so it's identical in loading and loaded states
    const Header = (
        <div
            className="p-4 text-white flex items-center justify-between flex-shrink-0 z-10"
            style={{ background: 'linear-gradient(90deg,#d9ad82,#b1835a)' }}
        >
            <div className="cursor-pointer flex items-center gap-2" onClick={() => navigate('/profile')}>
                <ArrowBackIosIcon fontSize="small" />
                <span className="text-sm">Transaction Record</span>
            </div>

            {/* Filter trigger */}
            <button
                onClick={() => setFilterOpen(true)}
                className="flex items-center gap-1.5 bg-white/20 active:bg-white/30 rounded-full pl-3 pr-2.5 py-1 transition-colors"
            >
                <TuneIcon sx={{ fontSize: 16 }} />
                <span className="text-xs font-medium">{activeFilter.label === 'All transactions' ? 'All' : activeFilter.label}</span>
            </button>
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen" style={{ minHeight: '100dvh' }}>
                <div
                    className="w-full lg:max-w-[400px] mx-auto h-screen flex flex-col overflow-hidden shadow-2xl border border-gray-300"
                    style={{ height: '100dvh' }}
                >
                    {Header}
                    <div className="flex-1 flex items-center justify-center">
                        <Box sx={{ display: 'flex' }}>
                            <CircularProgress />
                        </Box>
                    </div>
                </div>
                {filterSheet()}
            </div>
        );
    }

    function filterSheet() {
        if (!filterOpen) return null;
        return (
            <div className="fixed inset-0 z-50 flex items-end justify-center">
                {/* backdrop */}
                <div
                    className="absolute inset-0 bg-black/40 animate-fadeIn"
                    onClick={() => setFilterOpen(false)}
                />
                {/* sheet — constrained to the app column width */}
                <div className="relative w-full lg:max-w-[400px] bg-white rounded-t-2xl shadow-2xl animate-slideUp pb-[env(safe-area-inset-bottom)]">
                    <div className="flex items-center justify-center pt-3 pb-1">
                        <div className="w-10 h-1 rounded-full bg-gray-300" />
                    </div>
                    <p className="text-center text-sm font-bold text-gray-800 py-2">Filter by type</p>
                    <div className="max-h-[60vh] overflow-y-auto pb-2">
                        {FILTERS.map(f => {
                            const selected = f.value === filter;
                            return (
                                <button
                                    key={f.value}
                                    onClick={() => selectFilter(f.value)}
                                    className={`w-full flex items-center justify-between px-5 py-3.5 text-sm active:bg-gray-50 ${selected ? 'text-[#b1835a] font-semibold' : 'text-gray-700'
                                        }`}
                                >
                                    <span>{f.label}</span>
                                    {selected && <CheckIcon sx={{ fontSize: 18 }} className="text-[#b1835a]" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen" style={{ minHeight: '100dvh' }}>
            {/* h-screen is the fallback; 100dvh (inline) wins on iOS and tracks the Safari toolbar */}
            <div
                className="w-full lg:max-w-[400px] mx-auto h-screen flex flex-col overflow-hidden shadow-2xl border border-gray-300"
                style={{ height: '100dvh' }}
            >

                {Header}

                {/* Content. min-h-0 is required for flex children to scroll on iOS */}
                <div
                    className="flex-1 min-h-0 overflow-y-auto"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                >
                    {transactions.length === 0 ? (
                        <div className="text-center py-16 text-gray-400">
                            No {filter === 'all' ? '' : activeFilter.label.toLowerCase() + ' '}transactions found
                        </div>
                    ) : (
                        transactions.map((item, index) => {
                            const isLast = index === transactions.length - 1;
                            const display = getTransactionDisplay(item);

                            return (
                                <div key={item._id ?? index} ref={isLast ? lastElementRef : null}>
                                    <div className="flex justify-between py-3 px-5">
                                        <div className="flex flex-col gap-1">
                                            <span className={`font-medium flex items-center gap-1.5 ${display.titleColor || (display.amountColor.includes('red') ? 'text-red-500' : 'text-gray-800')}`}>
                                                {display.title}
                                                {display.icon && <display.icon />}
                                            </span>
                                            <p className="text-sm text-[#aaa]">
                                                {new Date(item.successAt || item.date)
                                                    .toLocaleString("sv-SE", { timeZone: "Asia/Kolkata" })
                                                    .replace(",", "")}
                                            </p>
                                        </div>

                                        <span className={display.amountColor}>
                                            {display.amount}
                                        </span>
                                    </div>

                                    <div className="w-[90%] mx-auto border-b border-gray-100"></div>
                                </div>
                            );
                        })
                    )}

                    {loadingMore && (
                        <div className="flex justify-center py-6">
                            <CircularProgress size={24} />
                        </div>
                    )}

                    {!hasMore && transactions.length > 0 && (
                        <div className="text-center py-6 text-gray-400 text-sm">
                            No more transactions
                        </div>
                    )}
                </div>
            </div>

            {filterSheet()}

            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to   { transform: translateY(0); }
                }
                .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
                .animate-slideUp { animation: slideUp 0.28s cubic-bezier(0.32, 0.72, 0, 1); }
            `}</style>
        </div>
    );
}

export default Transaction;