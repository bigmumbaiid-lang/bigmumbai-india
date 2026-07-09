import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import pf1 from "../assets/pf1.jpg";
import pf2 from "../assets/pf2.jpg";
import pf3 from "../assets/pf3.jpg";
import pf4 from "../assets/pf4.jpg";
import pf5 from "../assets/pf5.jpg";
import pf6 from "../assets/pf6.jpg";
import pf7 from "../assets/pf7.jpg";
import pf8 from "../assets/pf8.jpg";
import pf9 from "../assets/pf9.jpg";
import pf10 from "../assets/pf10.jpg";
import pf11 from "../assets/pf11.jpg";
import pf12 from "../assets/pf12.jpg";
import pf13 from "../assets/pf13.jpg";
import pf14 from "../assets/pf14.jpg";
import pf15 from "../assets/pf15.jpg";
import pf16 from "../assets/pf16.jpg";
import pf17 from "../assets/pf17.jpg";
import pf18 from "../assets/pf18.jpg";
import pf19 from "../assets/pf19.jpg";
import pf20 from "../assets/pf20.jpg";
import pf21 from "../assets/pf21.jpg";
import pf22 from "../assets/pf22.jpg";
import pf23 from "../assets/pf23.jpg";
import pf24 from "../assets/pf24.jpg";
import pf25 from "../assets/pf25.jpg";
import pf26 from "../assets/pf26.jpg";

import youWinIcon from "../assets/youWinIcon.png";
import goldMedal from "../assets/goldMedal.png";
import silverMedal from "../assets/silverMedal.png";
import brownMedal from "../assets/brownMedal.png";

// ─── Data ──────────────────────────────────────────────────────────────────

const AVATAR_IMGS = [
    pf1, pf2, pf3, pf4, pf5, pf6, pf7, pf8, pf9, pf10, pf11, pf12, pf13,
    pf14, pf15, pf16, pf17, pf18, pf19, pf20, pf21, pf22, pf23, pf24, pf25, pf26,
];

const CARDS_PER_SLIDE = 3;
const WINNERS_COUNT   = 18; // multiple of CARDS_PER_SLIDE, keeps slides even
const EARNERS_COUNT   = 15;

