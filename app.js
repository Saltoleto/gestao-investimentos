document.addEventListener('DOMContentLoaded', () => {
  const supabase = window.supabaseClient;

  const authDiv = document.getElementById('auth');
  const listaSection = document.getElementById('lista-section');
  const formSection = document.getElementById('form-section');
  const metaFormSection = document.getElementById('meta-form-section');
  const listaConteudo = document.getElementById('lista-conteudo');
  const listaResumo = document.getElementById('lista-resumo');
  const form = document.getElementById('form');
  const btnSubmit = form.querySelector('button[type="submit"]');
  const btnLogin = document.getElementById('btn-login');
  const btnAuthSwitch = document.getElementById('btn-auth-switch');
  const btnAuthRecover = document.getElementById('btn-auth-recover');
  const btnNovo = document.getElementById('btn-novo');
  const btnCancelar = document.getElementById('btn-cancelar');
  const btnLogout = document.getElementById('btn-logout');
  const btnMeta = document.getElementById('btn-meta');
  const btnCancelarMeta = document.getElementById('btn-cancelar-meta');
  const layout = document.getElementById('app-layout');
  const sidebar = document.getElementById('sidebar');
  const menuToggle = document.getElementById('menu-toggle');
  const filtroBanco = document.getElementById('filtro-banco');
  const filtroTipo = document.getElementById('filtro-tipo');
  const filtroLiquidez = document.getElementById('filtro-liquidez');
  const btnLimparFiltros = document.getElementById('btn-limpar-filtros');
  const btnToggleFiltros = document.getElementById('btn-toggle-filtros');
  const filterCard = document.querySelector('.filter-card');
  const totaisCard = document.getElementById('totais-card');
  const metasSectionCard = document.getElementById('metas-section');
  const ativosSectionCard = document.getElementById('lista');
  const totaisSection = document.getElementById('totais-section');
  const toastContainer = document.getElementById('toast-container');
  const pwaInstallCard = document.getElementById('pwa-install');
  const pwaInstallButton = document.getElementById('pwa-install-button');
  const pwaInstallDismiss = document.getElementById('pwa-install-dismiss');
  const pwaInstallHint = document.getElementById('pwa-install-hint');
  const metaForm = document.getElementById('meta-form');
  const metaNomeInput = document.getElementById('meta-nome');
  const metaValorInput = document.getElementById('meta-valor');
  const metaLista = document.getElementById('meta-lista');
  const metaError = document.getElementById('meta-error');
  const metaSuccess = document.getElementById('meta-success');
  const metaSelect = document.getElementById('meta-select');

  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const passwordConfirmInput = document.getElementById('password-confirm');
  const emailGroup = document.getElementById('email-group');
  const passwordGroup = document.getElementById('password-group');
  const passwordConfirmGroup = document.getElementById('password-confirm-group');
  const authTitle = document.getElementById('auth-title');
  const authHelper = document.getElementById('auth-helper');
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
  let authSubmitting = false;

  const formatarMensagemFeedback = message => {
    if (!message) return '';
    const trimmed = message.trim();
    return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
  };

  const showToast = (title, message, type = 'info') => {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const formattedMessage = formatarMensagemFeedback(message);
    toast.innerHTML = `<strong>${title}</strong><p>${formattedMessage}</p>`;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 4200);
  };

  const removerMensagemDuplicada = (titulo, mensagem) => {
    if (!titulo || !mensagem) return mensagem;
    const tituloNormalizado = titulo.trim().toLowerCase();
    const mensagemNormalizada = mensagem.trim().toLowerCase();
    if (!mensagemNormalizada.startsWith(tituloNormalizado)) return mensagem;
    const restante = mensagem.trim().slice(titulo.trim().length).trim().replace(/^[:.-]\s*/, '');
    return restante || mensagem;
  };

  const setFeedback = (target, title, message, type = 'error', showToastMessage = true) => {
    const formattedMessage = formatarMensagemFeedback(removerMensagemDuplicada(title, message));
    if (target) {
      target.innerText = formattedMessage;
    }
    if (showToastMessage) {
      showToast(title, formattedMessage, type);
    }
  };

  const montarMensagemErro = (contexto, erro) => {
    if (erro?.message) {
      return `${contexto} ${erro.message}`;
    }
    return contexto;
  };

  const bancos = ["Banco do Brasil", "Bradesco", "BTG Pactual", "Caixa Econômica Federal", "Itaú", "Inter", "Nubank", "Original", "Rico", "Santander", "Safra", "XP"].sort();
  const tiposProdutos = ["CDB", "LCI", "LCA", "Tesouro Direto", "Fundos de Renda Fixa", "Ações", "ETFs", "Fundos Imobiliários", "Debêntures", "CRI/CRA"].sort();
  let investimentoEditandoId = null;
  let investimentosCache = [];
  let investimentosFiltradosCache = [];
  let mostrarValores = true;
  let metasCache = [];

  const formatarDataBR = d => d ? d.split('T')[0].split('-').reverse().join('/') : '';
  const formatarMoeda = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatarMoedaComPrivacidade = v => (mostrarValores ? formatarMoeda(v) : 'R$ ••••••');
  const formatarPercentual = valor => `${valor.toFixed(1)}%`;
  const obterMetaPorId = id => metasCache.find(meta => meta.id === id);
  const limparMetaMensagens = () => {
    if (metaError) metaError.innerText = '';
    if (metaSuccess) metaSuccess.innerText = '';
  };

  const authState = {
    mode: 'login'
  };

  const mobileMenuQuery = window.matchMedia('(max-width: 900px)');
  let menuPinned = false;

  const atualizarEstadoMenu = isOpen => {
    if (!layout || !menuToggle) return;
    layout.classList.toggle('menu-open', isOpen);
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  };

  const fecharMenu = () => {
    if (!mobileMenuQuery.matches) return;
    if (menuPinned) return;
    atualizarEstadoMenu(false);
  };

  const abrirMenu = () => {
    if (!mobileMenuQuery.matches) return;
    atualizarEstadoMenu(true);
  };

  const prepararMenuHamburger = () => {
    if (!layout || !menuToggle) return;
    if (!mobileMenuQuery.matches) {
      menuPinned = false;
      layout.classList.remove('menu-open');
      menuToggle.setAttribute('aria-expanded', 'true');
      return;
    }
    menuToggle.setAttribute('aria-expanded', String(layout.classList.contains('menu-open')));
  };

  const resetAuthMensagens = () => {
    authError.innerText = '';
    formError.innerText = '';
  };

  const setAuthMode = mode => {
    authState.mode = mode;
    resetAuthMensagens();
    if (btnNovo) {
      const ocultarCriar = mode === 'login' || mode === 'signup' || mode === 'recover';
      btnNovo.classList.toggle('hidden', ocultarCriar);
    }
    if (btnMeta) {
      const ocultarMetas = mode === 'login' || mode === 'signup' || mode === 'recover';
      btnMeta.classList.toggle('hidden', ocultarMetas);
    }
    if (metaFormSection) {
      metaFormSection.classList.add('hidden');
    }
    if (mode === 'login') {
      authTitle.innerText = 'Entrar';
      authHelper.innerText = 'Gerencie seus investimentos com uma visão clara e segura.';
      emailGroup.classList.remove('hidden');
      passwordGroup.classList.remove('hidden');
      passwordConfirmGroup.classList.add('hidden');
      btnLogin.innerText = 'Entrar';
      btnAuthSwitch.innerText = 'Criar conta';
      btnAuthSwitch.classList.remove('hidden');
      btnAuthRecover.classList.remove('hidden');
    } else if (mode === 'signup') {
      authTitle.innerText = 'Criar conta';
      authHelper.innerText = 'Crie seu acesso para acompanhar seus investimentos com segurança.';
      emailGroup.classList.remove('hidden');
      passwordGroup.classList.remove('hidden');
      passwordConfirmGroup.classList.remove('hidden');
      btnLogin.innerText = 'Criar conta';
      btnAuthSwitch.innerText = 'Já tenho conta';
      btnAuthSwitch.classList.remove('hidden');
      btnAuthRecover.classList.add('hidden');
    } else if (mode === 'recover') {
      authTitle.innerText = 'Recuperar senha';
      authHelper.innerText = 'Envie um link de recuperação para redefinir sua senha.';
      emailGroup.classList.remove('hidden');
      passwordGroup.classList.add('hidden');
      passwordConfirmGroup.classList.add('hidden');
      btnLogin.innerText = 'Enviar link';
      btnAuthSwitch.innerText = 'Voltar ao login';
      btnAuthSwitch.classList.remove('hidden');
      btnAuthRecover.classList.add('hidden');
    } else if (mode === 'reset') {
      authTitle.innerText = 'Definir nova senha';
      authHelper.innerText = 'Crie uma nova senha para continuar usando o painel.';
      emailGroup.classList.add('hidden');
      passwordGroup.classList.remove('hidden');
      passwordConfirmGroup.classList.remove('hidden');
      btnLogin.innerText = 'Atualizar senha';
      btnAuthSwitch.innerText = 'Voltar ao login';
      btnAuthSwitch.classList.remove('hidden');
      btnAuthRecover.classList.add('hidden');
    }
    passwordInput.value = '';
    if (passwordConfirmInput) passwordConfirmInput.value = '';
  };

  const handleAuthenticated = () => {
    authDiv.classList.add('hidden');
    listaSection.classList.remove('hidden');
    formSection.classList.add('hidden');
    if (metaFormSection) {
      metaFormSection.classList.add('hidden');
    }
    if (btnNovo) {
      btnNovo.classList.remove('hidden');
    }
    if (btnMeta) {
      btnMeta.classList.remove('hidden');
    }
    if (btnLogout) {
      btnLogout.classList.remove('hidden');
    }
    carregarMetas();
    carregarInvestimentos();
  };

  const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isInStandaloneMode = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  const isSecureAuthContext = () => window.isSecureContext
    || window.location.protocol === 'https:'
    || ['localhost', '127.0.0.1'].includes(window.location.hostname);
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

  if (metaValorInput) {
    metaValorInput.addEventListener('input', () => {
      let v = metaValorInput.value.replace(/\D/g, '');
      v = (v / 100).toFixed(2).replace('.', ',');
      v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
      metaValorInput.value = v;
    });
  }

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

  function atualizarMetasSelect() {
    if (!metaSelect) return;
    const valorAtual = metaSelect.value;
    metaSelect.innerHTML = '<option value="">Sem meta</option>';
    metasCache.forEach(meta => {
      const option = document.createElement('option');
      option.value = meta.id;
      option.textContent = `${meta.nome} (${formatarMoeda(meta.valor_meta)})`;
      metaSelect.appendChild(option);
    });
    metaSelect.value = metasCache.some(meta => meta.id === valorAtual) ? valorAtual : '';
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

  function configurarSecaoColapsavel(section, storageKey, iniciarColapsado = false) {
    if (!section) return;
    const toggleButton = section.querySelector('.btn-collapsible-toggle');
    if (!toggleButton) return;
    const valorSalvo = localStorage.getItem(storageKey);
    const colapsado = valorSalvo ? valorSalvo === '1' : iniciarColapsado;
    const aplicarEstado = (estado, persistir = true) => {
      section.classList.toggle('collapsed', estado);
      toggleButton.setAttribute('aria-expanded', String(!estado));
      toggleButton.setAttribute('aria-label', estado ? 'Expandir seção' : 'Colapsar seção');
      if (persistir) {
        localStorage.setItem(storageKey, estado ? '1' : '0');
      }
    };
    aplicarEstado(colapsado, false);
    toggleButton.addEventListener('click', () => {
      aplicarEstado(!section.classList.contains('collapsed'));
    });
  }

  configurarSecaoColapsavel(filterCard, 'collapsible:filtros', true);
  configurarSecaoColapsavel(totaisCard, 'collapsible:totais', false);
  configurarSecaoColapsavel(metasSectionCard, 'collapsible:metas', false);
  configurarSecaoColapsavel(ativosSectionCard, 'collapsible:ativos', false);

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

  // AUTH
  const finalizarAuthSubmit = () => {
    authSubmitting = false;
    btnLogin.disabled = false;
  };

  btnLogin.addEventListener('click', async () => {
    if (authSubmitting) {
      return;
    }
    authSubmitting = true;
    btnLogin.disabled = true;
    formError.innerText = '';
    authError.innerText = '';
    if (!isSecureAuthContext()) {
      setFeedback(
        authError,
        'Conexão insegura',
        'Conexão insegura. Use HTTPS para proteger seus dados.',
        'error'
      );
      return;
    }
    if (authState.mode === 'login') {
      if (!emailInput.value || !passwordInput.value) {
        setFeedback(
          authError,
          'Dados incompletos',
          'Preencha e-mail e senha para continuar.',
          'error'
        );
        finalizarAuthSubmit();
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email: emailInput.value, password: passwordInput.value });
      if (error) {
        setFeedback(
          authError,
          'Não foi possível entrar',
          montarMensagemErro('Não foi possível entrar.', error),
          'error'
        );
        finalizarAuthSubmit();
        return;
      }
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        handleAuthenticated();
        showToast('Bem-vindo!', 'Login realizado com sucesso.', 'success');
      } else {
        setFeedback(
          authError,
          'Não foi possível autenticar',
          'Não foi possível autenticar. Tente novamente em instantes.',
          'error'
        );
      }
      finalizarAuthSubmit();
      return;
    }

    if (authState.mode === 'signup') {
      if (!emailInput.value || !passwordInput.value || !passwordConfirmInput.value) {
        setFeedback(
          authError,
          'Dados incompletos',
          'Preencha e-mail, senha e confirmação para continuar.',
          'error',
          false
        );
        finalizarAuthSubmit();
        return;
      }
      if (passwordInput.value !== passwordConfirmInput.value) {
        setFeedback(
          authError,
          'Senhas diferentes',
          'As senhas não conferem. Verifique as senhas digitadas.',
          'error',
          false
        );
        finalizarAuthSubmit();
        return;
      }
      const { error } = await supabase.auth.signUp({
        email: emailInput.value,
        password: passwordInput.value,
        options: {
          emailRedirectTo: window.location.origin + window.location.pathname
        }
      });
      if (error) {
        if (error.status === 429) {
          setFeedback(
            authError,
            'Limite de tentativas',
            'Limite de tentativas atingido. Aguarde alguns minutos e tente novamente.',
            'error',
            false
          );
        } else {
          setFeedback(
            authError,
            'Não foi possível criar a conta',
            montarMensagemErro('Não foi possível criar a conta.', error),
            'error',
            false
          );
        }
        finalizarAuthSubmit();
        return;
      }
      showToast('Conta criada', 'Verifique seu e-mail para confirmar o cadastro.', 'success');
      setAuthMode('login');
      finalizarAuthSubmit();
      return;
    }

    if (authState.mode === 'recover') {
      if (!emailInput.value) {
        setFeedback(
          authError,
          'E-mail necessário',
          'Informe o e-mail da conta para recuperar a senha.',
          'error'
        );
        finalizarAuthSubmit();
        return;
      }
      const { error } = await supabase.auth.resetPasswordForEmail(emailInput.value, {
        redirectTo: window.location.origin + window.location.pathname
      });
      if (error) {
        setFeedback(
          authError,
          'Não foi possível enviar o e-mail',
          montarMensagemErro('Não foi possível enviar o e-mail de recuperação.', error),
          'error'
        );
        finalizarAuthSubmit();
        return;
      }
      showToast('E-mail enviado', 'Confira sua caixa de entrada para redefinir a senha.', 'success');
      setAuthMode('login');
      finalizarAuthSubmit();
      return;
    }

    if (authState.mode === 'reset') {
      if (!passwordInput.value || !passwordConfirmInput.value) {
        setFeedback(
          authError,
          'Senha necessária',
          'Informe e confirme a nova senha para continuar.',
          'error'
        );
        finalizarAuthSubmit();
        return;
      }
      if (passwordInput.value !== passwordConfirmInput.value) {
        setFeedback(
          authError,
          'Senhas diferentes',
          'As senhas não conferem. Verifique as senhas digitadas.',
          'error'
        );
        finalizarAuthSubmit();
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: passwordInput.value });
      if (error) {
        setFeedback(
          authError,
          'Não foi possível atualizar a senha',
          montarMensagemErro('Não foi possível atualizar a senha.', error),
          'error'
        );
        finalizarAuthSubmit();
        return;
      }
      showToast('Senha atualizada', 'Você já pode acessar sua conta.', 'success');
      handleAuthenticated();
      finalizarAuthSubmit();
    }
  });


  btnAuthSwitch.addEventListener('click', () => {
    if (authState.mode === 'login') {
      setAuthMode('signup');
    } else {
      setAuthMode('login');
    }
  });

  btnAuthRecover.addEventListener('click', () => {
    setAuthMode('recover');
  });

  const abrirFormularioNovoInvestimento = () => {
    investimentoEditandoId = null; form.reset(); bancoSearch.value = ''; tipoInput.value = ''; descricaoInput.value = '';
    btnSubmit.innerText = 'Salvar'; document.getElementById('form-title').innerText = 'Novo';
    formSection.classList.remove('hidden'); listaSection.classList.add('hidden');
    if (metaFormSection) metaFormSection.classList.add('hidden');
    formError.innerText = ''; formSuccess.innerText = ''; valorInput.focus();
    atualizarVencimento();
    if (metaSelect) metaSelect.value = '';
    fecharMenu();
  };

  const abrirFormularioMeta = () => {
    if (!metaFormSection) return;
    listaSection.classList.add('hidden');
    formSection.classList.add('hidden');
    metaFormSection.classList.remove('hidden');
    metaForm.reset();
    limparMetaMensagens();
    metaFormSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (metaNomeInput) metaNomeInput.focus();
    fecharMenu();
  };

  const fecharFormularioMeta = () => {
    if (!metaFormSection) return;
    metaFormSection.classList.add('hidden');
    listaSection.classList.remove('hidden');
    limparMetaMensagens();
  };

  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      btnLogout.disabled = true;
      const { error } = await supabase.auth.signOut();
      btnLogout.disabled = false;
      if (error) {
        showToast('Não foi possível sair', montarMensagemErro('Não foi possível encerrar a sessão.', error), 'error');
        return;
      }
      showToast('Sessão encerrada', 'Você saiu da aplicação com segurança.', 'success');
    });
  }

  // NOVO
  btnNovo.addEventListener('click', () => {
    abrirFormularioNovoInvestimento();
  });

  if (btnMeta) {
    btnMeta.addEventListener('click', () => {
      abrirFormularioMeta();
    });
  }

  // CANCELAR
  btnCancelar.addEventListener('click', () => {
    formSection.classList.add('hidden'); listaSection.classList.remove('hidden'); investimentoEditandoId = null; form.reset();
    bancoSearch.value = ''; tipoInput.value = ''; descricaoInput.value = ''; formError.innerText = ''; formSuccess.innerText = '';
    atualizarVencimento();
    showToast('Ação cancelada', 'O aporte não foi alterado.', 'info');
  });

  if (btnCancelarMeta) {
    btnCancelarMeta.addEventListener('click', () => {
      fecharFormularioMeta();
      showToast('Ação cancelada', 'A meta não foi alterada.', 'info');
    });
  }

  if (menuToggle) {
    menuToggle.addEventListener('click', () => {
      if (!layout) return;
      const aberto = layout.classList.contains('menu-open');
      menuPinned = !aberto;
      atualizarEstadoMenu(!aberto);
    });

    menuToggle.addEventListener('mouseenter', () => {
      if (!mobileMenuQuery.matches) return;
      menuPinned = false;
      abrirMenu();
    });

    menuToggle.addEventListener('mouseleave', () => {
      fecharMenu();
    });
  }

  if (sidebar) {
    sidebar.addEventListener('mouseenter', () => {
      abrirMenu();
    });
    sidebar.addEventListener('mouseleave', () => {
      fecharMenu();
    });
  }

  document.addEventListener('click', event => {
    if (!layout || !mobileMenuQuery.matches) return;
    if (!layout.classList.contains('menu-open')) return;
    if (event.target.closest('#sidebar') || event.target.closest('#menu-toggle')) return;
    menuPinned = false;
    atualizarEstadoMenu(false);
  });

  mobileMenuQuery.addEventListener('change', prepararMenuHamburger);
  prepararMenuHamburger();

  // LISTAR INVESTIMENTOS
  function renderizarInvestimentos(investimentos) {
    listaConteudo.innerHTML = '';
    if (listaResumo) {
      const total = investimentosCache.length;
      const atual = investimentos.length;
      if (total && total !== atual) {
        listaResumo.textContent = `${atual} de ${total} investimentos`;
      } else if (total) {
        listaResumo.textContent = `${total} investimento${total > 1 ? 's' : ''}`;
      } else {
        listaResumo.textContent = '';
      }
    }
    if (!investimentos.length) {
      const mensagem = investimentosCache.length
        ? 'Nenhum investimento encontrado com os filtros atuais'
        : 'Nenhum investimento cadastrado';
      listaConteudo.innerHTML = `
        <div class="empty-state">
          <span aria-hidden="true">📭</span>
          <p>${mensagem}</p>
          <small>${
            investimentosCache.length
              ? 'Experimente ajustar os filtros ou cadastrar um novo aporte.'
              : 'Comece cadastrando um novo aporte para acompanhar seus investimentos.'
          }</small>
        </div>
      `;
      return;
    }

    investimentos.forEach(i => {
      const div = document.createElement('div'); div.className = 'investimento-card';
      const descricaoProduto = i.descricao_produto?.trim();
      const dataAporte = i.data_aporte ? formatarDataBR(i.data_aporte) : '-';
      const dataVencimento = i.data_vencimento ? formatarDataBR(i.data_vencimento) : '-';
      const metaVinculada = i.meta_id ? obterMetaPorId(i.meta_id) : null;
      div.innerHTML = `
        <div class="investimento-main">
          <div class="investimento-info">
            <div class="investimento-header">
              <div>
                <span class="investimento-title">${i.banco}</span>
                <span class="investimento-subtitle">${i.tipo_produto}</span>
              </div>
              <div class="investimento-value">${formatarMoedaComPrivacidade(i.valor)}</div>
            </div>
            <div class="investimento-tags">
              <span class="badge">${i.liquidez}</span>
              ${descricaoProduto ? `<span class="badge neutral">${descricaoProduto}</span>` : ''}
              ${metaVinculada ? `<span class="badge neutral">Meta: ${metaVinculada.nome}</span>` : ''}
            </div>
            <div class="investimento-meta">
              <div>
                <span class="label">Data de Aporte</span>
                <span class="value">${dataAporte}</span>
              </div>
              <div>
                <span class="label">Vencimento</span>
                <span class="value">${dataVencimento}</span>
              </div>
            </div>
          </div>
          <div class="investimento-acoes">
            <button class="btn btn-editar" type="button">Editar</button>
            <button class="btn btn-excluir" type="button">Excluir</button>
          </div>
        </div>
      `;
      div.querySelector('.btn-editar').addEventListener('click', () => {
        investimentoEditandoId = i.id; bancoSearch.value = i.banco; tipoInput.value = i.tipo_produto; descricaoInput.value = i.descricao_produto || '';
        valorInput.value = i.valor.toFixed(2).replace('.', ','); dataInput.value = i.data_aporte.split('T')[0]; vencimentoInput.value = i.data_vencimento || '';
        document.querySelector(`input[name="liquidez"][value="${i.liquidez}"]`).checked = true;
        if (metaSelect) metaSelect.value = i.meta_id || '';
        btnSubmit.innerText = 'Atualizar'; document.getElementById('form-title').innerText = 'Editar';
        formSection.classList.remove('hidden'); listaSection.classList.add('hidden'); formError.innerText = ''; formSuccess.innerText = ''; valorInput.focus();
        atualizarVencimento();
      });
      div.querySelector('.btn-excluir').addEventListener('click', async () => {
        if (!confirm('Deseja excluir este investimento?')) return;
        const { error } = await supabase.from('investimentos').delete().eq('id', i.id);
        if (error) {
          showToast('Não foi possível excluir', montarMensagemErro('Não foi possível excluir o investimento.', error), 'error');
          return;
        }
        showToast('Investimento excluído', 'Registro removido com sucesso.', 'success');
        carregarInvestimentos();
      });
      listaConteudo.appendChild(div);
    });
  }

  function calcularProgressoMetas(metas, investimentos) {
    const totaisPorMeta = investimentos.reduce((acc, investimento) => {
      if (!investimento.meta_id) return acc;
      acc[investimento.meta_id] = (acc[investimento.meta_id] || 0) + (investimento.valor || 0);
      return acc;
    }, {});
    return metas.map(meta => {
      const valorAtingido = totaisPorMeta[meta.id] || 0;
      const percentual = meta.valor_meta ? Math.min((valorAtingido / meta.valor_meta) * 100, 100) : 0;
      return { ...meta, valorAtingido, percentual };
    });
  }

  function renderizarMetas() {
    if (!metaLista) return;
    metaLista.innerHTML = '';
    if (!metasCache.length) {
      metaLista.innerHTML = `
        <div class="empty-state">
          <span aria-hidden="true">🎯</span>
          <p>Nenhuma meta cadastrada</p>
          <small>Cadastre uma meta para acompanhar o progresso dos seus investimentos.</small>
        </div>
      `;
      return;
    }
    const metasComProgresso = calcularProgressoMetas(metasCache, investimentosCache);
    metasComProgresso.forEach(meta => {
      const card = document.createElement('div');
      card.className = 'meta-card';
      card.innerHTML = `
        <div class="meta-card-header">
          <span class="meta-card-title">${meta.nome}</span>
          <strong>${formatarMoedaComPrivacidade(meta.valor_meta)}</strong>
        </div>
        <div class="meta-card-values">
          <span>Atingido: ${formatarMoedaComPrivacidade(meta.valorAtingido)}</span>
          <span>Faltam: ${formatarMoedaComPrivacidade(Math.max(meta.valor_meta - meta.valorAtingido, 0))}</span>
        </div>
        <div class="meta-progress">
          <div class="meta-progress-bar" role="img" aria-label="Progresso da meta ${meta.nome}: ${formatarPercentual(meta.percentual)}">
            <div class="meta-progress-fill" style="width: ${meta.percentual}%;"></div>
          </div>
          <div class="meta-progress-footer">
            <span>${formatarPercentual(meta.percentual)}</span>
            <span>${meta.valorAtingido >= meta.valor_meta ? 'Meta concluída' : 'Em andamento'}</span>
          </div>
        </div>
        <div class="meta-actions">
          <button class="btn btn-ghost" type="button">Excluir</button>
        </div>
      `;
      card.querySelector('.btn-ghost').addEventListener('click', async () => {
        if (!confirm('Deseja excluir esta meta? Os investimentos vinculados serão desvinculados.')) return;
        const { error } = await supabase.from('metas').delete().eq('id', meta.id);
        if (error) {
          showToast('Não foi possível excluir', montarMensagemErro('Não foi possível excluir a meta.', error), 'error');
          return;
        }
        showToast('Meta excluída', 'Meta removida com sucesso.', 'success');
        carregarMetas();
        carregarInvestimentos();
      });
      metaLista.appendChild(card);
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

  function criarTabelaTotais(titulo, iconeSvg, grupos, emptyMessage) {
    const card = document.createElement('div');
    card.className = 'totais-card';
    card.innerHTML = `
      <h3 class="font-bold text-slate-800 mb-4 flex items-center gap-2">
        ${iconeSvg}
        <span>${titulo}</span>
      </h3>
    `;

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
          <span>Liquidez diária</span>
          <strong>${formatarMoedaComPrivacidade(totalLiquidezDiaria)}</strong>
        </div>
      </div>
    `;
    const toggleButton = patrimonioCard.querySelector('.btn-toggle-valores');
    toggleButton.addEventListener('click', () => {
      mostrarValores = !mostrarValores;
      renderizarTotais(investimentosFiltradosCache);
      renderizarInvestimentos(investimentosFiltradosCache);
    });
    totaisSection.appendChild(patrimonioCard);

    const concentracaoCard = document.createElement('div');
    concentracaoCard.className = 'totais-card totais-card-wide';
    concentracaoCard.innerHTML = `
      <h3 class="font-bold text-slate-800 mb-4 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layers text-slate-500" aria-hidden="true" focusable="false">
          <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"></path>
          <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"></path>
          <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"></path>
        </svg>
        Alocação
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
      <h3 class="font-bold text-slate-800 mb-4 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clock text-slate-500" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        Liquidez
      </h3>
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

    const iconeTipoProduto = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-tag text-slate-500" aria-hidden="true" focusable="false">
        <path d="M20.59 13.41 11 3.83A2 2 0 0 0 9.59 3H4a1 1 0 0 0-1 1v5.59A2 2 0 0 0 3.83 11l9.58 9.58a2 2 0 0 0 2.83 0l4.35-4.35a2 2 0 0 0 0-2.82Z"></path>
        <line x1="7" y1="7" x2="7.01" y2="7"></line>
      </svg>
    `;
    const iconeLiquidez = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-droplet text-slate-500" aria-hidden="true" focusable="false">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0Z"></path>
      </svg>
    `;
    const iconeInstituicao = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-landmark text-slate-500" aria-hidden="true" focusable="false">
        <line x1="3" y1="22" x2="21" y2="22"></line>
        <line x1="6" y1="18" x2="6" y2="11"></line>
        <line x1="10" y1="18" x2="10" y2="11"></line>
        <line x1="14" y1="18" x2="14" y2="11"></line>
        <line x1="18" y1="18" x2="18" y2="11"></line>
        <polygon points="12 2 20 7 4 7"></polygon>
      </svg>
    `;

    totaisSection.appendChild(criarTabelaTotais('Tipos de produto', iconeTipoProduto, gruposTipo, 'Sem dados para tipos de produto.'));
    totaisSection.appendChild(criarTabelaTotais('Prazos de liquidez', iconeLiquidez, gruposLiquidez, 'Sem dados para liquidez.'));
    totaisSection.appendChild(criarTabelaTotais('Instituições financeiras', iconeInstituicao, gruposBanco, 'Sem dados para bancos/corretoras.'));
  }

  async function carregarMetas() {
    if (metaLista) metaLista.innerHTML = '';
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const { data, error } = await supabase.from('metas').select('*').eq('usuario_id', userData.user.id).order('data_criacao', { ascending: false });
    if (error) {
      if (metaLista) metaLista.innerHTML = '<p class="error">Não foi possível carregar as metas.</p>';
      showToast('Não foi possível carregar', 'Não foi possível obter as metas no momento.', 'error');
      return;
    }
    metasCache = data || [];
    atualizarMetasSelect();
    renderizarMetas();
  }

  // LISTAR INVESTIMENTOS
  async function carregarInvestimentos() {
    listaConteudo.innerHTML = '';
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data, error } = await supabase.from('investimentos').select('*').eq('usuario_id', userData.user.id).order('data_aporte', { ascending: false });
    if (error) {
      listaConteudo.innerHTML = '<p class="error">Não foi possível carregar os investimentos.</p>';
      showToast('Não foi possível carregar', 'Não foi possível obter os investimentos no momento.', 'error');
      return;
    }

    investimentosCache = data || [];
    atualizarFiltrosComDados(investimentosCache);
    aplicarFiltros();
    renderizarMetas();
  }

  // SALVAR / ATUALIZAR
  form.addEventListener('submit', async e => {
    e.preventDefault(); formError.innerText = ''; formSuccess.innerText = '';
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setFeedback(
        formError,
        'Sessão inválida',
        'Sessão inválida. Faça login novamente para continuar.',
        'error'
      );
      return;
    }
    const valor = parseFloat(valorInput.value.replace(/\./g, '').replace(',', '.'));
    if (!valor || valor <= 0) {
      setFeedback(
        formError,
        'Valor inválido',
        'Informe um valor maior que zero.',
        'error'
      );
      return;
    }
    if (!bancoSearch.value || !tipoInput.value || !dataInput.value) {
      setFeedback(
        formError,
        'Campos obrigatórios',
        'Preencha banco, tipo e data para continuar.',
        'error'
      );
      return;
    }
    const liquidez = document.querySelector('input[name="liquidez"]:checked').value;
    if (liquidez === 'No vencimento' && !vencimentoInput.value) {
      setFeedback(
        formError,
        'Vencimento obrigatório',
        'Informe a data de vencimento para liquidez no vencimento.',
        'error'
      );
      return;
    }

    const payload = { banco: bancoSearch.value, tipo_produto: tipoInput.value, descricao_produto: descricaoInput.value, valor, liquidez, data_aporte: dataInput.value,
      data_vencimento: liquidez === 'No vencimento' ? vencimentoInput.value : null,
      meta_id: metaSelect && metaSelect.value ? metaSelect.value : null
    };
    let error;
    if (investimentoEditandoId) ({ error } = await supabase.from('investimentos').update(payload).eq('id', investimentoEditandoId));
    else { payload.usuario_id = userData.user.id; ({ error } = await supabase.from('investimentos').insert(payload)); }

    if (error) {
      setFeedback(
        formError,
        'Não foi possível salvar',
        montarMensagemErro('Não foi possível salvar o investimento.', error),
        'error'
      );
    } else {
      investimentoEditandoId = null; form.reset(); bancoSearch.value = ''; tipoInput.value = ''; descricaoInput.value = '';
      btnSubmit.innerText = 'Salvar'; document.getElementById('form-title').innerText = 'Novo';
      formSection.classList.add('hidden'); listaSection.classList.remove('hidden'); formSuccess.innerText = formatarMensagemFeedback('Investimento salvo com sucesso');
      showToast('Investimento salvo', 'Registro atualizado com sucesso.', 'success');
      atualizarVencimento();
      carregarInvestimentos();
    }
  });

  if (metaForm) {
    metaForm.addEventListener('submit', async event => {
      event.preventDefault();
      limparMetaMensagens();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setFeedback(
          metaError,
          'Sessão inválida',
          'Sessão inválida. Faça login novamente para continuar.',
          'error'
        );
        return;
      }
      if (!metaNomeInput.value || !metaValorInput.value) {
        setFeedback(
          metaError,
          'Campos obrigatórios',
          'Preencha o nome e o valor da meta.',
          'error'
        );
        return;
      }
      const valorMeta = parseFloat(metaValorInput.value.replace(/\./g, '').replace(',', '.'));
      if (!valorMeta || valorMeta <= 0) {
        setFeedback(
          metaError,
          'Valor inválido',
          'Informe um valor de meta maior que zero.',
          'error'
        );
        return;
      }
      const payload = {
        usuario_id: userData.user.id,
        nome: metaNomeInput.value.trim(),
        valor_meta: valorMeta
      };
      const { error } = await supabase.from('metas').insert(payload);
      if (error) {
        setFeedback(
          metaError,
          'Não foi possível salvar',
          montarMensagemErro('Não foi possível salvar a meta.', error),
          'error'
        );
        return;
      }
      metaForm.reset();
      fecharFormularioMeta();
      showToast('Meta cadastrada', 'Meta cadastrada com sucesso.', 'success');
      carregarMetas();
    });
  }

  const recoveryInUrl = window.location.hash.includes('type=recovery');
  setAuthMode(recoveryInUrl ? 'reset' : 'login');

  supabase.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') {
      authDiv.classList.remove('hidden');
      listaSection.classList.add('hidden');
      formSection.classList.add('hidden');
      if (metaFormSection) {
        metaFormSection.classList.add('hidden');
      }
      setAuthMode('reset');
      if (btnLogout) {
        btnLogout.classList.add('hidden');
      }
      return;
    }
    if (event === 'SIGNED_OUT') {
      authDiv.classList.remove('hidden');
      listaSection.classList.add('hidden');
      formSection.classList.add('hidden');
      if (metaFormSection) {
        metaFormSection.classList.add('hidden');
      }
      setAuthMode('login');
      if (btnLogout) {
        btnLogout.classList.add('hidden');
      }
      return;
    }
    if (event === 'SIGNED_IN' && authState.mode !== 'reset') {
      handleAuthenticated();
    }
  });

  // AUTO LOAD
  (async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session && authState.mode !== 'reset') {
      handleAuthenticated();
    }
  })();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {
      showToast('PWA', 'Não foi possível ativar o modo offline.', 'error');
    });
  }
});
