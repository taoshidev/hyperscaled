'use client'

export default function ShinyButton({
  children,
  onClick,
  className = '',
  type = 'button',
  disabled = false,
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`shiny-cta ${className}`}
    >
      <span>{children}</span>
    </button>
  )
}
