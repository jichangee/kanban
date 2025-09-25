'use client'

import { useEffect, useState } from 'react'

// Global loading state management
class LoadingManager {
  private static instance: LoadingManager
  private loadingStates: Map<string, boolean> = new Map()
  private listeners: Set<(states: Map<string, boolean>) => void> = new Set()

  static getInstance(): LoadingManager {
    if (!LoadingManager.instance) {
      LoadingManager.instance = new LoadingManager()
    }
    return LoadingManager.instance
  }

  setLoading(key: string, loading: boolean) {
    this.loadingStates.set(key, loading)
    this.notifyListeners()
  }

  isLoading(key: string): boolean {
    return this.loadingStates.get(key) || false
  }

  isAnyLoading(): boolean {
    return Array.from(this.loadingStates.values()).some(loading => loading)
  }

  subscribe(listener: (states: Map<string, boolean>) => void) {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(new Map(this.loadingStates)))
  }
}

// Hook for managing loading states
export function useLoading(key: string) {
  const manager = LoadingManager.getInstance()
  const [loading, setLoading] = useState(manager.isLoading(key))

  useEffect(() => {
    const unsubscribe = manager.subscribe((states) => {
      setLoading(states.get(key) || false)
    })
    return () => unsubscribe()
  }, [key, manager])

  const setLoadingState = (isLoading: boolean) => {
    manager.setLoading(key, isLoading)
  }

  return [loading, setLoadingState] as const
}

// Hook for global loading state
export function useGlobalLoading() {
  const manager = LoadingManager.getInstance()
  const [isAnyLoading, setIsAnyLoading] = useState(manager.isAnyLoading())

  useEffect(() => {
    const unsubscribe = manager.subscribe((states) => {
      setIsAnyLoading(Array.from(states.values()).some(loading => loading))
    })
    return () => unsubscribe()
  }, [manager])

  return isAnyLoading
}

// Utility functions for showing/hiding global loading
export function showGlobalLoading() {
  const element = document.getElementById('global-loading')
  if (element) {
    element.classList.remove('hidden')
  }
}

export function hideGlobalLoading() {
  const element = document.getElementById('global-loading')
  if (element) {
    element.classList.add('hidden')
  }
}

// Debounced loading hook to prevent flash for quick operations
export function useDebouncedLoading(key: string, delay: number = 300) {
  const [loading, setLoading] = useState(false)
  const [debouncedLoading, setDebouncedLoading] = useState(false)

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => setDebouncedLoading(true), delay)
      return () => clearTimeout(timer)
    } else {
      setDebouncedLoading(false)
    }
  }, [loading, delay])

  return [debouncedLoading, setLoading] as const
}

// Loading with progress
export function useLoadingWithProgress() {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  const startLoading = () => {
    setLoading(true)
    setProgress(0)
  }

  const updateProgress = (newProgress: number) => {
    setProgress(Math.min(100, Math.max(0, newProgress)))
  }

  const finishLoading = () => {
    setProgress(100)
    setTimeout(() => {
      setLoading(false)
      setProgress(0)
    }, 500)
  }

  return {
    loading,
    progress,
    startLoading,
    updateProgress,
    finishLoading
  }
}
