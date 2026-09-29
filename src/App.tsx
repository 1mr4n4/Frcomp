import { useEffect, useRef, useState } from 'react'
import { runProgram, type InputKeyword, type Lang } from './engine/interpreter'
import { UI, example } from './i18n'

type Line = { k: 'out' | 'in' | 'err' | 'sys'; t: string }
type Pending = { resolve: (v: string) => void; reject: (e: Error) => void }

function Segmented<T extends string>(props: {
  value: T; options: T[]; onChange: (v: T) => void; disabled?: boolean
}) {
  return (
    <div className={`inline-flex rounded-lg border border-slate-300 overflow-hidden ${props.disabled ? 'opacity-40 pointer-events-none' : ''}`}>
      {props.options.map(o => (
        <button
          key={o}
          onClick={() => props.onChange(o)}
          className={`px-4 py-1.5 text-sm font-medium transition ${props.value === o ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

export default function App() {
  const [lang, setLang] = useState<Lang>('fr')
  const [kw, setKw] = useState<InputKeyword>('Saisir')
  const [code, setCode] = useState(example('fr', 'Saisir'))
  const [lines, setLines] = useState<Line[]>([])
  const [running, setRunning] = useState(false)
  const [waiting, setWaiting] = useState(false)
  const [value, setValue] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const pending = useRef<Pending | null>(null)
  const ctl = useRef({ aborted: false })
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const t = UI[lang]

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }) }, [lines, waiting])
  useEffect(() => { if (waiting) inputRef.current?.focus() }, [waiting])
  useEffect(() => { document.documentElement.lang = lang }, [lang])

  // If the code is still the untouched example, swap it when a setting changes.
  const changeLang = (l: Lang) => {
    if (code === example(lang, kw)) setCode(example(l, kw))
    setLang(l)
  }
  const changeKw = (k: InputKeyword) => {
    if (code === example(lang, kw)) setCode(example(lang, k))
    setKw(k)
  }

  const push = (l: Line) => setLines(prev => [...prev, l])

  const run = async () => {
    const c = { aborted: false }
    ctl.current = c
    setLines([]); setRunning(true)
    try {
      await runProgram(code, { lang, inputKeyword: kw }, {
        print: s => push({ k: 'out', t: s }),
        input: () => new Promise<string>((resolve, reject) => {
          pending.current = { resolve, reject }
          setWaiting(true)
        }),
      }, c)
      push({ k: 'sys', t: t.done })
    } catch (e) {
      if (c.aborted) push({ k: 'sys', t: t.stopped })
      else push({ k: 'err', t: (e as Error).message })
    } finally {
      pending.current = null
      setWaiting(false); setRunning(false)
    }
  }

  const stop = () => {
    ctl.current.aborted = true
    pending.current?.reject(new Error('aborted'))
  }

  const submit = () => {
    if (!pending.current) return
    push({ k: 'in', t: value })
    pending.current.resolve(value)
    pending.current = null
    setValue(''); setWaiting(false)
  }

  return (
    <div className="min-h-screen flex flex-col text-slate-900">
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-lg font-bold text-indigo-700">{t.title}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(s => !s)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm hover:bg-slate-50"
          >
            ⚙ {t.settings}
          </button>
          {running ? (
            <button onClick={stop} className="px-4 py-1.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700">
              ■ {t.stop}
            </button>
          ) : (
            <button onClick={run} className="px-4 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700">
              ▶ {t.run}
            </button>
          )}
        </div>
      </header>

      {showSettings && (
        <section className="bg-white border-b border-slate-200 px-4 py-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium mb-2">{t.language}</p>
            <Segmented<Lang> value={lang} options={['fr', 'en']} onChange={changeLang} />
          </div>
          <div>
            <p className="text-sm font-medium mb-2">{t.inputSyntax}</p>
            <Segmented<InputKeyword>
              value={kw} options={['Saisir', 'Lire']} onChange={changeKw} disabled={lang === 'en'}
            />
            {lang === 'en' && <p className="text-xs text-slate-500 mt-1">{t.inputDisabled}</p>}
          </div>
        </section>
      )}

      <main className="flex-1 grid gap-4 p-4 grid-cols-1 lg:grid-cols-2">
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">{t.editor}</label>
          <textarea
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder={t.editorPlaceholder}
            spellCheck={false}
            className="flex-1 min-h-[18rem] lg:min-h-[70vh] w-full rounded-xl border border-slate-300 bg-white p-3 font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium">{t.console}</label>
            <button onClick={() => setLines([])} className="text-xs text-slate-500 hover:text-slate-800">{t.clear}</button>
          </div>
          <div className="flex-1 min-h-[18rem] lg:min-h-[70vh] max-h-[70vh] flex flex-col rounded-xl bg-slate-900 text-slate-100 font-mono text-sm overflow-hidden">
            <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
              {lines.length === 0 && !running && <p className="text-slate-500">{t.idle}</p>}
              {lines.map((l, i) => (
                <p
                  key={i}
                  className={`whitespace-pre-wrap break-words ${
                    l.k === 'err' ? 'text-red-400' : l.k === 'in' ? 'text-amber-300' : l.k === 'sys' ? 'text-slate-500' : ''
                  }`}
                >
                  {l.k === 'in' ? '> ' : ''}{l.t}
                </p>
              ))}
              <div ref={endRef} />
            </div>
            <div className="flex gap-2 border-t border-slate-700 p-2">
              <span className="text-amber-300 pl-1 self-center">&gt;</span>
              <input
                ref={inputRef}
                value={value}
                disabled={!waiting}
                onChange={e => setValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit()}
                placeholder={t.inputPlaceholder}
                className="flex-1 bg-transparent outline-none placeholder-slate-600 disabled:opacity-30"
              />
              <button
                onClick={submit}
                disabled={!waiting}
                className="px-3 py-1 rounded-md bg-indigo-600 text-white text-xs font-medium disabled:opacity-30"
              >
                {t.send}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
