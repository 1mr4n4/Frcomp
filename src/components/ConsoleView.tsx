import { useEffect, useRef } from 'react'
import type { UIStrings } from '../i18n'
import { AlertIcon, CheckIcon, CopyIcon, TerminalIcon, TrashIcon } from './Icons'

export type Line = { k: 'out' | 'in' | 'err' | 'sys'; t: string }

interface Props {
  t: UIStrings
  lines: Line[]
  typedCount: number
  typingText: string | null
  running: boolean
  waiting: boolean
  value: string
  copied: boolean
  onChange: (v: string) => void
  onSubmit: () => void
  onClear: () => void
  onCopy: () => void
  onSkip: () => void
}

const plain: Record<Line['k'], string> = {
  out: 'text-[#e6edf3]',
  in: 'text-[#d29922]',
  sys: 'text-[#6e7681]',
  err: '',
}

function LineRow({ l }: { l: Line }) {
  if (l.k === 'err') {
    return (
      <div className="anim-shake flex items-start gap-2 rounded-md border-l-2 border-[#f85149] bg-[#f85149]/10 px-2.5 py-1.5 text-[#ff7b72]">
        <AlertIcon className="mt-[3px] h-3.5 w-3.5 shrink-0" />
        <span className="break-words">{l.t}</span>
      </div>
    )
  }
  return (
    <p className={`anim-fade-in whitespace-pre-wrap break-words ${plain[l.k]}`}>
      {l.k === 'in' && <span className="text-[#6e7681]">{'> '}</span>}
      {l.t}
    </p>
  )
}

function Dots({ label, tone, className = '' }: { label: string; tone: 'blue' | 'amber'; className?: string }) {
  return (
    <div className={`flex shrink-0 items-center gap-2 text-[12px] text-[#8b949e] ${className}`}>
      <span className="flex items-center gap-1">
        {[0, 1, 2].map(i => (
          <span key={i} className={`dot ${tone === 'amber' ? 'dot-amber' : ''}`} />
        ))}
      </span>
      <span>{label}</span>
    </div>
  )
}

export default function ConsoleView(props: Props) {
  const { t, lines, typedCount, typingText, running, waiting } = props
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const done = lines.slice(0, typedCount)
  const current = lines[typedCount]
  const hasError = lines.some(l => l.k === 'err')

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [typedCount, typingText, waiting, lines.length])

  useEffect(() => {
    if (waiting) inputRef.current?.focus()
  }, [waiting])

  const status = hasError
    ? { text: t.statusError, box: 'border-[#f85149]/40 bg-[#f85149]/10 text-[#ff7b72]', dot: 'bg-[#f85149]' }
    : waiting
    ? { text: t.statusWait, box: 'border-[#d29922]/40 bg-[#d29922]/10 text-[#e3b341]', dot: 'bg-[#d29922]' }
    : running
    ? { text: t.statusRunning, box: 'border-[#238636]/40 bg-[#238636]/10 text-[#3fb950]', dot: 'bg-[#3fb950]' }
    : { text: t.statusReady, box: 'border-[#30363d] bg-[#21262d] text-[#8b949e]', dot: 'bg-[#6e7681]' }

  const ghost =
    'grid h-7 w-7 place-items-center rounded-md border border-[#30363d] bg-[#0d1117] text-[#8b949e] transition-colors duration-200 hover:border-[#484f58] hover:bg-[#21262d] hover:text-[#e6edf3] active:scale-95'

  const empty = lines.length === 0

  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-[#21262d] bg-[#161b22]">
      <div className="flex items-center justify-between gap-2 border-b border-[#21262d] px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <TerminalIcon className="h-4 w-4 text-[#6e7681]" />
          <span className="truncate text-[13px] font-semibold text-[#8b949e]">{t.console}</span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors duration-300 ${status.box}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            {status.text}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={props.onCopy}
            disabled={empty}
            title={t.copy}
            className={`${ghost} disabled:pointer-events-none disabled:opacity-30`}
          >
            {props.copied ? <CheckIcon className="h-3.5 w-3.5 text-[#3fb950]" /> : <CopyIcon className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={props.onClear}
            disabled={empty}
            title={t.clear}
            className={`${ghost} disabled:pointer-events-none disabled:opacity-30`}
          >
            <TrashIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div
        onClick={props.onSkip}
        className="thin-scroll min-h-[14rem] flex-1 space-y-1.5 overflow-y-auto p-4 font-mono text-[13px] leading-relaxed lg:min-h-[58vh]"
      >
        {empty && !running && (
          <div className="flex h-full min-h-[12rem] flex-col items-center justify-center gap-3 text-center">
            <div className="grid h-11 w-11 place-items-center rounded-lg border border-[#21262d] bg-[#0d1117]">
              <TerminalIcon className="h-5 w-5 text-[#6e7681]" />
            </div>
            <p className="max-w-[30ch] text-[13px] text-[#6e7681]">{t.idle}</p>
            <kbd className="rounded-md border border-[#30363d] bg-[#21262d] px-2 py-1 text-[10px] font-medium text-[#8b949e]">
              {t.shortcut}
            </kbd>
          </div>
        )}

        {done.map((l, i) => (
          <LineRow key={i} l={l} />
        ))}

        {current && typingText !== null && <LineRow l={{ ...current, t: typingText }} />}

        {running && typingText === null && current === undefined && !waiting && (
          <div className={empty ? 'flex h-full min-h-[12rem] items-center justify-center' : ''}>
            <Dots label={t.writing} tone="blue" />
          </div>
        )}

        <div ref={endRef} />
      </div>

      <div
        className={`flex items-center gap-2 border-t px-3 py-3 transition-colors duration-200 ${
          waiting ? 'border-[#388bfd]/50 bg-[#388bfd]/[0.07]' : 'border-[#21262d] bg-[#0d1117]'
        }`}
      >
        <span className={`self-center pl-1 font-mono ${waiting ? 'text-[#58a6ff]' : 'text-[#6e7681]'}`}>&gt;</span>
        <input
          ref={inputRef}
          value={props.value}
          disabled={!waiting}
          onChange={e => props.onChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && props.onSubmit()}
          placeholder={waiting ? t.enterHint : t.inputPlaceholder}
          className="min-w-0 flex-1 bg-transparent font-mono text-[13px] text-[#e6edf3] outline-none transition placeholder:text-[#6e7681] disabled:cursor-not-allowed disabled:opacity-40"
        />
        <button
          onClick={props.onSubmit}
          disabled={!waiting}
          className="rounded-md bg-[#238636] px-3.5 py-1.5 text-xs font-semibold text-white transition-colors duration-200 hover:bg-[#2ea043] active:scale-95 disabled:bg-[#21262d] disabled:text-[#6e7681] disabled:active:scale-100"
        >
          {t.send}
        </button>
        {waiting && <Dots label={t.waitingInput} tone="amber" className="hidden sm:flex" />}
      </div>
    </div>
  )
}
