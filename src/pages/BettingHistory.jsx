import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos'
import axios from '../utils/axios'
import { toDisplay } from '../utils/money'
import blackJackIcon from '../assets/blackJackIcon.jpg'
import minesIcon from '../assets/minesIcon.jpg'
import DateRangePicker from '../components/DateRangePicker'

const GAMES = [
    { key: 'mines',     label: 'Mines',     endpoint: '/mines/history',     icon: minesIcon },
    { key: 'blackjack', label: 'Blackjack', endpoint: '/blackjack/history', icon: blackJackIcon },
]

const PAGE_SIZE  = 15
const BRAND_GRAD = 'linear-gradient(90deg, #d9ad82, #b1835a)'
const BRAND_C    = '#b1835a'

const DATE_FILTERS = [
    { key: 'all',    label: 'All' },
    { key: 'today',  label: 'Today' },
    { key: 'week',   label: 'This Week' },
    { key: 'month',  label: 'This Month' },
    { key: 'custom', label: 'Custom' },
]

// IST = UTC+5:30. "Today"/"This Week"/"This Month" must be calendar boundaries
// in IST regardless of the device's own timezone — using the browser's local
// setHours(0,0,0,0) here would drift by the device/IST offset (e.g. a device
// set to UTC would put "midnight" 5.5h before real IST midnight, leaking the
// previous IST calendar day's late-night bets into "Today").
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000

// "Now" shifted so its UTC-getters read as IST wall-clock values.
const istShifted = (d) => new Date(d.getTime() + IST_OFFSET_MS)

// Real UTC instant of IST midnight for an already-IST-shifted Date.
const istMidnightOf = (shifted) => {
    const asIfUTC = new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()))
    return new Date(asIfUTC.getTime() - IST_OFFSET_MS)
}

