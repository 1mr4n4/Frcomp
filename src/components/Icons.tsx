type P = { className?: string }

const stroke = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

export const PlayIcon = ({ className = 'h-4 w-4' }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <path d="M8 5.5v13a1 1 0 0 0 1.53.85l10.2-6.5a1 1 0 0 0 0-1.7L9.53 4.65A1 1 0 0 0 8 5.5Z" fill="currentColor" />
  </svg>
)

export const StopIcon = ({ className = 'h-4 w-4' }: P) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden>
    <rect x="6.5" y="6.5" width="11" height="11" rx="2.2" fill="currentColor" />
  </svg>
)

export const SettingsIcon = ({ className = 'h-4 w-4' }: P) => (
  <svg {...stroke} className={className}>
    <path d="M20 7h-9" />
    <path d="M14 17H5" />
    <circle cx="17" cy="17" r="3" />
    <circle cx="7" cy="7" r="3" />
  </svg>
)

export const TrashIcon = ({ className = 'h-4 w-4' }: P) => (
  <svg {...stroke} className={className}>
    <path d="M3.5 6h17" />
    <path d="M8.5 6V4.8A1.3 1.3 0 0 1 9.8 3.5h4.4a1.3 1.3 0 0 1 1.3 1.3V6" />
    <path d="M18.5 6v13.2a1.8 1.8 0 0 1-1.8 1.8H7.3a1.8 1.8 0 0 1-1.8-1.8V6" />
    <path d="M10 10.5v6M14 10.5v6" />
  </svg>
)

export const CopyIcon = ({ className = 'h-4 w-4' }: P) => (
  <svg {...stroke} className={className}>
    <rect x="9" y="9" width="11.5" height="11.5" rx="2.2" />
    <path d="M5.5 15H5a2 2 0 0 1-2-2V5.5a2 2 0 0 1 2-2h7.5a2 2 0 0 1 2 2V6" />
  </svg>
)

export const CheckIcon = ({ className = 'h-4 w-4' }: P) => (
  <svg {...stroke} className={className}>
    <path d="M20 6.5 9.4 17.5 4 12.2" />
  </svg>
)

export const CodeIcon = ({ className = 'h-4 w-4' }: P) => (
  <svg {...stroke} className={className}>
    <path d="m17.5 15.5 4-4-4-4" />
    <path d="m6.5 8.5-4 4 4 4" />
    <path d="m14.2 4.5-4.4 15" />
  </svg>
)

export const TerminalIcon = ({ className = 'h-4 w-4' }: P) => (
  <svg {...stroke} className={className}>
    <rect x="2.5" y="4" width="19" height="16" rx="2.5" />
    <path d="m7 10 2.8 2.4L7 15" />
    <path d="M13 15.5h4" />
  </svg>
)

export const AlertIcon = ({ className = 'h-4 w-4' }: P) => (
  <svg {...stroke} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5.2" />
    <path d="M12 16.4h.01" />
  </svg>
)

export const ResetIcon = ({ className = 'h-4 w-4' }: P) => (
  <svg {...stroke} className={className}>
    <path d="M3.5 5.5v5h5" />
    <path d="M4.2 10.5a8 8 0 1 1-.2 4.6" />
  </svg>
)

export const KeyboardIcon = ({ className = 'h-4 w-4' }: P) => (
  <svg {...stroke} className={className}>
    <rect x="2.5" y="6" width="19" height="12" rx="2.5" />
    <path d="M6.5 10h.01M10 10h.01M13.5 10h.01M17 10h.01M8 14h8" />
  </svg>
)
