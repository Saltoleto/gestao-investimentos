document.addEventListener('DOMContentLoaded', () => {
  const supabase = window.supabaseClient;

  // ELEMENTOS
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
  const dataInput = document.getElementById('data');
  const vencimentoInput = document.getElementById('vencimento');
  const formError = document.getElementById('form-error');
  const formSuccess = document.getElementById('form-success');

  const bancos = [
    "Banco do Brasil", "Bradesco", "BTG Pactual", "Caixa Econômica Federal", "Itaú",
    "Inter", "Nubank", "Original", "Rico", "Santander", "Safra", "XP"
  ].sort();

  let investimentoEditandoId = null;

// ===== HELPERS =====
  const formatarDataBR = d => {
    if (!d) return '';
    // Corrige decremento de um dia
    const parts = d.split('T')[0].split('-'); // yyyy-mm-dd
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  const formatarMoeda = v =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // MÁSCARA MONETÁRIA
  valorInput.addEventListener('input', () => {
    let v = valorInput.value.replace(/\D/g, '');
    v = (v / 100).toFixed(2).replace('.', ',');
    v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    valorInput.value = v;
  });

  // AUTOCOMPLETE BANCO
  bancoSearch.addEventListener('input', () => {
    const filter = bancoSearch.value.toLowerCase();
    bancoList.innerHTML = '';
    bancos.filter(b => b.toLowerCase().includes(filter)).forEach(b => {
      const li = document.createElement('li');
      li.textContent = b;
      li.addEventListener('click', () => {
        bancoSearch.value = b;
        bancoList.classList.add('hidden');
      });
      bancoList.appendChild(li);
    });
    bancoList.classList.toggle('hidden', bancoList.children.length === 0);
  });

  bancoSearch.addEventListener('focus', () => {
    bancoSearch.dispatchEvent(new Event('input'));
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('.autocomplete')) {
      bancoList.classList.add('hidden');
    }
  });

  // ===== LOGIN =====
  btnLogin.addEventListener('click', async () => {
    formError.innerText = '';
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailInput.value,
      password: passwordInput.value
    });

    if (error) {
      document.getElementById('auth-error').innerText = error.message;
      return;
    }

    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session) {
      authDiv.classList.add('hidden');
      listaSection.classList.remove('hidden');
      formSection.classList.add('hidden');
      carregarInvestimentos();
    } else {
      document.getElementById('auth-error').innerText = 'Falha ao autenticar';
    }
  });

  // LOGOUT
  btnLogout.addEventListener('click', async () => {
    await supabase.auth.signOut();
    authDiv.classList.remove('hidden');
    listaSection.classList.add('hidden');
    formSection.classList.add('hidden');
  });

  // NOVO
  btnNovo.addEventListener('click', () => {
    investimentoEditandoId = null;
    form.reset();
    bancoSearch.value = '';
    btnSubmit.innerText = 'Salvar';
    document.getElementById('form-title').innerText = 'Novo';
    formSection.classList.remove('hidden');
    listaSection.classList.add('hidden');
    formError.innerText = '';
    formSuccess.innerText = '';
    valorInput.focus();
  });

  // CANCELAR
  btnCancelar.addEventListener('click', () => {
    formSection.classList.add('hidden');
    listaSection.classList.remove('hidden');
    investimentoEditandoId = null;
    form.reset();
    bancoSearch.value = '';
    formError.innerText = '';
    formSuccess.innerText = '';
  });

  // LISTAR INVESTIMENTOS
  async function carregarInvestimentos() {
    lista.innerHTML = '';
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data, error } = await supabase
      .from('investimentos')
      .select('*')
      .eq('usuario_id', userData.user.id)
      .order('data_aporte', { ascending: false });

    if (error) {
      lista.innerHTML = '<p class="error">Erro ao carregar investimentos</p>';
      return;
    }

    data.forEach(i => {
      const div = document.createElement('div');
      div.className = 'investimento-card';
      div.innerHTML = `
        <strong>${i.banco}</strong><br/>
        Produto: ${i.tipo_produto}<br/>
        Valor: ${formatarMoeda(i.valor)}<br/>
        Aporte: ${formatarDataBR(i.data_aporte)}<br/>
        Vencimento: ${formatarDataBR(i.data_vencimento)}
        <div class="investimento-acoes">
          <button class="btn-editar">Editar</button>
          <button class="btn-excluir">Excluir</button>
        </div>
      `;

      // EDITAR
      div.querySelector('.btn-editar').addEventListener('click', () => {
        investimentoEditandoId = i.id;
        bancoSearch.value = i.banco;
        tipoInput.value = i.tipo_produto;
        valorInput.value = i.valor.toFixed(2).replace('.', ',');
        dataInput.value = i.data_aporte.split('T')[0];
        vencimentoInput.value = i.data_vencimento;
        btnSubmit.innerText = 'Atualizar';
        document.getElementById('form-title').innerText = 'Editar';
        formSection.classList.remove('hidden');
        listaSection.classList.add('hidden');
        formError.innerText = '';
        formSuccess.innerText = '';
        valorInput.focus();
      });

      // EXCLUIR
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
    e.preventDefault();
    formError.innerText = '';
    formSuccess.innerText = '';

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      formError.innerText = 'Sessão inválida';
      return;
    }

    const valor = parseFloat(valorInput.value.replace(/\./g, '').replace(',', '.'));
    if (!valor || valor <= 0) {
      formError.innerText = 'Valor inválido';
      return;
    }

    const payload = {
      banco: bancoSearch.value,
      tipo_produto: tipoInput.value,
      valor,
      data_aporte: dataInput.value,
      data_vencimento: vencimentoInput.value
    };

    let error;
    if (investimentoEditandoId) {
      ({ error } = await supabase.from('investimentos').update(payload).eq('id', investimentoEditandoId));
    } else {
      payload.usuario_id = userData.user.id;
      ({ error } = await supabase.from('investimentos').insert(payload));
    }

    if (error) {
      formError.innerText = error.message;
    } else {
      investimentoEditandoId = null;
      form.reset();
      bancoSearch.value = '';
      btnSubmit.innerText = 'Salvar';
      document.getElementById('form-title').innerText = 'Novo';
      formSection.classList.add('hidden');
      listaSection.classList.remove('hidden');
      formSuccess.innerText = 'Investimento salvo com sucesso!';
      carregarInvestimentos();
    }
  });

  // AUTO LOAD
  (async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session) {
      authDiv.classList.add('hidden');
      listaSection.classList.remove('hidden');
      carregarInvestimentos();
    }
  })();
});