const compact = (val) => {
    const n = Math.abs(Number(val || 0))
    if (n >= 1e9) return `₹${(n / 1e9).toFixed(2).replace(/\.?0+$/, '')}B`
    if (n >= 1e6) return `₹${(n / 1e6).toFixed(2).replace(/\.?0+$/, '')}M`
    if (n >= 1e3) return `₹${(n / 1e3).toFixed(1).replace(/\.?0$/, '')}K`
    return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

function BettingHistory() {
    const navigate = useNavigate()

    const [activeGame, setActiveGame]       = useState(GAMES[0].key)
    const [items, setItems]                 = useState([])
    const [page, setPage]                   = useState(1)
    const [hasMore, setHasMore]             = useState(true)
    const [loading, setLoading]             = useState(false)
    const [error, setError]                 = useState('')
    const [serverSummary, setServerSummary] = useState(null)
    const [dateFilter, setDateFilter]       = useState('all')
    const [outcome, setOutcome]             = useState('all')
    const [customFrom, setCustomFrom]       = useState('')
    const [customTo, setCustomTo]           = useState('')
    const [dateOpen, setDateOpen]           = useState(false)
    const [outcomeOpen, setOutcomeOpen]     = useState(false)

    const sentinelRef = useRef(null)
    const loadingRef  = useRef(false)
    const requestIdRef = useRef(0)

    const game = GAMES.find((g) => g.key === activeGame)

    const outcomeOptions = activeGame === 'mines'
        ? [{ key: 'all', label: 'All' }, { key: 'won', label: 'Won' }, { key: 'lost', label: 'Lost' }]
        : [{ key: 'all', label: 'All' }, { key: 'won', label: 'Won' }, { key: 'lost', label: 'Lost' }, { key: 'push', label: 'Push' }]

    const activeDateLabel   = DATE_FILTERS.find(d => d.key === dateFilter)?.label || 'All'
    const activeOutcomeLabel = outcomeOptions.find(o => o.key === outcome)?.label || 'All'

    const formatDate = (iso) => {
        if (!iso) return ''
        return new Date(iso).toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short',
            hour: '2-digit', minute: '2-digit',
        })
    }

    const getRange = useCallback(() => {
        const now     = new Date()
        const shifted = istShifted(now)

        if (dateFilter === 'today') {
            return { from: istMidnightOf(shifted).toISOString(), to: now.toISOString() }
        }
        if (dateFilter === 'week') {
            // Monday-start week, based on the IST calendar day (getUTCDay() on the
            // shifted date reads as IST's day-of-week since it's shifted to IST wall-clock).
            const dow           = (shifted.getUTCDay() + 6) % 7
            const shiftedMonday = new Date(shifted.getTime() - dow * 86400000)
            return { from: istMidnightOf(shiftedMonday).toISOString(), to: now.toISOString() }
        }
        if (dateFilter === 'month') {
            const shiftedFirst = new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), 1))
            return { from: new Date(shiftedFirst.getTime() - IST_OFFSET_MS).toISOString(), to: now.toISOString() }
        }
        if (dateFilter === 'custom') {
            // customFrom/customTo are YYYY-MM-DD strings meant as IST calendar days —
            // parse as UTC first so the local-timezone Date constructor can't shift them.
            const out = {}
            if (customFrom) out.from = istMidnightOf(new Date(customFrom + 'T00:00:00Z')).toISOString()
            if (customTo) {
                const nextDay = istMidnightOf(new Date(customTo + 'T00:00:00Z'))
                out.to = new Date(nextDay.getTime() + 86400000 - 1).toISOString()
            }
            return out
        }
        return {}
    }, [dateFilter, customFrom, customTo])

    const fetchPage = useCallback(async (pageToLoad, replace = false) => {
        // "Load more" calls still dedupe against an in-flight request, but a filter
        // change (replace=true) must always be allowed to start immediately —
        // otherwise it silently no-ops while a stale request is in flight (see
        // requestId below) and the list never actually refreshes for the new filter.
        if (!replace && loadingRef.current) return
        const requestId = ++requestIdRef.current
        loadingRef.current = true
        setLoading(true); setError('')
        try {
            const { data } = await axios.get(game.endpoint, {
                params: { page: pageToLoad, limit: PAGE_SIZE, ...getRange(), result: outcome !== 'all' ? outcome : undefined },
            })
            // A newer request (e.g. the user switched filters again) has since
            // superseded this one — discard these now-stale results instead of
            // merging them into the list.
            if (requestIdRef.current !== requestId) return
            const results = data.results || []
            setItems((prev) => (replace ? results : [...prev, ...results]))
            setHasMore(Boolean(data.hasMore))
            setPage(pageToLoad)
            if (data.summary) setServerSummary(data.summary)
        } catch (err) {
            if (requestIdRef.current !== requestId) return
            setError(err.response?.data?.message || err.response?.data?.error || 'Failed to load history')
        } finally {
            if (requestIdRef.current === requestId) { setLoading(false); loadingRef.current = false }
        }
    }, [game.endpoint, getRange, outcome])

    useEffect(() => {
        setItems([]); setPage(1); setHasMore(true); setServerSummary(null)
        fetchPage(1, true)
    }, [activeGame, fetchPage])

    useEffect(() => {
        if (!sentinelRef.current || !hasMore) return
        const observer = new IntersectionObserver(
            (entries) => { if (entries[0].isIntersecting && hasMore && !loadingRef.current) fetchPage(page + 1) },
            { rootMargin: '120px' }
        )
        observer.observe(sentinelRef.current)
        return () => observer.disconnect()
    }, [page, hasMore, fetchPage])

    const switchGame = (key) => {
        if (key === 'mines' && outcome === 'push') setOutcome('all')
        setActiveGame(key)
    }

    const netOf = (item) => {
        if (typeof item.net === 'number') return item.net
        if (item.status === 'lost') return -toDisplay(item.betAmount)
        return toDisplay(item.payout) - toDisplay(item.betAmount)
    }

    const fallback = items.reduce(
        (acc, it) => {
            acc.totalWagered += toDisplay(it.betAmount)
            acc.totalNet     += toDisplay(netOf(it))
            const won = it.status === 'won' || it.status === 'cashed_out'
            if (won) acc.wins += 1
            else if (it.status === 'lost') acc.losses += 1
            return acc
        },
        { totalWagered: 0, totalNet: 0, wins: 0, losses: 0, totalBets: items.length }
    )
    const summary  = serverSummary
        ? { totalWagered: toDisplay(serverSummary.totalWagered), totalNet: toDisplay(serverSummary.totalNet),
            wins: serverSummary.wins, losses: serverSummary.losses, totalBets: serverSummary.totalBets }
        : fallback

    const decided = summary.wins + summary.losses
    const winRate = decided > 0 ? Math.round((summary.wins / decided) * 100) : 0
    const netPos  = summary.totalNet > 0
    const netZero = summary.totalNet === 0

    const statusChip = (item) => {
        const s = item.status
        if (s === 'lost')                return { label: 'Lost',       color: '#dc2626' }
        if (s === 'push')                return { label: 'Push',       color: '#9ca3af' }
        if (item.result === 'blackjack') return { label: 'Blackjack',  color: '#059669' }
        if (s === 'cashed_out')          return { label: 'Cashed out', color: '#059669' }
        return                                  { label: 'Won',        color: '#059669' }
    }

    const renderMeta = (item) => {
        if (activeGame === 'mines') {
            const parts = []
            if (item.minesCount != null) parts.push(`${item.minesCount} mines`)
            if (typeof item.multiplier === 'number') parts.push(`${item.multiplier.toFixed(2)}x`)
            return parts.join(' · ')
        }
        if (activeGame === 'blackjack') {
            const parts = []
            if (item.playerScore != null && item.dealerScore != null)
                parts.push(`You ${item.playerScore} · Dealer ${item.dealerScore}`)
            if (item.doubled) parts.push('Doubled')
            return parts.join(' · ')
        }
        return ''
    }

    const renderRow = (item) => {
        const chip     = statusChip(item)
        const net      = toDisplay(netOf(item))
        const pos      = net > 0
        const zero     = net === 0
        const sign     = zero ? '' : pos ? '+' : '-'
        const netColor = zero ? '#9ca3af' : pos ? '#059669' : '#dc2626'
        const barColor = zero ? '#e5e7eb' : pos ? '#10b981' : '#ef4444'
        const meta     = renderMeta(item)

        return (
            <div key={item.id} className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100" style={{ borderLeft: `3px solid ${barColor}` }}>
                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={game.icon} alt={game.label} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[13px] font-semibold text-gray-800">{game.label}</span>
                        <span className="text-[11px]" style={{ color: chip.color }}>{chip.label}</span>
                    </div>
                    <p className="text-[11px] text-gray-400 truncate">
                        {formatDate(item.createdAt)}
                        {meta ? ` · ${meta}` : ''}
                    </p>
                </div>
                <div className="flex flex-col items-end flex-shrink-0 ml-1">
                    <span className="text-[15px] font-semibold leading-tight" style={{ color: netColor }}>
                        {sign}{compact(Math.abs(net))}
                    </span>
                    <span className="text-[10px] text-gray-400 mt-0.5">Bet {compact(toDisplay(item.betAmount))}</span>
                </div>
            </div>
        )
    }

    return (
        <div className="flex items-center justify-center min-h-screen" style={{ minHeight: '100dvh', background: '#f7f8ff' }}>
            <div className="w-full lg:max-w-[400px] mx-auto flex flex-col overflow-hidden shadow-2xl" style={{ height: '100dvh', background: '#f7f8ff' }}>

                {/* ── Header ── */}
                <div className="flex-shrink-0 flex items-center justify-between px-4 py-4 text-white" style={{ background: BRAND_GRAD }}>
                    <div className="cursor-pointer flex items-center gap-2" onClick={() => navigate(-1)}>
                        <ArrowBackIosIcon fontSize="small" />
                        <span className="text-sm">Betting History</span>
                    </div>

                    {/* Date dropdown */}
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
                                    {DATE_FILTERS.map(d => (
                                        <button key={d.key} onClick={() => { setDateFilter(d.key); setDateOpen(false) }}
                                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                                            style={{ color: dateFilter === d.key ? BRAND_C : '#374151', fontWeight: dateFilter === d.key ? 600 : 400 }}>
                                            {d.label}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* ── Stats + Game tabs (same white block) ── */}
                <div className="flex-shrink-0 bg-white border-b border-gray-100">

                    {/* Stats row */}
                    <div className="grid grid-cols-3 border-b border-gray-100 mx-4 py-3">
                        <div className="text-center">
                            <p className="text-gray-400 text-[9px] uppercase tracking-wide mb-1">Wagered</p>
                            <p className="text-gray-800 font-bold text-sm leading-none">{compact(summary.totalWagered)}</p>
                        </div>
                        <div className="text-center border-x border-gray-100">
                            <p className="text-gray-400 text-[9px] uppercase tracking-wide mb-1">Net P/L</p>
                            <p className="font-bold text-sm leading-none"
                                style={{ color: netZero ? '#9ca3af' : netPos ? '#059669' : '#dc2626' }}>
                                {netZero ? '₹0' : `${netPos ? '+' : '-'}${compact(Math.abs(summary.totalNet))}`}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-gray-400 text-[9px] uppercase tracking-wide mb-1">Win Rate</p>
                            <p className="font-bold text-sm leading-none" style={{ color: BRAND_C }}>{winRate}%</p>
                        </div>
                    </div>
                    {/* Progress + counts */}
                    <div className="px-4 pt-2 pb-2.5">
                        <div className="h-1 rounded-full overflow-hidden bg-gray-100">
                            <div className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${winRate}%`, background: winRate >= 50 ? '#10b981' : '#f87171' }} />
                        </div>
                        <div className="flex justify-between mt-1">
                            <span className="text-gray-400 text-[10px]">{summary.totalBets} bets</span>
                            <span className="text-[10px]">
                                <span className="text-emerald-500 font-medium">{summary.wins}W</span>
                                <span className="text-gray-300 mx-1">·</span>
                                <span className="text-red-400 font-medium">{summary.losses}L</span>
                            </span>
                        </div>
                    </div>

                    {/* Game tabs + outcome filter */}
                    <div className="flex items-center border-t border-gray-100">
                        {/* Game tabs — text only, square underline style */}
                        <div className="flex flex-1">
                            {GAMES.map(g => {
                                const active = g.key === activeGame
                                return (
                                    <button
                                        key={g.key}
                                        onClick={() => switchGame(g.key)}
                                        className="flex-1 flex items-center justify-center py-3 text-sm font-semibold relative transition-colors"
                                        style={{ color: active ? BRAND_C : '#9ca3af' }}
                                    >
                                        {g.label}
                                        {active && (
                                            <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: BRAND_C }} />
                                        )}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Divider */}
                        <div className="w-px h-8 bg-gray-100 mx-1" />

                        {/* Outcome dropdown */}
                        <div className="relative px-3">
                            <button
                                onClick={() => setOutcomeOpen(v => !v)}
                                className="flex items-center gap-1 text-xs font-semibold py-3 transition-colors"
                                style={{ color: outcome !== 'all' ? BRAND_C : '#6b7280' }}
                            >
                                {activeOutcomeLabel}
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                                    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                            </button>
                            {outcomeOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setOutcomeOpen(false)} />
                                    <div className="absolute right-0 top-10 z-50 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden min-w-[110px]">
                                        {outcomeOptions.map(o => (
                                            <button key={o.key}
                                                onClick={() => { setOutcome(o.key); setOutcomeOpen(false) }}
                                                className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                                                style={{ color: outcome === o.key ? BRAND_C : '#374151', fontWeight: outcome === o.key ? 600 : 400 }}>
                                                {o.label}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Custom date range */}
                    {dateFilter === 'custom' && (
                        <div className="flex items-center px-4 pt-3 pb-3">
                            <DateRangePicker
                                from={customFrom}
                                to={customTo}
                                onChange={(f, t) => { setCustomFrom(f); setCustomTo(t) }}
                                placeholder="Select date range"
                            />
                        </div>
                    )}
                </div>

                {/* ── List ── */}
                <div className="flex-1 min-h-0 overflow-y-auto bg-white" style={{ WebkitOverflowScrolling: 'touch' }}>

                    {error && (
                        <div className="mx-4 mt-4 bg-red-50 border border-red-100 text-red-500 rounded-lg px-4 py-3 text-xs">{error}</div>
                    )}

                    {!loading && items.length === 0 && !error && (
                        <div className="flex flex-col items-center justify-center text-center mt-24">
                            <div className="w-14 h-14 rounded-xl overflow-hidden mb-3 opacity-40">
                                <img src={game.icon} alt={game.label} className="w-full h-full object-cover" />
                            </div>
                            <p className="text-sm font-semibold text-gray-500">No {game.label} bets found</p>
                            <p className="text-xs text-gray-400 mt-1">Try a different filter or date range</p>
                        </div>
                    )}

                    {items.map(renderRow)}

                    {loading && (
                        <>
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 animate-pulse" style={{ borderLeft: '3px solid #e5e7eb' }}>
                                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex-shrink-0" />
                                    <div className="flex-1">
                                        <div className="h-3 bg-gray-100 rounded-full w-1/3 mb-2" />
                                        <div className="h-2.5 bg-gray-100 rounded-full w-1/2" />
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <div className="h-3.5 w-14 bg-gray-100 rounded-full" />
                                        <div className="h-2.5 w-10 bg-gray-100 rounded-full" />
                                    </div>
                                </div>
                            ))}
                        </>
                    )}

                    {hasMore && <div ref={sentinelRef} className="h-4" />}

                    {!hasMore && items.length > 0 && (
                        <div className="text-center py-6 text-gray-400 text-xs">End of history</div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default BettingHistory
