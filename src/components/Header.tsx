'use client'
import { GameState } from '@/hooks/useGameState'

type Props = { state: GameState }

export default function Header({ state }: Props) {
  const maxXP = state.level * 60
  const curXP = state.xp % maxXP
  const pct = Math.min(100, Math.round(curXP / maxXP * 100))

  return (
    <div className="mb-3">
      {/* brand + xp bar */}
      <div className="flex items-center gap-2 mb-3">
        <div className="text-xs font-medium tracking-widest text-gray-400 shrink-0">
          <span className="text-ws-orange font-semibold">WORD</span> STREET
        </div>
        <div className="flex-1">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-ws-orange rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="text-[10px] text-gray-400 text-right mt-0.5">
            Lv.{state.level} — {curXP}/{maxXP} XP
          </div>
        </div>
        <div className="text-xs font-semibold text-gray-500 shrink-0">XP {state.xp}</div>
      </div>

      {/* stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { n: state.learned.length, l: '単語マスター' },
          { n: state.streak, l: '連続日数' },
          { n: state.level, l: 'レベル' },
          { n: state.score, l: '正解数' },
        ].map(({ n, l }) => (
          <div key={l} className="bg-gray-100 rounded-lg p-2 text-center">
            <div className="text-lg font-medium text-gray-800">{n}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">{l}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
