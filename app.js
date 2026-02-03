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

  const bancos = ["Banco do Brasil", "Bradesco", "BTG Pactual", "Caixa Econômica Federal", "Itaú", "Inter", "Nubank", "Original", "Rico", "Santander", "Safra", "XP"].sort();
  const tiposProdutos = ["CDB", "LCI", "LCA", "Tesouro Direto", "Fundos de Renda Fixa", "Ações", "ETFs", "Fundos Imobiliários", "Debêntures", "CRI/CRA"].sort();
  let investimentoEditandoId = null;

  const formatarDataBR = d => d ? d.split('T')[0].split('-').reverse().join('/') : '';
  const formatarMoeda = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

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
    const { data, error } = await supabase.auth.signInWithPassword({ email: emailInput.value, password: passwordInput.value });
    if (error) { document.getElementById('auth-error').innerText = error.message; return; }
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session) {
      authDiv.classList.add('hidden'); listaSection.classList.remove('hidden'); formSection.classList.add('hidden'); carregarInvestimentos();
    } else document.getElementById('auth-error').innerText = 'Falha ao autenticar';
  });

  btnLogout.addEventListener('click', async () => {
    await supabase.auth.signOut();
    authDiv.classList.remove('hidden'); listaSection.classList.add('hidden'); formSection.classList.add('hidden');
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
  });

  // LISTAR INVESTIMENTOS
  async function carregarInvestimentos() {
    lista.innerHTML = '';
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data, error } = await supabase.from('investimentos').select('*').eq('usuario_id', userData.user.id).order('data_aporte', { ascending: false });
    if (error) { lista.innerHTML = '<p class="error">Erro ao carregar investimentos</p>'; return; }
    if (!data.length) { lista.innerHTML = '<p class="info">Nenhum investimento cadastrado</p>'; return; }

    data.forEach(i => {
      const div = document.createElement('div'); div.className = 'investimento-card';
      div.innerHTML = `
        Banco/Corretora: ${i.banco}<br/>
        Produto: ${i.tipo_produto}<br/>
        Descrição: ${i.descricao_produto || '-'}<br/>
        Valor: ${formatarMoeda(i.valor)}<br/>
        Data de Aporte: ${formatarDataBR(i.data_aporte)}<br/>
        Liquidez: ${i.liquidez}<br/>                
        Data de Vencimento: ${i.data_vencimento ? formatarDataBR(i.data_vencimento) : '-'}
        <div class="investimento-acoes">
          <button class="btn-editar">Editar</button>
          <button class="btn-excluir">Excluir</button>
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
        if (!error) carregarInvestimentos();
      });
      lista.appendChild(div);
    });
  }

  // SALVAR / ATUALIZAR
  form.addEventListener('submit', async e => {
    e.preventDefault(); formError.innerText = ''; formSuccess.innerText = '';
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) { formError.innerText = 'Sessão inválida'; return; }
    const valor = parseFloat(valorInput.value.replace(/\./g, '').replace(',', '.'));
    if (!valor || valor <= 0) { formError.innerText = 'Valor inválido'; return; }
    const liquidez = document.querySelector('input[name="liquidez"]:checked').value;
    if (liquidez === 'No vencimento' && !vencimentoInput.value) { formError.innerText = 'Data de Vencimento obrigatória'; return; }

    const payload = { banco: bancoSearch.value, tipo_produto: tipoInput.value, descricao_produto: descricaoInput.value, valor, liquidez, data_aporte: dataInput.value, 
      data_vencimento: liquidez === 'No vencimento' ? vencimentoInput.value : null
    };
    let error;
    if (investimentoEditandoId) ({ error } = await supabase.from('investimentos').update(payload).eq('id', investimentoEditandoId));
    else { payload.usuario_id = userData.user.id; ({ error } = await supabase.from('investimentos').insert(payload)); }

    if (error) formError.innerText = error.message;
    else {
      investimentoEditandoId = null; form.reset(); bancoSearch.value = ''; tipoInput.value = ''; descricaoInput.value = '';
      btnSubmit.innerText = 'Salvar'; document.getElementById('form-title').innerText = 'Novo';
      formSection.classList.add('hidden'); listaSection.classList.remove('hidden'); formSuccess.innerText = 'Investimento salvo com sucesso!';
      atualizarVencimento();
      carregarInvestimentos();
    }
  });

  // AUTO LOAD
  (async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session) { authDiv.classList.add('hidden'); listaSection.classList.remove('hidden'); carregarInvestimentos(); }
  })();
});
