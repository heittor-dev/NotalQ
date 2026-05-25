import React, { useState } from 'react'
import CadastroProduto from './components/CadastroProduto'
import SimuladorVendas from './components/SimuladorVendas'
import Dashboard from './pages/Dashboard'
import Pagamento from './pages/Pagamento'
import Cupom from './pages/Cupom'
import Vendas from './pages/Vendas'
import Financeiro from './pages/Financeiro'
import Fornecedores from './pages/Fornecedores'
import Compras from './pages/Compras'
import Relatorios from './pages/Relatorios'
import Configuracoes from './pages/Configuracoes'
import Login from './pages/Login'
import Cadastro from './pages/Cadastro'
import { useToast } from './components/Toast'
import { AuthService } from './services/api'
import NavIcon from './components/NavIcon'

const TITLES = {
  home: 'Dashboard',
  produtos: 'Produtos',
  pdv: 'Simular Vendas',
  pagamento: 'Pagamento',
  cupom: 'Cupom Fiscal',
  vendas: 'Histórico de Vendas',
  financeiro: 'Financeiro',
  fornecedores: 'Fornecedores',
  compras: 'Compras / Estoque',
  relatorios: 'Relatórios',
  configuracoes: 'Configurações'
}

const NAV_SECTIONS = [
  {
    label: 'VISÃO GERAL',
    items: [{ key: 'home', label: 'Dashboard', icon: 'home' }]
  },
  {
    label: 'OPERAÇÕES',
    items: [
      { key: 'pdv', label: 'Simular Vendas', icon: 'pdv' },
      { key: 'vendas', label: 'Vendas', icon: 'vendas' }
    ]
  },
  {
    label: 'CADASTROS',
    items: [
      { key: 'produtos', label: 'Produtos', icon: 'produtos' },
      { key: 'fornecedores', label: 'Fornecedores', icon: 'fornecedores' }
    ]
  },
  {
    label: 'GESTÃO',
    items: [
      { key: 'compras', label: 'Compras / Estoque', icon: 'compras' },
      { key: 'financeiro', label: 'Financeiro', icon: 'financeiro' }
    ]
  },
  {
    label: 'ANÁLISE',
    items: [{ key: 'relatorios', label: 'Relatórios', icon: 'relatorios' }]
  },
  {
    label: 'SISTEMA',
    items: [{ key: 'configuracoes', label: 'Configurações', icon: 'configuracoes' }]
  }
]

export default function App() {
  const [usuario, setUsuario] = useState(() => AuthService.getUsuario())
  const [authPage, setAuthPage] = useState('login')
  const [page, setPage] = useState('home')
  const [dadosVenda, setDadosVenda] = useState(null)
  const [dadosCupom, setDadosCupom] = useState(null)
  const [filtrosNav, setFiltrosNav] = useState({})
  const { addToast, ToastContainer } = useToast()

  const [tema, setTema] = useState(() => {
    const salvo = localStorage.getItem('tema') || 'dark'
    document.documentElement.setAttribute('data-theme', salvo)
    return salvo
  })

  const toggleTema = () => {
    setTema(t => {
      const novo = t === 'dark' ? 'light' : 'dark'
      document.documentElement.setAttribute('data-theme', novo)
      localStorage.setItem('tema', novo)
      return novo
    })
  }

  const temaIcon = tema === 'dark' ? '☀' : '◑'
  const temaLabel = tema === 'dark' ? 'Claro' : 'Escuro'

  const handleLogin = (user) => {
    setUsuario(user)
    setPage('home')
  }

  const handleLogout = () => {
    AuthService.logout()
    setUsuario(null)
    setPage('home')
    setAuthPage('login')
  }

  if (!usuario) {
    return (
      <>
        <button className="theme-toggle-float" onClick={toggleTema} title={`Mudar para tema ${temaLabel}`}>
          {temaIcon} {temaLabel}
        </button>
        {authPage === 'login'
          ? <Login onLogin={handleLogin} onIrParaCadastro={() => setAuthPage('cadastro')} />
          : <Cadastro onIrParaLogin={() => setAuthPage('login')} />
        }
        <ToastContainer />
      </>
    )
  }

  const irParaPagamento = (dados) => {
    setDadosVenda(dados)
    setPage('pagamento')
  }

  const pagamentoAprovado = (cupomData) => {
    setDadosCupom(cupomData)
    setDadosVenda(null)
    setPage('cupom')
    addToast('Venda realizada com sucesso!', 'success')
  }

  const novaVenda = () => {
    setDadosCupom(null)
    setDadosVenda(null)
    setPage('pdv')
  }

  const navPage = (key, filtros = {}) => {
    if (['pagamento', 'cupom'].includes(key)) return
    setFiltrosNav(filtros)
    setPage(key)
  }

  return (
    <div className="container">
      <aside className="sidebar">
        <h1>PlanQ</h1>
        <nav className="nav-menu">
          {NAV_SECTIONS.map(section => (
            <div key={section.label} className="nav-section">
              <div className="section-label">
                {section.label}
              </div>
              {section.items.map(({ key, label, icon }) => (
                <div key={key} className="nav-item">
                  <a
                    className={`nav-link${page === key ? ' active' : ''}`}
                    onClick={() => navPage(key)}
                  >
                    <span className="nav-icon"><NavIcon name={icon} size={16} /></span>
                    {label}
                  </a>
                </div>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <div className="content">
        <header className="header">
          <h2>{TITLES[page] || 'PlanQ'}</h2>
          <div className="flex items-center gap-3">
            <span className="text-muted text-sm">{usuario.nome}</span>
            <button className="theme-toggle" onClick={toggleTema} title={`Mudar para tema ${temaLabel}`}>
              {temaIcon} {temaLabel}
            </button>
            <button onClick={handleLogout} className="btn btn-secondary btn--sm">
              Sair
            </button>
          </div>
        </header>

        <main className="main">
          {page === 'home'          && <Dashboard onNavegar={navPage} />}
          {page === 'produtos'      && <CadastroProduto addToast={addToast} filtrosIniciais={filtrosNav} />}
          {page === 'pdv'           && <SimuladorVendas onIrParaPagamento={irParaPagamento} addToast={addToast} />}
          {page === 'pagamento'     && <Pagamento dadosVenda={dadosVenda} onPagamentoAprovado={pagamentoAprovado} onCancelar={() => setPage('pdv')} />}
          {page === 'cupom'         && <Cupom dadosCupom={dadosCupom} onNovaVenda={novaVenda} />}
          {page === 'vendas'        && <Vendas addToast={addToast} filtrosIniciais={filtrosNav} />}
          {page === 'financeiro'    && <Financeiro addToast={addToast} />}
          {page === 'fornecedores'  && <Fornecedores addToast={addToast} />}
          {page === 'compras'       && <Compras addToast={addToast} />}
          {page === 'relatorios'    && <Relatorios />}
          {page === 'configuracoes' && <Configuracoes addToast={addToast} />}
        </main>
      </div>

      <ToastContainer />
    </div>
  )
}
