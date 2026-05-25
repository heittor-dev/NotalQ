import React, { useState, useEffect, useRef } from 'react'
import { VendaService } from '../services/api'

const FORMAS = { pix: 'PIX', credito: 'Crédito', debito: 'Débito', dinheiro: 'Dinheiro', boleto: 'Boleto', transferencia: 'Transferência' }
const FORMA_COR = { pix: '#10b981', credito: '#6366f1', debito: '#3b82f6', dinheiro: '#f59e0b', boleto: '#f97316', transferencia: '#8b5cf6' }

const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }

const Lbl = ({ children }) => (
  <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>
    {children}
  </label>
)

// ── Modal de Recibo ────────────────────────────────────────────────────────
function ModalRecibo({ venda, onFechar }) {
  const printRef = useRef()

  const imprimir = () => {
    const conteudo = printRef.current.innerHTML
    const janela = window.open('', '_blank', 'width=480,height=700')
    janela.document.write(`
      <html><head><title>Recibo ${venda.numero_venda}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; font-size: 13px; background: white; color: #000; }
        .recibo { max-width: 360px; margin: 0 auto; padding: 24px 20px; }
        .linha-separadora { border: none; border-top: 1px dashed #000; margin: 12px 0; }
        .linha-dupla { border: none; border-top: 2px solid #000; margin: 12px 0; }
        .centro { text-align: center; }
        .entre { display: flex; justify-content: space-between; }
        .negrito { font-weight: 700; }
        .grande { font-size: 16px; }
        .pequeno { font-size: 11px; }
        .item { margin-bottom: 10px; }
        .titulo { font-size: 20px; font-weight: 700; letter-spacing: 4px; }
      </style></head>
      <body>${printRef.current.innerHTML}</body></html>
    `)
    janela.document.close()
    janela.focus()
    setTimeout(() => { janela.print(); janela.close() }, 300)
  }

  const data = venda.data
    ? new Date(venda.data).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—'

  const subtotalBruto = venda.itens
    ? venda.itens.reduce((s, i) => s + Number(i.subtotal), 0)
    : Number(venda.valor_total)

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px'
    }} onClick={e => e.target === e.currentTarget && onFechar()}>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', width: '100%', maxWidth: '520px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header do modal */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Cupom não fiscal</div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>{venda.numero_venda}</h3>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={imprimir}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'var(--accent)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              🖨 Imprimir
            </button>
            <button onClick={onFechar} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '22px', lineHeight: 1, padding: '0 4px' }}>×</button>
          </div>
        </div>

        {/* Corpo — recibo imprimível */}
        <div style={{ overflowY: 'auto', padding: '24px', display: 'flex', justifyContent: 'center' }}>
          <div ref={printRef} className="recibo" style={{
            background: 'white', color: '#000',
            fontFamily: '"Courier New", monospace',
            width: '360px', padding: '28px 20px',
            borderRadius: '8px', fontSize: '13px', lineHeight: '1.6'
          }}>
            {/* Cabeçalho */}
            <div className="centro" style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '14px', marginBottom: '14px' }}>
              <div className="titulo" style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '4px' }}>PDV SYSTEM</div>
              <div className="pequeno" style={{ fontSize: '11px', marginTop: '4px' }}>CUPOM NÃO FISCAL</div>
            </div>

            {/* Dados da venda */}
            <div className="pequeno" style={{ fontSize: '11px', marginBottom: '12px' }}>
              <div>Data: {data}</div>
              <div>Venda: {venda.numero_venda}</div>
              <div>Pagamento: {FORMAS[venda.forma_pagamento] || venda.forma_pagamento}</div>
            </div>

            {/* Itens */}
            <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '12px 0', marginBottom: '12px' }}>
              {venda.itens && venda.itens.length > 0 ? venda.itens.map((item, i) => (
                <div key={i} className="item" style={{ marginBottom: '10px' }}>
                  <div className="negrito" style={{ fontWeight: '700' }}>{item.nome}</div>
                  <div className="entre" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{item.quantidade}x R$ {Number(item.preco_unitario).toFixed(2)}</span>
                    <span>R$ {Number(item.subtotal).toFixed(2)}</span>
                  </div>
                </div>
              )) : (
                <div style={{ fontSize: '12px', color: '#555' }}>Detalhes dos itens não disponíveis</div>
              )}
            </div>

            {/* Totais */}
            <div style={{ marginBottom: '4px' }}>
              {Number(venda.desconto) > 0 && (
                <>
                  <div className="entre" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Subtotal</span>
                    <span>R$ {subtotalBruto.toFixed(2)}</span>
                  </div>
                  <div className="entre" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Desconto</span>
                    <span>- R$ {Number(venda.desconto).toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>

            <div style={{ borderTop: '2px solid #000', paddingTop: '8px', marginBottom: '14px' }}>
              <div className="entre negrito grande" style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '16px' }}>
                <span>TOTAL</span>
                <span>R$ {Number(venda.valor_total).toFixed(2)}</span>
              </div>
            </div>

            {/* Rodapé */}
            <div className="centro pequeno" style={{ textAlign: 'center', borderTop: '1px dashed #000', paddingTop: '12px', fontSize: '11px' }}>
              <div>Obrigado pela preferência!</div>
              <div style={{ marginTop: '4px' }}>PDV System</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────────────
export default function Vendas({ addToast, filtrosIniciais = {} }) {
  const [vendas, setVendas] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandido, setExpandido] = useState(null)
  const [filtroForma, setFiltroForma] = useState(filtrosIniciais.forma || '')
  const [dataInicio, setDataInicio] = useState(filtrosIniciais.dataInicio || '')
  const [dataFim, setDataFim] = useState(filtrosIniciais.dataFim || '')
  const [reciboVenda, setReciboVenda] = useState(null)
  const [buscaNumero, setBuscaNumero] = useState('')
  const [buscando, setBuscando] = useState(false)

  useEffect(() => { carregar() }, [])

  const carregar = async () => {
    try {
      setLoading(true)
      const dados = await VendaService.buscarTodas()
      setVendas(dados)
    } finally {
      setLoading(false)
    }
  }

  const toggleExpandir = async (venda) => {
    if (expandido?.id === venda.id) { setExpandido(null); return }
    const res = await VendaService.obter(venda.id)
    setExpandido(res.dados || res)
  }

  const abrirRecibo = async (venda) => {
    try {
      const res = await VendaService.obter(venda.id)
      setReciboVenda(res.dados || res)
    } catch {
      addToast('Erro ao carregar recibo', 'error')
    }
  }

  const buscarPorNumero = async (e) => {
    e.preventDefault()
    if (!buscaNumero.trim()) return
    try {
      setBuscando(true)
      const todas = await VendaService.buscarTodas()
      const encontrada = todas.find(v =>
        (v.numero_venda || '').toLowerCase() === buscaNumero.trim().toLowerCase() ||
        String(v.id) === buscaNumero.trim()
      )
      if (!encontrada) { addToast('Venda não encontrada', 'error'); return }
      const res = await VendaService.obter(encontrada.id)
      setReciboVenda(res.dados || res)
    } catch {
      addToast('Erro ao buscar venda', 'error')
    } finally {
      setBuscando(false)
    }
  }

  const limparFiltros = () => { setDataInicio(''); setDataFim(''); setFiltroForma('') }
  const temFiltro = dataInicio || dataFim || filtroForma

  const vendasFiltradas = vendas.filter(v => {
    if (filtroForma && v.forma_pagamento !== filtroForma) return false
    const dataVenda = (v.data || '').split('T')[0].split(' ')[0]
    if (dataInicio && dataVenda < dataInicio) return false
    if (dataFim && dataVenda > dataFim) return false
    return true
  })

  const totalFaturado = vendasFiltradas.reduce((s, v) => s + Number(v.valor_total), 0)
  const ticketMedio = vendasFiltradas.length > 0 ? totalFaturado / vendasFiltradas.length : 0

  if (loading) return <div className="loading"><div className="spinner"></div>Carregando vendas...</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Modal de recibo */}
      {reciboVenda && <ModalRecibo venda={reciboVenda} onFechar={() => setReciboVenda(null)} />}

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
        {[
          { label: 'Vendas no período', sub: temFiltro ? 'filtrado' : 'total', valor: vendasFiltradas.length, cor: '#6366f1', rgb: '99,102,241', icon: '◈' },
          { label: 'Faturamento', sub: 'do período', valor: `R$ ${totalFaturado.toFixed(2)}`, cor: '#10b981', rgb: '16,185,129', icon: '+' },
          { label: 'Ticket Médio', sub: 'por venda', valor: `R$ ${ticketMedio.toFixed(2)}`, cor: '#6366f1', rgb: '99,102,241', icon: '~' },
        ].map(({ label, sub, valor, cor, rgb, icon }) => (
          <div key={label} style={{ background: `linear-gradient(135deg, rgba(${rgb},0.12) 0%, rgba(${rgb},0.04) 100%)`, border: `1px solid rgba(${rgb},0.3)`, borderRadius: '12px', padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>{label}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sub}</div>
              </div>
              <span style={{ fontSize: '16px', color: cor, fontWeight: '700', opacity: 0.85 }}>{icon}</span>
            </div>
            <div style={{ fontSize: '26px', fontWeight: '800', color: cor, lineHeight: 1 }}>{valor}</div>
          </div>
        ))}
      </div>

      {/* ── Busca de recibo ── */}
      <div style={card}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Recibo</div>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>Buscar e Imprimir Recibo</h3>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <form onSubmit={buscarPorNumero} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, maxWidth: '360px' }}>
              <Lbl>Número da venda ou ID</Lbl>
              <input
                className="input"
                placeholder="Ex: VND-0001"
                value={buscaNumero}
                onChange={e => setBuscaNumero(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={buscando || !buscaNumero.trim()}
              style={{ padding: '9px 20px' }}
            >
              {buscando ? 'Buscando…' : '🖨 Ver recibo'}
            </button>
          </form>
          <p style={{ margin: '10px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
            Ou clique em <strong style={{ color: 'var(--text-primary)' }}>Recibo</strong> em qualquer linha da tabela abaixo.
          </p>
        </div>
      </div>

      {/* ── Tabela de vendas ── */}
      <div style={card}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>Histórico de Vendas</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                {vendasFiltradas.length} venda{vendasFiltradas.length !== 1 ? 's' : ''}{temFiltro ? ' (filtrado)' : ''}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div>
                <Lbl>Data início</Lbl>
                <input type="date" className="input" style={{ width: '150px', padding: '7px 10px', fontSize: '13px' }} value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
              </div>
              <div>
                <Lbl>Data fim</Lbl>
                <input type="date" className="input" style={{ width: '150px', padding: '7px 10px', fontSize: '13px' }} value={dataFim} onChange={e => setDataFim(e.target.value)} />
              </div>
              <div>
                <Lbl>Pagamento</Lbl>
                <select className="input" style={{ width: '140px', padding: '7px 10px', fontSize: '13px' }} value={filtroForma} onChange={e => setFiltroForma(e.target.value)}>
                  <option value="">Todas</option>
                  {Object.entries(FORMAS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              {temFiltro && (
                <button className="btn btn-secondary" style={{ padding: '7px 14px', fontSize: '13px' }} onClick={limparFiltros}>
                  Limpar
                </button>
              )}
            </div>
          </div>
        </div>

        {vendasFiltradas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>
              {temFiltro ? 'Nenhuma venda encontrada para os filtros aplicados' : 'Nenhuma venda registrada ainda'}
            </p>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: 'var(--bg-secondary)' }}>
              <tr>
                {['Nº Venda', 'Data', 'Itens', 'Desconto', 'Total', 'Pagamento', ''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vendasFiltradas.map(v => {
                const cor = FORMA_COR[v.forma_pagamento] || '#71717a'
                return (
                  <React.Fragment key={v.id}>
                    <tr style={{ borderBottom: expandido?.id === v.id ? 'none' : '1px solid var(--border)', background: expandido?.id === v.id ? 'rgba(255,255,255,0.02)' : 'transparent', transition: 'background 120ms' }}
                      onMouseEnter={e => { if (expandido?.id !== v.id) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                      onMouseLeave={e => { if (expandido?.id !== v.id) e.currentTarget.style.background = 'transparent' }}
                    >
                      <td style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--accent)', fontFamily: 'monospace' }}>
                        {v.numero_venda || `#${v.id}`}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>
                        {new Date(v.data).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>
                        {v.quantidade_itens} it{v.quantidade_itens !== 1 ? 'ens' : 'em'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: v.desconto > 0 ? 'var(--warning)' : 'var(--text-muted)' }}>
                        {v.desconto > 0 ? `− R$ ${Number(v.desconto).toFixed(2)}` : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '700', color: 'var(--success)' }}>
                        R$ {Number(v.valor_total).toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: `${cor}18`, color: cor, border: `1px solid ${cor}40`, borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: '700' }}>
                          {FORMAS[v.forma_pagamento] || v.forma_pagamento}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '12px' }}
                            onClick={() => toggleExpandir(v)}
                          >
                            {expandido?.id === v.id ? 'Fechar' : 'Itens'}
                          </button>
                          <button
                            style={{ padding: '4px 10px', fontSize: '12px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '6px', color: 'var(--accent)', cursor: 'pointer', fontWeight: '600', fontFamily: 'inherit', transition: 'background 150ms' }}
                            onClick={() => abrirRecibo(v)}
                            title="Ver e imprimir recibo"
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.2)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.1)'}
                          >
                            🖨 Recibo
                          </button>
                        </div>
                      </td>
                    </tr>

                    {expandido?.id === v.id && expandido.itens && (
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <td colSpan={7} style={{ padding: '0', background: 'var(--bg-secondary)' }}>
                          <div style={{ padding: '16px 24px 20px' }}>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                              Itens da venda
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr>
                                  {['Produto', 'Qtd', 'Unitário', 'Subtotal'].map(h => (
                                    <th key={h} style={{ padding: '6px 12px', textAlign: h === 'Produto' ? 'left' : 'right', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {expandido.itens.map(i => (
                                  <tr key={i.id}>
                                    <td style={{ padding: '8px 12px', fontSize: '13px', fontWeight: '500' }}>{i.nome}</td>
                                    <td style={{ padding: '8px 12px', fontSize: '13px', textAlign: 'right', color: 'var(--text-muted)' }}>{i.quantidade}</td>
                                    <td style={{ padding: '8px 12px', fontSize: '12px', textAlign: 'right', color: 'var(--text-muted)', fontFamily: 'monospace' }}>R$ {Number(i.preco_unitario).toFixed(2)}</td>
                                    <td style={{ padding: '8px 12px', fontSize: '13px', textAlign: 'right', fontWeight: '700', color: 'var(--success)' }}>R$ {Number(i.subtotal).toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

    </div>
  )
}
