'use client'

import { useEffect, useState } from 'react'

interface ModernLoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  variant?: 'default' | 'minimal' | 'dots' | 'pulse'
  className?: string
}

export default function ModernLoadingSpinner({ 
  size = 'medium', 
  variant = 'default',
  className = '' 
}: ModernLoadingSpinnerProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50)
    return () => clearTimeout(timer)
  }, [])

  if (!isVisible) return null

  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  }

  const renderSpinner = () => {
    switch (variant) {
      case 'minimal':
        return (
          <div className={`${sizeClasses[size]} flex items-center justify-center ${className}`}>
            <div className="w-full h-full border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )
      
      case 'dots':
        return (
          <div className={`flex items-center justify-center space-x-1 ${className}`}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-white/60 rounded-full animate-pulse"
                style={{
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '1s'
                }}
              />
            ))}
          </div>
        )
      
      case 'pulse':
        return (
          <div className={`${sizeClasses[size]} flex items-center justify-center ${className}`}>
            <div className="w-full h-full bg-white/60 rounded-full animate-pulse" />
          </div>
        )
      
      default:
        return (
          <div className={`${sizeClasses[size]} flex items-center justify-center ${className}`}>
            <div className="w-full h-full border-3 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )
    }
  }

  return renderSpinner()
}

// Loading overlay component
export function LoadingOverlay({ 
  message = '加载中...', 
  showSpinner = true,
  className = '' 
}: { 
  message?: string
  showSpinner?: boolean
  className?: string 
}) {
  return (
    <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 flex flex-col items-center space-y-4 border border-white/20 shadow-2xl">
        {showSpinner && <ModernLoadingSpinner size="large" />}
        <p className="text-white/90 text-sm font-medium">{message}</p>
      </div>
    </div>
  )
}

// Progress bar component
export function LoadingProgress({ 
  progress = 0, 
  className = '' 
}: { 
  progress: number
  className?: string 
}) {
  return (
    <div className={`w-full bg-white/20 rounded-full h-3 overflow-hidden ${className}`}>
      <div 
        className="h-full bg-white/80 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  )
}
