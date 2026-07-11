import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';
import toast, { Toaster } from 'react-hot-toast';
import SearchIcon from '@mui/icons-material/Search';
import BackButton from '../components/BackButton';

function ReferredUser() {
    const navigate = useNavigate();
    const [referredUsers, setReferredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const limit = 10;

    // Debounce the search input (waits 400ms after typing stops)
    useEffect(() => {
        const t = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1); // reset to first page when search term changes
        }, 400);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => {
        const fetchReferredUsers = async () => {
            setLoading(true);
            try {
                const response = await axios.post('/user/referred', {
                    page,
                    limit,
                    search: debouncedSearch,
                });
                setReferredUsers(response.data?.users || []);
                setTotalPages(response.data?.totalPages || 1);
                setTotalUsers(response.data?.total || 0);
            } catch (error) {
                toast.error('Failed to load referrals');
                setReferredUsers([]);
                setTotalPages(1);
            } finally {
                setLoading(false);
            }
        };
        fetchReferredUsers();
    }, [page, debouncedSearch]);

    return (
        <div
            className="bg-[#f7f8ff] flex justify-center min-h-screen"
            style={{ minHeight: '100dvh' }}
        >
            <Toaster position="top-center" />

            {/* h-screen is the fallback; 100dvh (inline) wins on iOS and tracks the Safari toolbar */}
            <div
                className="w-full lg:max-w-[400px] mx-auto h-screen flex flex-col overflow-hidden shadow-2xl border border-gray-300 bg-white"
                style={{ height: '100dvh' }}
            >

                {/* Header — wrapped so it can't be compressed by the flex column */}
                <div className="flex-shrink-0">
                    <BackButton label="My referrals" />
                </div>

                {/* Total count strip */}
                <div className="flex-shrink-0 px-4 py-2.5 bg-[#fff9f0] border-b border-[#f5e6d0] flex items-center justify-between">
                    <span className="text-sm text-gray-500">Total referrals</span>
                    <span className="text-base font-bold text-[#b1835a]">{totalUsers}</span>
                </div>

                {/* Search Bar */}
                <div className="flex-shrink-0 p-3 bg-white border-b border-gray-100">
                    <div className="relative">
                        <SearchIcon
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            sx={{ fontSize: 20 }}
                        />
                        <input
                            type="text"
                            placeholder="Search username…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#d8ab83]/40"
                        />
                    </div>
                </div>

                {/* Table Header */}
                <div className="flex-shrink-0 bg-gray-50 border-b border-gray-200 px-4 py-2.5 grid grid-cols-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    <div>Username</div>
                    <div className="text-center">Registered</div>
                    <div className="text-right">Contribution</div>
                </div>

                {/* Table Body — the only scrolling region. min-h-0 is required for flex scroll on iOS */}
                <div
                    className="flex-1 min-h-0 overflow-y-auto bg-white"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                >
                    {loading ? (
                        // Skeleton rows — keeps layout stable while loading
                        <div>
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="grid grid-cols-3 px-4 py-4 border-b border-gray-50 animate-pulse">
                                    <div className="h-4 bg-gray-100 rounded w-20" />
                                    <div className="h-4 bg-gray-100 rounded w-24 mx-auto" />
                                    <div className="h-4 bg-gray-100 rounded w-12 ml-auto" />
                                </div>
                            ))}
                        </div>
                    ) : referredUsers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                            <span className="text-3xl mb-2">👥</span>
                            <p className="text-sm">
                                {debouncedSearch ? 'No users match your search' : 'No referred users yet'}
                            </p>
                        </div>
                    ) : (
                        <>
                            {referredUsers.map((user, index) => (
                                <div
                                    key={user._id || index}
                                    className="grid grid-cols-3 px-4 py-3.5 border-b border-gray-50 hover:bg-gray-50 items-center"
                                >
                                    <div className="font-medium text-gray-800 text-sm truncate pr-2">
                                        {user.username}
                                    </div>
                                    <div className="text-center text-xs text-gray-500">
                                        {user.createdAt
                                            ? new Date(user.createdAt).toLocaleDateString('en-IN', {
                                                timeZone: 'Asia/Kolkata',
                                                day: '2-digit',
                                                month: 'short',
                                                year: '2-digit',
                                            })
                                            : '-'}
                                    </div>
                                    <div className="text-right text-emerald-600 font-semibold text-sm">
                                        +{Number(user.contribution || 0).toFixed(2)}
                                    </div>
                                </div>
                            ))}

                            {/* End marker — only on the last page with data */}
                            {page === totalPages && (
                                <div className="py-6 text-center text-gray-300 text-xs">
                                    — End —
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex-shrink-0 px-4 py-3 bg-white border-t border-gray-100 flex justify-between items-center">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1 || loading}
                            className="px-4 py-1.5 text-sm rounded-lg bg-gray-100 text-gray-600 disabled:opacity-40 hover:bg-gray-200 transition-colors"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-gray-500">
                            Page {page} of {totalPages}
                        </span>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages || loading}
                            className="px-4 py-1.5 text-sm rounded-lg bg-gray-100 text-gray-600 disabled:opacity-40 hover:bg-gray-200 transition-colors"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ReferredUser; 