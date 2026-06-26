'use client'
import { useState, useEffect, useRef } from 'react'
import { useGameState } from '@/hooks/useGameState'
import { LEVELS, CREW, SENTENCES, CONVERSATIONS, GRAMMAR_RULES, READINGS, BADGES } from '@/data/gameData'
import Header from '@/components/Header'
import CharCanvas from '@/components/CharCanvas'

// ── helpers ──────────────────────────────────────────────
function calcLevel(xp: number) { return Math.min(20, Math.floor(xp / 60) + 1) }

let synthBusy = false
function speakEn(text: string, rate = 0.88, onEnd?: () => void) {
  if (typeof window === 'undefined' || synthBusy) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'en-US'; u.rate = rate
  u.onstart = () => { synthBusy = true }
  u.onend = () => { synthBusy = false; onEnd?.() }
  u.onerror = () => { synthBusy = false }
  window.speechSynthesis.speak(u)
}

function SpeakWave({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <span className="inline-flex items-end gap-0.5 h-4">
      {[0,1,2,3].map(i => (
        <span key={i} className="wave-bar" style={{ animationDelay: `${i*0.1}s` }} />
      ))}
    </span>
  )
}

function EikenBadge({ cls, label }: { cls: string; label: string }) {
  return <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${cls}`}>{label}</span>
}

// ── EXPANDED WORD DATA ────────────────────────────────────
// Each level gets 20 words
const EXTRA_WORDS: Record<number, {e:string;en:string;jp:string;g:string;ex:string;syn?:string}[]> = {
  1: [
    {e:'🐯',en:'tiger',jp:'トラ',g:'noun',ex:'The tiger runs fast.'},
    {e:'🐺',en:'wolf',jp:'オオカミ',g:'noun',ex:'Wolves hunt in packs.'},
    {e:'🦒',en:'giraffe',jp:'キリン',g:'noun',ex:'Giraffes have long necks.'},
    {e:'🦓',en:'zebra',jp:'シマウマ',g:'noun',ex:'Zebras have stripes.'},
    {e:'🐊',en:'crocodile',jp:'ワニ',g:'noun',ex:'Crocodiles live in rivers.'},
    {e:'🦜',en:'parrot',jp:'オウム',g:'noun',ex:'Parrots can talk.'},
    {e:'🦋',en:'butterfly',jp:'チョウ',g:'noun',ex:'Butterflies are beautiful.'},
    {e:'🐸',en:'frog',jp:'カエル',g:'noun',ex:'Frogs jump high.'},
    {e:'🐙',en:'octopus',jp:'タコ',g:'noun',ex:'An octopus has eight arms.'},
    {e:'🦈',en:'shark',jp:'サメ',g:'noun',ex:'Sharks are dangerous.'},
    {e:'🐧',en:'penguin',jp:'ペンギン',g:'noun',ex:'Penguins cannot fly.'},
    {e:'🦔',en:'hedgehog',jp:'ハリネズミ',g:'noun',ex:'Hedgehogs have spines.'},
  ],
  2: [
    {e:'🥗',en:'salad',jp:'サラダ',g:'noun',ex:'I eat salad for lunch.'},
    {e:'🍦',en:'ice cream',jp:'アイスクリーム',g:'noun',ex:'Ice cream is cold.'},
    {e:'🥐',en:'croissant',jp:'クロワッサン',g:'noun',ex:'A croissant is flaky.'},
    {e:'🍓',en:'strawberry',jp:'イチゴ',g:'noun',ex:'Strawberries are red.'},
    {e:'🧁',en:'cupcake',jp:'カップケーキ',g:'noun',ex:'The cupcake is sweet.'},
    {e:'🥞',en:'pancake',jp:'パンケーキ',g:'noun',ex:'I love pancakes.'},
    {e:'🍝',en:'pasta',jp:'パスタ',g:'noun',ex:'Pasta is from Italy.'},
    {e:'🫐',en:'blueberry',jp:'ブルーベリー',g:'noun',ex:'Blueberries are healthy.'},
    {e:'🍋',en:'lemon',jp:'レモン',g:'noun',ex:'Lemons are sour.'},
    {e:'🥜',en:'peanut',jp:'ピーナッツ',g:'noun',ex:'Peanuts are a snack.'},
    {e:'🌽',en:'corn',jp:'とうもろこし',g:'noun',ex:'Corn grows tall.'},
    {e:'🫚',en:'olive oil',jp:'オリーブオイル',g:'noun',ex:'Cook with olive oil.'},
  ],
  3: [
    {e:'🖥️',en:'computer',jp:'コンピューター',g:'noun',ex:'Use the computer.'},
    {e:'📏',en:'ruler',jp:'ものさし',g:'noun',ex:'Use a ruler to measure.'},
    {e:'📌',en:'pin',jp:'画鋲',g:'noun',ex:'Pin the paper.'},
    {e:'🗂️',en:'folder',jp:'ファイル',g:'noun',ex:'Put it in a folder.'},
    {e:'🖊️',en:'pen',jp:'ペン',g:'noun',ex:'Write with a pen.'},
    {e:'📓',en:'notebook',jp:'ノート',g:'noun',ex:'Write in the notebook.'},
    {e:'🧮',en:'calculator',jp:'電卓',g:'noun',ex:'Use a calculator.'},
    {e:'🗓️',en:'calendar',jp:'カレンダー',g:'noun',ex:'Check the calendar.'},
    {e:'📢',en:'announcement',jp:'お知らせ',g:'noun',ex:'Read the announcement.'},
    {e:'🎒',en:'backpack',jp:'リュック',g:'noun',ex:'Carry a backpack.'},
    {e:'🏃',en:'run',jp:'走る',g:'verb',ex:'Run to school.'},
    {e:'📐',en:'triangle',jp:'三角定規',g:'noun',ex:'Draw with a triangle.'},
  ],
  4: [
    {e:'🛁',en:'bath',jp:'お風呂',g:'noun',ex:'Take a bath.'},
    {e:'🪥',en:'toothbrush',jp:'歯ブラシ',g:'noun',ex:'Use a toothbrush.'},
    {e:'🧴',en:'shampoo',jp:'シャンプー',g:'noun',ex:'Use shampoo.'},
    {e:'🪞',en:'mirror',jp:'鏡',g:'noun',ex:'Look in the mirror.'},
    {e:'🛋️',en:'sofa',jp:'ソファ',g:'noun',ex:'Sit on the sofa.'},
    {e:'🖼️',en:'picture',jp:'絵・写真',g:'noun',ex:'Hang a picture.'},
    {e:'🕯️',en:'candle',jp:'ろうそく',g:'noun',ex:'Light a candle.'},
    {e:'🧺',en:'laundry',jp:'洗濯物',g:'noun',ex:'Do the laundry.'},
    {e:'🗑️',en:'trash',jp:'ゴミ',g:'noun',ex:'Take out the trash.'},
    {e:'🔌',en:'plug',jp:'コンセント',g:'noun',ex:'Plug it in.'},
    {e:'💡',en:'lamp',jp:'ランプ',g:'noun',ex:'Turn on the lamp.'},
    {e:'📬',en:'mailbox',jp:'郵便受け',g:'noun',ex:'Check the mailbox.'},
  ],
  5: [
    {e:'🚂',en:'train',jp:'電車',g:'noun',ex:'Take the train.'},
    {e:'🚕',en:'taxi',jp:'タクシー',g:'noun',ex:'Call a taxi.'},
    {e:'🚲',en:'bicycle',jp:'自転車',g:'noun',ex:'Ride a bicycle.'},
    {e:'⛽',en:'gas station',jp:'ガソリンスタンド',g:'noun',ex:'Stop at the gas station.'},
    {e:'🏗️',en:'construction',jp:'工事',g:'noun',ex:'There is construction.'},
    {e:'🏪',en:'supermarket',jp:'スーパー',g:'noun',ex:'Shop at the supermarket.'},
    {e:'💒',en:'church',jp:'教会',g:'noun',ex:'Visit the church.'},
    {e:'🏟️',en:'stadium',jp:'スタジアム',g:'noun',ex:'Go to the stadium.'},
    {e:'🗼',en:'tower',jp:'タワー',g:'noun',ex:'See the tower.'},
    {e:'🌉',en:'bridge',jp:'橋',g:'noun',ex:'Cross the bridge.'},
    {e:'🚶',en:'pedestrian',jp:'歩行者',g:'noun',ex:'A pedestrian walks.'},
    {e:'🏬',en:'department store',jp:'デパート',g:'noun',ex:'Shop at the department store.'},
  ],
  6: [
    {e:'🏄',en:'surfing',jp:'サーフィン',g:'noun',ex:'Try surfing.'},
    {e:'🧗',en:'climbing',jp:'クライミング',g:'noun',ex:'Go climbing.'},
    {e:'🎿',en:'skiing',jp:'スキー',g:'noun',ex:'I love skiing.'},
    {e:'🏇',en:'horse racing',jp:'競馬',g:'noun',ex:'Watch horse racing.'},
    {e:'🤸',en:'gymnastics',jp:'体操',g:'noun',ex:'Do gymnastics.'},
    {e:'🧜',en:'diving',jp:'ダイビング',g:'noun',ex:'Try diving.'},
    {e:'⛳',en:'golf',jp:'ゴルフ',g:'noun',ex:'Play golf.'},
    {e:'🎯',en:'archery',jp:'アーチェリー',g:'noun',ex:'Practice archery.'},
    {e:'🥋',en:'martial arts',jp:'武道',g:'noun',ex:'Train martial arts.'},
    {e:'🏐',en:'volleyball',jp:'バレーボール',g:'noun',ex:'Play volleyball.'},
    {e:'🎽',en:'jersey',jp:'ユニフォーム',g:'noun',ex:'Wear a jersey.'},
    {e:'🏅',en:'medal',jp:'メダル',g:'noun',ex:'Win a medal.'},
  ],
  7: [
    {e:'😤',en:'frustrated',jp:'イライラした',g:'adj',ex:'She felt frustrated.',syn:'annoyed'},
    {e:'🥺',en:'anxious',jp:'不安な',g:'adj',ex:'He was anxious.',syn:'worried'},
    {e:'😎',en:'confident',jp:'自信がある',g:'adj',ex:'Be confident.',syn:'assured'},
    {e:'🤭',en:'embarrassed',jp:'恥ずかしい',g:'adj',ex:'I was embarrassed.',syn:'ashamed'},
    {e:'😴',en:'exhausted',jp:'疲れ果てた',g:'adj',ex:'I am exhausted.',syn:'tired'},
    {e:'🥰',en:'delighted',jp:'大喜びの',g:'adj',ex:'She was delighted.',syn:'pleased'},
    {e:'😒',en:'jealous',jp:'嫉妬している',g:'adj',ex:'He felt jealous.',syn:'envious'},
    {e:'🤔',en:'confused',jp:'混乱した',g:'adj',ex:'I am confused.',syn:'puzzled'},
    {e:'😌',en:'relieved',jp:'安堵した',g:'adj',ex:'She felt relieved.',syn:'calm'},
    {e:'🫡',en:'determined',jp:'決意した',g:'adj',ex:'Be determined.',syn:'resolved'},
    {e:'😶',en:'speechless',jp:'言葉を失った',g:'adj',ex:'I was speechless.',syn:'silent'},
    {e:'🤯',en:'overwhelmed',jp:'圧倒された',g:'adj',ex:'He was overwhelmed.',syn:'stunned'},
  ],
  8: [
    {e:'🔧',en:'fix',jp:'直す',g:'verb',ex:'Fix the problem.',syn:'repair'},
    {e:'📤',en:'submit',jp:'提出する',g:'verb',ex:'Submit your work.',syn:'send'},
    {e:'🏗️',en:'build',jp:'建てる',g:'verb',ex:'Build a house.',syn:'construct'},
    {e:'🎙️',en:'present',jp:'発表する',g:'verb',ex:'Present your idea.',syn:'show'},
    {e:'🤲',en:'offer',jp:'提供する',g:'verb',ex:'Offer help.',syn:'provide'},
    {e:'🔎',en:'investigate',jp:'調査する',g:'verb',ex:'Investigate the issue.',syn:'examine'},
    {e:'💬',en:'discuss',jp:'話し合う',g:'verb',ex:'Discuss the plan.',syn:'talk about'},
    {e:'🧭',en:'navigate',jp:'案内する',g:'verb',ex:'Navigate the city.',syn:'guide'},
    {e:'⚙️',en:'operate',jp:'操作する',g:'verb',ex:'Operate the machine.',syn:'run'},
    {e:'🌱',en:'develop',jp:'発展させる',g:'verb',ex:'Develop your skills.',syn:'grow'},
    {e:'📋',en:'organize',jp:'整理する',g:'verb',ex:'Organize your files.',syn:'arrange'},
    {e:'🤝',en:'collaborate',jp:'協力する',g:'verb',ex:'Collaborate with others.',syn:'cooperate'},
  ],
  9: [
    {e:'🌤️',en:'atmosphere',jp:'大気・雰囲気',g:'noun',ex:'The atmosphere is warming.',syn:'air'},
    {e:'🌊',en:'tide',jp:'潮流',g:'noun',ex:'The tide is high.',syn:'current'},
    {e:'🌿',en:'vegetation',jp:'植生',g:'noun',ex:'Dense vegetation covers the land.',syn:'plants'},
    {e:'🏜️',en:'desert',jp:'砂漠',g:'noun',ex:'The desert is hot.',syn:'wasteland'},
    {e:'🌾',en:'harvest',jp:'収穫',g:'noun',ex:'The harvest was good.',syn:'crop'},
    {e:'❄️',en:'blizzard',jp:'吹雪',g:'noun',ex:'A blizzard hit the town.',syn:'snowstorm'},
    {e:'🌈',en:'rainbow',jp:'虹',g:'noun',ex:'A rainbow appeared.',syn:'arc'},
    {e:'🌑',en:'eclipse',jp:'日食・月食',g:'noun',ex:'Watch the eclipse.',syn:'shadow'},
    {e:'💨',en:'wind',jp:'風',g:'noun',ex:'The wind is strong.',syn:'breeze'},
    {e:'🪨',en:'mineral',jp:'鉱物',g:'noun',ex:'Study the mineral.',syn:'rock'},
    {e:'🌡️',en:'temperature',jp:'気温',g:'noun',ex:'The temperature dropped.'},
    {e:'🌲',en:'pine',jp:'松',g:'noun',ex:'Pine trees are tall.',syn:'evergreen'},
  ],
  10: [
    {e:'📜',en:'policy',jp:'政策',g:'noun',ex:'The policy changed.',syn:'rule'},
    {e:'🏛️',en:'parliament',jp:'議会',g:'noun',ex:'Parliament voted.',syn:'congress'},
    {e:'🌏',en:'international',jp:'国際的な',g:'adj',ex:'International cooperation.',syn:'global'},
    {e:'🤲',en:'welfare',jp:'福祉',g:'noun',ex:'Improve social welfare.',syn:'wellbeing'},
    {e:'⚡',en:'crisis',jp:'危機',g:'noun',ex:'Handle the crisis.',syn:'emergency'},
    {e:'🏗️',en:'infrastructure',jp:'インフラ',g:'noun',ex:'Build infrastructure.',syn:'framework'},
    {e:'📣',en:'protest',jp:'抗議',g:'noun',ex:'Join the protest.',syn:'demonstration'},
    {e:'🎗️',en:'charity',jp:'慈善活動',g:'noun',ex:'Support charity.',syn:'donation'},
    {e:'🔐',en:'regulation',jp:'規制',g:'noun',ex:'Follow the regulation.',syn:'rule'},
    {e:'🌐',en:'minority',jp:'少数派',g:'noun',ex:'Protect minorities.',syn:'group'},
    {e:'📊',en:'survey',jp:'調査',g:'noun',ex:'Conduct a survey.',syn:'research'},
    {e:'🗺️',en:'territory',jp:'領土',g:'noun',ex:'Protect the territory.',syn:'land'},
  ],
  11: [
    {e:'🔋',en:'battery',jp:'バッテリー',g:'noun',ex:'Charge the battery.',syn:'cell'},
    {e:'📶',en:'wireless',jp:'無線の',g:'adj',ex:'Wireless connection.',syn:'wifi'},
    {e:'🖨️',en:'printer',jp:'プリンター',g:'noun',ex:'Print with a printer.'},
    {e:'☁️',en:'cloud computing',jp:'クラウドコンピューティング',g:'noun',ex:'Use cloud computing.'},
    {e:'🔐',en:'encryption',jp:'暗号化',g:'noun',ex:'Encryption protects data.',syn:'coding'},
    {e:'🤖',en:'automation',jp:'自動化',g:'noun',ex:'Automation saves time.',syn:'mechanization'},
    {e:'📲',en:'notification',jp:'通知',g:'noun',ex:'Turn off notifications.',syn:'alert'},
    {e:'🧠',en:'machine learning',jp:'機械学習',g:'noun',ex:'Study machine learning.'},
    {e:'🕹️',en:'interface',jp:'インターフェース',g:'noun',ex:'Simple interface.',syn:'display'},
    {e:'⌨️',en:'keyboard',jp:'キーボード',g:'noun',ex:'Type on the keyboard.',syn:'input'},
    {e:'📡',en:'bandwidth',jp:'帯域幅',g:'noun',ex:'Increase bandwidth.',syn:'capacity'},
    {e:'🔬',en:'nanotechnology',jp:'ナノテクノロジー',g:'noun',ex:'Nanotechnology is tiny.'},
  ],
  12: [
    {e:'🌀',en:'chaos',jp:'混沌',g:'noun',ex:'Chaos erupted.',syn:'disorder'},
    {e:'⚖️',en:'balance',jp:'バランス',g:'noun',ex:'Find balance.',syn:'equilibrium'},
    {e:'🎭',en:'irony',jp:'皮肉',g:'noun',ex:'The irony is clear.',syn:'sarcasm'},
    {e:'💫',en:'illusion',jp:'幻想',g:'noun',ex:'It was an illusion.',syn:'fantasy'},
    {e:'🔥',en:'passion',jp:'情熱',g:'noun',ex:'Follow your passion.',syn:'drive'},
    {e:'🌊',en:'momentum',jp:'勢い',g:'noun',ex:'Build momentum.',syn:'force'},
    {e:'🧩',en:'complexity',jp:'複雑さ',g:'noun',ex:'Embrace complexity.',syn:'difficulty'},
    {e:'✨',en:'potential',jp:'可能性',g:'noun',ex:'Reach your potential.',syn:'ability'},
    {e:'🔮',en:'uncertainty',jp:'不確実性',g:'noun',ex:'Deal with uncertainty.',syn:'doubt'},
    {e:'🌱',en:'resilience',jp:'回復力',g:'noun',ex:'Show resilience.',syn:'toughness'},
    {e:'💡',en:'insight',jp:'洞察',g:'noun',ex:'Share your insight.',syn:'wisdom'},
    {e:'🎯',en:'precision',jp:'精度',g:'noun',ex:'Work with precision.',syn:'accuracy'},
  ],
}

function getLevelWords(lvId: number) {
  const base = LEVELS.find(l => l.id === lvId)?.words || []
  const extra = EXTRA_WORDS[lvId] || []
  return [...base, ...extra]
}

// ── LEARN MODE ─────────────────────────────────────────────
function LearnMode({ curLv, learned, onLearn }: {
  curLv: number; learned: string[]; onLearn: (w: string) => void
}) {
  const words = getLevelWords(curLv)
  const [selWord, setSelWord] = useState<typeof words[0] | null>(null)
  const [speaking, setSpeaking] = useState(false)
  const [speakEx, setSpeakEx] = useState(false)

  function selectAndSpeak(w: typeof words[0]) {
    setSelWord(w)
    onLearn(w.en)
    setSpeaking(true)
    speakEn(w.en, 0.82, () => setSpeaking(false))
  }

  function handleSpeakEx() {
    if (!selWord) return
    setSpeakEx(true)
    speakEn(selWord.ex, 0.85, () => setSpeakEx(false))
  }

  function handleSpeakWord() {
    if (!selWord) return
    setSpeaking(true)
    speakEn(selWord.en, 0.75, () => setSpeaking(false))
  }

  return (
    <div>
      <div className="text-[10px] text-gray-400 mb-2">{words.length}語 — タップで即発音</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        {words.map(w => {
          const done = learned.includes(w.en)
          const sel = selWord?.en === w.en
          return (
            <button key={w.en} onClick={() => selectAndSpeak(w)}
              className={`relative rounded-xl p-2.5 text-center transition-all border cursor-pointer
                ${sel ? 'border-ws-orange border-2 -translate-y-0.5 bg-white shadow-sm' :
                  done ? 'border-ws-teal bg-ws-teal-light' : 'border-gray-200 bg-white hover:border-ws-orange'}`}>
              <div className="text-2xl mb-1">{w.e}</div>
              <div className="text-xs font-semibold text-gray-800 leading-tight">{w.en}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{w.jp}</div>
              {done && <span className="absolute top-1 right-1 text-ws-teal text-xs">✓</span>}
              {sel && <span className="absolute top-1 left-1 text-ws-orange text-xs"><SpeakWave show={speaking} /></span>}
            </button>
          )
        })}
      </div>

      {selWord && (
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="text-4xl">{selWord.e}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <div className="text-lg font-semibold text-gray-800">{selWord.en}</div>
                <button onClick={handleSpeakWord}
                  className="text-ws-orange hover:text-ws-orange-dark flex items-center gap-0.5 text-sm">
                  🔊 <SpeakWave show={speaking} />
                </button>
              </div>
              <div className="text-sm text-gray-500">{selWord.jp}</div>
              <div className="flex gap-1.5 mt-1 flex-wrap">
                <span className="text-[10px] px-1.5 py-0.5 bg-ws-purple-light text-ws-purple-dark rounded-full">{selWord.g}</span>
                {selWord.syn && <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-full">= {selWord.syn}</span>}
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
            <span className="text-xs text-gray-400 italic flex-1">"{selWord.ex}"</span>
            <button onClick={handleSpeakEx}
              className="text-ws-orange text-sm flex items-center gap-0.5 shrink-0">
              🔊 例文 <SpeakWave show={speakEx} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── QUIZ MODE ───────────────────────────────────────────────
function QuizMode({ curLv, onCorrect }: { curLv: number; onCorrect: () => void }) {
  const words = getLevelWords(curLv)
  const [qType, setQType] = useState<'emoji'|'jp'|'en'|'listen'>('emoji')
  const [q, setQ] = useState(words[0])
  const [opts, setOpts] = useState<typeof words>([])
  const [result, setResult] = useState<'correct'|'wrong'|null>(null)
  const [locked, setLocked] = useState(false)
  const [listeningHint, setListeningHint] = useState(false)

  function newQ(ws = words) {
    const nq = ws[Math.floor(Math.random() * ws.length)]
    const wrong = ws.filter(w => w.en !== nq.en).sort(() => Math.random()-.5).slice(0,3)
    setQ(nq); setOpts([nq,...wrong].sort(() => Math.random()-.5))
    setResult(null); setLocked(false); setListeningHint(false)
    if (qType === 'listen') {
      setTimeout(() => speakEn(nq.en, 0.8), 300)
    }
  }

  useEffect(() => { newQ(words) }, [curLv, qType])

  function answer(opt: typeof words[0]) {
    if (locked) return
    setLocked(true)
    const ok = qType === 'en' ? opt.jp === q.jp : opt.en === q.en
    setResult(ok ? 'correct' : 'wrong')
    if (ok) { onCorrect(); speakEn(q.en, 0.85) }
    setTimeout(() => newQ(), 1800)
  }

  return (
    <div>
      <div className="flex gap-1.5 mb-3 flex-wrap">
        {([
          {id:'emoji',label:'🖼 絵→英語'},
          {id:'jp',label:'🇯🇵 日本語→英語'},
          {id:'en',label:'🇬🇧 英語→日本語'},
          {id:'listen',label:'👂 聞いて答える'},
        ] as const).map(t => (
          <button key={t.id} onClick={() => setQType(t.id)}
            className={`px-2.5 py-1 rounded-full text-xs border transition-all
              ${qType === t.id ? 'bg-ws-purple text-white border-ws-purple' : 'bg-white text-gray-500 border-gray-200'}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        {qType === 'listen' ? (
          <div className="text-center mb-4">
            <button onClick={() => speakEn(q.en, 0.8)}
              className="inline-flex items-center gap-2 px-5 py-3 bg-ws-orange text-white rounded-xl text-sm font-medium">
              🔊 もう一度聞く
            </button>
            {!listeningHint && (
              <button onClick={() => setListeningHint(true)}
                className="block mx-auto mt-2 text-xs text-gray-400 underline">ヒントを見る</button>
            )}
            {listeningHint && (
              <div className="mt-2 text-2xl">{q.e}</div>
            )}
          </div>
        ) : (
          <div className="text-center mb-4">
            {qType === 'emoji' && <div className="text-4xl mb-1">{q.e}</div>}
            {(qType === 'jp' || qType === 'en') && (
              <div className="text-xl font-semibold text-ws-orange">{qType === 'jp' ? q.jp : q.en}</div>
            )}
            <div className="text-xs text-gray-400 mt-1">
              {qType === 'emoji' ? 'この絵は英語でなんと言う？' : qType === 'jp' ? '日本語を英語に' : '英語を日本語に'}
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          {opts.map(o => {
            const isCorrect = locked && o.en === q.en
            const isWrong = locked && result === 'wrong' && (qType === 'en' ? o.jp === opts.find(x=>x!==q)?.jp : o.en !== q.en) && o.en !== q.en
            return (
              <button key={o.en} onClick={() => answer(o)}
                className={`py-2.5 px-2 rounded-lg border text-sm font-medium transition-all leading-tight
                  ${isCorrect ? 'bg-ws-teal-light border-ws-teal text-ws-teal-dark' :
                    isWrong ? 'bg-red-50 border-red-300 text-red-400' :
                    'bg-white border-gray-200 hover:border-ws-orange text-gray-700'}`}>
                {qType === 'en' ? o.jp : o.en}
              </button>
            )
          })}
        </div>
        {result && (
          <div className={`text-center text-sm mt-3 font-medium ${result === 'correct' ? 'text-ws-teal-dark' : 'text-red-600'}`}>
            {result === 'correct' ? '✓ Great! +10XP 🎉' : `× 正解: "${qType === 'en' ? q.jp : q.en}"`}
          </div>
        )}
        <div className="text-[10px] text-gray-300 text-right mt-2">{words.length}語から出題</div>
      </div>
    </div>
  )
}

// ── SENTENCE MODE ───────────────────────────────────────────
function SentenceMode({ curLv, onCorrect }: { curLv: number; onCorrect: () => void }) {
  const sents = SENTENCES[curLv] || SENTENCES[1]
  const [idx, setIdx] = useState(0)
  const [ans, setAns] = useState<string[]>([])
  const [used, setUsed] = useState<boolean[]>([])
  const [shuffled, setShuffled] = useState<string[]>([])
  const [fb, setFb] = useState('')
  const [hint, setHint] = useState('')
  const [speakingEx, setSpeakingEx] = useState(false)

  const s = sents[idx % sents.length]

  useEffect(() => {
    const sh = [...s.words].sort(() => Math.random()-.5)
    setShuffled(sh); setUsed(new Array(sh.length).fill(false))
    setAns([]); setFb(''); setHint('')
  }, [idx, curLv])

  function addToken(i: number) {
    if (used[i]) return
    const nu = [...used]; nu[i] = true; setUsed(nu)
    setAns([...ans, shuffled[i]])
  }
  function removeToken(i: number) {
    const word = ans[i]
    const wi = shuffled.findIndex((w, si) => w === word && used[si])
    const nu = [...used]; if (wi >= 0) nu[wi] = false; setUsed(nu)
    setAns(ans.filter((_, ai) => ai !== i))
  }
  function check() {
    const correct = s.en.split(' ')
    if (JSON.stringify(ans) === JSON.stringify(correct)) {
      setFb('✓ パーフェクト！ +15XP')
      onCorrect()
      setSpeakingEx(true)
      speakEn(s.en.replace(' .', '.'), 0.85, () => setSpeakingEx(false))
    } else { setFb(`× 正解: ${s.en}`) }
  }

  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
      <div className="text-xs text-gray-400 mb-1 font-medium tracking-wide">文章並べ替え</div>
      <div className="flex items-center gap-2 mb-3">
        <div className="text-sm font-semibold text-gray-800 flex-1">{s.jp}</div>
        <button onClick={() => { setSpeakingEx(true); speakEn(s.en.replace(' .', '.'), 0.85, () => setSpeakingEx(false)) }}
          className="text-ws-orange text-sm flex items-center gap-0.5 shrink-0">
          🔊 <SpeakWave show={speakingEx} />
        </button>
      </div>
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
      <div className="flex flex-wrap gap-1.5 mb-3">
        {shuffled.map((w, i) => (
          <button key={i} onClick={() => addToken(i)}
            className={`px-2.5 py-1 rounded-full text-xs border transition-all
              ${used[i] ? 'opacity-20 cursor-not-allowed' : 'bg-white border-gray-200 hover:border-ws-orange text-gray-700'}`}>
            {w}
          </button>
        ))}
      </div>
      {fb && <div className={`text-xs mb-2 font-medium ${fb.startsWith('✓') ? 'text-ws-teal-dark' : 'text-red-600'}`}>{fb}</div>}
      <div className="flex gap-2">
        <button onClick={check} className="px-3 py-1.5 bg-ws-orange text-white rounded-lg text-xs">確認</button>
        <button onClick={() => setIdx(i => i+1)} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-500 rounded-lg text-xs">次へ</button>
        <button onClick={() => setHint(`ヒント: "${s.en.split(' ').slice(0,3).join(' ')}..."`)}
          className="px-3 py-1.5 bg-ws-purple-light text-ws-purple-dark border border-purple-200 rounded-lg text-xs">ヒント</button>
      </div>
    </div>
  )
}

