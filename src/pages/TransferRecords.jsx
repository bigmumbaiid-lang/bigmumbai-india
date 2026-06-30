import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import axios from '../utils/axios';
import { AuthContext } from '../context/AuthContext';

function fmtDate(d) {
    return new Date(d)
        .toLocaleString('sv-SE', { timeZone: 'Asia/Kolkata' })
        .replace(',', '');
}

export default function TransferRecords() {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);

    const [transfers, setTransfers]     = useState([]);
    const [loading, setLoading]         = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore]         = useState(true);
    const [page, setPage]               = useState(1);
    const observer = useRef();

    const fetchTransfers = useCallback(async (pageNum, append = false) => {
        try {
            const res   = await axios.get('/transfers/my', { params: { page: pageNum, limit: 20 } });
            const items = res.data.transfers || [];
            setTransfers(prev => append ? [...prev, ...items] : items);
            setHasMore(res.data.pagination?.hasMore ?? items.length === 20);
        } catch {
            setHasMore(false);
        }
    }, []);

    const loadMore = useCallback(async () => {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
        const next = page + 1;
        await fetchTransfers(next, true);
        setPage(next);
        setLoadingMore(false);
    }, [loadingMore, hasMore, page, fetchTransfers]);

    const lastElementRef = useCallback(node => {
        if (loadingMore) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) loadMore();
        });
        if (node) observer.current.observe(node);
    }, [loadingMore, hasMore, loadMore]);

    useEffect(() => {
        if (user && user.role !== 'admin') { navigate(-1); return; }
    }, [user, navigate]);

    useEffect(() => {
        if (!user || user.role !== 'admin') return;
        const run = async () => {
            setLoading(true);
            setPage(1);
            setHasMore(true);
            await fetchTransfers(1, false);
            setLoading(false);
        };
        run();
        return () => observer.current?.disconnect();
    }, [fetchTransfers, user]);

    if (!user || user.role !== 'admin') return null;

    const Header = (
        <div
            className="p-4 text-white flex items-center justify-between flex-shrink-0 z-10"
            style={{ background: 'linear-gradient(90deg,#d9ad82,#b1835a)' }}
        >
            <div className="cursor-pointer flex items-center gap-2" onClick={() => navigate(-1)}>
                <ArrowBackIosIcon fontSize="small" />
                <span className="text-sm">Transfer Records</span>
            </div>
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
                        <Box sx={{ display: 'flex' }}><CircularProgress /></Box>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center min-h-screen" style={{ minHeight: '100dvh' }}>
            <div
                className="w-full lg:max-w-[400px] mx-auto h-screen flex flex-col overflow-hidden shadow-2xl border border-gray-300"
                style={{ height: '100dvh' }}
            >
                {Header}

                {/* Content — min-h-0 required so flex child can scroll on iOS */}
                <div
                    className="flex-1 min-h-0 overflow-y-auto"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                >
                    {transfers.length === 0 ? (
                        <div className="text-center py-16 text-gray-400">No transfer records found</div>
                    ) : (
                        transfers.map((t, index) => {
                            const sent   = t.direction === 'sent';
                            const isLast = index === transfers.length - 1;
                            const amt    = Number(t.amount || 0);

                            return (
                                <div key={t._id ?? index} ref={isLast ? lastElementRef : null}>
                                    <div className="flex justify-between py-3 px-5">
                                        <div className="flex flex-col gap-1">
                                            <span className={`font-medium ${sent ? 'text-red-500' : 'text-gray-800'}`}>
                                                {sent
                                                    ? `Transfer to ${t.otherUser?.username ?? '—'}`
                                                    : `Transfer from ${t.otherUser?.username ?? '—'}`}
                                            </span>
                                            <p className="text-sm text-[#aaa]">{fmtDate(t.createdAt)}</p>
                                        </div>
                                        <span className={`font-medium self-center ${sent ? 'text-red-500' : 'text-[#03a112]'}`}>
                                            {sent ? `-${amt.toFixed(2)}` : `+${amt.toFixed(2)}`}
                                        </span>
                                    </div>
                                    <div className="w-[90%] mx-auto border-b border-gray-100" />
                                </div>
                            );
                        })
                    )}

                    {loadingMore && (
                        <div className="flex justify-center py-6">
                            <CircularProgress size={24} />
                        </div>
                    )}

                    {!hasMore && transfers.length > 0 && (
                        <div className="text-center py-6 text-gray-400 text-sm">No more records</div>
                    )}
                </div>
            </div>
        </div>
    );
}
