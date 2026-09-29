import { useEffect, useMemo, useRef, useState } from 'react'
import { runProgram, type InputKeyword, type Lang } from './engine/interpreter'
import { UI, example, type UIStrings } from './i18n'
import Segmented from './components/Segmented'
import ConsoleView, { type Line } from './components/ConsoleView'
import { AlertIcon, CodeIcon, KeyboardIcon, PlayIcon, ResetIcon, SettingsIcon, StopIcon } from './components/Icons'

type Pending = { resolve: (v: string) => void; reject: (e: Error) => void }

function PanelLabel({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[#6e7681]">{icon}</span>
      <span className="text-[13px] font-semibold text-[#8b949e]">{children}</span>
    </div>
  )
}

export default function App() {
  const [lang, setLang] = useState<Lang>('fr')
  const [kw, setKw] = useState<InputKeyword>('Saisir')
  const [code, setCode] = useState(example('fr', 'Saisir'))
  const [lines, setLines] = useState<Line[]>([])
  const [typedCount, setTypedCount] = useState(0)
  const [typingText, setTypingText] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [waiting, setWaiting] = useState(false)
  const [value, setValue] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [copied, setCopied] = useState(false)
  const pending = useRef<Pending | null>(null)
  const ctl = useRef({ aborted: false })
  const skipRef = useRef<() => void>(() => {})
  const t: UIStrings = UI[lang]

  // Smooth, one-line-at-a-time typewriter reveal of the console output.
  const current = lines[typedCount]
  const backlog = lines.length - typedCount

  useEffect(() => {
    if (!current) {
      setTypingText(null)
      skipRef.current = () => {}
      return
    }

    const full = current.t
    const reduced =
      typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduced || backlog > 6 || full.length === 0) {
      setTypingText(null)
      setTypedCount(c => (lines[typedCount] ? c + 1 : c))
      return
    }

    let i = 0
    let active = true
    const delay = full.length > 160 ? 6 : full.length > 60 ? 11 : 17
    setTypingText('')

    const id = window.setInterval(() => {
      if (!active) return
      i += 1
      setTypingText(full.slice(0, i))
      if (i >= full.length) {
        active = false
        window.clearInterval(id)
        setTypingText(null)
        setTypedCount(c => c + 1)
      }
    }, delay)

    skipRef.current = () => {
      if (!active) return
      active = false
      window.clearInterval(id)
      setTypingText(null)
      setTypedCount(c => c + 1)
    }

    return () => {
      active = false
      window.clearInterval(id)
    }
  }, [current, typedCount])

  useEffect(() => { document.documentElement.lang = lang }, [lang])

  const resetConsole = () => {
    setLines([])
    setTypedCount(0)
    setTypingText(null)
  }

  const run = async () => {
    if (running) return
    const c = { aborted: false }
    ctl.current = c
    resetConsole()
    setRunning(true)
    try {
      await runProgram(code, { lang, inputKeyword: kw }, {
        print: s => setLines(prev => [...prev, { k: 'out', t: s }]),
        input: () => new Promise<string>((resolve, reject) => {
          pending.current = { resolve, reject }
          setWaiting(true)
        }),
      }, c)
      setLines(prev => [...prev, { k: 'sys', t: t.done }])
    } catch (e) {
      if (c.aborted) setLines(prev => [...prev, { k: 'sys', t: t.stopped }])
      else setLines(prev => [...prev, { k: 'err', t: (e as Error).message }])
    } finally {
      pending.current = null
      setWaiting(false)
      setRunning(false)
    }
  }

  const stop = () => {
    ctl.current.aborted = true
    pending.current?.reject(new Error('aborted'))
  }

  const submit = () => {
    if (!pending.current) return
    setLines(prev => [...prev, { k: 'in', t: value }])
    pending.current.resolve(value)
    pending.current = null
    setValue('')
    setWaiting(false)
  }

  const copyOutput = async () => {
    try {
      await navigator.clipboard.writeText(lines.map(l => l.t).join('\n'))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  // If the code is still the untouched example, swap it when a setting changes.
  const changeLang = (l: Lang) => {
    if (code === example(lang, kw)) setCode(example(l, kw))
    setLang(l)
  }
  const changeKw = (k: InputKeyword) => {
    if (code === example(lang, kw)) setCode(example(lang, k))
    setKw(k)
  }

  const resetExample = () => setCode(example(lang, kw))

  // Shortcuts: Ctrl/Cmd + Enter runs, Escape stops.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        if (!running) void run()
      } else if (e.key === 'Escape' && running) {
        stop()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const stats = useMemo(() => {
    const rows = code.split('\n').length
    return { rows, chars: code.length }
  }, [code])

  const statusChips = [
    { label: t.language, value: lang.toUpperCase() },
    { label: t.inputSyntax, value: kw },
    { label: t.editor, value: `${stats.rows} ${t.linesLabel}` },
  ]

  const hasError = lines.some(l => l.k === 'err')

  return (
    <div className="flex min-h-screen flex-col bg-[#0d1117] text-[#e6edf3]">
      <header className="anim-fade-in sticky top-0 z-30 border-b border-[#21262d] bg-[#0d1117]">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="anim-rise flex min-w-0 items-center gap-3">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-[#388bfd]">
              <CodeIcon className="h-4 w-4 text-[#0d1117]" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-[15px] font-semibold text-[#e6edf3]">{t.title}</h1>
              <p className="hidden truncate text-[11px] text-[#6e7681] sm:block">{t.subtitle}</p>
            </div>
          </div>

          <div className="anim-rise flex items-center gap-2" style={{ animationDelay: '80ms' }}>
            <button
              onClick={() => setShowSettings(s => !s)}
              aria-expanded={showSettings}
              className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-[13px] font-medium transition-colors duration-200 active:scale-95 ${
                showSettings
                  ? 'border-[#388bfd]/50 bg-[#388bfd]/10 text-[#79c0ff]'
                  : 'border-[#30363d] bg-[#21262d] text-[#c9d1d9] hover:border-[#484f58] hover:bg-[#30363d]'
              }`}
            >
              <SettingsIcon className={`h-4 w-4 transition-transform duration-300 ${showSettings ? 'rotate-90' : ''}`} />
              <span className="hidden sm:inline">{t.settings}</span>
            </button>

            {running ? (
              <button
                onClick={stop}
                className="flex items-center gap-2 rounded-md border border-[#f85149]/40 bg-[#f85149]/10 px-4 py-1.5 text-[13px] font-semibold text-[#ff7b72] transition-colors duration-200 hover:bg-[#f85149]/20 active:scale-95"
              >
                <StopIcon className="h-3 w-3" />
                {t.stop}
              </button>
            ) : (
              <button
                onClick={() => void run()}
                className="flex items-center gap-2 rounded-md bg-[#238636] px-4 py-1.5 text-[13px] font-semibold text-white transition-colors duration-200 hover:bg-[#2ea043] active:scale-95"
              >
                <PlayIcon className="h-3 w-3" />
                {t.run}
              </button>
            )}
          </div>
        </div>
      </header>

      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
          showSettings ? 'grid-rows-[1fr] opacity-100' : 'pointer-events-none grid-rows-[0fr] opacity-0'
        }`}
        aria-hidden={!showSettings}
      >
        <div className="overflow-hidden">
          <section className="border-b border-[#21262d] bg-[#10141a]">
            <div className="mx-auto grid w-full max-w-6xl gap-5 px-4 py-4 sm:grid-cols-2 sm:px-6">
              <div className="anim-rise">
                <p className="mb-2 text-[12px] font-medium text-[#8b949e]">{t.language}</p>
                <Segmented<Lang> value={lang} options={['fr', 'en']} onChange={changeLang} />
              </div>
              <div className="anim-rise" style={{ animationDelay: '60ms' }}>
                <p className="mb-2 text-[12px] font-medium text-[#8b949e]">{t.inputSyntax}</p>
                <div className="flex flex-wrap items-center gap-3">
                  <Segmented<InputKeyword>
                    value={kw}
                    options={['Saisir', 'Lire']}
                    onChange={changeKw}
                    disabled={lang === 'en'}
                  />
                  {lang === 'en' && <span className="text-[11px] text-[#6e7681]">{t.inputDisabled}</span>}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <main className="mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 gap-4 p-4 sm:px-6 lg:grid-cols-2 lg:gap-5 lg:py-6">
        <section
          className="anim-rise flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#21262d] bg-[#161b22]"
          style={{ animationDelay: '50ms' }}
        >
          <div className="flex items-center justify-between gap-2 border-b border-[#21262d] px-4 py-2.5">
            <PanelLabel icon={<CodeIcon className="h-4 w-4" />}>{t.editor}</PanelLabel>
            <button
              onClick={resetExample}
              title={t.reset}
              className="grid h-7 w-7 place-items-center rounded-md border border-[#30363d] bg-[#0d1117] text-[#8b949e] transition-colors duration-200 hover:border-[#484f58] hover:bg-[#21262d] hover:text-[#e6edf3] active:scale-95"
            >
              <ResetIcon className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex min-h-[15rem] flex-1 p-3 lg:min-h-[58vh]">
            <textarea
              value={code}
              onChange={e => setCode(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Tab') {
                  e.preventDefault()
                  const el = e.currentTarget
                  const s = el.selectionStart
                  const n = el.selectionEnd
                  setCode(code.slice(0, s) + '  ' + code.slice(n))
                  requestAnimationFrame(() => {
                    el.selectionStart = el.selectionEnd = s + 2
                  })
                }
              }}
              placeholder={t.editorPlaceholder}
              spellCheck={false}
              className="thin-scroll h-full w-full resize-none rounded-md border border-[#21262d] bg-[#0d1117] p-3 font-mono text-[13px] leading-relaxed text-[#e6edf3] caret-[#388bfd] outline-none transition-colors duration-200 focus:border-[#388bfd] placeholder:text-[#6e7681]"
            />
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-[#21262d] px-4 py-2 text-[11px] text-[#6e7681]">
            <span>
              {stats.rows} {t.linesLabel} · {stats.chars} {t.charsLabel}
            </span>
            <span className="flex items-center gap-1.5">
              <KeyboardIcon className="h-3.5 w-3.5" />
              {t.shortcut}
            </span>
          </div>
        </section>

        <section className="anim-rise flex min-h-0 flex-col" style={{ animationDelay: '110ms' }}>
          <ConsoleView
            t={t}
            lines={lines}
            typedCount={typedCount}
            typingText={typingText}
            running={running}
            waiting={waiting}
            value={value}
            copied={copied}
            onChange={setValue}
            onSubmit={submit}
            onClear={resetConsole}
            onCopy={copyOutput}
            onSkip={() => skipRef.current()}
          />
        </section>
      </main>

      <footer className="border-t border-[#21262d] bg-[#0d1117]">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-2 px-4 py-2.5 sm:gap-3 sm:px-6">
          {statusChips.map(c => (
            <span
              key={c.label}
              className="flex items-center gap-1.5 rounded-md border border-[#21262d] bg-[#161b22] px-2.5 py-1 text-[11px] text-[#8b949e]"
            >
              <span className="text-[#6e7681]">{c.label}</span>
              <span className="font-medium text-[#c9d1d9]">{c.value}</span>
            </span>
          ))}
          {hasError && (
            <span className="flex items-center gap-1.5 rounded-md border border-[#f85149]/40 bg-[#f85149]/10 px-2.5 py-1 text-[11px] font-medium text-[#ff7b72]">
              <AlertIcon className="h-3.5 w-3.5" />
              {t.statusError}
            </span>
          )}
          <span className="ml-auto hidden items-center gap-1.5 text-[11px] text-[#6e7681] sm:flex">
            <span className={`h-1.5 w-1.5 rounded-full ${running ? 'bg-[#3fb950]' : 'bg-[#6e7681]'}`} />
            {running ? t.statusRunning : t.statusReady}
          </span>
        </div>
      </footer>
    </div>
  )
}
