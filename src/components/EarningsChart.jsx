import React from 'react'

// Medal styling for top 3 ranks
const rankMeta = (rank) => {
    if (rank === 1) return { color: 'text-amber-500', medal: '🥇', label: 'NO.1' }
    if (rank === 2) return { color: 'text-gray-400', medal: '🥈', label: 'NO.2' }
    if (rank === 3) return { color: 'text-orange-600', medal: '🥉', label: 'NO.3' }
    return { color: 'text-gray-400', medal: null, label: `NO.${rank}` }
}

function EarningsChart({ earners = [] }) {
    return (
        <div className="px-4 mt-6">
            <h2 className="text-center text-lg font-semibold text-gray-700 mb-3">
                Today's earnings chart
            </h2>

            <div className="bg-white rounded-sm overflow-hidden">
                {earners.map((e, i) => {
                    const rank = i + 1
                    const meta = rankMeta(rank)
                    return (
                        <div
                            key={e.id ?? i}
                            className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-b-0"
                        >
                            <div className="flex items-center gap-3">
                                <img
                                    src={e.avatar}
                                    alt={e.username}
                                    className="w-10 h-10 rounded-full object-cover"
                                />
                                <div className="flex flex-col">
                                    <span className="font-semibold text-gray-800 text-sm">{e.username}</span>
                                    <span className={`text-xs font-medium flex items-center gap-1 ${meta.color}`}>
                                        {meta.medal && <span>{meta.medal}</span>}
                                        {meta.label}
                                    </span>
                                </div>
                            </div>

                            <span className="font-bold text-gray-800 text-sm">
                                {Number(e.amount).toLocaleString('en-IN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}
                            </span>
                        </div>
                    )
                })}

                {earners.length === 0 && (
                    <div className="text-center text-gray-400 text-sm py-6">
                        No earnings data yet
                    </div>
                )}
            </div>
        </div>
    )
}

export default EarningsChart