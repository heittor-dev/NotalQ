import React, { useEffect, useState } from 'react'
import { ProdutoService, VendaService } from '../services/api'

const FORMAS_LABEL = { pix: 'PIX', credito: 'Crédito', debito: 'Débito', dinheiro: 'Dinheiro' }

export default function SimuladorVendas({ onIrParaPagamento, addToast }) {
  const [produtos, setProdutos] = useState([])
  const [carrinho, setCarrinho] = useState([])
  const [desconto, setDesconto] = useState(0)
  const [vendas, setVendas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [adicionando, setAdicionando] = useState(null)

  useEffect(() => { buscarProdutos(); buscarVendas() }, [])

  const buscarProdutos = async () => {
    try {
      const dados = await ProdutoService.buscarTodos()
      setProdutos(dados || [])
    } catch { addToast('Erro ao carregar produtos', 'error') }
    finally { setCarregando(false) }
  }

  const buscarVendas = async () => {
    try {
      const dados = await VendaService.buscarTodas()
      setVendas(dados || [])
    } catch {}
  }

  const adicionarProduto = (produto) => {
    if (produto.estoque === 0) return
    const itemExistente = carrinho.find(i => i.produto_id === produto.id)
    const novaQtd = (itemExistente?.quantidade || 0) + 1
    if (novaQtd > produto.estoque) {
      addToast(`Estoque máximo: ${produto.estoque} un.`, 'error')
      return
    }
    setAdicionando(produto.id)
    setTimeout(() => setAdicionando(null), 400)
    setCarrinho(prev => itemExistente
      ? prev.map(i => i.produto_id === produto.id
          ? { ...i, quantidade: novaQtd, subtotal: novaQtd * produto.preco }
          : i)
      : [...prev, { produto_id: produto.id, nome: produto.nome, quantidade: 1, preco_unitario: produto.preco, subtotal: produto.preco, estoque_max: produto.estoque }]
    )
  }

  const alterarQtd = (produto_id, delta) => {
    setCarrinho(prev => prev.map(i => {
      if (i.produto_id !== produto_id) return i
      const novaQtd = i.quantidade + delta
      if (novaQtd < 1) return null
      if (novaQtd > i.estoque_max) { addToast(`Estoque máximo: ${i.estoque_max} un.`, 'error'); return i }
      return { ...i, quantidade: novaQtd, subtotal: novaQtd * i.preco_unitario }
    }).filter(Boolean))
  }

  const setQtdDireta = (produto_id, valor, estoque_max) => {
    const n = parseInt(valor)
    if (isNaN(n) || n < 1) return
    const qtdFinal = Math.min(n, estoque_max)
    if (n > estoque_max) addToast(`Estoque máximo: ${estoque_max} un.`, 'error')
    setCarrinho(prev => prev.map(i =>
      i.produto_id === produto_id
        ? { ...i, quantidade: qtdFinal, subtotal: qtdFinal * i.preco_unitario }
        : i
    ))
  }

  const removerItem = (produto_id) => setCarrinho(prev => prev.filter(i => i.produto_id !== produto_id))

  const totalBruto = carrinho.reduce((s, i) => s + i.subtotal, 0)
  const totalFinal = Math.max(0, totalBruto - (desconto || 0))

  const irParaPagamento = () => {
    if (carrinho.length === 0) { addToast('Adicione produtos ao carrinho', 'warning'); return }
    onIrParaPagamento({ carrinho, desconto })
  }

  const produtosFiltrados = produtos.filter(p =>
    !busca || p.nome.toLowerCase().includes(busca.toLowerCase()) || (p.categoria || '').toLowerCase().includes(busca.toLowerCase())
  )

  const qtdNoCarrinho = (id) => carrinho.find(i => i.produto_id === id)?.quantidade || 0

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px', alignItems: 'start' }}>

      {/* ── PAINEL ESQUERDO: produtos ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Busca */}
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '14px', pointerEvents: 'none' }}>◎</span>
          <input
            className="input"
            placeholder="Buscar produto..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={{ paddingLeft: '36px', fontSize: '14px' }}
          />
        </div>

        {/* Grid de produtos */}
        {carregando ? (
          <div className="loading"><div className="spinner"></div>Carregando produtos...</div>
        ) : produtosFiltrados.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>
              {busca ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
            {produtosFiltrados.map(p => {
              const semEstoque = p.estoque === 0
              const estoqueBaixo = !semEstoque && p.estoque <= (p.estoque_minimo || 5)
              const qtd = qtdNoCarrinho(p.id)
              const flash = adicionando === p.id

              return (
                <div
                  key={p.id}
                  onClick={() => adicionarProduto(p)}
                  title={semEstoque ? 'Sem estoque' : 'Clique para adicionar'}
                  style={{
                    background: flash
                      ? 'rgba(99,102,241,0.15)'
                      : qtd > 0
                        ? 'rgba(99,102,241,0.08)'
                        : 'var(--surface)',
                    border: `1px solid ${flash ? 'rgba(99,102,241,0.5)' : qtd > 0 ? 'rgba(99,102,241,0.3)' : 'var(--border)'}`,
                    borderRadius: '10px',
                    padding: '16px',
                    cursor: semEstoque ? 'not-allowed' : 'pointer',
                    opacity: semEstoque ? 0.45 : 1,
                    transition: 'background 200ms, border-color 200ms, transform 100ms',
                    transform: flash ? 'scale(0.97)' : 'scale(1)',
                    position: 'relative',
                    userSelect: 'none',
                  }}
                >
                  {/* Badge de quantidade no carrinho */}
                  {qtd > 0 && (
                    <div style={{
                      position: 'absolute', top: '10px', right: '10px',
                      background: 'var(--accent)', color: '#fff',
                      borderRadius: '50%', width: '20px', height: '20px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '11px', fontWeight: '800', lineHeight: 1
                    }}>{qtd}</div>
                  )}

                  {/* Categoria */}
                  {p.categoria && (
                    <div style={{ fontSize: '10px', fontWeight: '600', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                      {p.categoria}
                    </div>
                  )}

                  {/* Nome */}
                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '10px', lineHeight: '1.3' }}>
                    {p.nome}
                  </div>

                  {/* Preço */}
                  <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--accent)', letterSpacing: '-0.5px', marginBottom: '8px' }}>
                    R$ {parseFloat(p.preco).toFixed(2)}
                  </div>

                  {/* Estoque */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{
                      width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
                      background: semEstoque ? 'var(--danger)' : estoqueBaixo ? 'var(--warning)' : 'var(--success)'
                    }} />
                    <span style={{ fontSize: '11px', color: semEstoque ? 'var(--danger)' : estoqueBaixo ? 'var(--warning)' : 'var(--text-muted)' }}>
                      {semEstoque ? 'Sem estoque' : `${p.estoque} un.`}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── PAINEL DIREITO: carrinho ── */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        overflow: 'hidden',
        position: 'sticky',
        top: '20px'
      }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-primary)' }}>Carrinho</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
              {carrinho.length === 0 ? 'vazio' : `${carrinho.reduce((s, i) => s + i.quantidade, 0)} item${carrinho.reduce((s, i) => s + i.quantidade, 0) !== 1 ? 's' : ''}`}
            </div>
          </div>
          {carrinho.length > 0 && (
            <button
              onClick={() => { setCarrinho([]); setDesconto(0) }}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', padding: '4px 8px', borderRadius: '4px', transition: 'color 150ms, background 150ms' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none' }}
            >
              Limpar
            </button>
          )}
        </div>

        {/* Itens */}
        {carrinho.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '32px', opacity: 0.15, marginBottom: '10px' }}>◉</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px', margin: 0 }}>
              Clique em um produto para adicionar
            </p>
          </div>
        ) : (
          <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
            {carrinho.map((item, idx) => (
              <div key={item.produto_id} style={{
                padding: '12px 20px',
                borderBottom: idx < carrinho.length - 1 ? '1px solid var(--border)' : 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', flex: 1, paddingRight: '8px', lineHeight: '1.3' }}>{item.nome}</span>
                  <button
                    onClick={() => removerItem(item.produto_id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px', padding: '0 2px', lineHeight: 1, flexShrink: 0, transition: 'color 150ms' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                  >✕</button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {/* Controles +/- */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border)', overflow: 'hidden' }}>
                    <button
                      onClick={() => alterarQtd(item.produto_id, -1)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', width: '28px', height: '28px', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 150ms', fontWeight: '700' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >−</button>
                    <input
                      type="number"
                      min="1"
                      max={item.estoque_max}
                      value={item.quantidade}
                      onClick={e => e.target.select()}
                      onChange={e => setQtdDireta(item.produto_id, e.target.value, item.estoque_max)}
                      onBlur={e => {
                        const n = parseInt(e.target.value)
                        if (isNaN(n) || n < 1) setQtdDireta(item.produto_id, '1', item.estoque_max)
                        else if (n > item.estoque_max) setQtdDireta(item.produto_id, String(item.estoque_max), item.estoque_max)
                      }}
                      style={{ width: '40px', textAlign: 'center', fontSize: '13px', fontWeight: '700', background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', padding: 0, MozAppearance: 'textfield' }}
                    />
                    <button
                      onClick={() => alterarQtd(item.produto_id, +1)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', width: '28px', height: '28px', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 150ms', fontWeight: '700' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >+</button>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>R$ {parseFloat(item.preco_unitario).toFixed(2)} × {item.quantidade}</div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--success)' }}>R$ {item.subtotal.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Rodapé do carrinho */}
        {carrinho.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Desconto */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', whiteSpace: 'nowrap', flex: 1 }}>Desconto (R$)</label>
              <input
                className="input"
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={desconto || ''}
                onChange={e => setDesconto(Number(e.target.value))}
                style={{ width: '100px', padding: '6px 10px', fontSize: '13px', textAlign: 'right' }}
              />
            </div>

            {/* Separador */}
            <div style={{ borderTop: '1px dashed var(--border)' }} />

            {/* Subtotal */}
            {desconto > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Subtotal</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>R$ {totalBruto.toFixed(2)}</span>
              </div>
            )}
            {desconto > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: 'var(--warning)' }}>Desconto</span>
                <span style={{ fontSize: '12px', color: 'var(--warning)', fontWeight: '600' }}>− R$ {Number(desconto).toFixed(2)}</span>
              </div>
            )}

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total</span>
              <span style={{ fontSize: '28px', fontWeight: '800', color: 'var(--success)', lineHeight: 1, letterSpacing: '-1px' }}>
                R$ {totalFinal.toFixed(2)}
              </span>
            </div>

            {/* Botão finalizar */}
            <button
              className="btn btn-success"
              onClick={irParaPagamento}
              style={{ width: '100%', padding: '13px', fontSize: '14px', fontWeight: '700', justifyContent: 'center', letterSpacing: '0.3px' }}
            >
              Ir para Pagamento →
            </button>
          </div>
        )}

        {/* Vendas recentes (quando carrinho vazio) */}
        {carrinho.length === 0 && vendas.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border)' }}>
            <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)' }}>Últimas vendas</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{Math.min(vendas.length, 5)} de {vendas.length}</span>
            </div>
            <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {vendas.slice(0, 5).map(v => (
                <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: 'var(--bg-secondary)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--accent)' }}>{v.numero_venda || `#${v.id}`}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {FORMAS_LABEL[v.forma_pagamento] || v.forma_pagamento} · {new Date(v.data).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--success)' }}>R$ {Number(v.valor_total).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
