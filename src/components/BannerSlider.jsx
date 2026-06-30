import React, { useEffect, useRef, useState, useCallback } from 'react'
import banner1 from '../assets/banner1.png'
import banner2 from '../assets/banner2.png'
import banner3 from '../assets/banner3.png'
import banner4 from '../assets/banner4.png'
import banner5 from '../assets/banner5.png'
import banner6 from '../assets/banner6.png'

const BANNERS = [banner1, banner2, banner3, banner4, banner5, banner6]
const slides = [BANNERS[BANNERS.length - 1], ...BANNERS, BANNERS[0]]
const TOTAL = slides.length

function BannerSlider() {
    const [index, setIndex] = useState(1)
    const [transitioning, setTransitioning] = useState(true)

    const indexRef = useRef(1)
    const intervalRef = useRef(null)
    const startXRef = useRef(null)
    const dragOffsetRef = useRef(0)
    const isDraggingRef = useRef(false)

    const moveTo = useCallback((i, animate = true) => {
        indexRef.current = i
        setTransitioning(animate)
        setIndex(i)
    }, [])

    const next = useCallback(() => {
        const nextIndex = indexRef.current + 1
        moveTo(nextIndex, true)
    }, [moveTo])

    const resetInterval = useCallback(() => {
        clearInterval(intervalRef.current)
        intervalRef.current = setInterval(next, 3000)
    }, [next])

    useEffect(() => {
        resetInterval()
        return () => clearInterval(intervalRef.current)
    }, [resetInterval])

    const handleTransitionEnd = useCallback(() => {
        const current = indexRef.current
        // Slid to cloned first (right end) → jump to real first
        if (current >= TOTAL - 1) {
            moveTo(1, false)
            return
        }
        // Slid to cloned last (left end) → jump to real last
        if (current <= 0) {
            moveTo(BANNERS.length, false)
        }
    }, [moveTo])

    const activeDot = ((indexRef.current - 1) % BANNERS.length + BANNERS.length) % BANNERS.length

    // Touch
    const onTouchStart = (e) => {
        startXRef.current = e.touches[0].clientX
        isDraggingRef.current = true
        dragOffsetRef.current = 0
        clearInterval(intervalRef.current)
    }
    const onTouchMove = (e) => {
        if (!isDraggingRef.current) return
        dragOffsetRef.current = e.touches[0].clientX - startXRef.current
    }
    const onTouchEnd = () => {
        if (!isDraggingRef.current) return
        isDraggingRef.current = false
        if (dragOffsetRef.current < -50) moveTo(indexRef.current + 1)
        else if (dragOffsetRef.current > 50) moveTo(indexRef.current - 1)
        resetInterval()
    }

    // Mouse
    const onMouseDown = (e) => {
        startXRef.current = e.clientX
        isDraggingRef.current = true
        dragOffsetRef.current = 0
        clearInterval(intervalRef.current)
    }
    const onMouseMove = (e) => {
        if (!isDraggingRef.current) return
        dragOffsetRef.current = e.clientX - startXRef.current
    }
    const onMouseUp = () => {
        if (!isDraggingRef.current) return
        isDraggingRef.current = false
        if (dragOffsetRef.current < -50) moveTo(indexRef.current + 1)
        else if (dragOffsetRef.current > 50) moveTo(indexRef.current - 1)
        resetInterval()
    }

    return (
        <div className="w-full overflow-hidden relative select-none mt-2">
            <div
                style={{
                    display: 'flex',
                    transform: `translateX(-${index * 100}%)`,
                    transition: transitioning ? 'transform 500ms ease-in-out' : 'none',
                    willChange: 'transform',
                }}
                onTransitionEnd={handleTransitionEnd}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
            >
                {slides.map((src, i) => (
                    <img
                        key={i}
                        src={src}
                        alt={`Banner ${i}`}
                        style={{ width: '100%', flexShrink: 0, display: 'block' }}
                        draggable={false}
                    />
                ))}
            </div>

            {/* Dots */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                {BANNERS.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => { moveTo(i + 1); resetInterval() }}
                        style={{
                            width: i === activeDot ? 16 : 8,
                            height: 8,
                            borderRadius: 9999,
                            background: i === activeDot ? 'white' : 'rgba(255,255,255,0.45)',
                            border: 'none',
                            padding: 0,
                            transition: 'width 300ms',
                            cursor: 'pointer',
                        }}
                    />
                ))}
            </div>
        </div>
    )
}

export default BannerSlider