import React, { useState, useEffect, useCallback } from 'react'
import { RelatorioService } from '../services/api'

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const MESES_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const FORMAS_LABEL = { pix: 'PIX', credito: 'Crédito', debito: 'Débito', dinheiro: 'Dinheiro', boleto: 'Boleto', transferencia: 'Transfer.' }
const FORMA_COR = { pix: '#10b981', credito: '#6366f1', debito: '#3b82f6', dinheiro: '#f59e0b', boleto: '#f97316', transferencia: '#8b5cf6' }
const CHART_H = 130
const MEDAL = ['🥇','🥈','🥉']

const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }
const cardHeader = { padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }

const Lbl = ({ children }) => (
  <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>
    {children}
  </label>
)

const Spinner = () => (
  <div style={{ textAlign: 'center', padding: '48px 20px' }}>
    <div className="spinner" style={{ margin: '0 auto 12px' }} />
    <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>Carregando…</p>
  </div>
)

const Empty = ({ texto }) => (
  <div style={{ textAlign: 'center', padding: '48px 20px' }}>
    <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>{texto}</p>
  </div>
)

export default function Relatorios() {
  const hoje = new Date()
  const anoAtual = hoje.getFullYear()
  const mesAtual = hoje.getMonth() + 1
  const priDia  = `${anoAtual}-${String(mesAtual).padStart(2,'0')}-01`
  const ultDia  = hoje.toISOString().split('T')[0]

  const [dataInicio, setDataInicio] = useState(priDia)
  const [dataFim,    setDataFim]    = useState(ultDia)
  const [mes, setMes] = useState(mesAtual)
  const [ano, setAno] = useState(anoAtual)

  const [vendasPeriodo, setVendasPeriodo] = useState(null)
  const [produtosMV,    setProdutosMV]    = useState(null)
  const [fatDiario,     setFatDiario]     = useState(null)
  const [loading, setLoading] = useState({ vendas: false, produtos: false, fat: false })
  const [diaAtivo, setDiaAtivo] = useState(null)
  const [produtoAtivo, setProdutoAtivo] = useState(null)
  const [filtroFormaVendas, setFiltroFormaVendas] = useState('')

  const set = (k, v) => setLoading(l => ({ ...l, [k]: v }))

  const carregarVendas   = useCallback(async (ini, fim) => {
    set('vendas', true)
    try { setVendasPeriodo(await RelatorioService.vendasPorPeriodo(ini, fim)) } finally { set('vendas', false) }
  }, [])

  const carregarProdutos = useCallback(async () => {
    set('produtos', true)
    try { setProdutosMV(await RelatorioService.produtosMaisVendidos(10)) } finally { set('produtos', false) }
  }, [])

  const carregarFat = useCallback(async (m, a) => {
    set('fat', true)
    try { setFatDiario(await RelatorioService.faturamentoDiario(m, a)) } finally { set('fat', false) }
  }, [])

  // Auto-carregar tudo ao montar
  useEffect(() => {
    carregarVendas(priDia, ultDia)
    carregarProdutos()
    carregarFat(mesAtual, anoAtual)
  }, []) // eslint-disable-line

  const atualizarTudo = () => {
    carregarVendas(dataInicio, dataFim)
    carregarProdutos()
    carregarFat(mes, ano)
  }

  const maxFat  = fatDiario ? Math.max(...fatDiario.map(d => Number(d.faturamento)), 1) : 1
  const maxProd = produtosMV?.length > 0 ? Math.max(...produtosMV.map(p => p.total_vendido), 1) : 1

  // Breakdown por forma de pagamento
  const porForma = vendasPeriodo?.vendas?.reduce((acc, v) => {
    const f = v.forma_pagamento || 'outro'
    acc[f] = { valor: (acc[f]?.valor || 0) + Number(v.valor_total), qtd: (acc[f]?.qtd || 0) + 1 }
    return acc
  }, {}) || {}
  const totalForma = Object.values(porForma).reduce((s, f) => s + f.valor, 0)
  const formasSorted = Object.entries(porForma).sort((a, b) => b[1].valor - a[1].valor)

  const qualquerCarregando = Object.values(loading).some(Boolean)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── Cabeçalho com controles globais ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <Lbl>Período</Lbl>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <input type="date" className="input" style={{ width: '145px', padding: '7px 10px', fontSize: '13px' }} value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
              <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>até</span>
              <input type="date" className="input" style={{ width: '145px', padding: '7px 10px', fontSize: '13px' }} value={dataFim} onChange={e => setDataFim(e.target.value)} />
            </div>
          </div>
          <div>
            <Lbl>Mês / Ano</Lbl>
            <div style={{ display: 'flex', gap: '6px' }}>
              <select className="input" style={{ padding: '7px 10px', fontSize: '13px', width: '140px' }} value={mes} onChange={e => setMes(Number(e.target.value))}>
                {MESES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
              </select>
              <input type="number" className="input" style={{ width: '85px', padding: '7px 10px', fontSize: '13px' }} value={ano} onChange={e => setAno(Number(e.target.value))} />
            </div>
          </div>
        </div>
        <button className="btn btn-primary" style={{ padding: '9px 20px' }} onClick={atualizarTudo} disabled={qualquerCarregando}>
          {qualquerCarregando ? 'Atualizando…' : '↻ Atualizar tudo'}
        </button>
      </div>

      {/* ── Grid: Produtos + Faturamento Diário ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Produtos Mais Vendidos */}
        <div style={card}>
          <div style={cardHeader}>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Relatório 02</p>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>Produtos Mais Vendidos</h3>
            </div>
            <button className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: '12px' }} disabled={loading.produtos}
              onClick={carregarProdutos}>
              {loading.produtos ? '…' : '↻'}
            </button>
          </div>

          {loading.produtos ? <Spinner /> : !produtosMV ? <Empty texto="Clique em ↻ para carregar" /> :
            produtosMV.length === 0 ? <Empty texto="Nenhum produto vendido ainda" /> : (
            <div style={{ padding: '0 24px' }}>
              {produtosMV.map((p, i) => {
                const pct = Math.round((p.total_vendido / maxProd) * 100)
                const totalGeral = produtosMV.reduce((s, x) => s + Number(x.receita_total), 0)
                const pctReceita = totalGeral > 0 ? ((Number(p.receita_total) / totalGeral) * 100).toFixed(1) : 0
                const cor = i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7c33' : '#6366f1'
                const ativo = produtoAtivo === p.id
                return (
                  <div key={p.id}>
                    <div className={`row-click${ativo ? ' ativo' : ''}`}
                      onClick={() => setProdutoAtivo(ativo ? null : p.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 6px', margin: '0 -6px', borderBottom: (!ativo && i < produtosMV.length - 1) ? '1px solid var(--border)' : 'none', borderRadius: ativo ? '6px 6px 0 0' : undefined }}>
                      <span style={{ fontSize: i < 3 ? '16px' : '12px', fontWeight: '800', color: i < 3 ? cor : 'var(--text-muted)', width: '22px', textAlign: 'center', flexShrink: 0, lineHeight: 1 }}>
                        {i < 3 ? MEDAL[i] : i + 1}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '52%' }}>{p.nome}</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', flexShrink: 0, marginLeft: '8px' }}>
                            {p.total_vendido} un. · <strong style={{ color: 'var(--success)' }}>R$ {Number(p.receita_total).toFixed(0)}</strong>
                          </span>
                        </div>
                        <div style={{ height: '5px', background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div className="bar-click" style={{ width: `${pct}%`, height: '100%', background: cor, borderRadius: '3px', transition: 'width 500ms ease' }} />
                        </div>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', width: '30px', textAlign: 'right', flexShrink: 0 }}>{pct}%</span>
                    </div>
                    {ativo && (
                      <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)', borderTop: 'none', borderRadius: '0 0 6px 6px', padding: '10px 14px', marginBottom: '4px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                        <div><div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>Unidades</div><div style={{ fontSize: '16px', fontWeight: '800', color: cor }}>{p.total_vendido}</div></div>
                        <div><div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>Receita</div><div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--success)' }}>R$ {Number(p.receita_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div></div>
                        <div><div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>% do Total</div><div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--accent)' }}>{pctReceita}%</div></div>
                        <div><div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', marginBottom: '2px' }}>Ticket médio</div><div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>R$ {(Number(p.receita_total) / p.total_vendido).toFixed(2)}</div></div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Faturamento Diário */}
        <div style={card}>
          <div style={cardHeader}>
            <div>
              <p style={{ margin: '0 0 2px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Relatório 03</p>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>Faturamento Diário</h3>
              {fatDiario && <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>{MESES[mes - 1]} {ano}</p>}
            </div>
            <button className="btn btn-secondary" style={{ padding: '5px 12px', fontSize: '12px' }} disabled={loading.fat}
              onClick={() => carregarFat(mes, ano)}>
              {loading.fat ? '…' : '↻'}
            </button>
          </div>

          {loading.fat ? <Spinner /> : !fatDiario ? <Empty texto="Selecione mês/ano e atualize" /> :
            fatDiario.length === 0 ? <Empty texto={`Sem faturamento em ${MESES[mes - 1]}`} /> : (
            <div style={{ padding: '16px 24px' }}>
              {/* Total do mês */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Total do mês</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--success)', lineHeight: 1 }}>
                    R$ {fatDiario.reduce((acc, d) => acc + Number(d.faturamento), 0).toFixed(2)}
                  </div>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {fatDiario.filter(d => Number(d.faturamento) > 0).length} dias com vendas
                </span>
              </div>

              {/* Painel dia ativo */}
              {diaAtivo && (
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '8px', padding: '10px 14px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent)' }}>Dia {diaAtivo.dia.slice(8)}/{String(mes).padStart(2,'0')}/{ano}</span>
                  <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--success)' }}>R$ {Number(diaAtivo.faturamento).toFixed(2)}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{diaAtivo.qtd_vendas} venda{diaAtivo.qtd_vendas !== 1 ? 's' : ''}</span>
                  <button onClick={() => setDiaAtivo(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px', lineHeight: 1 }}>✕</button>
                </div>
              )}

              {/* Barras */}
              <div style={{ overflowX: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', minWidth: `${fatDiario.length * 28}px`, height: `${CHART_H + 22}px` }}>
                  {fatDiario.map(d => {
                    const fat = Number(d.faturamento)
                    const barH = fat > 0 ? Math.max((fat / maxFat) * CHART_H, 6) : 2
                    const dia = d.dia.slice(8)
                    const isMax = fat === maxFat && fat > 0
                    const ativo = diaAtivo?.dia === d.dia
                    return (
                      <div key={d.dia} style={{ flex: 1, minWidth: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                        onClick={() => fat > 0 && setDiaAtivo(ativo ? null : d)}>
                        <div style={{ width: '100%', height: `${CHART_H}px`, display: 'flex', alignItems: 'flex-end' }}>
                          <div className={fat > 0 ? 'bar-click' : ''} style={{
                            width: '100%', height: `${barH}px`,
                            background: ativo ? '#a78bfa' : fat === 0 ? 'var(--bg-secondary)' : isMax ? '#10b981' : 'var(--accent)',
                            borderRadius: fat > 0 ? '3px 3px 0 0' : '2px',
                            transition: 'height 400ms ease, background 200ms ease',
                            opacity: fat === 0 ? 0.3 : 1,
                            boxShadow: ativo ? '0 0 6px rgba(167,139,250,0.5)' : 'none'
                          }} title={`${dia}/${mes}: R$ ${fat.toFixed(2)}`} />
                        </div>
                        <span style={{ fontSize: '8px', color: ativo ? 'var(--accent)' : 'var(--text-muted)', marginTop: '4px', lineHeight: 1, fontWeight: ativo ? '700' : '400' }}>{dia}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Legenda */}
              <div style={{ display: 'flex', gap: '16px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--accent)', display: 'inline-block' }} /> Dia comum
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#10b981', display: 'inline-block' }} /> Melhor dia
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#a78bfa', display: 'inline-block' }} /> Selecionado
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Vendas por Período (largura total) ── */}
      <div style={card}>
        <div style={cardHeader}>
          <div>
            <p style={{ margin: '0 0 2px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Relatório 01</p>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>Vendas por Período</h3>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <div>
              <Lbl>De</Lbl>
              <input type="date" className="input" style={{ width: '145px', padding: '7px 10px', fontSize: '13px' }} value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
            </div>
            <div>
              <Lbl>Até</Lbl>
              <input type="date" className="input" style={{ width: '145px', padding: '7px 10px', fontSize: '13px' }} value={dataFim} onChange={e => setDataFim(e.target.value)} />
            </div>
            <button className="btn btn-primary" style={{ padding: '7px 16px', fontSize: '13px' }} disabled={loading.vendas}
              onClick={() => carregarVendas(dataInicio, dataFim)}>
              {loading.vendas ? 'Buscando…' : 'Buscar'}
            </button>
          </div>
        </div>

        {loading.vendas ? <Spinner /> : !vendasPeriodo ? <Empty texto="Selecione o período e clique em Buscar" /> : (
          <>
            {/* KPIs + Formas de pagamento */}
            <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(99,102,241,0.04) 100%)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '10px', padding: '16px 20px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Total de Vendas</div>
                <div style={{ fontSize: '28px', fontWeight: '800', color: '#6366f1', lineHeight: 1 }}>{vendasPeriodo.totais.total_vendas}</div>
              </div>
              <div style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(16,185,129,0.04) 100%)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', padding: '16px 20px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Faturamento</div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#10b981', lineHeight: 1 }}>R$ {Number(vendasPeriodo.totais.faturamento).toFixed(2)}</div>
              </div>

              {/* Breakdown por forma de pagamento */}
              <div style={{ background: 'var(--bg-secondary)', borderRadius: '10px', padding: '16px 20px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Formas de Pagamento</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {formasSorted.map(([forma, dados]) => {
                    const pct = totalForma > 0 ? Math.round((dados.valor / totalForma) * 100) : 0
                    const cor = FORMA_COR[forma] || '#71717a'
                    const ativo = filtroFormaVendas === forma
                    return (
                      <div key={forma} className="row-click" style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '4px', padding: '2px 4px', margin: '0 -4px', background: ativo ? `${cor}18` : 'transparent' }}
                        onClick={() => setFiltroFormaVendas(ativo ? '' : forma)}
                        title={ativo ? 'Clique para limpar filtro' : `Filtrar por ${FORMAS_LABEL[forma] || forma}`}>
                        <span style={{ fontSize: '10px', fontWeight: '700', color: cor, width: '56px', flexShrink: 0 }}>{FORMAS_LABEL[forma] || forma}</span>
                        <div style={{ flex: 1, height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div className="bar-click" style={{ width: `${pct}%`, height: '100%', background: cor, borderRadius: '2px', transition: 'width 400ms' }} />
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', width: '28px', textAlign: 'right' }}>{pct}%</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Tabela de vendas */}
            {filtroFormaVendas && (
              <div style={{ padding: '8px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Filtrando por:</span>
                <button onClick={() => setFiltroFormaVendas('')} style={{ background: `${FORMA_COR[filtroFormaVendas] || '#71717a'}18`, border: `1px solid ${FORMA_COR[filtroFormaVendas] || '#71717a'}44`, color: FORMA_COR[filtroFormaVendas] || '#71717a', borderRadius: '6px', padding: '3px 10px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}>
                  {FORMAS_LABEL[filtroFormaVendas] || filtroFormaVendas} ✕
                </button>
              </div>
            )}
            {vendasPeriodo.vendas.filter(v => !filtroFormaVendas || v.forma_pagamento === filtroFormaVendas).length === 0 ? (
              <Empty texto="Nenhuma venda para este filtro" />
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'var(--bg-secondary)' }}>
                  <tr>
                    {['Nº Venda', 'Data', 'Itens', 'Desconto', 'Total', 'Pagamento'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--border)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vendasPeriodo.vendas.filter(v => !filtroFormaVendas || v.forma_pagamento === filtroFormaVendas).map(v => {
                    const cor = FORMA_COR[v.forma_pagamento] || '#71717a'
                    return (
                      <tr key={v.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 120ms' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '700', color: 'var(--accent)', fontFamily: 'monospace' }}>{v.numero_venda}</td>
                        <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(v.data).toLocaleDateString('pt-BR')}</td>
                        <td style={{ padding: '12px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>{v.qtd_itens}</td>
                        <td style={{ padding: '12px 16px', fontSize: '12px', color: Number(v.desconto) > 0 ? 'var(--danger)' : 'var(--text-muted)' }}>
                          {Number(v.desconto) > 0 ? `- R$ ${Number(v.desconto).toFixed(2)}` : '—'}
                        </td>
                        <td style={{ padding: '12px 16px', fontSize: '14px', fontWeight: '700', color: 'var(--success)' }}>R$ {Number(v.valor_total).toFixed(2)}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ background: `${cor}18`, color: cor, border: `1px solid ${cor}40`, borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: '700' }}>
                            {FORMAS_LABEL[v.forma_pagamento] || v.forma_pagamento}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>


    </div>
  )
}
