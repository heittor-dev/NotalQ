import React, { useState, useEffect } from 'react'
import { PagamentoService } from '../services/api'

const FORMAS = [
  { id: 'pix',      label: 'PIX',           sub: 'Instantâneo',   cor: '#00bb77' },
  { id: 'credito',  label: 'Crédito',        sub: 'Parcelado',     cor: '#6366f1' },
  { id: 'debito',   label: 'Débito',         sub: 'Saldo em conta',cor: '#a78bfa' },
  { id: 'dinheiro', label: 'Dinheiro',       sub: 'Espécie',       cor: '#f59e0b' },
]

const Lbl = ({ children }) => (
  <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
    {children}
  </label>
)

// ── Ícones SVG de pagamento ────────────────────────────────────────────────────
const PAY_ICONS = {
  pix: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  credito: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2"/>
      <line x1="1" y1="10" x2="23" y2="10"/>
      <line x1="5" y1="15" x2="8" y2="15"/>
    </svg>
  ),
  debito: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2"/>
      <line x1="1" y1="10" x2="23" y2="10"/>
      <circle cx="17" cy="15" r="2"/>
    </svg>
  ),
  dinheiro: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2"/>
      <circle cx="12" cy="12" r="3"/>
      <line x1="4" y1="10" x2="4" y2="14"/>
      <line x1="20" y1="10" x2="20" y2="14"/>
    </svg>
  ),
}

function PayIcon({ name, size = 22 }) {
  const icon = PAY_ICONS[name]
  if (!icon) return null
  return (
    <span style={{ width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {React.cloneElement(icon, { width: size, height: size })}
    </span>
  )
}

// ── QR Code fake determinístico ────────────────────────────────────────────────
function FakeQR({ seed = 1, size = 160 }) {
  const N = 21
  const cell = size / N

  const prng = (r, c) => {
    let h = ((seed * 1664525 + r * 40503 + c * 22695477) >>> 0)
    h ^= h >>> 16
    h = (Math.imul(h, 0x45d9f3b)) >>> 0
    h ^= h >>> 16
    return h & 1
  }

  const finderDark = (lr, lc) =>
    (lr === 0 || lr === 6 || lc === 0 || lc === 6) ||
    (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4)

  const cells = []
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const inTL = r <= 6 && c <= 6
      const inTR = r <= 6 && c >= N - 7
      const inBL = r >= N - 7 && c <= 6
      let dark = false
      if (inTL) dark = finderDark(r, c)
      else if (inTR) dark = finderDark(r, c - (N - 7))
      else if (inBL) dark = finderDark(r - (N - 7), c)
      else if ((r === 7 && c <= 8) || (c === 7 && r <= 8)) dark = false
      else if ((r === N - 8 && c <= 6) || (c === 7 && r >= N - 7)) dark = false
      else if (r === 6 || c === 6) dark = (r + c) % 2 === 0
      else dark = !!prng(r, c)
      cells.push({ r, c, dark })
    }
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      <rect width={size} height={size} fill="white" />
      {cells.filter(x => x.dark).map(({ r, c }) => (
        <rect key={`${r}-${c}`} x={c * cell + 0.4} y={r * cell + 0.4}
          width={cell - 0.8} height={cell - 0.8} fill="#111" rx={cell * 0.18} />
      ))}
    </svg>
  )
}

