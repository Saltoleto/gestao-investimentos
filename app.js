document.addEventListener('DOMContentLoaded', () => {
  const supabase = window.supabaseClient;

  const authDiv = document.getElementById('auth');
  const listaSection = document.getElementById('lista-section');
  const formSection = document.getElementById('form-section');
  const lista = document.getElementById('lista');
  const form = document.getElementById('form');
  const btnSubmit = form.querySelector('button[type="submit"]');
  const btnLogin = document.getElementById('btn-login');
  const btnLogout = document.getElementById('btn-logout');
  const btnNovo = document.getElementById('btn-novo');
  const btnCancelar = document.getElementById('btn-cancelar');
  const filtroBanco = document.getElementById('filtro-banco');
  const filtroTipo = document.getElementById('filtro-tipo');
  const filtroLiquidez = document.getElementById('filtro-liquidez');
  const btnLimparFiltros = document.getElementById('btn-limpar-filtros');
  const totaisSection = document.getElementById('totais-section');
  const toastContainer = document.getElementById('toast-container');
  const pwaInstallCard = document.getElementById('pwa-install');
  const pwaInstallButton = document.getElementById('pwa-install-button');
  const pwaInstallDismiss = document.getElementById('pwa-install-dismiss');
  const pwaInstallHint = document.getElementById('pwa-install-hint');

  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const valorInput = document.getElementById('valor');
  const bancoSearch = document.getElementById('banco-search');
  const bancoList = document.getElementById('banco-list');
  const tipoInput = document.getElementById('tipo');
  const tipoList = document.getElementById('tipo-list');
  const descricaoInput = document.getElementById('descricao');
  const dataInput = document.getElementById('data');
  const vencimentoInput = document.getElementById('vencimento');
  const formError = document.getElementById('form-error');
  const formSuccess = document.getElementById('form-success');
  const liquidezRadios = document.querySelectorAll('input[name="liquidez"]');
  const authError = document.getElementById('auth-error');

  const showToast = (title, message, type = 'info') => {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<strong>${title}</strong><p>${message}</p>`;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 4200);
  };

  const bancos = ["Banco do Brasil", "Bradesco", "BTG Pactual", "Caixa Econômica Federal", "Itaú", "Inter", "Nubank", "Original", "Rico", "Santander", "Safra", "XP"].sort();
  const tiposProdutos = ["CDB", "LCI", "LCA", "Tesouro Direto", "Fundos de Renda Fixa", "Ações", "ETFs", "Fundos Imobiliários", "Debêntures", "CRI/CRA"].sort();
  let investimentoEditandoId = null;
  let investimentosCache = [];
  let investimentosFiltradosCache = [];
  let mostrarValores = true;

  const formatarDataBR = d => d ? d.split('T')[0].split('-').reverse().join('/') : '';
  const formatarMoeda = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatarMoedaComPrivacidade = v => (mostrarValores ? formatarMoeda(v) : 'R$ ••••••');

  const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isInStandaloneMode = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  const pwaInstallState = {
    deferredPrompt: null
  };

  function ocultarPwaInstall() {
    if (pwaInstallCard) {
      pwaInstallCard.classList.add('hidden');
    }
  }

  function exibirPwaInstall() {
    if (pwaInstallCard) {
      pwaInstallCard.classList.remove('hidden');
    }
  }

  function prepararPwaInstall() {
    if (!pwaInstallCard) return;

    if (isInStandaloneMode()) {
      ocultarPwaInstall();
      return;
    }

    if (pwaInstallState.deferredPrompt) {
      if (pwaInstallHint) {
        pwaInstallHint.classList.add('hidden');
      }
      exibirPwaInstall();
      return;
    }

    if (isIos()) {
      if (pwaInstallHint) {
        pwaInstallHint.textContent = 'No iPhone/iPad, toque em Compartilhar e selecione "Adicionar à Tela de Início".';
        pwaInstallHint.classList.remove('hidden');
      }
      if (pwaInstallButton) {
        pwaInstallButton.classList.add('hidden');
      }
      exibirPwaInstall();
    } else {
      ocultarPwaInstall();
    }
  }

  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    pwaInstallState.deferredPrompt = event;
    if (pwaInstallButton) {
      pwaInstallButton.classList.remove('hidden');
    }
    prepararPwaInstall();
  });

  window.addEventListener('appinstalled', () => {
    pwaInstallState.deferredPrompt = null;
    ocultarPwaInstall();
    showToast('Aplicativo instalado', 'O app foi adicionado à sua tela inicial.', 'success');
  });

  if (pwaInstallButton) {
    pwaInstallButton.addEventListener('click', async () => {
      if (!pwaInstallState.deferredPrompt) return;
      pwaInstallState.deferredPrompt.prompt();
      const choiceResult = await pwaInstallState.deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        showToast('Instalação iniciada', 'Aguarde a conclusão do processo.', 'success');
      } else {
        showToast('Instalação cancelada', 'Você pode instalar quando quiser.', 'info');
      }
      pwaInstallState.deferredPrompt = null;
      ocultarPwaInstall();
    });
  }

  if (pwaInstallDismiss) {
    pwaInstallDismiss.addEventListener('click', () => {
      ocultarPwaInstall();
    });
  }

  prepararPwaInstall();

  valorInput.addEventListener('input', () => {
    let v = valorInput.value.replace(/\D/g, '');
    v = (v / 100).toFixed(2).replace('.', ',');
    v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    valorInput.value = v;
  });

  function setupAutocomplete(input, list, options) {
    input.addEventListener('input', () => {
      const filter = input.value.toLowerCase();
      list.innerHTML = '';
      options.filter(o => o.toLowerCase().includes(filter)).forEach(o => {
        const li = document.createElement('li');
        li.textContent = o;
        li.addEventListener('click', () => {
          input.value = o;
          list.style.display = 'none';
        });
        list.appendChild(li);
      });
      list.style.display = list.children.length ? 'block' : 'none';
    });
    input.addEventListener('focus', () => input.dispatchEvent(new Event('input')));
    document.addEventListener('click', e => {
      if (!e.target.closest('.autocomplete')) list.style.display = 'none';
    });
  }

  setupAutocomplete(bancoSearch, bancoList, bancos);
  setupAutocomplete(tipoInput, tipoList, tiposProdutos);

  function atualizarOpcoesSelect(select, options, defaultLabel) {
    const valorAtual = select.value;
    select.innerHTML = `<option value="">${defaultLabel}</option>`;
    options.forEach(opcao => {
      const option = document.createElement('option');
      option.value = opcao;
      option.textContent = opcao;
      select.appendChild(option);
    });
    select.value = options.includes(valorAtual) ? valorAtual : '';
  }

  function atualizarFiltrosComDados(dados) {
    const bancosDisponiveis = Array.from(new Set([...bancos, ...dados.map(item => item.banco).filter(Boolean)])).sort();
    const tiposDisponiveis = Array.from(new Set([...tiposProdutos, ...dados.map(item => item.tipo_produto).filter(Boolean)])).sort();
    atualizarOpcoesSelect(filtroBanco, bancosDisponiveis, 'Todos');
    atualizarOpcoesSelect(filtroTipo, tiposDisponiveis, 'Todos');
  }

  function aplicarFiltros() {
    const bancoSelecionado = filtroBanco.value;
    const tipoSelecionado = filtroTipo.value;
    const liquidezSelecionada = filtroLiquidez.value;

    const filtrados = investimentosCache.filter(item => {
      const bancoOk = !bancoSelecionado || item.banco === bancoSelecionado;
      const tipoOk = !tipoSelecionado || item.tipo_produto === tipoSelecionado;
      const liquidezOk = !liquidezSelecionada || item.liquidez === liquidezSelecionada;
      return bancoOk && tipoOk && liquidezOk;
    });

    investimentosFiltradosCache = filtrados;
    renderizarTotais(filtrados);
    renderizarInvestimentos(filtrados);
  }

  filtroBanco.addEventListener('change', aplicarFiltros);
  filtroTipo.addEventListener('change', aplicarFiltros);
  filtroLiquidez.addEventListener('change', aplicarFiltros);
  btnLimparFiltros.addEventListener('click', () => {
    filtroBanco.value = '';
    filtroTipo.value = '';
    filtroLiquidez.value = '';
    aplicarFiltros();
  });

  // HABILITA/DESABILITA VENCIMENTO SEGUNDO LIQUIDEZ
  function atualizarVencimento() {
    const selecionado = document.querySelector('input[name="liquidez"]:checked').value;
    if (selecionado === 'No vencimento') {
      vencimentoInput.disabled = false;
      vencimentoInput.required = true;
    } else {
      vencimentoInput.disabled = true;
      vencimentoInput.required = false;
      vencimentoInput.value = '';
    }
  }
  liquidezRadios.forEach(r => r.addEventListener('change', atualizarVencimento));
  atualizarVencimento();

  // LOGIN
  btnLogin.addEventListener('click', async () => {
    formError.innerText = '';
    authError.innerText = '';
    if (!emailInput.value || !passwordInput.value) {
      authError.innerText = 'Informe email e senha para continuar.';
      showToast('Dados incompletos', 'Preencha email e senha para acessar.', 'error');
      return;
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email: emailInput.value, password: passwordInput.value });
    if (error) {
      authError.innerText = error.message;
      showToast('Não foi possível entrar', error.message, 'error');
      return;
    }
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session) {
      authDiv.classList.add('hidden'); listaSection.classList.remove('hidden'); formSection.classList.add('hidden'); carregarInvestimentos();
      showToast('Bem-vindo!', 'Login realizado com sucesso.', 'success');
    } else {
      authError.innerText = 'Falha ao autenticar';
      showToast('Falha ao autenticar', 'Tente novamente em instantes.', 'error');
    }
  });

  btnLogout.addEventListener('click', async () => {
    await supabase.auth.signOut();
    authDiv.classList.remove('hidden'); listaSection.classList.add('hidden'); formSection.classList.add('hidden');
    showToast('Sessão encerrada', 'Você saiu da aplicação com segurança.', 'info');
  });

  // NOVO
  btnNovo.addEventListener('click', () => {
    investimentoEditandoId = null; form.reset(); bancoSearch.value = ''; tipoInput.value = ''; descricaoInput.value = '';
    btnSubmit.innerText = 'Salvar'; document.getElementById('form-title').innerText = 'Novo';
    formSection.classList.remove('hidden'); listaSection.classList.add('hidden'); formError.innerText = ''; formSuccess.innerText = ''; valorInput.focus();
    atualizarVencimento();
  });

  // CANCELAR
  btnCancelar.addEventListener('click', () => {
    formSection.classList.add('hidden'); listaSection.classList.remove('hidden'); investimentoEditandoId = null; form.reset();
    bancoSearch.value = ''; tipoInput.value = ''; descricaoInput.value = ''; formError.innerText = ''; formSuccess.innerText = '';
    atualizarVencimento();
    showToast('Ação cancelada', 'O aporte não foi alterado.', 'info');
  });

  // LISTAR INVESTIMENTOS
  function renderizarInvestimentos(investimentos) {
    lista.innerHTML = '';
    if (!investimentos.length) {
      const mensagem = investimentosCache.length ? 'Nenhum investimento encontrado com os filtros atuais' : 'Nenhum investimento cadastrado';
      lista.innerHTML = `
        <div class="empty-state">
          <span aria-hidden="true">📭</span>
          <p>${mensagem}</p>
          <small>Experimente ajustar os filtros ou cadastre um novo aporte.</small>
        </div>
      `;
      return;
    }

    investimentos.forEach(i => {
      const div = document.createElement('div'); div.className = 'investimento-card';
      div.innerHTML = `
        <div class="investimento-header">
          <div>
            <span class="investimento-title">${i.banco}</span>
            <span class="investimento-subtitle">${i.tipo_produto}</span>
          </div>
          <div class="investimento-value">${formatarMoeda(i.valor)}</div>
        </div>
        <div class="investimento-tags">
          <span class="badge">${i.liquidez}</span>
          <span class="badge neutral">${i.descricao_produto || 'Sem descrição'}</span>
        </div>
        <div class="investimento-meta">
          <div>
            <span class="label">Data de Aporte</span>
            <span class="value">${formatarDataBR(i.data_aporte)}</span>
          </div>
          <div>
            <span class="label">Vencimento</span>
            <span class="value">${i.data_vencimento ? formatarDataBR(i.data_vencimento) : '-'}</span>
          </div>
        </div>
        <div class="investimento-acoes">
          <button class="btn btn-editar">Editar</button>
          <button class="btn btn-excluir">Excluir</button>
        </div>
      `;
      div.querySelector('.btn-editar').addEventListener('click', () => {
        investimentoEditandoId = i.id; bancoSearch.value = i.banco; tipoInput.value = i.tipo_produto; descricaoInput.value = i.descricao_produto || '';
        valorInput.value = i.valor.toFixed(2).replace('.', ','); dataInput.value = i.data_aporte.split('T')[0]; vencimentoInput.value = i.data_vencimento || '';
        document.querySelector(`input[name="liquidez"][value="${i.liquidez}"]`).checked = true;
        btnSubmit.innerText = 'Atualizar'; document.getElementById('form-title').innerText = 'Editar';
        formSection.classList.remove('hidden'); listaSection.classList.add('hidden'); formError.innerText = ''; formSuccess.innerText = ''; valorInput.focus();
        atualizarVencimento();
      });
      div.querySelector('.btn-excluir').addEventListener('click', async () => {
        if (!confirm('Deseja excluir este investimento?')) return;
        const { error } = await supabase.from('investimentos').delete().eq('id', i.id);
        if (error) {
          showToast('Erro ao excluir', error.message, 'error');
          return;
        }
        showToast('Investimento excluído', 'Registro removido com sucesso.', 'success');
        carregarInvestimentos();
      });
      lista.appendChild(div);
    });
  }

  function agruparInvestimentos(investimentos, chave, labelFallback = 'Não informado') {
    return investimentos.reduce((acc, item) => {
      const label = item[chave] || labelFallback;
      if (!acc[label]) acc[label] = { total: 0, quantidade: 0 };
      acc[label].total += item.valor || 0;
      acc[label].quantidade += 1;
      return acc;
    }, {});
  }

  function ordenarGrupos(grupos) {
    return Object.entries(grupos)
      .map(([label, dados]) => ({ label, ...dados }))
      .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));
  }

  function criarTabelaTotais(titulo, grupos, emptyMessage) {
    const card = document.createElement('div');
    card.className = 'totais-card';
    card.innerHTML = `<h3>${titulo}</h3>`;

    if (!grupos.length) {
      const empty = document.createElement('p');
      empty.className = 'info';
      empty.textContent = emptyMessage;
      card.appendChild(empty);
      return card;
    }

    const table = document.createElement('table');
    table.className = 'totais-table';
    table.innerHTML = `
      <thead>
        <tr>
          <th>Grupo</th>
          <th>Qtd.</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${grupos
          .map(
            grupo => `
          <tr>
            <td>${grupo.label}</td>
            <td>${grupo.quantidade}</td>
            <td>${formatarMoedaComPrivacidade(grupo.total)}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    `;
    card.appendChild(table);
    return card;
  }

  function renderizarTotais(investimentos) {
    totaisSection.innerHTML = '';

    const totalValor = investimentos.reduce((acc, item) => acc + (item.valor || 0), 0);
    const totalQuantidade = investimentos.length;
    const rendaFixaTipos = new Set([
      'cdb',
      'lci',
      'lca',
      'tesouro direto',
      'fundos de renda fixa',
      'debêntures',
      'debentures',
      'cri/cra'
    ]);
    const rendaVariavelTipos = new Set(['ações', 'acoes', 'etfs', 'fundos imobiliários', 'fundos imobiliarios']);
    const totalRendaFixa = investimentos.reduce((acc, item) => {
      const tipo = (item.tipo_produto || '').toLowerCase();
      if (rendaFixaTipos.has(tipo)) return acc + (item.valor || 0);
      return acc;
    }, 0);
    const totalRendaVariavel = investimentos.reduce((acc, item) => {
      const tipo = (item.tipo_produto || '').toLowerCase();
      if (rendaVariavelTipos.has(tipo)) return acc + (item.valor || 0);
      return acc;
    }, 0);
    const percentualRendaFixa = totalValor ? (totalRendaFixa / totalValor) * 100 : 0;
    const percentualRendaVariavel = totalValor ? (totalRendaVariavel / totalValor) * 100 : 0;
    const totalLiquidezDiaria = investimentos.reduce((acc, item) => {
      if (item.liquidez === 'Diária') return acc + (item.valor || 0);
      return acc;
    }, 0);
    const totalLiquidezVencimento = investimentos.reduce((acc, item) => {
      if (item.liquidez === 'No vencimento') return acc + (item.valor || 0);
      return acc;
    }, 0);
    const percentualLiquidezDiaria = totalValor ? (totalLiquidezDiaria / totalValor) * 100 : 0;
    const percentualLiquidezVencimento = totalValor ? (totalLiquidezVencimento / totalValor) * 100 : 0;

    const patrimonioCard = document.createElement('div');
    patrimonioCard.className = 'totais-card totais-card-hero totais-card-wide';
    patrimonioCard.innerHTML = `
      <div class="totais-hero-header">
        <div>
          <span class="totais-hero-label">Patrimônio total</span>
          <h3 class="totais-hero-value">${formatarMoedaComPrivacidade(totalValor)}</h3>
        </div>
        <button class="btn btn-ghost btn-toggle-valores" type="button" aria-pressed="${mostrarValores}">
          ${mostrarValores ? 'Ocultar valores' : 'Mostrar valores'}
        </button>
      </div>
      <div class="totais-hero-footer">
        <div>
          <span>Total de investimentos</span>
          <strong>${totalQuantidade}</strong>
        </div>
        <div>
          <span>Base aplicada</span>
          <strong>${formatarMoedaComPrivacidade(totalValor)}</strong>
        </div>
      </div>
    `;
    const toggleButton = patrimonioCard.querySelector('.btn-toggle-valores');
    toggleButton.addEventListener('click', () => {
      mostrarValores = !mostrarValores;
      renderizarTotais(investimentosFiltradosCache);
    });
    totaisSection.appendChild(patrimonioCard);

    const resumoCard = document.createElement('div');
    resumoCard.className = 'totais-card totais-card-wide';
    resumoCard.innerHTML = `
      <h3>Resumo geral</h3>
      <div class="totais-resumo">
        <div class="totais-kpi">
          <span>Total investido</span>
          <strong>${formatarMoedaComPrivacidade(totalValor)}</strong>
        </div>
        <div class="totais-kpi">
          <span>Quantidade de investimentos</span>
          <strong>${totalQuantidade}</strong>
        </div>
      </div>
    `;
    totaisSection.appendChild(resumoCard);

    const concentracaoCard = document.createElement('div');
    concentracaoCard.className = 'totais-card totais-card-wide';
    concentracaoCard.innerHTML = `
      <h3 class="font-bold text-slate-800 mb-4 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layers text-slate-500" aria-hidden="true" focusable="false">
          <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"></path>
          <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"></path>
          <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"></path>
        </svg>
        Alocação por Classe
      </h3>
      <div class="totais-concentracao">
        <div class="totais-concentracao-item fixa">
          <span>Renda fixa</span>
          <strong>${percentualRendaFixa.toFixed(1)}%</strong>
          <small>${formatarMoedaComPrivacidade(totalRendaFixa)}</small>
        </div>
        <div class="totais-concentracao-item variavel">
          <span>Renda variável</span>
          <strong>${percentualRendaVariavel.toFixed(1)}%</strong>
          <small>${formatarMoedaComPrivacidade(totalRendaVariavel)}</small>
        </div>
        <div class="totais-concentracao-bar" role="img" aria-label="Concentração: ${percentualRendaFixa.toFixed(1)}% renda fixa, ${percentualRendaVariavel.toFixed(1)}% renda variável">
          <div class="totais-concentracao-fill fixa" style="width: ${percentualRendaFixa}%;"></div>
          <div class="totais-concentracao-fill variavel" style="width: ${percentualRendaVariavel}%;"></div>
        </div>
      </div>
    `;
    totaisSection.appendChild(concentracaoCard);

    const concentracaoLiquidezCard = document.createElement('div');
    concentracaoLiquidezCard.className = 'totais-card totais-card-wide';
    concentracaoLiquidezCard.innerHTML = `
      <h3>Concentração por liquidez</h3>
      <div class="totais-concentracao">
        <div class="totais-concentracao-item diaria">
          <span>Diária</span>
          <strong>${percentualLiquidezDiaria.toFixed(1)}%</strong>
          <small>${formatarMoedaComPrivacidade(totalLiquidezDiaria)}</small>
        </div>
        <div class="totais-concentracao-item vencimento">
          <span>No vencimento</span>
          <strong>${percentualLiquidezVencimento.toFixed(1)}%</strong>
          <small>${formatarMoedaComPrivacidade(totalLiquidezVencimento)}</small>
        </div>
        <div class="totais-concentracao-bar" role="img" aria-label="Concentração por liquidez: ${percentualLiquidezDiaria.toFixed(1)}% diária, ${percentualLiquidezVencimento.toFixed(1)}% no vencimento">
          <div class="totais-concentracao-fill diaria" style="width: ${percentualLiquidezDiaria}%;"></div>
          <div class="totais-concentracao-fill vencimento" style="width: ${percentualLiquidezVencimento}%;"></div>
        </div>
      </div>
    `;
    totaisSection.appendChild(concentracaoLiquidezCard);

    const gruposBanco = ordenarGrupos(agruparInvestimentos(investimentos, 'banco'));
    const gruposTipo = ordenarGrupos(agruparInvestimentos(investimentos, 'tipo_produto'));
    const gruposLiquidez = ordenarGrupos(agruparInvestimentos(investimentos, 'liquidez'));

    totaisSection.appendChild(criarTabelaTotais('Quantidade por tipo de produto', gruposTipo, 'Sem dados para tipos de produto.'));
    totaisSection.appendChild(criarTabelaTotais('Quantidade por liquidez', gruposLiquidez, 'Sem dados para liquidez.'));
    totaisSection.appendChild(criarTabelaTotais('Quantidade por banco/corretora', gruposBanco, 'Sem dados para bancos/corretoras.'));
  }

  // LISTAR INVESTIMENTOS
  async function carregarInvestimentos() {
    lista.innerHTML = '';
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data, error } = await supabase.from('investimentos').select('*').eq('usuario_id', userData.user.id).order('data_aporte', { ascending: false });
    if (error) {
      lista.innerHTML = '<p class="error">Erro ao carregar investimentos</p>';
      showToast('Erro ao carregar', 'Não foi possível obter os investimentos.', 'error');
      return;
    }

    investimentosCache = data || [];
    atualizarFiltrosComDados(investimentosCache);
    aplicarFiltros();
  }

  // SALVAR / ATUALIZAR
  form.addEventListener('submit', async e => {
    e.preventDefault(); formError.innerText = ''; formSuccess.innerText = '';
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      formError.innerText = 'Sessão inválida';
      showToast('Sessão inválida', 'Faça login novamente para continuar.', 'error');
      return;
    }
    const valor = parseFloat(valorInput.value.replace(/\./g, '').replace(',', '.'));
    if (!valor || valor <= 0) {
      formError.innerText = 'Valor inválido';
      showToast('Valor inválido', 'Informe um valor maior que zero.', 'error');
      return;
    }
    if (!bancoSearch.value || !tipoInput.value || !dataInput.value) {
      formError.innerText = 'Preencha banco, tipo e data.';
      showToast('Campos obrigatórios', 'Banco, tipo e data são obrigatórios.', 'error');
      return;
    }
    const liquidez = document.querySelector('input[name="liquidez"]:checked').value;
    if (liquidez === 'No vencimento' && !vencimentoInput.value) {
      formError.innerText = 'Data de Vencimento obrigatória';
      showToast('Vencimento obrigatório', 'Informe a data de vencimento para liquidez no vencimento.', 'error');
      return;
    }

    const payload = { banco: bancoSearch.value, tipo_produto: tipoInput.value, descricao_produto: descricaoInput.value, valor, liquidez, data_aporte: dataInput.value, 
      data_vencimento: liquidez === 'No vencimento' ? vencimentoInput.value : null
    };
    let error;
    if (investimentoEditandoId) ({ error } = await supabase.from('investimentos').update(payload).eq('id', investimentoEditandoId));
    else { payload.usuario_id = userData.user.id; ({ error } = await supabase.from('investimentos').insert(payload)); }

    if (error) {
      formError.innerText = error.message;
      showToast('Erro ao salvar', error.message, 'error');
    } else {
      investimentoEditandoId = null; form.reset(); bancoSearch.value = ''; tipoInput.value = ''; descricaoInput.value = '';
      btnSubmit.innerText = 'Salvar'; document.getElementById('form-title').innerText = 'Novo';
      formSection.classList.add('hidden'); listaSection.classList.remove('hidden'); formSuccess.innerText = 'Investimento salvo com sucesso!';
      showToast('Investimento salvo', 'Registro atualizado com sucesso.', 'success');
      atualizarVencimento();
      carregarInvestimentos();
    }
  });

  // AUTO LOAD
  (async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session) { authDiv.classList.add('hidden'); listaSection.classList.remove('hidden'); carregarInvestimentos(); }
  })();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {
      showToast('PWA', 'Não foi possível ativar o modo offline.', 'error');
    });
  }
});
