import React from 'react'
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos'
import { useNavigate } from 'react-router-dom'

const DEFAULT_BG = 'linear-gradient(90deg,#d9ad82,#b1835a)'

function BackButton({
    label,
    to,
    fallback = '/',
    className = '',
    iconColor,
    textColor,
    background,
    rightLabel,      // text for the right-side action (e.g. "Records")
    rightTo,         // route the right action navigates to
    onRightClick,    // OR a custom handler instead of a route
    rightContent,    // OR fully custom JSX for the right side
}) {
    const navigate = useNavigate()

    const handleBack = () => {
        if (to) { navigate(to); return }
        if (window.history.state && window.history.state.idx > 0) {
            navigate(-1)
        } else {
            navigate(fallback, { replace: true })
        }
    }

    const handleRight = () => {
        if (onRightClick) { onRightClick(); return }
        if (rightTo) navigate(rightTo)
    }

    return (
        <div
            className={`p-4 text-white flex items-center justify-between sticky top-0 z-10 ${className}`}
            style={{ background: background || DEFAULT_BG }}
        >
            {/* Left: back */}
            <div className="cursor-pointer flex items-center gap-2" onClick={handleBack}>
                <ArrowBackIosIcon fontSize="small" style={{ color: iconColor }} />
                {label && <span className="text-sm ml-1 font-medium" style={{ color: textColor }}>{label}</span>}
            </div>

            {/* Right: optional action — renders only if provided */}
            {rightContent ? (
                rightContent
            ) : rightLabel ? (
                <span
                    onClick={handleRight}
                    className="text-sm font-medium cursor-pointer active:opacity-70 transition-opacity"
                    style={{ color: textColor }}
                >
                    {rightLabel}
                </span>
            ) : null}
        </div>
    )
}

export default BackButton