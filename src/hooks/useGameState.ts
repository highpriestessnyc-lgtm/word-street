'use client'
import { useState, useEffect, useCallback } from 'react'

export type GameState = {
  xp: number
  level: number
  currentLv: number
  mode: string
  learned: string[]
  score: number
  streak: number
  crewId: string
  sentIdx: number
  gramIdx: number
  gramQIdx: number
  qType: string
  rdgIdx: number
  rdgCorrect: number
  earnedBadges: string[]
  isPremium: boolean
}

const DEFAULT_STATE: GameState = {
  xp: 0, level: 1, currentLv: 1, mode: 'learn',
  learned: [], score: 0, streak: 1, crewId: 'shin',
  sentIdx: 0, gramIdx: 0, gramQIdx: 0, qType: 'emoji',
  rdgIdx: 0, rdgCorrect: 0, earnedBadges: [], isPremium: false,
}

export function useGameState() {
  const [state, setStateRaw] = useState<GameState>(DEFAULT_STATE)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('ws_state')
      if (saved) setStateRaw({ ...DEFAULT_STATE, ...JSON.parse(saved) })
    } catch {}
    setHydrated(true)
  }, [])

  const setState = useCallback((updater: Partial<GameState> | ((prev: GameState) => Partial<GameState>)) => {
    setStateRaw(prev => {
      const patch = typeof updater === 'function' ? updater(prev) : updater
      const next = { ...prev, ...patch }
      try { localStorage.setItem('ws_state', JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const calcLevel = (xp: number) => Math.min(20, Math.floor(xp / 60) + 1)

  const addXP = useCallback((n: number) => {
    setState(prev => {
      const newXP = prev.xp + n
      const newLv = calcLevel(newXP)
      return { xp: newXP, level: newLv }
    })
  }, [setState])

  const learnWord = useCallback((word: string) => {
    setState(prev => {
      if (prev.learned.includes(word)) return {}
      return { learned: [...prev.learned, word] }
    })
    addXP(5)
  }, [setState, addXP])

  const addScore = useCallback(() => {
    setState(prev => ({ score: prev.score + 1 }))
    addXP(10)
  }, [setState, addXP])

  const resetProgress = useCallback(() => {
    setStateRaw(DEFAULT_STATE)
    try { localStorage.removeItem('ws_state') } catch {}
  }, [])

  return { state, setState, addXP, learnWord, addScore, resetProgress, hydrated }
}
