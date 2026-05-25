export default function KpiCard({ label, sub, valor, cor, bg, borda, rgb, icon, onClick, ativo }) {
  const bgStyle = bg
    ? bg
    : rgb
      ? `linear-gradient(135deg, rgba(${rgb},0.12) 0%, rgba(${rgb},0.04) 100%)`
      : `linear-gradient(135deg, ${cor}1a 0%, ${cor}08 100%)`
  const borderStyle = borda
    ? `1px solid ${borda}`
    : rgb
      ? `1px solid rgba(${rgb},${ativo ? '0.6' : '0.25'})`
      : `1px solid ${cor}30`
  return (
    <div
      onClick={onClick}
      style={{
        background: bgStyle,
        border: borderStyle,
        borderRadius: '12px',
        padding: '20px 24px',
        cursor: onClick ? 'pointer' : 'default',
        transition: onClick ? 'border-color 150ms, transform 150ms' : undefined,
        transform: ativo ? 'translateY(-1px)' : undefined,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {label}
          </div>
          {sub && <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{sub}</div>}
        </div>
        {icon && <span style={{ fontSize: '16px', color: cor, opacity: 0.8, fontWeight: '700' }}>{icon}</span>}
      </div>
      <div style={{ fontSize: '24px', fontWeight: '800', color: cor, lineHeight: 1 }}>
        {valor}
      </div>
    </div>
  )
}
