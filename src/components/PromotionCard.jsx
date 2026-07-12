import React, { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import KeyboardArrowRightOutlinedIcon from '@mui/icons-material/KeyboardArrowRightOutlined'
import banner from '../assets/promotion.jpg'

function PromotionCard() {
    const navigate = useNavigate()
    const [loaded, setLoaded] = useState(false)
    const imgRef = useRef(null)

    // Covers the case where the image is served from browser cache and
    // `onLoad` fires before this component's listener is attached.
    const setImgRef = (el) => {
        imgRef.current = el
        if (el && el.complete) setLoaded(true)
    }

    return (
        <div className="px-4 mt-4">
            <div
                className="bg-white px-4 py-3 cursor-pointer rounded-sm"
                onClick={() => navigate('/promotion')}
            >
                <div className="text-gray-500 mb-2">My promotion</div>
                <div className="relative overflow-hidden rounded-sm" style={{ aspectRatio: '2.7 / 1' }}>
                    {!loaded && (
                        <div className="absolute inset-0 bg-gray-100 animate-pulse" />
                    )}
                    <img
                        ref={setImgRef}
                        src={banner}
                        alt="Promotion Banner"
                        onLoad={() => setLoaded(true)}
                        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
                    />
                </div>
                <div className="mx-auto border-b border-gray-200 mt-4"></div>
                <div className="flex justify-between items-center">
                    <div className="text-gray-500 text-sm mt-2">View Details</div>
                    <KeyboardArrowRightOutlinedIcon sx={{ fontSize: 20, color: 'grey.500' }} />
                </div>
            </div>
        </div>
    )
}

export default PromotionCard
