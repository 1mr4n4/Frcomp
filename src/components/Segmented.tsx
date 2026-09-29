export default function Segmented<T extends string>(props: {
  value: T
  options: T[]
  onChange: (v: T) => void
  disabled?: boolean
}) {
  return (
    <div
      className={`inline-flex gap-1 rounded-lg border border-[#30363d] bg-[#0d1117] p-1 ${
        props.disabled ? 'pointer-events-none opacity-40' : ''
      }`}
    >
      {props.options.map(o => (
        <button
          key={o}
          onClick={() => props.onChange(o)}
          className={`rounded-md px-3 py-1 text-[13px] font-medium transition-colors duration-200 ${
            props.value === o
              ? 'bg-[#388bfd] text-white'
              : 'text-[#8b949e] hover:bg-[#21262d] hover:text-[#e6edf3]'
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  )
}
