import { useCallback, useEffect, useRef, useState } from "react";
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

import youWinIcon from "../assets/youWinIcon.png";
import goldMedal from "../assets/goldMedal.png";
import silverMedal from "../assets/silverMedal.png";
import brownMedal from "../assets/brownMedal.png";




// ─── Data ──────────────────────────────────────────────────────────────────

const AVATAR_IMGS = [pf1, pf2, pf3, pf4, pf5, pf6, pf7, pf8, pf9, pf10, pf11, pf12, pf13];

function img(idx) {
    return AVATAR_IMGS[idx % AVATAR_IMGS.length];
}

const winners = [
    { id: 1, username: "smr***ash", amount: "6861.00" },
    { id: 2, username: "vin***pta", amount: "68.00" },
    { id: 3, username: "use***781", amount: "32.00" },
    { id: 4, username: "prr***ham", amount: "7463.00" },
    { id: 5, username: "630***636", amount: "62.00" },
    { id: 6, username: "939***386", amount: "50.00" },
    { id: 7, username: "bn***tu", amount: "83236.00" },
    { id: 8, username: "95j***ena", amount: "86.00" },
    { id: 9, username: "ne***uy", amount: "4521.00" },
    { id: 10, username: "gun***123", amount: "47.00" },
    { id: 11, username: "meg***r1", amount: "51.00" },
    { id: 12, username: "hrs***456", amount: "1531.00" },
];

const earners = [
    { id: 1, username: "rah***789", amount: "96,017,368.87" },
    { id: 2, username: "mus***123", amount: "93,463,838.80" },
    { id: 3, username: "rup***897", amount: "87,131,518.91" },
    { id: 4, username: "akh***123", amount: "75,737,059.38" },
    { id: 5, username: "cha***996", amount: "65,867,299.34" },
    { id: 6, username: "vrr***990", amount: "55,444,156.53" },
    { id: 7, username: "sun***441", amount: "44,320,987.12" },
    { id: 8, username: "pri***007", amount: "38,910,234.60" },
    { id: 9, username: "dev***555", amount: "27,654,102.45" },
    { id: 10, username: "raj***888", amount: "19,201,876.30" },
];

const CARDS_PER_SLIDE = 3;
const TOTAL_SLIDES    = winners.length / CARDS_PER_SLIDE; // 4
const tripled         = [...winners, ...winners, ...winners];

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

function WinnerCard({ winner, cardW, imgIdx }) {
    return (
        <div
            className="flex-none flex flex-col items-center px-2 pt-6 pb-3 gap-1.5 select-none"
            style={{ width: cardW }}
        >
            <div className="relative w-16 h-16">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-amber-100">
                    <Avatar index={imgIdx} size="lg" />
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
                {/* <span className="text-base leading-none">🥇</span> */}
                <img src={goldMedal} className="w-3.5" />

                <span className="text-sm font-bold text-amber-500">NO.1</span>
            </div>
        );
    if (rank === 2)
        return (
            <div className="flex items-center gap-1">
                {/* <span className="text-base leading-none">🥈</span> */}
                <img src={silverMedal} className="w-3.5" />

                <span className="text-sm font-bold text-slate-400">NO.2</span>
            </div>
        );
    if (rank === 3)
        return (
            <div className="flex items-center gap-1">
                {/* <span className="text-base leading-none">🥉</span> */}
                <img src={brownMedal} className="w-3.5" />
                <span className="text-sm font-bold text-orange-400">NO.3</span>
            </div>
        );
    return <span className="text-sm text-gray-400">NO.{rank}</span>;
}

function EarnerRow({ earner, imgIdx, last }) {
    return (
        <div
            className={`flex items-center gap-3 px-5 py-3 ${!last ? "border-b border-gray-100" : ""}`}
        >
            <div className="flex-none w-11 h-11 rounded-full overflow-hidden">
                <Avatar index={imgIdx} size="sm" />
            </div>
            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span className="text-sm font-semibold text-gray-800 truncate">
                    {earner.username}
                </span>
                <RankBadge rank={earner.id} />
            </div>
            <span className="text-sm font-semibold text-gray-800 tabular-nums whitespace-nowrap">
                {earner.amount}
            </span>
        </div>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function WinningCarousel() {
    const containerRef = useRef(null);
    const trackRef     = useRef(null);
    const [containerW, setContainerW] = useState(0);

    // Mutable state kept in a ref so closures always see the latest values
    const s = useRef({ current: TOTAL_SLIDES, busy: false, timerId: null });
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
            if (s.current.current >= TOTAL_SLIDES * 2) {
                s.current.current = TOTAL_SLIDES;
                track.style.transition = 'none';
                track.style.transform  = `translateX(${-s.current.current * containerW}px)`;
                void track.offsetWidth;
            }
            // Wrap backward
            else if (s.current.current < TOTAL_SLIDES) {
                s.current.current = TOTAL_SLIDES * 2 - 1;
                track.style.transition = 'none';
                track.style.transform  = `translateX(${-s.current.current * containerW}px)`;
                void track.offsetWidth;
            }

            s.current.busy = false;
        }, { once: true });
    }, [containerW]);

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
                                imgIdx={idx}
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
                        imgIdx={idx}
                        last={idx === earners.length - 1}
                    />
                ))}
            </div>
        </>
    );
}