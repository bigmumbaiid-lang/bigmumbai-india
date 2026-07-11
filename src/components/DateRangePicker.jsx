import React, { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

const BRAND_GRAD = 'linear-gradient(135deg, #d9ad82, #b1835a)'
const BRAND_C    = '#b1835a'

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTH_LABEL = (y, m) => new Date(y, m, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })

const toKey = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
const parseKey = (key) => {
    if (!key) return null
    const [y, m, d] = key.split('-').map(Number)
    return { y, m: m - 1, d }
}
const fmtShort = (key) => {
    const p = parseKey(key)
    if (!p) return null
    return new Date(p.y, p.m, p.d).toLocaleString('en-US', { day: 'numeric', month: 'short' })
}

// "Now", with Y/M/D read as the IST calendar day rather than the viewer's own
// device timezone — betting history's "today" must match IST everywhere else in
// the app, so a device set to a timezone behind IST can't disable-as-"future" a
// date that's already today in IST.
const istToday = () => {
    const shifted = new Date(Date.now() + 5.5 * 60 * 60 * 1000)
    return new Date(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate())
}

// Beautiful in-app calendar for picking a custom [from, to] range — replaces the
// two bare native <input type="date"> fields with something on-brand and touch-friendly.
export default function DateRangePicker({ from, to, onChange, placeholder = 'Select dates' }) {
    const [open, setOpen]     = useState(false)
    const [cursor, setCursor] = useState(() => {
        const p = parseKey(from) || parseKey(to)
        const now = istToday()
        return p ? { y: p.y, m: p.m } : { y: now.getFullYear(), m: now.getMonth() }
    })
    const [draftFrom, setDraftFrom] = useState(from || '')
    const [draftTo, setDraftTo]     = useState(to || '')
    const popRef = useRef(null)

    useEffect(() => {
        if (!open) return
        const onClick = (e) => { if (popRef.current && !popRef.current.contains(e.target)) setOpen(false) }
        document.addEventListener('mousedown', onClick)
        return () => document.removeEventListener('mousedown', onClick)
    }, [open])

    const openPicker = () => {
        setDraftFrom(from || ''); setDraftTo(to || '')
        const p = parseKey(from) || parseKey(to) || (() => { const n = istToday(); return { y: n.getFullYear(), m: n.getMonth() } })()
        setCursor({ y: p.y, m: p.m })
        setOpen(true)
    }

    const pick = (key) => {
        if (!draftFrom || (draftFrom && draftTo)) { setDraftFrom(key); setDraftTo(''); return }
        if (key < draftFrom) { setDraftTo(draftFrom); setDraftFrom(key); return }
        setDraftTo(key)
    }

    const apply = () => { onChange(draftFrom, draftTo || draftFrom); setOpen(false) }
    const clear = () => { setDraftFrom(''); setDraftTo(''); onChange('', '') }

    const changeMonth = (delta) => {
        setCursor(({ y, m }) => {
            const d = new Date(y, m + delta, 1)
            return { y: d.getFullYear(), m: d.getMonth() }
        })
    }

    // Build a 6-row grid including leading/trailing days from adjacent months
    const startWeekday = new Date(cursor.y, cursor.m, 1).getDay()
    const gridStart     = new Date(cursor.y, cursor.m, 1 - startWeekday)
    const istNow        = istToday()
    const todayKey      = toKey(istNow.getFullYear(), istNow.getMonth(), istNow.getDate())

    const cells = Array.from({ length: 42 }, (_, i) => {
        const d   = new Date(gridStart)
        d.setDate(gridStart.getDate() + i)
        const key = toKey(d.getFullYear(), d.getMonth(), d.getDate())
        return { key, day: d.getDate(), inMonth: d.getMonth() === cursor.m, future: key > todayKey }
    })

    const label = (from || to)
        ? `${fmtShort(from) || '…'} – ${fmtShort(to) || '…'}`
        : placeholder

    return (
        <div className="relative flex-1" ref={popRef}>
            <button
                type="button"
                onClick={openPicker}
                className="w-full flex items-center gap-2 text-xs bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 transition-colors"
                style={{ borderColor: open ? BRAND_C : undefined }}
            >
                <Calendar size={13} style={{ color: BRAND_C }} className="shrink-0" />
                <span className={`truncate ${(from || to) ? 'font-medium text-gray-700' : 'text-gray-400'}`}>{label}</span>
            </button>

            {open && (
                <div
                    className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
                    style={{ width: 300, maxWidth: '90vw' }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 text-white" style={{ background: BRAND_GRAD }}>
                        <button type="button" onClick={() => changeMonth(-1)} className="p-1 rounded-full active:bg-white/20 transition-colors">
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-sm font-semibold">{MONTH_LABEL(cursor.y, cursor.m)}</span>
                        <button type="button" onClick={() => changeMonth(1)} className="p-1 rounded-full active:bg-white/20 transition-colors">
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    {/* Selected range chips */}
                    <div className="flex items-center justify-center gap-2 px-4 pt-3 text-[11px] text-gray-400">
                        <span className="px-2 py-1 rounded-full font-semibold" style={{ background: draftFrom ? '#fdf6ee' : '#f9fafb', color: draftFrom ? BRAND_C : '#9ca3af' }}>
                            {draftFrom ? fmtShort(draftFrom) : 'Start'}
                        </span>
                        <span>→</span>
                        <span className="px-2 py-1 rounded-full font-semibold" style={{ background: draftTo ? '#fdf6ee' : '#f9fafb', color: draftTo ? BRAND_C : '#9ca3af' }}>
                            {draftTo ? fmtShort(draftTo) : 'End'}
                        </span>
                    </div>

                    {/* Weekday header */}
                    <div className="grid grid-cols-7 px-3 pt-3 pb-1">
                        {WEEKDAYS.map((w, i) => (
                            <div key={i} className="text-center text-[10px] font-semibold text-gray-300 uppercase">{w}</div>
                        ))}
                    </div>

                    {/* Day grid */}
                    <div className="grid grid-cols-7 gap-y-0.5 px-3 pb-3">
                        {cells.map(({ key, day, inMonth, future }) => {
                            const isStart    = key === draftFrom
                            const isEnd      = key === draftTo
                            const inRange    = draftFrom && draftTo && key > draftFrom && key < draftTo
                            const isEdge     = isStart || isEnd
                            const isToday    = key === todayKey
                            const disabled   = future || !inMonth

                            return (
                                <div key={key} className="relative flex items-center justify-center" style={{ height: 34 }}>
                                    {inRange && <div className="absolute inset-y-1 left-0 right-0" style={{ background: '#fdf0e2' }} />}
                                    {isStart && draftTo && <div className="absolute inset-y-1 left-1/2 right-0" style={{ background: '#fdf0e2' }} />}
                                    {isEnd && draftFrom && <div className="absolute inset-y-1 left-0 right-1/2" style={{ background: '#fdf0e2' }} />}
                                    <button
                                        type="button"
                                        disabled={disabled}
                                        onClick={() => pick(key)}
                                        className="relative z-10 flex items-center justify-center rounded-full text-xs font-medium transition-all active:scale-90"
                                        style={{
                                            width: 28, height: 28,
                                            background: isEdge ? BRAND_GRAD : 'transparent',
                                            color: disabled ? '#e5e7eb' : isEdge ? '#fff' : inMonth ? '#374151' : '#d1d5db',
                                            fontWeight: isEdge ? 700 : isToday ? 700 : 500,
                                            boxShadow: isEdge ? '0 2px 6px rgba(177,131,90,0.4)' : 'none',
                                            border: isToday && !isEdge ? `1.5px solid ${BRAND_C}` : 'none',
                                        }}
                                    >
                                        {day}
                                    </button>
                                </div>
                            )
                        })}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={clear}
                            className="flex-1 py-2 rounded-xl text-xs font-semibold text-gray-500 bg-gray-50 active:bg-gray-100 transition-colors"
                        >
                            Clear
                        </button>
                        <button
                            type="button"
                            onClick={apply}
                            disabled={!draftFrom}
                            className="flex-1 py-2 rounded-xl text-xs font-semibold text-white transition-all active:scale-95 disabled:opacity-40"
                            style={{ background: BRAND_GRAD }}
                        >
                            Apply
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