// ── CONVERSATION MODE ───────────────────────────────────────
function ConvMode({ curLv, onCorrect }: { curLv: number; onCorrect: () => void }) {
  const keys = Object.keys(CONVERSATIONS).map(Number).sort((a,b) => a-b)
  const key = keys.filter(k => k <= curLv).pop() || keys[0]
  const data = CONVERSATIONS[key]
  const [step, setStep] = useState(0)
  const [lines, setLines] = useState<{text:string;isUser:boolean;em:string}[]>([])
  const [fb, setFb] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => { setStep(0); setLines([]); setFb(''); setDone(false) }, [curLv])

  useEffect(() => {
    if (step >= data.lines.length || done) return
    const line = data.lines[step]
    if (!line.isUser) {
      setLines(prev => [...prev, { text: line.t!, isUser: false, em: line.em }])
      speakEn(line.t!, 0.85)
      const t = setTimeout(() => setStep(s => s+1), Math.max(1500, (line.t?.length || 20) * 50))
      return () => clearTimeout(t)
    }
  }, [step, data, done])

  function choose(ch: {t:string;jp:string;ok:boolean}) {
    setLines(prev => [...prev, { text: ch.t, isUser: true, em: '🕺' }])
    if (ch.ok) { onCorrect(); setFb('✓ +20XP! ネイティブ表現！') }
    else setFb('× 文法ミス。もう一度。')
    setDone(true)
    setTimeout(() => {
      const next = data.lines[step+1]
      if (next && !next.isUser) {
        setLines(prev => [...prev, { text: next.t!, isUser: false, em: next.em }])
        speakEn(next.t!, 0.85)
      }
    }, 600)
  }

  const curLine = data.lines[step]

  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
      <div className="text-[10px] text-gray-400 font-medium tracking-wide mb-3">{data.scene}</div>
      <div className="flex flex-col gap-2 mb-3 max-h-64 overflow-y-auto">
        {lines.map((l, i) => (
          <div key={i} className={`flex gap-2 ${l.isUser ? 'flex-row-reverse' : ''}`}>
            <span className="text-xl shrink-0">{l.em}</span>
            <div className={`max-w-xs text-sm rounded-xl px-3 py-2 ${l.isUser ? 'bg-ws-orange-light text-ws-orange-dark' : 'bg-white border border-gray-200 text-gray-800'}`}>
              {l.text}
            </div>
          </div>
        ))}
      </div>
      {!done && curLine?.isUser && curLine.choices && (
        <div className="flex flex-col gap-2">
          {curLine.choices.map((ch, i) => (
            <button key={i} onClick={() => choose(ch)}
              className="text-left px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800 hover:border-ws-orange hover:bg-ws-orange-light transition-all">
              {ch.t}
              <div className="text-[10px] text-gray-400 mt-0.5">{ch.jp}</div>
            </button>
          ))}
        </div>
      )}
      {fb && <div className={`text-xs mt-2 font-medium ${fb.startsWith('✓') ? 'text-ws-teal-dark' : 'text-red-600'}`}>{fb}</div>}
      {done && (
        <button onClick={() => { setStep(0); setLines([]); setFb(''); setDone(false) }}
          className="mt-3 px-3 py-1.5 bg-white border border-gray-200 text-gray-500 rounded-lg text-xs">
          もう一度
        </button>
      )}
    </div>
  )
}

