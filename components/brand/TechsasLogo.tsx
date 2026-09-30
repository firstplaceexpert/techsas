import React from 'react'
import Image from 'next/image'

interface TechsasLogoProps {
  variant?: 'horizontal' | 'vertical' | 'icon' | 'reversed'
  className?: string
  showTagline?: boolean
  iconSize?: number
}

export default function TechsasLogo({
  variant = 'horizontal',
  className = '',
  showTagline = false,
  iconSize = 36,
}: TechsasLogoProps) {
  const isDarkBg = variant === 'reversed'

  // The official TECHSAS mark from the brand asset
  const Icon = (
    <div
      className="relative shrink-0 overflow-hidden rounded-xl shadow-xs border border-cloud-200/60 bg-white flex items-center justify-center p-0.5"
      style={{ width: iconSize, height: iconSize }}
    >
      <img
        src="/techsas-logo.png"
        alt="TECHSAS Brand Mark"
        className="w-full h-full object-contain"
      />
    </div>
  )

  if (variant === 'icon') {
    return <div className={`inline-flex items-center justify-center ${className}`}>{Icon}</div>
  }

  if (variant === 'vertical') {
    return (
      <div className={`flex flex-col items-center text-center gap-2.5 ${className}`}>
        {Icon}
        <div>
          <span className={`font-sans font-black text-xl tracking-[0.18em] ${isDarkBg ? 'text-white' : 'text-[#0F0F0F]'}`}>
            TECHSAS
          </span>
          {showTagline && (
            <p className="text-[11px] text-[#6B7280] font-medium tracking-tight mt-1 max-w-[220px] leading-snug">
              Platform Manajemen Aset UMKM Cerdas & Universal
            </p>
          )}
        </div>
      </div>
    )
  }

  // Horizontal (Default) or Reversed
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {Icon}
      <div className="flex flex-col justify-center">
        <span
          className={`font-sans font-black tracking-[0.16em] leading-none ${
            iconSize >= 40 ? 'text-2xl' : iconSize >= 32 ? 'text-lg' : 'text-base'
          } ${isDarkBg ? 'text-white' : 'text-[#0F0F0F]'}`}
        >
          TECHSAS
        </span>
        {showTagline && (
          <span className="text-[10px] text-[#6B7280] font-medium tracking-tight mt-0.5 leading-tight">
            Universal Smart Asset Management
          </span>
        )}
      </div>
    </div>
  )
}
