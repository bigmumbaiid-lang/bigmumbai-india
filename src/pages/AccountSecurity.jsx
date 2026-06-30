import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import axios from '../utils/axios';

function AccountSecurity() {
    const navigate = useNavigate();
    const [hasBankCard, setHasBankCard] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBankCard = async () => {
            try {
                const res = await axios.get('/bank-card/get-bank-card');
                const card = res.data?.data ?? res.data?.bankCard ?? res.data;
                const exists = !!card && typeof card === 'object' && (card._id || card.bankAccount);
                setHasBankCard(!!exists);
            } catch (error) {
                console.error('Failed to check bank card:', error?.response?.status);
                setHasBankCard(false);
            } finally {
                setLoading(false);
            }
        };
        fetchBankCard();
    }, []);

    return (
        <div
            className="flex items-center justify-center min-h-screen"
            style={{ minHeight: '100dvh' }}
        >
            <div
                className="w-full lg:max-w-[400px] mx-auto h-screen flex flex-col overflow-hidden shadow-2xl border border-gray-300"
                style={{ height: '100dvh' }}
            >
                {/* Header */}
                <div
                    className="p-4 text-white flex items-center flex-shrink-0 z-10"
                    style={{ background: 'linear-gradient(90deg,#d9ad82,#b1835a)' }}
                >
                    <div
                        className="cursor-pointer flex items-center gap-2"
                        onClick={() => navigate('/profile')}
                    >
                        <ArrowBackIosIcon fontSize="small" />
                        <span className="text-sm">Account Security</span>
                    </div>
                </div>

                {/* Menu List */}
                <div className="flex-1 min-h-0 bg-white overflow-y-auto">
                    {loading ? (
                        <div className="divide-y divide-gray-100">
                            {/* Skeleton rows while checking */}
                            {[...Array(2)].map((_, i) => (
                                <div key={i} className="flex items-center justify-between px-5 py-4 animate-pulse">
                                    <div className="h-4 bg-gray-100 rounded w-40" />
                                    <div className="h-4 bg-gray-100 rounded w-3" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">

                            {/* Modify Login Password — always shown */}
                            <div
                                onClick={() => navigate('/modify-login-password')}
                                className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 cursor-pointer active:bg-gray-100 transition-colors"
                            >
                                <span className="text-gray-800 text-[15px]">Modify login password</span>
                                <span className="text-gray-400">›</span>
                            </div>

                            {/* Modify Payment Password — only if a bank card exists */}
                            {hasBankCard && (
                                <div
                                    onClick={() => navigate('/modify-payment-password')}
                                    className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 cursor-pointer active:bg-gray-100 transition-colors"
                                >
                                    <span className="text-gray-800 text-[15px]">Modify payment password</span>
                                    <span className="text-gray-400">›</span>
                                </div>
                            )}

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AccountSecurity;