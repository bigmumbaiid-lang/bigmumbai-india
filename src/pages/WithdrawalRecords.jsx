import React, { useEffect, useState } from 'react';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axios';

function WithdrawalRecords() {
    const navigate = useNavigate();

    const [withdrawals, setWithdrawals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWithdrawals = async () => {
            try {
                const response = await axios.get('/withdrawal/my-withdrawals');

                if (response.data.success) {
                    setWithdrawals(response.data.withdrawals || []);
                }
            } catch (error) {
                console.error("Failed to fetch withdrawals:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchWithdrawals();
    }, []);

    const getStatusText = (item) => {
        const status = item.status?.toLowerCase();

        switch (status) {
            case 'pending':
                return 'Pending';
            case 'approved':
                return 'Approved';
            case 'success':
                return 'Successful';
            case 'failed':
                return 'Failed';
            default:
                // Fallback for old data
                if (item.isApproved) return 'Successful';
                if (item.isRejected) return 'Failed';
                return 'Pending';
        }
    };

    const isFailed = (item) => {
        const status = item.status?.toLowerCase();
        return status === 'failed' || item.isRejected === true;
    };

    return (
        <div className="min-h-screen max-h-screen flex items-center justify-center">
            <div className="w-full lg:max-w-[400px] mx-auto h-screen flex flex-col overflow-hidden shadow-2xl border border-gray-300">

                {/* Header */}
                <div
                    className='p-4 text-white flex items-center sticky top-0 z-10'
                    style={{
                        background: 'linear-gradient(90deg,#d9ad82,#b1835a)',
                    }}
                >
                    <div
                        className='cursor-pointer flex items-center'
                        onClick={() => navigate('/profile')}
                    >
                        <ArrowBackIosIcon fontSize="small" />
                        <span className='text-sm'>
                            Withdrawal Record
                        </span>
                    </div>
                </div>

                {/* Records */}
                <div className='flex-1 overflow-y-auto bg-white'>
                    {loading ? (
                        <div className='flex items-center justify-center h-full'>
                            Loading...
                        </div>
                    ) : withdrawals.length === 0 ? (
                        <div className='flex items-center justify-center h-full text-gray-400'>
                            No withdrawal records
                        </div>
                    ) : (
                        withdrawals.map((item) => {
                            const statusText = getStatusText(item);
                            const isFailedItem = isFailed(item);

                            return (
                                <div key={item._id}>
                                    <div className='flex justify-between py-3 px-5'>
                                        <div className='flex flex-col gap-1'>
                                            <span className="text-black font-medium">
                                                {statusText}
                                            </span>

                                            <p className='text-sm text-[#aaa]'>
                                                {new Date(item.updatedAt || item.createdAt)
                                                    .toLocaleString(
                                                        "sv-SE",
                                                        {
                                                            timeZone: "Asia/Kolkata"
                                                        }
                                                    )
                                                    .replace(",", "")}
                                            </p>
                                        </div>

                                        <div className="flex flex-col items-end">
                                            <span className="text-red-500 font-medium">
                                                -{Number(item.amount).toFixed(2)}
                                            </span>
                                            {isFailedItem && (
                                                <span className="text-green-500 text-xs font-medium">
                                                    Amount Refunded
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="w-[90%] mx-auto border-b border-gray-100"></div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}

export default WithdrawalRecords;