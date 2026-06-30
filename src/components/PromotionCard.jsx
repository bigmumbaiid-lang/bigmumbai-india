import React from 'react'
import { useNavigate } from 'react-router-dom'
import KeyboardArrowRightOutlinedIcon from '@mui/icons-material/KeyboardArrowRightOutlined'
import banner from '../assets/promotion.jpg'

function PromotionCard() {
    const navigate = useNavigate()

    return (
        <div className="px-4 mt-4">
            <div
                className="bg-white px-4 py-3 cursor-pointer rounded-sm"
                onClick={() => navigate('/promotion')}
            >
                <div className="text-gray-500 mb-2">My promotion</div>
                <div className="relative overflow-hidden">
                    <img src={banner} alt="Promotion Banner" className="w-full h-auto object-cover" />
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