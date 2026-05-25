import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

// Interceptor: injeta token JWT em todas as requisições
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('pdv_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Serviço de Autenticação
export const AuthService = {
  async registrar(dados) {
    const res = await axios.post(`${API_BASE}/auth/registro`, dados)
    return res.data
  },
  async login(dados) {
    const res = await axios.post(`${API_BASE}/auth/login`, dados)
    if (res.data.sucesso) {
      localStorage.setItem('pdv_token', res.data.token)
      localStorage.setItem('pdv_usuario', JSON.stringify(res.data.usuario))
    }
    return res.data
  },
  logout() {
    localStorage.removeItem('pdv_token')
    localStorage.removeItem('pdv_usuario')
  },
  getToken() { return localStorage.getItem('pdv_token') },
  getUsuario() {
    try { return JSON.parse(localStorage.getItem('pdv_usuario') || 'null') }
    catch { return null }
  },
  isAutenticado() { return !!this.getToken() }
}

// Serviço de Pagamento
export const PagamentoService = {
  async processar(dados) {
    try {
      const res = await axios.post(`${API_BASE}/pagamento`, dados)
      return res.data
    } catch (erro) {
      console.error('Erro ao processar pagamento:', erro)
      throw erro
    }
  }
}

// Serviço de Dashboard
export const DashboardService = {
  async obterEstatisticas() {
    try {
      const res = await axios.get(`${API_BASE}/dashboard`)
      return res.data
    } catch (erro) {
      console.error('Erro ao buscar dashboard:', erro)
      throw erro
    }
  }
}

// Serviço de Produtos
export const ProdutoService = {
  async buscarTodos() {
    try {
      const res = await axios.get(`${API_BASE}/produtos`)
      return res.data.dados || []
    } catch (erro) {
      console.error('Erro ao buscar produtos:', erro)
      throw erro
    }
  },

  async criar(produto) {
    try {
      const res = await axios.post(`${API_BASE}/produtos`, produto)
      return res.data
    } catch (erro) {
      console.error('Erro ao criar produto:', erro)
      throw erro
    }
  },

  async atualizar(id, produto) {
    try {
      const res = await axios.put(`${API_BASE}/produtos/${id}`, produto)
      return res.data
    } catch (erro) {
      console.error('Erro ao atualizar produto:', erro)
      throw erro
    }
  },

  async deletar(id) {
    try {
      const res = await axios.delete(`${API_BASE}/produtos/${id}`)
      return res.data
    } catch (erro) {
      console.error('Erro ao deletar produto:', erro)
      throw erro
    }
  }
}

// Serviço de Fornecedores
export const FornecedorService = {
  async buscarTodos() {
    const res = await axios.get(`${API_BASE}/fornecedores`)
    return res.data.dados || []
  },
  async criar(dados) {
    const res = await axios.post(`${API_BASE}/fornecedores`, dados)
    return res.data
  },
  async atualizar(id, dados) {
    const res = await axios.put(`${API_BASE}/fornecedores/${id}`, dados)
    return res.data
  },
  async deletar(id) {
    const res = await axios.delete(`${API_BASE}/fornecedores/${id}`)
    return res.data
  }
}

// Serviço de Compras
export const CompraService = {
  async buscarTodas() {
    const res = await axios.get(`${API_BASE}/compras`)
    return res.data.dados || []
  },
  async buscarPorId(id) {
    const res = await axios.get(`${API_BASE}/compras/${id}`)
    return res.data.dados
  },
  async criar(dados) {
    const res = await axios.post(`${API_BASE}/compras`, dados)
    return res.data
  },
  async receber(id) {
    const res = await axios.put(`${API_BASE}/compras/${id}/receber`)
    return res.data
  },
  async cancelar(id) {
    const res = await axios.put(`${API_BASE}/compras/${id}/cancelar`)
    return res.data
  }
}

// Serviço Financeiro
export const FinanceiroService = {
  async buscarMovimentos(filtros = {}) {
    const params = new URLSearchParams(filtros).toString()
    const res = await axios.get(`${API_BASE}/financeiro${params ? '?' + params : ''}`)
    return res.data.dados || []
  },
  async obterResumo(filtros = {}) {
    const params = new URLSearchParams(filtros).toString()
    const res = await axios.get(`${API_BASE}/financeiro/resumo${params ? '?' + params : ''}`)
    return res.data.dados
  },
  async criar(dados) {
    const res = await axios.post(`${API_BASE}/financeiro`, dados)
    return res.data
  },
  async deletar(id) {
    const res = await axios.delete(`${API_BASE}/financeiro/${id}`)
    return res.data
  }
}

// Serviço de Relatórios
export const RelatorioService = {
  async vendasPorPeriodo(dataInicio, dataFim) {
    const res = await axios.get(`${API_BASE}/relatorios/vendas?data_inicio=${dataInicio}&data_fim=${dataFim}`)
    return res.data.dados
  },
  async produtosMaisVendidos(limite = 10) {
    const res = await axios.get(`${API_BASE}/relatorios/produtos-mais-vendidos?limite=${limite}`)
    return res.data.dados || []
  },
  async faturamentoDiario(mes, ano) {
    const res = await axios.get(`${API_BASE}/relatorios/faturamento-diario?mes=${mes}&ano=${ano}`)
    return res.data.dados || []
  },
  async resumoFinanceiro(mes, ano) {
    const res = await axios.get(`${API_BASE}/relatorios/financeiro?mes=${mes}&ano=${ano}`)
    return res.data.dados
  }
}

// Serviço de Configurações
export const ConfiguracaoService = {
  async buscarTodas() {
    const res = await axios.get(`${API_BASE}/configuracoes`)
    return res.data.dados || {}
  },
  async atualizar(configs) {
    const res = await axios.put(`${API_BASE}/configuracoes`, { configs })
    return res.data
  }
}

// Serviço de Vendas
export const VendaService = {
  async buscarTodas() {
    try {
      const res = await axios.get(`${API_BASE}/vendas`)
      return res.data.dados || []
    } catch (erro) {
      console.error('Erro ao buscar vendas:', erro)
      throw erro
    }
  },

  async criar(venda) {
    try {
      const res = await axios.post(`${API_BASE}/vendas`, venda)
      return res.data
    } catch (erro) {
      console.error('Erro ao criar venda:', erro)
      throw erro
    }
  },

  async obter(id) {
    try {
      const res = await axios.get(`${API_BASE}/vendas/${id}`)
      return res.data
    } catch (erro) {
      console.error('Erro ao obter venda:', erro)
      throw erro
    }
  }
}
