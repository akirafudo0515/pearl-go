import { getProduct, statusLabel, twd } from './catalog'

export function Money({ value, className = '' }) {
  return <span className={`money ${className}`.trim()}>{twd(value)}</span>
}

export function Status({ status }) {
  return <span className={`status s-${status}`}>{statusLabel[status]}</span>
}

export function Bottles({ ids }) {
  return (
    <span className="bottles">
      {ids.map((id) => {
        const product = getProduct(id)
        return (
          <i key={id} title={product.name} style={{ background: product.color, color: product.ink || '#fff' }}>
            {product.name.slice(0, 1)}
          </i>
        )
      })}
    </span>
  )
}

export function ModeTag({ mode, scheduleAt, formatWhen }) {
  if (mode === 'now') return <span className="tag now">立即</span>
  return <span className="tag later">預約 {formatWhen(scheduleAt)}</span>
}