// ─── Seeded RNG — same seed always produces the same sequence ────────────
// Lets the "random" leaderboard stay fixed all day (same for every visitor)
// and only change once the IST calendar date rolls over.
function hashStringToSeed(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

function mulberry32(seed) {
    let a = seed;
    return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// IST = UTC+5:30 — the leaderboard "resets" at IST midnight, not UTC midnight.
function getIstDateStr() {
    return new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().split('T')[0];
}

// Fisher–Yates using the seeded RNG, so avatar assignment is deterministic too
function seededShuffle(arr, rng) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

const CONSONANTS = 'bcdfghjklmnpqrstvwxyz';
const VOWELS     = 'aeiou';
const randFrom   = (rng, set) => set[Math.floor(rng() * set.length)];

// Masked-username look, matching the existing "xxx***yyy" style
function randUsername(rng) {
    const prefix = randFrom(rng, CONSONANTS) + randFrom(rng, VOWELS) + randFrom(rng, CONSONANTS + VOWELS);
    const len = 2 + Math.floor(rng() * 3); // 2-4 chars
    const useDigits = rng() < 0.65;
    let suffix = '';
    for (let i = 0; i < len; i++) {
        suffix += useDigits ? String(Math.floor(rng() * 10)) : randFrom(rng, CONSONANTS + VOWELS);
    }
    return `${prefix}***${suffix}`;
}

// Skewed toward small wins with occasional big ones, like real jackpot feeds
function randWinAmount(rng) {
    const r = rng();
    let base;
    if (r < 0.7) base = 20 + rng() * 200;
    else if (r < 0.92) base = 200 + rng() * 4000;
    else base = 5000 + rng() * 90000;
    return Math.round(base * 100) / 100;
}

function randEarnAmount(rng) {
    return Math.round((15_000_000 + rng() * 83_000_000) * 100) / 100;
}

const fmtAmount = (n) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function buildDailyData(dateStr) {
    const rng = mulberry32(hashStringToSeed(dateStr));

    // Distinct avatar per person — 26 available, well over what we need
    const avatarOrder = seededShuffle(AVATAR_IMGS.map((_, i) => i), rng);

    const winners = Array.from({ length: WINNERS_COUNT }, (_, i) => ({
        id: i + 1,
        username: randUsername(rng),
        amount: fmtAmount(randWinAmount(rng)),
        avatarIdx: avatarOrder[i % avatarOrder.length],
    }));

    // Ranking must reflect the highest amount at NO.1 — sort first, then assign rank.
    const earners = Array.from({ length: EARNERS_COUNT }, () => ({
        username: randUsername(rng),
        amountNum: randEarnAmount(rng),
    }))
        .sort((a, b) => b.amountNum - a.amountNum)
        .map((e, i) => ({
            id: i + 1,
            rank: i + 1,
            username: e.username,
            amount: fmtAmount(e.amountNum),
            avatarIdx: avatarOrder[(WINNERS_COUNT + i) % avatarOrder.length],
        }));

    return { winners, earners };
}

function img(idx) {
    return AVATAR_IMGS[idx % AVATAR_IMGS.length];
}

// ─── Sub-components ────────────────────────────────────────────────────────

function Avatar({ index, size = "lg" }) {
    const cls = size === "lg" ? "w-16 h-16" : "w-11 h-11";
    return (
        <img
            src={img(index)}
            alt="avatar"
            className={`${cls} rounded-full object-cover border-2 border-white`}
            draggable={false}
        />
    );
}

function WinnerCard({ winner, cardW }) {
    return (
        <div
            className="flex-none flex flex-col items-center px-2 pt-6 pb-3 gap-1.5 select-none"
            style={{ width: cardW }}
        >
            <div className="relative w-16 h-16">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-amber-100">
                    <Avatar index={winner.avatarIdx} size="lg" />
                </div>
                <img
                    src={youWinIcon}
                    alt="YOU WIN!"
                    draggable={false}
                    className="absolute -top-5 left-1/2 -translate-x-1/2 w-14 z-10 pointer-events-none select-none"
                />
            </div>
            <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                {winner.username}
            </span>
            <span className="text-base font-bold text-amber-600 text-center leading-none">
                {winner.amount}
            </span>
            <span className="text-[10px] text-gray-400 text-center leading-none">
                Winning amount
            </span>
        </div>
    );
}

function RankBadge({ rank }) {
    if (rank === 1)
        return (
            <div className="flex items-center gap-1">
                <img src={goldMedal} className="w-3.5" alt="" />
                <span className="text-sm font-bold text-amber-500">NO.1</span>
            </div>
        );
    if (rank === 2)
        return (
            <div className="flex items-center gap-1">
                <img src={silverMedal} className="w-3.5" alt="" />
                <span className="text-sm font-bold text-slate-400">NO.2</span>
            </div>
        );
    if (rank === 3)
        return (
            <div className="flex items-center gap-1">
                <img src={brownMedal} className="w-3.5" alt="" />
                <span className="text-sm font-bold text-orange-400">NO.3</span>
            </div>
        );
    return <span className="text-sm text-gray-400">NO.{rank}</span>;
}

function EarnerRow({ earner, last }) {
    return (
        <div
            className={`flex items-center gap-3 px-5 py-3 ${!last ? "border-b border-gray-100" : ""}`}
        >
            <div className="flex-none w-11 h-11 rounded-full overflow-hidden">
                <Avatar index={earner.avatarIdx} size="sm" />
            </div>
            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span className="text-sm font-semibold text-gray-800 truncate">
                    {earner.username}
                </span>
                <RankBadge rank={earner.rank} />
            </div>
            <span className="text-sm font-semibold text-gray-800 tabular-nums whitespace-nowrap">
                {earner.amount}
            </span>
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function WinningCarousel() {
    const { winners, earners } = useMemo(() => buildDailyData(getIstDateStr()), []);
    const totalSlides = winners.length / CARDS_PER_SLIDE;
    const tripled = useMemo(() => [...winners, ...winners, ...winners], [winners]);

    const containerRef = useRef(null);
    const trackRef     = useRef(null);
    const [containerW, setContainerW] = useState(0);

    // Mutable state kept in a ref so closures always see the latest values
    const s = useRef({ current: totalSlides, busy: false, timerId: null });
    // Touch / mouse drag tracking
    const drag = useRef({ active: false, startX: 0, startTranslate: 0 });

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const ro = new ResizeObserver(() => setContainerW(el.clientWidth));
        ro.observe(el);
        setContainerW(el.clientWidth);
        return () => ro.disconnect();
    }, []);

    // Place track at correct position whenever containerW is first known
    useEffect(() => {
        const track = trackRef.current;
        if (!track || containerW === 0) return;
        track.style.transition = 'none';
        track.style.transform  = `translateX(${-s.current.current * containerW}px)`;
        void track.offsetWidth;
    }, [containerW]);

    const slideTo = useCallback((next) => {
        const track = trackRef.current;
        if (!track || containerW === 0) return;
        track.style.transition = 'transform 450ms cubic-bezier(0.4, 0, 0.2, 1)';
        track.style.transform  = `translateX(${-next * containerW}px)`;

        track.addEventListener('transitionend', function onDone() {
            track.removeEventListener('transitionend', onDone);
            s.current.current = next;

            // Wrap forward
            if (s.current.current >= totalSlides * 2) {
                s.current.current = totalSlides;
                track.style.transition = 'none';
                track.style.transform  = `translateX(${-s.current.current * containerW}px)`;
                void track.offsetWidth;
            }
            // Wrap backward
            else if (s.current.current < totalSlides) {
                s.current.current = totalSlides * 2 - 1;
                track.style.transition = 'none';
                track.style.transform  = `translateX(${-s.current.current * containerW}px)`;
                void track.offsetWidth;
            }

            s.current.busy = false;
        }, { once: true });
    }, [containerW, totalSlides]);

    const go = useCallback((dir) => {
        if (s.current.busy) return;
        s.current.busy = true;
        slideTo(s.current.current + dir);
    }, [slideTo]);

    // Reset auto-advance timer (call after manual swipe so it doesn't fire immediately)
    const resetTimer = useCallback(() => {
        clearInterval(s.current.timerId);
        s.current.timerId = setInterval(() => go(1), 2800);
    }, [go]);

    useEffect(() => {
        if (containerW === 0) return;
        resetTimer();
        return () => clearInterval(s.current.timerId);
    }, [containerW, resetTimer]);

    // ── Touch handlers ──
    const onTouchStart = (e) => {
        drag.current.active  = true;
        drag.current.startX  = e.touches[0].clientX;
    };
    const onTouchEnd = (e) => {
        if (!drag.current.active) return;
        drag.current.active = false;
        const delta = e.changedTouches[0].clientX - drag.current.startX;
        if (Math.abs(delta) > 40) {
            go(delta < 0 ? 1 : -1);
            resetTimer();
        }
    };

    // ── Mouse drag handlers ──
    const onMouseDown = (e) => {
        drag.current.active = true;
        drag.current.startX = e.clientX;
    };
    const onMouseUp = (e) => {
        if (!drag.current.active) return;
        drag.current.active = false;
        const delta = e.clientX - drag.current.startX;
        if (Math.abs(delta) > 40) {
            go(delta < 0 ? 1 : -1);
            resetTimer();
        }
    };

    const cardW  = containerW > 0 ? containerW / CARDS_PER_SLIDE : 0;
    const trackW = cardW * tripled.length;

    return (
        <>
            {/* Section title */}
            <div className="mt-4 mb-1 text-center text-base font-bold text-gray-900">
                Winning information
            </div>

            <div className="mx-4 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

            {/* Carousel */}
            <div
                ref={containerRef}
                className="overflow-hidden select-none cursor-grab active:cursor-grabbing"
                style={{ touchAction: 'pan-y' }}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
                onMouseDown={onMouseDown}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
            >
                {containerW > 0 && (
                    <div
                        ref={trackRef}
                        className="flex"
                        style={{ width: trackW, willChange: 'transform' }}
                    >
                        {tripled.map((winner, idx) => (
                            <WinnerCard
                                key={`${winner.id}-${idx}`}
                                winner={winner}
                                cardW={cardW}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Today's earnings chart */}
            <div className="mt-4 mb-2 text-center text-base font-bold text-gray-900">
                Today's earnings chart
            </div>

            <div className="mx-4 h-px bg-gray-200 mb-1" />

            <div className="pb-3">
                {earners.map((earner, idx) => (
                    <EarnerRow
                        key={earner.id}
                        earner={earner}
                        last={idx === earners.length - 1}
                    />
                ))}
            </div>
        </>
    );
}