// ── Card visual ────────────────────────────────────────────────────────────────
function CardVisual({ numero, nome, validade }) {
  const raw = numero.replace(/\D/g, '').padEnd(16, '•')
  const groups = [raw.slice(0,4), raw.slice(4,8), raw.slice(8,12), raw.slice(12,16)]
  return (
    <div style={{
      width: '100%', maxWidth: '280px', aspectRatio: '1.586',
      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 55%, #1e40af 100%)',
      borderRadius: '14px', padding: '16px 20px', color: '#fff',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      boxShadow: '0 20px 48px rgba(0,0,0,0.55)', position: 'relative', overflow: 'hidden',
      fontFamily: "'Courier New', monospace", userSelect: 'none',
    }}>
      <div style={{ position: 'absolute', top: -36, right: -36, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
      <div style={{ position: 'absolute', bottom: -20, left: 30, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
        <span style={{ fontSize: '13px', fontWeight: '800', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.85)' }}>PDV BANK</span>
        <div style={{ display: 'flex' }}>
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#eb001b', opacity: 0.9 }} />
          <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#f79e1b', opacity: 0.9, marginLeft: -10 }} />
        </div>
      </div>

      <div style={{ width: 36, height: 28, background: 'linear-gradient(135deg, #b8860b 0%, #ffd700 50%, #b8860b 100%)', borderRadius: '5px', boxShadow: '0 2px 6px rgba(0,0,0,0.4)', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '35%', left: '30%', right: '30%', height: '1px', background: 'rgba(0,0,0,0.3)' }} />
        <div style={{ position: 'absolute', top: '60%', left: '30%', right: '30%', height: '1px', background: 'rgba(0,0,0,0.3)' }} />
        <div style={{ position: 'absolute', top: '10%', bottom: '10%', left: '50%', width: '1px', background: 'rgba(0,0,0,0.3)' }} />
      </div>

      <div style={{ fontSize: '15px', letterSpacing: '2.5px', color: 'rgba(255,255,255,0.92)', position: 'relative' }}>
        {groups.join(' ')}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative' }}>
        <div>
          <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Titular</div>
          <div style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'rgba(255,255,255,0.85)', maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {nome || '•••••  •••••'}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Validade</div>
          <div style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.85)' }}>{validade || '••/••'}</div>
        </div>
      </div>
    </div>
  )
}

// ── Painel PIX ─────────────────────────────────────────────────────────────────
function PainelPix({ totalFinal, onConfirmar }) {
  const [pago, setPago] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [segundos, setSegundos] = useState(300)
  const chave = 'pdv@empresa.com.br'

  useEffect(() => {
    if (pago || segundos === 0) return
    const t = setInterval(() => setSegundos(s => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [pago, segundos])

  const copiar = () => {
    navigator.clipboard?.writeText(chave).catch(() => {})
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  const mm = String(Math.floor(segundos / 60)).padStart(2, '0')
  const ss = String(segundos % 60).padStart(2, '0')
  const expirado = segundos === 0
  const timerCor = segundos < 60 ? '#ef4444' : 'var(--text-muted)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' }}>
      {/* QR */}
      <div style={{ padding: '14px', background: 'white', borderRadius: '14px', boxShadow: '0 8px 32px rgba(0,0,0,0.25)', opacity: expirado ? 0.4 : 1, transition: 'opacity 400ms' }}>
        <FakeQR seed={Math.max(1, Math.round(totalFinal * 100))} size={160} />
      </div>

      {/* Chave */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,187,119,0.08)', border: '1px solid rgba(0,187,119,0.25)', borderRadius: '8px', padding: '8px 16px' }}>
        <span style={{ fontSize: '13px', fontWeight: '600', color: '#00bb77' }}>{chave}</span>
        <button onClick={copiar} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', color: copiado ? '#00bb77' : 'var(--text-muted)', transition: 'color 200ms', fontFamily: 'inherit', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {copiado ? '✓ Copiado' : 'Copiar'}
        </button>
      </div>

      {/* Valor + timer */}
      <div style={{ display: 'flex', gap: '24px', fontSize: '13px', color: 'var(--text-muted)' }}>
        <span>Valor: <strong style={{ color: 'var(--text-primary)', fontSize: '15px' }}>R$ {totalFinal.toFixed(2)}</strong></span>
        <span style={{ color: timerCor, fontWeight: expirado ? '700' : '400' }}>
          {expirado ? '⚠ QR expirado' : <>Expira em <strong style={{ fontFamily: 'monospace' }}>{mm}:{ss}</strong></>}
        </span>
      </div>

      {/* Botão pago */}
      <button
        onClick={() => { if (!pago && !expirado) { setPago(true); onConfirmar() } }}
        disabled={pago || expirado}
        style={{
          width: '100%', maxWidth: '280px', padding: '13px',
          background: pago ? '#00bb77' : expirado ? 'var(--bg-secondary)' : 'rgba(0,187,119,0.12)',
          border: `2px solid ${expirado ? 'var(--border)' : '#00bb77'}`,
          color: pago ? '#fff' : expirado ? 'var(--text-muted)' : '#00bb77',
          borderRadius: '10px', fontSize: '15px', fontWeight: '700',
          cursor: pago || expirado ? 'default' : 'pointer',
          transition: 'all 200ms', fontFamily: 'inherit',
        }}
      >
        {pago ? '✓ Processando...' : expirado ? 'QR Expirado' : '✓ Já paguei'}
      </button>

      <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center' }}>
        Escaneie o QR ou copie a chave no seu banco
      </p>
    </div>
  )
}

// ── Painel Cartão ──────────────────────────────────────────────────────────────
const maskNum = v => v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1 ').trim()
const maskVal = v => { const d = v.replace(/\D/g,'').slice(0,4); return d.length > 2 ? `${d.slice(0,2)}/${d.slice(2)}` : d }

function PainelCartao({ tipo, totalFinal }) {
  const [card, setCard] = useState({ numero: '', nome: '', validade: '', cvv: '' })
  const [parcelas, setParcelas] = useState('1')
  const upd = (k, v) => setCard(c => ({ ...c, [k]: v }))

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '5fr 6fr', gap: '28px', alignItems: 'start' }}>
      {/* Visual */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', paddingTop: '4px' }}>
        <div style={{ width: '100%' }}>
          <CardVisual numero={card.numero} nome={card.nome} validade={card.validade} />
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
          Dados fictícios · apenas simulação
        </span>
      </div>

      {/* Form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <Lbl>Número do cartão</Lbl>
          <input className="input" placeholder="0000 0000 0000 0000" maxLength={19} value={card.numero}
            onChange={e => upd('numero', maskNum(e.target.value))}
            style={{ fontSize: '14px', letterSpacing: '1.5px', fontFamily: 'monospace' }} />
        </div>
        <div>
          <Lbl>Nome no cartão</Lbl>
          <input className="input" placeholder="NOME SOBRENOME" value={card.nome}
            onChange={e => upd('nome', e.target.value.toUpperCase())} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <Lbl>Validade</Lbl>
            <input className="input" placeholder="MM/AA" maxLength={5} value={card.validade}
              onChange={e => upd('validade', maskVal(e.target.value))}
              style={{ fontFamily: 'monospace' }} />
          </div>
          <div>
            <Lbl>CVV</Lbl>
            <input className="input" placeholder="•••" maxLength={4} type="password" value={card.cvv}
              onChange={e => upd('cvv', e.target.value.replace(/\D/g,'').slice(0,4))}
              style={{ fontFamily: 'monospace' }} />
          </div>
        </div>
        {tipo === 'credito' && (
          <div>
            <Lbl>Parcelas</Lbl>
            <select className="input" value={parcelas} onChange={e => setParcelas(e.target.value)}>
              {[1,2,3,6,12].map(n => (
                <option key={n} value={n}>
                  {n}× de R$ {(totalFinal / n).toFixed(2)}{n === 1 ? ' (à vista)' : n <= 3 ? ' (sem juros)' : ' (+juros sim.)'}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Painel Dinheiro ────────────────────────────────────────────────────────────
function PainelDinheiro({ totalFinal, onRecebidoChange }) {
  const [recebido, setRecebido] = useState('')
  const valor = parseFloat(recebido) || 0
  const troco = Math.max(0, valor - totalFinal)
  const falta = Math.max(0, totalFinal - valor)
  const ok = valor >= totalFinal && valor > 0

  const sugestoes = [10, 20, 50, 100, 200].filter(v => v >= totalFinal).slice(0, 4)
  if (sugestoes.length === 0) sugestoes.push(Math.ceil(totalFinal / 10) * 10)

  const set = v => { setRecebido(v); onRecebidoChange(parseFloat(v) || 0) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Notas rápidas */}
      <div>
        <Lbl>Notas rápidas</Lbl>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {sugestoes.map(v => {
            const sel = recebido === String(v)
            return (
              <button key={v} onClick={() => set(String(v))} style={{
                padding: '9px 20px', borderRadius: '8px',
                border: `1px solid ${sel ? '#f59e0b' : 'var(--border)'}`,
                background: sel ? 'rgba(245,158,11,0.12)' : 'var(--bg-secondary)',
                color: sel ? '#f59e0b' : 'var(--text-primary)',
                cursor: 'pointer', fontWeight: '700', fontSize: '14px', fontFamily: 'inherit', transition: 'all 150ms',
              }}>R$ {v}</button>
            )
          })}
        </div>
      </div>

      {/* Input */}
      <div>
        <Lbl>Valor recebido</Lbl>
        <div style={{ position: 'relative', maxWidth: '200px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '15px', fontWeight: '700', color: 'var(--text-muted)', pointerEvents: 'none' }}>R$</span>
          <input className="input" type="number" min="0" step="0.01" placeholder="0,00" value={recebido}
            onChange={e => set(e.target.value)}
            style={{ paddingLeft: '40px', fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px' }} />
        </div>
      </div>

      {/* Resultado */}
      {valor > 0 && (
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1, padding: '14px 18px', background: ok ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${ok ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`, borderRadius: '10px' }}>
            <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
              {ok ? 'Troco' : 'Falta'}
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: ok ? 'var(--success)' : '#ef4444' }}>
              R$ {ok ? troco.toFixed(2) : falta.toFixed(2)}
            </div>
          </div>
          <div style={{ flex: 1, padding: '14px 18px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '10px' }}>
            <div style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Total</div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>R$ {totalFinal.toFixed(2)}</div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Principal ──────────────────────────────────────────────────────────────────
export default function Pagamento({ dadosVenda, onPagamentoAprovado, onCancelar }) {
  const [formaSelecionada, setFormaSelecionada] = useState('')
  const [estado, setEstado] = useState('idle')
  const [mensagemErro, setMensagemErro] = useState('')
  const [recebidoDinheiro, setRecebidoDinheiro] = useState(0)

  if (!dadosVenda) {
    return (
      <div className="alert alert-error">
        <span>⚠</span><span>Nenhum dado de venda encontrado. Volte ao PDV.</span>
      </div>
    )
  }

  const { carrinho, desconto } = dadosVenda
  const totalBruto = carrinho.reduce((s, i) => s + i.subtotal, 0)
  const totalFinal = Math.max(0, totalBruto - (desconto || 0))

  const processar = async () => {
    setMensagemErro('')
    setEstado('processando')
    try {
      const resultado = await PagamentoService.processar({
        itens: carrinho.map(i => ({ produto_id: i.produto_id, quantidade: i.quantidade })),
        desconto: desconto || 0,
        forma_pagamento: formaSelecionada,
      })
      if (resultado.aprovado) {
        setEstado('aprovado')
        setTimeout(() => onPagamentoAprovado(resultado.cupom_data), 1200)
      } else {
        setEstado('erro')
        setMensagemErro('Pagamento recusado. Tente novamente.')
      }
    } catch {
      setEstado('erro')
      setMensagemErro('Erro ao processar pagamento. Verifique o estoque.')
    }
  }

  const confirmar = () => {
    if (!formaSelecionada) { setMensagemErro('Selecione uma forma de pagamento'); return }
    if (formaSelecionada === 'dinheiro' && recebidoDinheiro < totalFinal) {
      setMensagemErro('Valor recebido insuficiente'); return
    }
    processar()
  }

  if (estado === 'processando') {
    const forma = FORMAS.find(f => f.id === formaSelecionada)
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '24px' }}>
        <div className="spinner" style={{ width: '60px', height: '60px', borderWidth: '4px' }} />
        <p style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: '600', margin: 0 }}>Processando pagamento...</p>
        <p style={{ color: forma?.cor || 'var(--accent)', fontSize: '14px', margin: 0, fontWeight: '600' }}>{forma?.label}</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>Aguarde a autorização</p>
      </div>
    )
  }

  if (estado === 'aprovado') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', animation: 'pulse 0.5s ease' }}>✓</div>
        <p style={{ color: 'var(--success)', fontSize: '22px', fontWeight: '700', margin: 0 }}>Pagamento Aprovado!</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>Gerando cupom...</p>
      </div>
    )
  }

  const formaAtiva = FORMAS.find(f => f.id === formaSelecionada)
  const isPix = formaSelecionada === 'pix'

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Resumo */}
      <div className="form-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '15px', fontWeight: '700' }}>Resumo da Compra</h3>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{carrinho.reduce((s, i) => s + i.quantidade, 0)} item{carrinho.reduce((s, i) => s + i.quantidade, 0) !== 1 ? 's' : ''}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
          {carrinho.map(item => (
            <div key={item.produto_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: 28, height: 28, borderRadius: '6px', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', flexShrink: 0 }}>
                  {item.quantidade}×
                </div>
                <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{item.nome}</span>
              </div>
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>R$ {item.subtotal.toFixed(2)}</span>
            </div>
          ))}
          {desconto > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(245,158,11,0.06)', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.2)' }}>
              <span style={{ fontSize: '13px', color: 'var(--warning)', fontWeight: '600' }}>Desconto aplicado</span>
              <span style={{ fontSize: '13px', color: 'var(--warning)', fontWeight: '700' }}>− R$ {Number(desconto).toFixed(2)}</span>
            </div>
          )}
        </div>
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total a pagar</div>
            {desconto > 0 && <div style={{ fontSize: '11px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>R$ {totalBruto.toFixed(2)}</div>}
          </div>
          <span style={{ color: 'var(--success)', fontWeight: '800', fontSize: '28px', letterSpacing: '-1px' }}>R$ {totalFinal.toFixed(2)}</span>
        </div>
      </div>

      {/* Formas de pagamento */}
      <div className="form-container">
        <h3 style={{ marginBottom: '16px', color: 'var(--text-primary)', fontSize: '15px', fontWeight: '700' }}>Forma de Pagamento</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {FORMAS.map(forma => {
            const ativo = formaSelecionada === forma.id
            return (
              <button key={forma.id}
                onClick={() => { setFormaSelecionada(forma.id); setMensagemErro('') }}
                style={{
                  padding: '16px 18px', borderRadius: '12px', cursor: 'pointer', fontFamily: 'inherit',
                  background: ativo ? `${forma.cor}14` : 'var(--bg-secondary)',
                  border: `2px solid ${ativo ? forma.cor : 'var(--border)'}`,
                  color: ativo ? forma.cor : 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', gap: '14px',
                  transition: 'all 150ms', textAlign: 'left',
                }}
                onMouseEnter={e => { if (!ativo) { e.currentTarget.style.borderColor = forma.cor + '60'; e.currentTarget.style.color = forma.cor + 'cc' } }}
                onMouseLeave={e => { if (!ativo) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' } }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: '10px', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: ativo ? `${forma.cor}22` : 'var(--surface)',
                  border: `1px solid ${ativo ? forma.cor + '44' : 'var(--border)'}`,
                  transition: 'all 150ms',
                }}>
                  <PayIcon name={forma.id} size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '700', lineHeight: 1.2 }}>{forma.label}</div>
                  <div style={{ fontSize: '11px', fontWeight: '500', opacity: 0.7, marginTop: '2px' }}>{forma.sub}</div>
                </div>
                {ativo && (
                  <div style={{ marginLeft: 'auto', width: 18, height: 18, borderRadius: '50%', background: forma.cor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <polyline points="2,5 4,7.5 8,3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Painel contextual */}
      {formaSelecionada && (
        <div className="form-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{ width: 36, height: 36, borderRadius: '9px', background: `${formaAtiva?.cor}18`, border: `1px solid ${formaAtiva?.cor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: formaAtiva?.cor, flexShrink: 0 }}>
              <PayIcon name={formaSelecionada} size={18} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: formaAtiva?.cor, lineHeight: 1.2 }}>
                {isPix ? 'Pague com PIX'
                  : formaSelecionada === 'credito' ? 'Cartão de Crédito'
                  : formaSelecionada === 'debito'  ? 'Cartão de Débito'
                  : 'Pagamento em Dinheiro'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>{formaAtiva?.sub}</div>
            </div>
          </div>

          {isPix && <PainelPix totalFinal={totalFinal} onConfirmar={processar} />}

          {(formaSelecionada === 'credito' || formaSelecionada === 'debito') && (
            <PainelCartao tipo={formaSelecionada} totalFinal={totalFinal} />
          )}

          {formaSelecionada === 'dinheiro' && (
            <PainelDinheiro totalFinal={totalFinal} onRecebidoChange={setRecebidoDinheiro} />
          )}
        </div>
      )}

      {/* Erro */}
      {mensagemErro && (
        <div className="alert alert-error"><span>⚠</span><span>{mensagemErro}</span></div>
      )}

      {/* Ações */}
      {!isPix && (
        <div className="btn-group">
          <button className="btn btn-success" onClick={confirmar}
            style={{ flex: 1, padding: '14px', fontSize: '15px', fontWeight: '700', justifyContent: 'center' }}>
            Confirmar Pagamento
          </button>
          <button className="btn btn-secondary" onClick={onCancelar}>Voltar</button>
        </div>
      )}

      {isPix && (
        <button className="btn btn-secondary" onClick={onCancelar} style={{ alignSelf: 'flex-start' }}>
          ← Voltar ao carrinho
        </button>
      )}
    </div>
  )
}
