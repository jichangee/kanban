'use client'

import { useState, useEffect } from 'react'
import ModernLoadingSpinner, { LoadingOverlay, LoadingProgress } from './ModernLoadingSpinner'
import { useLoadingWithProgress, useDebouncedLoading } from '@/lib/loading'
import AdvancedLoadingEffects from './AdvancedLoadingEffects'

export default function LoadingDemo() {
  const [showOverlay, setShowOverlay] = useState(false)
  const [showProgress, setShowProgress] = useState(false)
  const { loading: progressLoading, progress, startLoading, updateProgress, finishLoading } = useLoadingWithProgress()
  const [debouncedLoading, setDebouncedLoading] = useDebouncedLoading('demo', 500)

  const handleProgressDemo = () => {
    setShowProgress(true)
    startLoading()
    
    // Simulate progress updates
    let currentProgress = 0
    const interval = setInterval(() => {
      currentProgress += Math.random() * 20
      if (currentProgress >= 100) {
        clearInterval(interval)
        updateProgress(100)
        setTimeout(() => {
          finishLoading()
          setShowProgress(false)
        }, 1000)
      } else {
        updateProgress(currentProgress)
      }
    }, 200)
  }

  const handleOverlayDemo = () => {
    setShowOverlay(true)
    setTimeout(() => setShowOverlay(false), 3000)
  }

  const handleDebouncedDemo = () => {
    setDebouncedLoading(true)
    setTimeout(() => setDebouncedLoading(false), 1000)
  }

  return (
    <div className="p-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-4">现代加载页面演示</h1>
        <p className="text-white/70">体验各种现代化的加载效果</p>
      </div>

      {/* Spinner Variants */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="loading-card-modern rounded-xl p-6 text-center">
          <h3 className="text-white/90 font-medium mb-4">默认样式</h3>
          <div className="flex justify-center">
            <ModernLoadingSpinner size="medium" variant="default" />
          </div>
        </div>
        
        <div className="loading-card-modern rounded-xl p-6 text-center">
          <h3 className="text-white/90 font-medium mb-4">简约样式</h3>
          <div className="flex justify-center">
            <ModernLoadingSpinner size="medium" variant="minimal" />
          </div>
        </div>
        
        <div className="loading-card-modern rounded-xl p-6 text-center">
          <h3 className="text-white/90 font-medium mb-4">点状样式</h3>
          <div className="flex justify-center">
            <ModernLoadingSpinner size="medium" variant="dots" />
          </div>
        </div>
        
        <div className="loading-card-modern rounded-xl p-6 text-center">
          <h3 className="text-white/90 font-medium mb-4">脉冲样式</h3>
          <div className="flex justify-center">
            <ModernLoadingSpinner size="medium" variant="pulse" />
          </div>
        </div>
      </div>

      {/* Size Variants */}
      <div className="loading-card-modern rounded-xl p-6">
        <h3 className="text-white/90 font-medium mb-6 text-center">不同尺寸</h3>
        <div className="flex justify-center items-center space-x-8">
          <div className="text-center">
            <ModernLoadingSpinner size="small" variant="default" />
            <p className="text-white/70 text-sm mt-2">小</p>
          </div>
          <div className="text-center">
            <ModernLoadingSpinner size="medium" variant="default" />
            <p className="text-white/70 text-sm mt-2">中</p>
          </div>
          <div className="text-center">
            <ModernLoadingSpinner size="large" variant="default" />
            <p className="text-white/70 text-sm mt-2">大</p>
          </div>
        </div>
      </div>

      {/* Interactive Demos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={handleOverlayDemo}
          className="loading-button-modern hover:bg-white/30 rounded-xl p-6 transition-all duration-200 text-white font-medium"
        >
          <h3 className="mb-2">覆盖层加载</h3>
          <p className="text-white/70 text-sm">点击体验全屏加载覆盖层</p>
        </button>

        <button
          onClick={handleProgressDemo}
          className="loading-button-modern hover:bg-white/30 rounded-xl p-6 transition-all duration-200 text-white font-medium"
        >
          <h3 className="mb-2">进度条加载</h3>
          <p className="text-white/70 text-sm">点击体验带进度条的加载</p>
        </button>

        <button
          onClick={handleDebouncedDemo}
          className="loading-button-modern hover:bg-white/30 rounded-xl p-6 transition-all duration-200 text-white font-medium"
        >
          <h3 className="mb-2">防闪烁加载</h3>
          <p className="text-white/70 text-sm">点击体验防闪烁的加载效果</p>
        </button>
      </div>

      {/* Progress Demo */}
      {showProgress && (
        <div className="loading-card-modern rounded-xl p-6">
          <h3 className="text-white/90 font-medium mb-4">进度加载演示</h3>
          <div className="space-y-4">
            <LoadingProgress progress={progress} />
            <div className="flex justify-between text-white/70 text-sm">
              <span>加载中...</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Debounced Loading Demo */}
      {debouncedLoading && (
        <div className="loading-card-modern rounded-xl p-6 text-center">
          <h3 className="text-white/90 font-medium mb-4">防闪烁加载演示</h3>
          <ModernLoadingSpinner size="medium" variant="default" />
          <p className="text-white/70 text-sm mt-2">这个加载效果有500ms的延迟，防止快速操作时的闪烁</p>
        </div>
      )}

      {/* Overlay Demo */}
      {showOverlay && (
        <LoadingOverlay message="正在处理您的请求，请稍候..." />
      )}

      {/* Advanced Effects */}
      <AdvancedLoadingEffects />
    </div>
  )
}
