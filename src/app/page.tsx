'use client'
import { useState, useCallback, useEffect } from 'react'
import { useGameState } from '@/hooks/useGameState'
import { LEVELS, CREW, SENTENCES, CONVERSATIONS, GRAMMAR_RULES, READINGS, BADGES } from '@/data/gameData'
import Header from '@/components/Header'
import CharCanvas from '@/components/CharCanvas'

// ---- helpers ----
function calcLevel(xp: number) { return Math.min(20, Math.floor(xp / 60) + 1) }
function speakEn(text: string, onEnd?: () => void) {
  if (typeof window === 'undefined') return
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en-US'; u.rate = 0.85
  if (onEnd) u.onend = onEnd
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(u)
}

// ---- sub components ----
function EikenBadge({ cls, label }: { cls: string; label: string }) {
  return <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${cls}`}>{label}</span>
}

function SpeakWave({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <span className="inline-flex items-end gap-0.5 ml-2 h-5">
      {[0,1,2,3].map(i => (
        <span key={i} className="wave-bar" style={{ animationDelay: `${i * 0.1}s` }} />
      ))}
    </span>
  )
}

// ---- WORD LEARN MODE ----
function LearnMode({ curLv, learned, onLearn, onSpeak }: {
  curLv: number; learned: string[]; onLearn: (w: string) => void; onSpeak: (w: string) => void
}) {
  const lv = LEVELS.find(l => l.id === curLv)!
  const [selWord, setSelWord] = useState<typeof lv.words[0] | null>(null)
  const [speaking, setSpeaking] = useState(false)

  function select(w: typeof lv.words[0]) {
    setSelWord(w); onLearn(w.en)
  }
  function handleSpeak() {
    if (!selWord) return
    setSpeaking(true)
    speakEn(selWord.en, () => setSpeaking(false))
    onSpeak(selWord.en)
  }

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        {lv.words.map(w => {
          const done = learned.includes(w.en)
          const sel = selWord?.en === w.en
          return (
            <button
              key={w.en}
              onClick={() => select(w)}
              className={`relative rounded-xl p-3 text-center transition-all duration-200 border cursor-pointer
                ${sel ? 'border-ws-orange border-2 -translate-y-0.5 bg-white' :
                  done ? 'border-ws-teal bg-ws-teal-light' : 'border-gray-200 bg-white hover:border-ws-orange'}`}
            >
              <div className="text-2xl mb-1">{w.e}</div>
              <div className="text-sm font-medium text-gray-800">{w.en}</div>
              <div className="text-[11px] text-gray-500 mt-0.5">{w.jp}</div>
              {done && (
                <span className="absolute top-1 right-1 text-ws-teal text-xs">✓</span>
              )}
            </button>
          )
        })}
      </div>

      {selWord && (
        <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
          <div className="text-4xl mb-2">{selWord.e}</div>
          <div className="text-xl font-semibold text-gray-800 mb-1">{selWord.en}</div>
          <div className="text-sm text-gray-500 mb-1">{selWord.jp}</div>
          <span className="inline-block text-xs px-2 py-0.5 bg-ws-purple-light text-ws-purple-dark rounded-full mb-2">
            {selWord.g}
          </span>
          {selWord.syn && (
            <div className="text-xs text-ws-blue bg-ws-blue-light px-2 py-0.5 rounded-full inline-block mb-2 ml-1">
              類義語: {selWord.syn}
            </div>
          )}
          <div className="text-xs text-gray-400 italic mb-3">"{selWord.ex}"</div>
          <button
            onClick={handleSpeak}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-ws-orange text-white rounded-lg text-sm"
          >
            🔊 聞く <SpeakWave show={speaking} />
          </button>
        </div>
      )}
    </div>
  )
}

// ---- QUIZ MODE ----
function QuizMode({ curLv, onCorrect }: { curLv: number; onCorrect: () => void }) {
  const lv = LEVELS.find(l => l.id === curLv)!
  const [qType, setQType] = useState<'emoji' | 'jp' | 'en'>('emoji')
  const [q, setQ] = useState(() => lv.words[0])
  const [opts, setOpts] = useState<typeof lv.words>([])
  const [result, setResult] = useState<string | null>(null)
  const [locked, setLocked] = useState(false)

  function newQ(lvWords = lv.words) {
    const nq = lvWords[Math.floor(Math.random() * lvWords.length)]
    const wrong = lvWords.filter(w => w.en !== nq.en).sort(() => Math.random() - .5).slice(0, 3)
    setQ(nq); setOpts([nq, ...wrong].sort(() => Math.random() - .5))
    setResult(null); setLocked(false)
  }

  useEffect(() => { newQ(lv.words) }, [curLv])

  function answer(opt: typeof lv.words[0]) {
    if (locked) return
    setLocked(true)
    const ok = qType === 'en' ? opt.jp === q.jp : opt.en === q.en
    setResult(ok ? 'correct' : 'wrong')
    if (ok) onCorrect()
    setTimeout(() => newQ(), 1500)
  }

  const showTarget = qType === 'emoji' ? q.e : qType === 'jp' ? q.jp : q.en
  const getOptLabel = (o: typeof lv.words[0]) => qType === 'en' ? o.jp : o.en

  return (
    <div>
      <div className="flex gap-2 mb-3">
        {(['emoji','jp','en'] as const).map(t => (
          <button key={t} onClick={() => { setQType(t); newQ() }}
            className={`px-3 py-1 rounded-full text-xs border transition-all ${qType === t ? 'bg-ws-purple text-white border-ws-purple' : 'bg-white text-gray-500 border-gray-200'}`}>
            {t === 'emoji' ? '絵→英語' : t === 'jp' ? '日本語→英語' : '英語→日本語'}
          </button>
        ))}
      </div>
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <div className="text-4xl text-center mb-1">{showTarget}</div>
        <div className="text-xs text-gray-400 text-center mb-4">
          {qType === 'emoji' ? 'この絵は英語でなんと言う？' : qType === 'jp' ? '日本語を英語に' : '英語を日本語に'}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {opts.map(o => (
            <button key={o.en} onClick={() => answer(o)}
              className={`py-2.5 px-2 rounded-lg border text-sm font-medium transition-all
                ${locked && o.en === q.en ? 'bg-ws-teal-light border-ws-teal text-ws-teal-dark' :
                  locked && result === 'wrong' && (qType === 'en' ? o.jp === opts.find(x => x.en !== q.en)?.jp : o.en !== q.en) ? '' :
                  'bg-white border-gray-200 hover:border-ws-orange'}`}>
              {getOptLabel(o)}
            </button>
          ))}
        </div>
        {result && (
          <div className={`text-center text-sm mt-3 font-medium ${result === 'correct' ? 'text-ws-teal-dark' : 'text-red-600'}`}>
            {result === 'correct' ? '✓ Great! +10XP' : `× 正解: ${qType === 'en' ? q.jp : q.en}`}
          </div>
        )}
      </div>
    </div>
  )
}

// ---- SENTENCE MODE ----
function SentenceMode({ curLv, onCorrect }: { curLv: number; onCorrect: () => void }) {
  const sents = SENTENCES[curLv] || SENTENCES[1]
  const [idx, setIdx] = useState(0)
  const [ans, setAns] = useState<string[]>([])
  const [used, setUsed] = useState<boolean[]>([])
  const [shuffled, setShuffled] = useState<string[]>([])
  const [fb, setFb] = useState('')
  const [hint, setHint] = useState('')

  const s = sents[idx % sents.length]

  useEffect(() => {
    const sh = [...s.words].sort(() => Math.random() - .5)
    setShuffled(sh); setUsed(new Array(sh.length).fill(false))
    setAns([]); setFb(''); setHint('')
  }, [idx, curLv])

  function addToken(i: number) {
    if (used[i]) return
    const nu = [...used]; nu[i] = true
    setUsed(nu); setAns([...ans, shuffled[i]])
  }
  function removeToken(i: number) {
    const word = ans[i]
    const wi = shuffled.findIndex((w, si) => w === word && used[si] && !ans.slice(0, i).includes(w))
    const nu = [...used]; if (wi >= 0) nu[wi] = false
    setUsed(nu); setAns(ans.filter((_, ai) => ai !== i))
  }
  function check() {
    const correct = s.en.split(' ')
    if (JSON.stringify(ans) === JSON.stringify(correct)) {
      setFb('✓ パーフェクト！ +15XP'); onCorrect()
    } else {
      setFb(`× 正解: ${s.en}`)
    }
  }

  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
      <div className="text-xs text-gray-400 mb-1 font-medium tracking-wide">文章並べ替え</div>
      <div className="text-sm font-semibold text-gray-800 mb-3">{s.jp}</div>
      {hint && <div className="text-xs text-gray-400 italic mb-2">{hint}</div>}
      <div className="flex flex-wrap gap-1.5 min-h-9 p-2 bg-white rounded-lg border border-gray-200 mb-2 items-center">
        {ans.length === 0 && <span className="text-xs text-gray-400">単語をタップして並べよう</span>}
        {ans.map((w, i) => (
          <button key={i} onClick={() => removeToken(i)}
            className="px-2.5 py-1 bg-ws-orange-light text-ws-orange-dark rounded-full text-xs font-medium hover:bg-orange-200">
            {w}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {shuffled.map((w, i) => (
          <button key={i} onClick={() => addToken(i)}
            className={`px-2.5 py-1 rounded-full text-xs border transition-all ${used[i] ? 'opacity-25 cursor-not-allowed' : 'bg-white border-gray-200 hover:border-ws-orange text-gray-700'}`}>
            {w}
          </button>
        ))}
      </div>
      {fb && (
        <div className={`text-xs mb-2 font-medium ${fb.startsWith('✓') ? 'text-ws-teal-dark' : 'text-red-600'}`}>{fb}</div>
      )}
      <div className="flex gap-2">
        <button onClick={check} className="px-3 py-1.5 bg-ws-orange text-white rounded-lg text-xs">確認</button>
        <button onClick={() => setIdx(i => i + 1)} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-500 rounded-lg text-xs">次へ</button>
        <button onClick={() => setHint(`ヒント: "${s.en.split(' ').slice(0,3).join(' ')}..."`)}
          className="px-3 py-1.5 bg-ws-purple-light text-ws-purple-dark border border-purple-200 rounded-lg text-xs">ヒント</button>
      </div>
    </div>
  )
}

// ---- CONVERSATION MODE ----
function ConvMode({ curLv, onCorrect }: { curLv: number; onCorrect: () => void }) {
  const keys = Object.keys(CONVERSATIONS).map(Number).sort((a, b) => a - b)
  const key = keys.filter(k => k <= curLv).pop() || keys[0]
  const data = CONVERSATIONS[key]
  const [step, setStep] = useState(0)
  const [lines, setLines] = useState<{ text: string; isUser: boolean; em: string }[]>([])
  const [fb, setFb] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    setStep(0); setLines([]); setFb(''); setDone(false)
  }, [curLv])

  useEffect(() => {
    if (step >= data.lines.length || done) return
    const line = data.lines[step]
    if (!line.isUser) {
      setLines(prev => [...prev, { text: line.t!, isUser: false, em: line.em }])
      const t = setTimeout(() => setStep(s => s + 1), 700)
      return () => clearTimeout(t)
    }
  }, [step, data, done])

  function choose(ch: { t: string; jp: string; ok: boolean }) {
    setLines(prev => [...prev, { text: ch.t, isUser: true, em: '🕺' }])
    if (ch.ok) { onCorrect(); setFb('✓ +20XP! ネイティブ表現！') }
    else setFb('× 文法ミス。正解を確認しよう。')
    setDone(true)
    setTimeout(() => {
      setLines(prev => [...prev, { text: data.lines[step + 1]?.t || '', isUser: false, em: data.lines[step + 1]?.em || '🕺' }])
    }, 700)
  }

  const curLine = data.lines[step]
  const isChoiceStep = !done && curLine?.isUser

  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
      <div className="text-[10px] text-gray-400 font-medium tracking-wide mb-3">{data.scene}</div>
      <div className="flex flex-col gap-2 mb-3">
        {lines.map((l, i) => (
          <div key={i} className={`flex gap-2 ${l.isUser ? 'flex-row-reverse' : ''}`}>
            <span className="text-xl shrink-0">{l.em}</span>
            <div className={`max-w-xs text-sm rounded-xl px-3 py-2 ${l.isUser ? 'bg-ws-orange-light text-ws-orange-dark' : 'bg-white border border-gray-200 text-gray-800'}`}>
              {l.text}
            </div>
          </div>
        ))}
      </div>
      {isChoiceStep && curLine.choices && (
        <div className="flex flex-col gap-2">
          {curLine.choices.map((ch, i) => (
            <button key={i} onClick={() => choose(ch)}
              className="text-left px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 hover:border-ws-orange hover:bg-ws-orange-light transition-all">
              {ch.t}
              <div className="text-[11px] text-gray-400 mt-0.5">{ch.jp}</div>
            </button>
          ))}
        </div>
      )}
      {fb && (
        <div className={`text-xs mt-2 font-medium ${fb.startsWith('✓') ? 'text-ws-teal-dark' : 'text-red-600'}`}>{fb}</div>
      )}
      {done && (
        <button onClick={() => { setStep(0); setLines([]); setFb(''); setDone(false) }}
          className="mt-3 px-3 py-1.5 bg-white border border-gray-200 text-gray-500 rounded-lg text-xs">
          もう一度
        </button>
      )}
    </div>
  )
}

// ---- GRAMMAR MODE ----
function GrammarMode({ curLv, onCorrect }: { curLv: number; onCorrect: () => void }) {
  const avail = GRAMMAR_RULES.filter(g => g.lvs.includes(curLv))
  const rules = avail.length > 0 ? avail : GRAMMAR_RULES
  const [ri, setRi] = useState(0)
  const [qi, setQi] = useState(0)
  const [fb, setFb] = useState('')
  const [locked, setLocked] = useState(false)
  const [selAns, setSelAns] = useState('')

  const rule = rules[ri % rules.length]
  const q = rule.qs[qi % rule.qs.length]

  function answer(opt: string) {
    if (locked) return
    setLocked(true); setSelAns(opt)
    if (opt === q.ans) { onCorrect(); setFb('✓ 正解！ +12XP') }
    else setFb(`× 正解: "${q.ans}"`)
  }
  function next() {
    setQi(i => i + 1)
    if ((qi + 1) % 2 === 0) setRi(i => i + 1)
    setFb(''); setLocked(false); setSelAns('')
  }

  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
      <div className="bg-white border-l-4 border-ws-purple rounded-r-lg px-3 py-2 mb-4">
        <div className="text-sm font-semibold text-ws-purple-dark">{rule.title} <span className="text-xs text-gray-400 font-normal">{rule.rule}</span></div>
        {rule.exs.map(ex => <div key={ex} className="text-xs text-gray-500">{ex}</div>)}
      </div>
      <div className="text-xs text-gray-400 mb-1">{q.jp}</div>
      <div className="text-sm text-gray-800 mb-3 leading-relaxed">
        {q.q.split('___').map((part, i) => (
          <span key={i}>
            {part}
            {i < q.q.split('___').length - 1 && (
              <span className={`inline-block border-b-2 min-w-12 text-center font-semibold mx-1 px-1
                ${locked && selAns === q.ans ? 'border-ws-teal text-ws-teal-dark' : 'border-ws-purple text-ws-purple'}`}>
                {locked ? q.ans : '___'}
              </span>
            )}
          </span>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        {q.opts.map(opt => (
          <button key={opt} onClick={() => answer(opt)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-all
              ${locked && opt === q.ans ? 'bg-ws-teal-light border-ws-teal text-ws-teal-dark' :
                locked && opt === selAns && opt !== q.ans ? 'bg-red-50 border-red-400 text-red-700' :
                'bg-white border-gray-200 hover:border-ws-purple text-gray-700'}`}>
            {opt}
          </button>
        ))}
      </div>
      {fb && (
        <div className={`text-xs mb-2 font-medium ${fb.startsWith('✓') ? 'text-ws-teal-dark' : 'text-red-600'}`}>{fb}</div>
      )}
      <button onClick={next} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-500 rounded-lg text-xs">次の問題</button>
    </div>
  )
}