// ── GRAMMAR MODE ────────────────────────────────────────────
function GrammarMode({ curLv, onCorrect }: { curLv: number; onCorrect: () => void }) {
  const avail = GRAMMAR_RULES.filter(g => g.lvs.includes(curLv))
  const rules = avail.length > 0 ? avail : GRAMMAR_RULES
  const [ri, setRi] = useState(0)
  const [qi, setQi] = useState(0)
  const [fb, setFb] = useState('')
  const [locked, setLocked] = useState(false)
  const [sel, setSel] = useState('')

  const rule = rules[ri % rules.length]
  const q = rule.qs[qi % rule.qs.length]

  function answer(opt: string) {
    if (locked) return
    setLocked(true); setSel(opt)
    if (opt === q.ans) { onCorrect(); setFb('✓ 正解！ +12XP'); speakEn(q.q.replace('___', q.ans), 0.85) }
    else setFb(`× 正解: "${q.ans}"`)
  }
  function next() { setQi(i => i+1); if ((qi+1)%2===0) setRi(i => i+1); setFb(''); setLocked(false); setSel('') }

  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
      <div className="bg-white border-l-4 border-ws-purple rounded-r-lg px-3 py-2 mb-4">
        <div className="text-sm font-semibold text-ws-purple-dark">{rule.title}
          <span className="text-xs text-gray-400 font-normal ml-2">{rule.rule}</span>
        </div>
        {rule.exs.map(ex => (
          <button key={ex} onClick={() => speakEn(ex, 0.85)}
            className="block text-xs text-gray-500 hover:text-ws-orange text-left">🔊 {ex}</button>
        ))}
      </div>
      <div className="text-xs text-gray-400 mb-1">{q.jp}</div>
      <div className="text-sm text-gray-800 mb-3 leading-relaxed">
        {q.q.split('___').map((part, i, arr) => (
          <span key={i}>{part}
            {i < arr.length-1 && (
              <span className={`inline-block border-b-2 min-w-12 text-center font-semibold mx-1 px-1
                ${locked ? 'border-ws-teal text-ws-teal-dark' : 'border-ws-purple text-ws-purple'}`}>
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
                locked && opt === sel && opt !== q.ans ? 'bg-red-50 border-red-400 text-red-700' :
                'bg-white border-gray-200 hover:border-ws-purple text-gray-700'}`}>
            {opt}
          </button>
        ))}
      </div>
      {fb && <div className={`text-xs mb-2 font-medium ${fb.startsWith('✓') ? 'text-ws-teal-dark' : 'text-red-600'}`}>{fb}</div>}
      <button onClick={next} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-500 rounded-lg text-xs">次の問題</button>
    </div>
  )
}

// ── READING MODE ────────────────────────────────────────────
function ReadingMode({ curLv, onCorrect }: { curLv: number; onCorrect: () => void }) {
  const avail = READINGS.filter(r => r.lvs.includes(curLv))
  const rdgs = avail.length > 0 ? avail : READINGS
  const [ri, setRi] = useState(0)
  const [answers, setAnswers] = useState<Record<number,'correct'|'wrong'>>({})
  const [gloss, setGloss] = useState<{word:string;jp:string}|null>(null)
  const [reading, setReading] = useState(false)
  const rdg = rdgs[ri % rdgs.length]
  const lv = LEVELS.find(l => l.id === curLv)

  const GLOSSARY: Record<string, string> = {
    'transformed':'変革した','instantly':'瞬時に','psychological':'心理的な',
    'misinformation':'誤情報','threat':'脅威','activism':'社会運動',
    'evident':'明らか','renewable':'再生可能な','transition':'移行',
    'necessity':'必要性','infrastructure':'インフラ','adopt':'採用する',
    'artificial intelligence':'人工知能','consciousness':'意識','complex':'複雑な',
    'philosophers':'哲学者たち','empathy':'共感','evolves':'進化する',
    'boundary':'境界','ambiguous':'曖昧な',
  }

  function renderText(text: string) {
    return text.split(/\[([^\]]+)\]/).map((part, i) => {
      if (i % 2 === 0) return <span key={i}>{part}</span>
      return (
        <span key={i}
          onClick={() => { setGloss({ word: part, jp: GLOSSARY[part] || '...' }); speakEn(part, 0.8) }}
          className="bg-amber-100 text-amber-800 rounded px-0.5 cursor-pointer font-semibold hover:bg-amber-200">
          {part}
        </span>
      )
    })
  }

  function readAloud() {
    const plain = rdg.text.replace(/\[([^\]]+)\]/g, '$1').replace(/\s+/g, ' ')
    setReading(true)
    speakEn(plain, 0.8, () => setReading(false))
  }

  function answer(qi: number, oi: number) {
    if (answers[qi]) return
    const ok = oi === rdg.questions[qi].ans
    setAnswers(prev => ({ ...prev, [qi]: ok ? 'correct' : 'wrong' }))
    if (ok) { onCorrect(); speakEn(rdg.questions[qi].opts[oi], 0.85) }
  }

  const correct = Object.values(answers).filter(v => v === 'correct').length

  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
      <div className="flex items-center gap-2 mb-2">
        {lv && <EikenBadge cls={lv.eikenClass} label={rdg.eiken} />}
        <span className="text-[10px] text-gray-400 flex-1">{rdg.tag}</span>
        <button onClick={readAloud}
          className="inline-flex items-center gap-1 text-xs text-ws-orange border border-orange-200 rounded-full px-2 py-0.5">
          🔊 全文読み上げ <SpeakWave show={reading} />
        </button>
      </div>
      <div className="text-base font-semibold text-gray-800 mb-3">{rdg.title}</div>
      {gloss && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-amber-800">{gloss.word} = {gloss.jp}</span>
          <button onClick={() => setGloss(null)} className="text-amber-600 text-xs">✕</button>
        </div>
      )}
      <div className="bg-white border border-gray-200 rounded-lg p-3 mb-3 text-sm text-gray-800 leading-8">
        {renderText(rdg.text)}
      </div>
      <div className="text-[10px] text-gray-400 mb-3">★ ハイライト単語をタップ→意味＋発音</div>
      <div className="flex flex-col gap-3 mb-4">
        {rdg.questions.map((qobj, qi) => (
          <div key={qi} className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="text-sm font-medium text-gray-800 mb-2">Q{qi+1}. {qobj.q}</div>
            <div className="flex flex-col gap-1.5">
              {qobj.opts.map((opt, oi) => (
                <button key={oi} onClick={() => answer(qi, oi)}
                  className={`text-left px-3 py-2 rounded-lg text-xs border transition-all
                    ${answers[qi] && oi === qobj.ans ? 'bg-ws-teal-light border-ws-teal text-ws-teal-dark' :
                      answers[qi] && answers[qi] === 'wrong' && oi !== qobj.ans ? 'bg-gray-50 border-gray-100 text-gray-300' :
                      !answers[qi] ? 'bg-gray-50 border-gray-200 hover:border-ws-orange hover:bg-ws-orange-light text-gray-700' :
                      'bg-gray-50 border-gray-100 text-gray-300'}`}>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => { setRi(i => i+1); setAnswers({}); setGloss(null) }}
          className="px-3 py-1.5 bg-white border border-gray-200 text-gray-500 rounded-lg text-xs">次の長文</button>
        <span className="text-xs text-gray-400 ml-auto">{correct}/{rdg.questions.length} 正解</span>
      </div>
    </div>
  )
}

// ── AI INTERVIEW MODE ────────────────────────────────────────
type Msg = { role: 'user' | 'assistant'; content: string }

const INTERVIEW_LEVELS: Record<number, { label: string; prompt: string }> = {
  1: { label: '5級レベル', prompt: 'You are a friendly English teacher interviewing a young student (grade 1-3 level). Ask very simple questions about daily life, animals, food, colors. Use simple vocabulary. Speak slowly. After each answer, give brief positive feedback and correct any major errors gently. Keep responses under 3 sentences. Start by introducing yourself and asking the student their name.' },
  4: { label: '4級レベル', prompt: 'You are an English teacher interviewing an elementary school student (grade 4-6). Ask questions about hobbies, school life, and daily routine. Use simple but complete sentences. After each answer, give feedback on grammar and vocabulary. Keep responses concise. Start with a greeting and ask about their hobbies.' },
  7: { label: '3級レベル', prompt: 'You are an English examiner conducting a Eiken Grade 3 style interview. Ask questions about the student\'s experiences, opinions on simple topics, and future plans. Correct grammar errors politely. After each answer, ask a follow-up question. Start with "Hello, let\'s begin the interview."' },
  10: { label: '準2級レベル', prompt: 'You are an Eiken Pre-2 examiner. Conduct a formal interview asking about social topics, personal experiences, and opinions. Topics include school, environment, technology, and society. Provide grammar feedback and vocabulary suggestions. Use more complex sentence structures. Start formally.' },
  13: { label: '2級レベル', prompt: 'You are an Eiken Grade 2 examiner. Conduct an advanced interview on topics like environmental issues, social problems, global trends, and science. Expect complete sentences and complex grammar. Provide detailed feedback on fluency, vocabulary, and grammar. Challenge the student with follow-up questions.' },
  17: { label: '準1級レベル', prompt: 'You are an Eiken Pre-1 examiner. Conduct a sophisticated interview on abstract topics: philosophy, ethics, economics, culture, and international relations. Expect nuanced arguments, advanced vocabulary, and complex grammar. Give detailed professional feedback. Debate and challenge their arguments respectfully.' },
}

function getInterviewPrompt(lvId: number): { label: string; prompt: string } {
  const keys = Object.keys(INTERVIEW_LEVELS).map(Number).sort((a,b) => a-b)
  const key = keys.filter(k => k <= lvId).pop() || keys[0]
  return INTERVIEW_LEVELS[key]
}

function AIInterviewMode({ curLv }: { curLv: number }) {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [started, setStarted] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const lvInfo = getInterviewPrompt(curLv)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  async function callClaude(history: Msg[]) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: history,
      system: lvInfo.prompt,
    }),
  })
  const data = await res.json()
  return data.content?.[0]?.text || 'Sorry, please try again.'
}
  

  async function start() {
    setStarted(true)
    setLoading(true)
    const reply = await callClaude([{ role: 'user', content: 'Please start the interview.' }])
    const newMsgs: Msg[] = [
      { role: 'user', content: 'Please start the interview.' },
      { role: 'assistant', content: reply },
    ]
    setMsgs(newMsgs)
    setLoading(false)
    setSpeaking(true)
    speakEn(reply, 0.85, () => setSpeaking(false))
  }

  async function send() {
    if (!input.trim() || loading) return
    const userMsg: Msg = { role: 'user', content: input.trim() }
    const newHistory = [...msgs, userMsg]
    setMsgs(newHistory)
    setInput('')
    setLoading(true)
    const reply = await callClaude(newHistory)
    const withReply = [...newHistory, { role: 'assistant' as const, content: reply }]
    setMsgs(withReply)
    setLoading(false)
    setSpeaking(true)
    speakEn(reply, 0.85, () => setSpeaking(false))
  }

  function speakMsg(text: string) {
    setSpeaking(true)
    speakEn(text, 0.85, () => setSpeaking(false))
  }

  function reset() {
    setMsgs([]); setStarted(false); setInput(''); setLoading(false)
    window.speechSynthesis.cancel()
  }

  if (!started) {
    return (
      <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 text-center">
        <div className="text-3xl mb-3">🎤</div>
        <div className="text-base font-semibold text-gray-800 mb-1">AI英検面接</div>
        <div className="inline-block mb-3">
          <EikenBadge cls={LEVELS.find(l=>l.id===curLv)?.eikenClass||'bg-gray-100 text-gray-600'} label={lvInfo.label} />
        </div>
        <div className="text-sm text-gray-500 mb-4 leading-relaxed">
          AIが面接官になって英語で会話練習。<br/>
          文法・語彙・表現のフィードバックも自動でもらえる。<br/>
          面接官の音声も自動で読み上げるよ。
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4 text-xs text-gray-500 text-left space-y-1">
          <div>📌 レベル: {lvInfo.label}</div>
          <div>🔊 面接官の音声は自動再生</div>
          <div>📝 英語でタイピングして返答</div>
          <div>💡 文法ミスは優しく訂正してもらえる</div>
        </div>
        <button onClick={start}
          className="px-8 py-3 bg-ws-orange text-white rounded-xl text-sm font-semibold">
          面接スタート 🎤
        </button>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">🎤 AI英検面接</span>
          <EikenBadge cls={LEVELS.find(l=>l.id===curLv)?.eikenClass||'bg-gray-100 text-gray-600'} label={lvInfo.label} />
        </div>
        <div className="flex items-center gap-2">
          {speaking && <span className="text-xs text-ws-orange flex items-center gap-0.5">読み上げ中 <SpeakWave show={true} /></span>}
          <button onClick={reset} className="text-xs text-gray-400 hover:text-gray-600">リセット</button>
        </div>
      </div>

      <div className="h-72 overflow-y-auto p-3 flex flex-col gap-2">
        {msgs.filter(m => m.content !== 'Please start the interview.').map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <span className="text-lg shrink-0">{m.role === 'assistant' ? '👔' : '🙋'}</span>
            <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm leading-relaxed
              ${m.role === 'assistant' ? 'bg-white border border-gray-200 text-gray-800' : 'bg-ws-orange-light text-ws-orange-dark'}`}>
              {m.content}
              {m.role === 'assistant' && (
                <button onClick={() => speakMsg(m.content)}
                  className="block mt-1 text-xs text-gray-400 hover:text-ws-orange">🔊 再生</button>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <span className="text-lg">👔</span>
            <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-400 flex items-center gap-1">
              考え中<span className="animate-bounce">.</span><span className="animate-bounce" style={{animationDelay:'0.1s'}}>.</span><span className="animate-bounce" style={{animationDelay:'0.2s'}}>.</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-gray-200 bg-white">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="英語で入力してEnter..."
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-ws-orange"
          />
          <button onClick={send} disabled={loading || !input.trim()}
            className="px-4 py-2 bg-ws-orange text-white rounded-lg text-sm disabled:opacity-40">
            送信
          </button>
        </div>
        <div className="text-[10px] text-gray-300 mt-1">Enterで送信 · 面接官の音声は自動再生</div>
      </div>
    </div>
  )
}

// ── PREMIUM MODE ────────────────────────────────────────────
function PremiumMode() {
  return (
    <div className="bg-ws-purple-light border border-purple-200 rounded-xl p-5 text-center">
      <div className="text-2xl mb-2">🎤</div>
      <div className="text-sm font-semibold text-ws-purple-dark mb-1">発音採点 — プレミアム</div>
      <div className="text-xs text-ws-purple-dark opacity-80 mb-4">
        マイクで発音して、AIが正確さをスコア採点。<br/>英検スピーキング本番対策に！
      </div>
      <div className="bg-white border border-purple-200 rounded-lg p-3 mb-4 text-xs text-gray-600 text-left space-y-1.5">
        <div>✓ 発音スコア採点（Web Speech API）</div>
        <div>✓ 苦手音の分析レポート</div>
        <div>✓ 英検面接スピーキング練習</div>
        <div>✓ 全レベル解放・広告なし</div>
      </div>
      <a href="https://gumroad.com" target="_blank" rel="noopener noreferrer"
        className="inline-block px-6 py-2.5 bg-ws-purple text-white rounded-lg text-sm font-medium">
        プレミアムを始める ★
      </a>
    </div>
  )
}

// ── MAIN ────────────────────────────────────────────────────
export default function HomePage() {
  const { state, setState, addXP, learnWord, addScore, hydrated } = useGameState()
  const [bubble, setBubble] = useState('Yo! WORD STREETへようこそ。単語をタップしたら即発音するぜ！')

  const crew = CREW.find(c => c.id === state.crewId) || CREW[0]
  const curLv = LEVELS.find(l => l.id === state.currentLv) || LEVELS[0]

  const earnedBadges = BADGES.filter(b => {
    try { return (b.fn as any)(state.learned.length, state.score, state.rdgCorrect, state.level) }
    catch { return false }
  }).map(b => b.id)

  function onLearn(word: string) {
    learnWord(word)
    addXP(5)
    setBubble(`「${word}」をマスター！ Keep going! 🔥`)
  }
  function onCorrect() {
    addScore()
    setState(prev => {
      const newXP = prev.xp + 10
      return { score: prev.score + 1, level: calcLevel(newXP), xp: newXP }
    })
    setBubble('ナイス！ +10XP 🎉')
  }
  function onRdgCorrect() {
    setState(prev => ({ rdgCorrect: prev.rdgCorrect+1, score: prev.score+1, xp: prev.xp+25 }))
    setBubble('長文読解マスター！ +25XP 最高！')
  }
  function onGramCorrect() {
    setState(prev => ({ score: prev.score+1, xp: prev.xp+12 }))
    setBubble('文法完璧！ +12XP ナイス！')
  }
  function onConvCorrect() {
    setState(prev => ({ score: prev.score+1, xp: prev.xp+20 }))
    setBubble('ネイティブ表現！ +20XP やるじゃん！')
  }
  function onSentCorrect() {
    setState(prev => ({ score: prev.score+1, xp: prev.xp+15 }))
    setBubble('完璧な文章！ +15XP 最高！')
  }

  const progress = (() => {
    const words = getLevelWords(state.currentLv)
    const done = words.filter(w => state.learned.includes(w.en)).length
    return Math.round(done / words.length * 100)
  })()

  if (!hydrated) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-ws-orange text-sm animate-pulse">WORD STREET loading...</div>
    </div>
  )

  const MODES = [
    { id:'learn', label:'単語', icon:'🃏' },
    { id:'quiz',  label:'クイズ', icon:'❓' },
    { id:'sent',  label:'文章', icon:'📝' },
    { id:'conv',  label:'会話', icon:'💬' },
    { id:'gram',  label:'文法', icon:'📖' },
    { id:'read',  label:'長文', icon:'📄' },
    { id:'ai',    label:'AI面接', icon:'🎤' },
    { id:'premium',label:'発音★', icon:'🏆', premium: true },
  ]

  return (
    <main className="max-w-2xl mx-auto px-4 py-4">
      <Header state={state} />

      {/* crew */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
        {CREW.map(c => {
          const unlocked = state.level >= c.lv
          return (
            <button key={c.id} onClick={() => unlocked && setState({ crewId: c.id })}
              className={`flex flex-col items-center gap-1 shrink-0 ${!unlocked ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}`}>
              <div className={`w-11 h-11 rounded-full border-2 flex items-center justify-center text-xl transition-all
                ${state.crewId === c.id ? 'scale-110' : 'border-gray-200 bg-gray-100'}`}
                style={unlocked ? { borderColor: state.crewId === c.id ? c.color : undefined, background: state.crewId === c.id ? c.color+'20' : undefined } : {}}>
                {c.em}
              </div>
              <span className={`text-[10px] font-medium ${state.crewId === c.id ? 'text-ws-orange' : 'text-gray-400'}`}>{c.name}</span>
            </button>
          )
        })}
      </div>

      {/* scene */}
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
                <button key={lv.id} onClick={() => unlocked && setState({ currentLv: lv.id })}
                  className={`shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border transition-all
                    ${state.currentLv === lv.id ? 'bg-ws-orange text-white border-ws-orange' :
                      unlocked ? 'bg-white text-gray-600 border-gray-200 hover:border-ws-orange' :
                      'bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed'}`}>
                  {lv.icon}Lv.{lv.id}
                  <EikenBadge
                    cls={state.currentLv===lv.id ? 'bg-orange-200 text-orange-900' : unlocked ? lv.eikenClass : 'bg-gray-200 text-gray-400'}
                    label={lv.eiken} />
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* progress */}
      <div className="mb-3">
        <div className="flex justify-between text-[11px] text-gray-400 mb-1">
          <span>Lv.{curLv.id} — {curLv.name} [{curLv.eiken}] {getLevelWords(curLv.id).length}語</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-ws-orange rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* modes */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {MODES.map(m => (
          <button key={m.id} onClick={() => setState({ mode: m.id })}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs transition-all
              ${(m as any).premium ? 'opacity-50 cursor-not-allowed border-gray-200 bg-white text-gray-500' :
                state.mode === m.id ? 'bg-ws-orange-light border-ws-orange text-ws-orange-dark font-medium' :
                'bg-white border-gray-200 text-gray-500 hover:border-ws-orange'}`}>
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {/* panels */}
      {state.mode === 'learn'   && <LearnMode curLv={state.currentLv} learned={state.learned} onLearn={onLearn} />}
      {state.mode === 'quiz'    && <QuizMode key={state.currentLv} curLv={state.currentLv} onCorrect={onCorrect} />}
      {state.mode === 'sent'    && <SentenceMode key={state.currentLv} curLv={state.currentLv} onCorrect={onSentCorrect} />}
      {state.mode === 'conv'    && <ConvMode key={state.currentLv} curLv={state.currentLv} onCorrect={onConvCorrect} />}
      {state.mode === 'gram'    && <GrammarMode key={state.currentLv} curLv={state.currentLv} onCorrect={onGramCorrect} />}
      {state.mode === 'read'    && <ReadingMode key={state.currentLv} curLv={state.currentLv} onCorrect={onRdgCorrect} />}
      {state.mode === 'ai'      && <AIInterviewMode key={state.currentLv} curLv={state.currentLv} />}
      {state.mode === 'premium' && <PremiumMode />}

      <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
        <div className="text-[10px] text-gray-300 tracking-widest">CASA SHINDY © 2025</div>
        <button onClick={() => { if (confirm('リセットしますか？')) { localStorage.clear(); window.location.reload() } }}
          className="text-[10px] text-gray-300 hover:text-gray-500">リセット</button>
      </div>
    </main>
  )
}
