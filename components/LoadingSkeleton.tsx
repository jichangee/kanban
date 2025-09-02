'use client'

import { useEffect, useState } from 'react'

export default function LoadingSkeleton() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Add a small delay to prevent flash for fast loads
    const timer = setTimeout(() => setIsVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  if (!isVisible) return null

  return (
    <div className="loading-container">
      {/* Header Skeleton */}
      <div className="loading-header">
        <div className="loading-logo loading-enhanced"></div>
        <div className="loading-nav">
          <div className="loading-nav-item loading-enhanced" style={{ animationDelay: '0.1s' }}></div>
          <div className="loading-nav-item loading-enhanced" style={{ animationDelay: '0.2s' }}></div>
          <div className="loading-nav-item loading-enhanced" style={{ animationDelay: '0.3s' }}></div>
        </div>
        <div className="loading-user loading-enhanced" style={{ animationDelay: '0.4s' }}></div>
      </div>

      {/* Main Content Skeleton */}
      <div className="loading-content">
        <div className="loading-board-header">
          <div className="loading-title loading-enhanced"></div>
          <div className="loading-actions">
            <div className="loading-button loading-enhanced" style={{ animationDelay: '0.2s' }}></div>
            <div className="loading-button loading-enhanced" style={{ animationDelay: '0.3s' }}></div>
          </div>
        </div>

        {/* Kanban Columns Skeleton */}
        <div className="loading-columns">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="loading-column glass-effect">
              <div className="loading-column-header">
                <div className="loading-column-title loading-enhanced"></div>
                <div className="loading-column-count loading-enhanced" style={{ animationDelay: '0.1s' }}></div>
              </div>
              <div className="loading-tasks">
                {Array.from({ length: 3 + (index % 2) }).map((_, taskIndex) => (
                  <div key={taskIndex} className="loading-task glass-effect">
                    <div className="loading-task-header">
                      <div className="loading-task-priority loading-enhanced"></div>
                      <div className="loading-task-menu loading-enhanced" style={{ animationDelay: '0.1s' }}></div>
                    </div>
                    <div className="loading-task-title loading-enhanced" style={{ animationDelay: '0.2s' }}></div>
                    <div className="loading-task-description loading-enhanced" style={{ animationDelay: '0.3s' }}></div>
                    <div className="loading-task-footer">
                      <div className="loading-task-tags">
                        <div className="loading-tag loading-enhanced" style={{ animationDelay: '0.4s' }}></div>
                        <div className="loading-tag loading-enhanced" style={{ animationDelay: '0.5s' }}></div>
                      </div>
                      <div className="loading-task-avatar loading-enhanced" style={{ animationDelay: '0.6s' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Action Button Skeleton */}
      <div className="loading-fab loading-float"></div>
    </div>
  )
}