// ---- READING MODE ----
function ReadingMode({ curLv, onCorrect }: { curLv: number; onCorrect: () => void }) {
  const avail = READINGS.filter(r => r.lvs.includes(curLv))
  const rdgs = avail.length > 0 ? avail : READINGS
  const [ri, setRi] = useState(0)
  const [answers, setAnswers] = useState<Record<number, 'correct' | 'wrong'>>({})
  const [gloss, setGloss] = useState<{ word: string; jp: string } | null>(null)
  const rdg = rdgs[ri % rdgs.length]

  const lv = LEVELS.find(l => l.id === curLv)

  function renderText(text: string) {
    return text.split(/\[([^\]]+)\]/).map((part, i) => {
      if (i % 2 === 0) return <span key={i}>{part}</span>
      const glossData: Record<string, string> = {
        'transformed': '変革した', 'instantly': '瞬時に', 'psychological': '心理的な',
        'misinformation': '誤情報', 'threat': '脅威', 'activism': '社会運動',
        'evident': '明らか', 'renewable': '再生可能な', 'transition': '移行',
        'necessity': '必要性', 'infrastructure': 'インフラ', 'adopt': '採用する',
        'artificial intelligence': '人工知能', 'consciousness': '意識', 'complex': '複雑な',
        'philosophers': '哲学者たち', 'empathy': '共感', 'evolves': '進化する',
        'boundary': '境界', 'ambiguous': '曖昧な',
      }
      return (
        <span key={i}
          onClick={() => setGloss({ word: part, jp: glossData[part] || '...' })}
          className="bg-amber-100 text-amber-800 rounded px-0.5 cursor-pointer font-semibold hover:bg-amber-200">
          {part}
        </span>
      )
    })
  }

  function answer(qi: number, oi: number) {
    if (answers[qi]) return
    const ok = oi === rdg.questions[qi].ans
    setAnswers(prev => ({ ...prev, [qi]: ok ? 'correct' : 'wrong' }))
    if (ok) onCorrect()
  }

  const correct = Object.values(answers).filter(v => v === 'correct').length

  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
      <div className="flex items-center gap-2 mb-2">
        {lv && <EikenBadge cls={lv.eikenClass} label={rdg.eiken} />}
        <span className="text-[10px] text-gray-400">{rdg.tag}</span>
      </div>
      <div className="text-base font-semibold text-gray-800 mb-3">{rdg.title}</div>

      {gloss && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-amber-800">{gloss.word} = {gloss.jp}</span>
          <button onClick={() => setGloss(null)} className="text-amber-600 text-xs">✕</button>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4 text-sm text-gray-800 leading-8">
        {renderText(rdg.text)}
      </div>
      <div className="text-[10px] text-gray-400 mb-3">★ ハイライト単語をタップすると意味が出るよ</div>

      <div className="flex flex-col gap-3 mb-4">
        {rdg.questions.map((qobj, qi) => (
          <div key={qi} className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="text-sm font-medium text-gray-800 mb-2">Q{qi + 1}. {qobj.q}</div>
            <div className="flex flex-col gap-1.5">
              {qobj.opts.map((opt, oi) => (
                <button key={oi} onClick={() => answer(qi, oi)}
                  className={`text-left px-3 py-2 rounded-lg text-xs border transition-all
                    ${answers[qi] && oi === qobj.ans ? 'bg-ws-teal-light border-ws-teal text-ws-teal-dark' :
                      answers[qi] && answers[qi] === 'wrong' && oi !== qobj.ans ? 'bg-gray-50 border-gray-200 text-gray-400' :
                      !answers[qi] ? 'bg-gray-50 border-gray-200 hover:border-ws-orange hover:bg-ws-orange-light text-gray-700' :
                      'bg-gray-50 border-gray-200 text-gray-400'}`}>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button onClick={() => { setRi(i => i + 1); setAnswers({}); setGloss(null) }}
          className="px-3 py-1.5 bg-white border border-gray-200 text-gray-500 rounded-lg text-xs">次の長文</button>
        <span className="text-xs text-gray-400 ml-auto">{correct}/{rdg.questions.length} 正解</span>
      </div>
    </div>
  )
}

// ---- PREMIUM MODE ----
function PremiumMode() {
  return (
    <div className="bg-ws-purple-light border border-purple-200 rounded-xl p-5 text-center">
      <div className="text-2xl mb-2">🎤</div>
      <div className="text-sm font-semibold text-ws-purple-dark mb-1">発音チャレンジ — プレミアム</div>
      <div className="text-xs text-ws-purple-dark opacity-80 mb-4">
        ネイティブ音声を聞いて自分の発音をAIが採点。<br/>英検スピーキング・面接対策に最適！
      </div>
      <div className="bg-white border border-purple-200 rounded-lg p-3 mb-4 text-xs text-gray-600 text-left space-y-1.5">
        <div>✓ 全単語の音声読み上げ（ネイティブ発音）</div>
        <div>✓ 発音認識スコア（Web Speech API）</div>
        <div>✓ 英検スピーキング練習モード</div>
        <div>✓ 広告なし・全レベル解放</div>
      </div>
      <a href="https://gumroad.com" target="_blank" rel="noopener noreferrer"
        className="inline-block px-6 py-2.5 bg-ws-purple text-white rounded-lg text-sm font-medium">
        プレミアムを始める ★
      </a>
    </div>
  )
}

// ---- MAIN APP ----
export default function HomePage() {
  const { state, setState, addXP, learnWord, addScore, hydrated } = useGameState()
  const [bubble, setBubble] = useState('Yo! WORD STREETへようこそ。レベルを選んで英語をマスターしよう！')

  const crew = CREW.find(c => c.id === state.crewId) || CREW[0]
  const curLv = LEVELS.find(l => l.id === state.currentLv) || LEVELS[0]

  // badge check
  const earnedBadges = BADGES.filter(b => {
    try {
      return (b.fn as any)(state.learned.length, state.score, state.rdgCorrect, state.level)
    } catch { return false }
  }).map(b => b.id)

  function setMode(m: string) { setState({ mode: m }) }

  function onLearn(word: string) { learnWord(word); setBubble(`「${word}」をマスター！ Keep going!`) }
  function onSpeak(word: string) { addXP(2) }

  function onCorrect() {
    addScore()
    setState(prev => {
      const newXP = prev.xp + 10
      const newLv = calcLevel(newXP)
      return { score: prev.score + 1, level: newLv, xp: newXP }
    })
  }

  function onRdgCorrect() {
    setState(prev => ({ rdgCorrect: prev.rdgCorrect + 1, score: prev.score + 1, xp: prev.xp + 25 }))
    setBubble('長文読解マスター！ +25XP 最高！')
  }
  function onGramCorrect() {
    setState(prev => ({ score: prev.score + 1, xp: prev.xp + 12 }))
    setBubble('文法完璧！ +12XP ナイス！')
  }
  function onConvCorrect() {
    setState(prev => ({ score: prev.score + 1, xp: prev.xp + 20 }))
    setBubble('ネイティブ表現！ +20XP やるじゃん！')
  }
  function onSentCorrect() {
    setState(prev => ({ score: prev.score + 1, xp: prev.xp + 15 }))
    setBubble('完璧な文章！ +15XP 最高！')
  }

  const progress = (() => {
    const done = curLv.words.filter(w => state.learned.includes(w.en)).length
    return Math.round(done / curLv.words.length * 100)
  })()

  if (!hydrated) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-ws-orange text-sm animate-pulse">WORD STREET loading...</div>
    </div>
  )

  const MODES = [
    { id: 'learn', label: '単語', icon: '🃏' },
    { id: 'quiz',  label: 'クイズ', icon: '❓' },
    { id: 'sent',  label: '文章', icon: '📝' },
    { id: 'conv',  label: '会話', icon: '💬' },
    { id: 'gram',  label: '文法', icon: '📖' },
    { id: 'read',  label: '長文', icon: '📄' },
    { id: 'premium', label: '発音★', icon: '🎤', premium: true },
  ]

  return (
    <main className="max-w-2xl mx-auto px-4 py-4">
      <Header state={state} />

      {/* crew strip */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
        {CREW.map(c => {
          const unlocked = state.level >= c.lv
          return (
            <button key={c.id} onClick={() => unlocked && setState({ crewId: c.id })}
              className={`flex flex-col items-center gap-1 shrink-0 ${!unlocked ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}>
              <div className={`w-11 h-11 rounded-full border-2 flex items-center justify-center text-xl bg-gray-100 transition-all
                ${state.crewId === c.id ? 'border-ws-orange scale-110' : 'border-gray-200'}`}
                style={unlocked ? { borderColor: state.crewId === c.id ? c.color : undefined, background: state.crewId === c.id ? c.color + '20' : undefined } : {}}>
                {c.em}
              </div>
              <span className={`text-[10px] font-medium ${state.crewId === c.id ? 'text-ws-orange' : 'text-gray-400'}`}>{c.name}</span>
            </button>
          )
        })}
      </div>

      {/* scene / speech bubble */}
      <div className="bg-gray-100 rounded-xl p-3 mb-3 flex items-center gap-3">
        <CharCanvas color={crew.color} initial={crew.name[0]} size={64} />
        <div className="relative flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2">
          <div className="absolute -left-2.5 top-3 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-200" />
          <div className="absolute -left-[9px] top-3 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-white" />
          <p className="text-sm text-gray-700 leading-relaxed">{bubble}</p>
        </div>
      </div>

      {/* badges */}
      {earnedBadges.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {BADGES.filter(b => earnedBadges.includes(b.id)).map(b => (
            <span key={b.id} className="text-xs px-2 py-0.5 rounded-full bg-ws-amber-light text-ws-amber font-medium">★ {b.lbl}</span>
          ))}
        </div>
      )}

      {/* level tabs */}
      <div className="mb-3">
        <div className="text-[10px] font-medium text-gray-400 tracking-widest mb-1.5">レベル — 英検5級 → 準1級</div>
        {[LEVELS.slice(0,7), LEVELS.slice(7,14), LEVELS.slice(14)].map((group, gi) => (
          <div key={gi} className="flex gap-1.5 overflow-x-auto pb-1 mb-1">
            {group.map(lv => {
              const unlocked = state.level >= lv.id
              return (
                <button key={lv.id}
                  onClick={() => unlocked && setState({ currentLv: lv.id })}
                  className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border transition-all
                    ${state.currentLv === lv.id ? 'bg-ws-orange text-white border-ws-orange' :
                      unlocked ? 'bg-white text-gray-600 border-gray-200 hover:border-ws-orange' :
                      'bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed'}`}>
                  {lv.icon}Lv.{lv.id}
                  <EikenBadge cls={unlocked && state.currentLv !== lv.id ? lv.eikenClass : state.currentLv === lv.id ? 'bg-orange-200 text-orange-900' : 'bg-gray-200 text-gray-400'} label={lv.eiken} />
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-[11px] text-gray-400 mb-1">
          <span>Lv.{curLv.id} — {curLv.name} [{curLv.eiken}]</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-ws-orange rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* mode tabs */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {MODES.map(m => (
          <button key={m.id} onClick={() => setMode(m.id)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs transition-all
              ${m.premium ? 'opacity-50 cursor-not-allowed border-gray-200 bg-white text-gray-500' :
                state.mode === m.id ? 'bg-ws-orange-light border-ws-orange text-ws-orange-dark font-medium' :
                'bg-white border-gray-200 text-gray-500 hover:border-ws-orange'}`}>
            <span>{m.icon}</span>{m.label}
          </button>
        ))}
      </div>

      {/* panels */}
      {state.mode === 'learn' && <LearnMode curLv={state.currentLv} learned={state.learned} onLearn={onLearn} onSpeak={onSpeak} />}
      {state.mode === 'quiz' && <QuizMode key={state.currentLv} curLv={state.currentLv} onCorrect={onCorrect} />}
      {state.mode === 'sent' && <SentenceMode key={state.currentLv} curLv={state.currentLv} onCorrect={onSentCorrect} />}
      {state.mode === 'conv' && <ConvMode key={state.currentLv} curLv={state.currentLv} onCorrect={onConvCorrect} />}
      {state.mode === 'gram' && <GrammarMode key={state.currentLv} curLv={state.currentLv} onCorrect={onGramCorrect} />}
      {state.mode === 'read' && <ReadingMode key={state.currentLv} curLv={state.currentLv} onCorrect={onRdgCorrect} />}
      {state.mode === 'premium' && <PremiumMode />}

      {/* footer */}
      <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
        <div className="text-[10px] text-gray-300 tracking-widest">CASA SHINDY © 2025</div>
        <button onClick={() => { if (confirm('リセットしますか？')) window.location.reload() }}
          className="text-[10px] text-gray-300 hover:text-gray-500">リセット</button>
      </div>
    </main>
  )
}
