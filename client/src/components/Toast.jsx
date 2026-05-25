import React, { useEffect, useState } from 'react'

export default function Toast({ mensagem, tipo = 'success', onClose }) {
  const [saindo, setSaindo] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setSaindo(true)
      setTimeout(onClose, 300)
    }, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  const cores = {
    success: { bg: 'var(--success)', icon: '✓' },
    error:   { bg: 'var(--danger)',  icon: '✕' },
    info:    { bg: 'var(--accent)',  icon: 'ℹ' },
    warning: { bg: 'var(--warning)', icon: '⚠' }
  }
  const { bg, icon } = cores[tipo] || cores.success

  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000,
      display: 'flex', alignItems: 'center', gap: '12px',
      background: 'var(--surface)', border: `1px solid ${bg}`,
      borderLeft: `4px solid ${bg}`, borderRadius: '8px',
      padding: '14px 18px', minWidth: '280px', maxWidth: '400px',
      boxShadow: `0 4px 20px rgba(0,0,0,0.4)`,
      opacity: saindo ? 0 : 1,
      transform: saindo ? 'translateY(8px)' : 'translateY(0)',
      transition: 'opacity 0.3s ease, transform 0.3s ease'
    }}>
      <span style={{ color: bg, fontWeight: '700', fontSize: '16px' }}>{icon}</span>
      <span style={{ color: 'var(--text-primary)', fontSize: '14px', flex: 1 }}>{mensagem}</span>
      <button
        onClick={() => { setSaindo(true); setTimeout(onClose, 300) }}
        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px', padding: '0 4px' }}
      >×</button>
    </div>
  )
}

export function useToast() {
  const [toasts, setToasts] = useState([])

  const addToast = (mensagem, tipo = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, mensagem, tipo }])
  }

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  const ToastContainer = () => (
    <>
      {toasts.map((t, i) => (
        <div key={t.id} style={{ position: 'fixed', bottom: `${24 + i * 80}px`, right: '24px', zIndex: 1000 + i }}>
          <Toast mensagem={t.mensagem} tipo={t.tipo} onClose={() => removeToast(t.id)} />
        </div>
      ))}
    </>
  )

  return { addToast, ToastContainer }
}
