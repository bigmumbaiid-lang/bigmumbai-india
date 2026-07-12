import React from 'react'
import axios from '../utils/axios'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import BackButton from '../components/BackButton'

// Same fixed-brand-color marks as the Recharge page's channel selector — not
// recolored to match surrounding text, like a Visa/Mastercard mark would stay put.
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

function RechargeRecords() {
    const navigate = useNavigate()

    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(1);

    const observer = useRef();
    const didInit = useRef(false); // guards StrictMode double-fetch

    const fetchTransactions = useCallback(async (pageNum = 1, append = false) => {
        try {
            const response = await axios.get(
                `/payment/recharge-record?status=all&page=${pageNum}&limit=15`
            );
            const newTransactions = response.data?.transactions || [];

            setTransactions(prev => (append ? [...prev, ...newTransactions] : newTransactions));
            setHasMore(Boolean(response.data?.pagination?.hasMore));
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
            setHasMore(false);
        }
    }, []);

    const loadMoreTransactions = useCallback(async () => {
        if (loadingMore || !hasMore) return;

        setLoadingMore(true);
        const nextPage = page + 1;
        await fetchTransactions(nextPage, true);
        setPage(nextPage);
        setLoadingMore(false);
    }, [loadingMore, hasMore, page, fetchTransactions]);

    const lastTransactionRef = useCallback(node => {
        if (loadingMore) return;
        if (observer.current) observer.current.disconnect();

        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                loadMoreTransactions();
            }
        });

        if (node) observer.current.observe(node);
    }, [loadingMore, hasMore, loadMoreTransactions]);

    // Initial load — guarded against StrictMode double-run, loading cleared after fetch
    useEffect(() => {
        if (didInit.current) return;
        didInit.current = true;

        (async () => {
            await fetchTransactions(1, false);
            setLoading(false);
        })();
    }, [fetchTransactions]);

    // Clean up the observer on unmount
    useEffect(() => {
        return () => observer.current?.disconnect();
    }, []);

    if (loading) {
        return (
            <div
                className="flex items-center justify-center min-h-screen"
                style={{ minHeight: '100dvh' }}
            >
                <div
                    className="w-full lg:max-w-[400px] mx-auto h-screen flex flex-col overflow-hidden shadow-2xl border border-gray-300"
                    style={{ height: '100dvh' }}
                >
                    <div className="w-full flex-1 flex items-center justify-center">
                        <Box sx={{ display: 'flex' }}>
                            <CircularProgress />
                        </Box>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div
            className="flex items-center justify-center min-h-screen"
            style={{ minHeight: '100dvh' }}
        >
            {/* h-screen is the fallback; 100dvh (inline) wins on iOS and tracks the Safari toolbar */}
            <div
                className="w-full lg:max-w-[400px] mx-auto h-screen flex flex-col overflow-hidden shadow-2xl border border-gray-300"
                style={{ height: '100dvh' }}
            >

                {/* Header — pulled OUT of the scroll area so it stays pinned */}
                <div className="flex-shrink-0">
                    <BackButton label={"Recharge Record"} />
                </div>

                {/* Scrollable list. min-h-0 is required for flex children to scroll on iOS */}
                <div
                    className="flex-1 min-h-0 overflow-y-auto"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                >
                    <div className="flex-1">
                        {transactions.map((item, index) => {
                            const isLast = index === transactions.length - 1;

                            const isUsdt    = item.channel === 'usdt';
                            const isTrx     = item.channel === 'trx';
                            const isExpired = item.status === 'expired' || item.status === 'cancelled';
                            const isSuccess = item.status === 'success' || item.status === 'completed';

                            const label = isSuccess ? 'Successful' : isExpired ? 'Expired' : 'Pending';

                            return (
                                <div
                                    key={item._id ?? index}
                                    ref={isLast ? lastTransactionRef : null}
                                >
                                    <div className='flex justify-between py-3 px-5'>
                                        <div className='flex flex-col gap-1'>
                                            <span className={`flex items-center gap-1.5 ${isExpired ? 'text-gray-400 font-medium' : 'text-gray-800 font-medium'}`}>
                                                {label}
                                                {isUsdt && <UsdtSVG />}
                                                {isTrx && <TrxSVG />}
                                            </span>
                                            <p className='text-sm text-[#aaa]'>
                                                {new Date(item.createdAt)
                                                    .toLocaleString("sv-SE", { timeZone: "Asia/Kolkata" })
                                                    .replace(",", "")}
                                            </p>
                                        </div>
                                        <span className={isExpired ? 'text-gray-400' : 'text-[#03a112]'}>
                                            +{Number(item.amount || 0).toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="w-[90%] mx-auto border-b border-gray-100"></div>
                                </div>
                            );
                        })}

                        {transactions.length === 0 && (
                            <div className="text-center py-12 text-gray-400">
                                No recharge records yet
                            </div>
                        )}

                        {loadingMore && (
                            <div className="text-center py-4 text-gray-500">
                                Loading more...
                            </div>
                        )}

                        {!hasMore && transactions.length > 0 && (
                            <div className="text-center py-4 text-gray-500">
                                No more transactions
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}

export default RechargeRecords