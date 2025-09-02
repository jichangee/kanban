'use client'

import { useState, useEffect } from 'react'

export default function AdvancedLoadingEffects() {
  const [activeEffect, setActiveEffect] = useState<string>('')

  const effects = [
    { id: 'ripple', name: '涟漪效果', description: '从中心向外扩散的涟漪动画' },
    { id: 'morphing', name: '变形效果', description: '形状不断变化的动画' },
    { id: 'breathing', name: '呼吸效果', description: '缓慢的缩放呼吸动画' },
    { id: 'gradient', name: '渐变效果', description: '颜色渐变的背景动画' },
    { id: 'sparkle', name: '闪烁效果', description: '星星点点的闪烁动画' },
  ]

  const renderEffect = (effectId: string) => {
    switch (effectId) {
      case 'ripple':
        return (
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center loading-ripple">
            <div className="w-8 h-8 bg-white/60 rounded-full"></div>
          </div>
        )
      case 'morphing':
        return (
          <div className="w-20 h-20 bg-gradient-to-br from-white/40 to-white/20 loading-morphing"></div>
        )
      case 'breathing':
        return (
          <div className="w-20 h-20 bg-white/30 rounded-full loading-breathing"></div>
        )
      case 'gradient':
        return (
          <div className="w-20 h-20 bg-white/30 rounded-full animate-pulse"></div>
        )
      case 'sparkle':
        return (
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center loading-sparkle">
            <div className="w-8 h-8 bg-white/60 rounded-full"></div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">高级加载效果</h2>
        <p className="text-white/70">体验更多创新的加载动画效果</p>
      </div>

      {/* Effect Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {effects.map((effect) => (
          <div
            key={effect.id}
            className="loading-card-modern rounded-xl p-6 text-center cursor-pointer transition-all duration-200 hover:scale-105"
            onClick={() => setActiveEffect(effect.id)}
          >
            <div className="flex justify-center mb-4">
              {renderEffect(effect.id)}
            </div>
            <h3 className="text-white/90 font-medium mb-2">{effect.name}</h3>
            <p className="text-white/60 text-xs">{effect.description}</p>
          </div>
        ))}
      </div>

      {/* Active Effect Display */}
      {activeEffect && (
        <div className="loading-card-modern rounded-xl p-8 text-center">
          <h3 className="text-white/90 font-medium mb-6">
            当前效果: {effects.find(e => e.id === activeEffect)?.name}
          </h3>
          <div className="flex justify-center mb-6">
            {renderEffect(activeEffect)}
          </div>
          <p className="text-white/70 text-sm mb-4">
            {effects.find(e => e.id === activeEffect)?.description}
          </p>
          <button
            onClick={() => setActiveEffect('')}
            className="loading-button-modern px-4 py-2 rounded-lg text-white font-medium"
          >
            关闭演示
          </button>
        </div>
      )}

      {/* Text Effects */}
      <div className="loading-card-modern rounded-xl p-6">
        <h3 className="text-white/90 font-medium mb-6 text-center">文字加载效果</h3>
        <div className="space-y-4">
          <div className="text-center">
            <h4 className="text-white/80 text-sm mb-2">渐变文字</h4>
            <p className="text-2xl font-bold loading-text-gradient">加载中...</p>
          </div>
          <div className="text-center">
            <h4 className="text-white/80 text-sm mb-2">闪烁文字</h4>
            <p className="text-2xl font-bold loading-text-shimmer">加载中...</p>
          </div>
        </div>
      </div>

      {/* Loading States Demo */}
      <div className="loading-card-modern rounded-xl p-6">
        <h3 className="text-white/90 font-medium mb-6 text-center">加载状态演示</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-white/80 text-sm">按钮加载状态</h4>
            <button className="loading-button-modern w-full py-3 rounded-lg text-white font-medium">
              加载中...
            </button>
          </div>
          <div className="space-y-4">
            <h4 className="text-white/80 text-sm">卡片加载状态</h4>
            <div className="loading-card-modern p-4 rounded-lg">
              <div className="space-y-2">
                <div className="h-4 bg-white/20 rounded loading-enhanced"></div>
                <div className="h-3 bg-white/15 rounded w-3/4 loading-enhanced" style={{ animationDelay: '0.1s' }}></div>
                <div className="h-3 bg-white/15 rounded w-1/2 loading-enhanced" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
