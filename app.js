document.addEventListener('DOMContentLoaded', () => {
  const supabase = window.supabaseClient;

  // ELEMENTOS
  const authDiv = document.getElementById('auth');
  const appDiv = document.getElementById('app');
  const lista = document.getElementById('lista');

  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  const valorInput = document.getElementById('valor');
  const bancoInput = document.getElementById('banco');
  const tipoInput = document.getElementById('tipo');
  const dataInput = document.getElementById('data');
  const vencimentoInput = document.getElementById('vencimento');

  const btnLogin = document.getElementById('btn-login');
  const btnLogout = document.getElementById('btn-logout');
  const form = document.getElementById('form');
  const btnSubmit = form.querySelector('button[type="submit"]');
  const btnCancelar = document.getElementById('btn-cancelar');

  let investimentoEditandoId = null;

  // HELPERS
  const formatarDataBR = d => {
    if (!d) return '';
    const data = new Date(d);
    return data.toLocaleDateString('pt-BR');
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

  // LOGIN
  btnLogin.addEventListener('click', async () => {
    document.getElementById('auth-error').innerText = '';
    const { error } = await supabase.auth.signInWithPassword({
      email: emailInput.value,
      password: passwordInput.value
    });
    if (error) {
      document.getElementById('auth-error').innerText = error.message;
    }
  });

  // LOGOUT
  btnLogout.addEventListener('click', async () => {
    await supabase.auth.signOut();
  });

  // SESSÃO
  supabase.auth.onAuthStateChange((_, session) => {
    authDiv.classList.toggle('hidden', !!session);
    appDiv.classList.toggle('hidden', !session);
    if (session) carregarInvestimentos();
  });

  // LISTAR INVESTIMENTOS (sem duplicação)
  async function carregarInvestimentos() {
    lista.innerHTML = ''; // limpa lista antes de renderizar

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

    // Usamos Map para evitar duplicação e garantir unicidade
    const uniqueData = new Map();
    data.forEach(i => {
      uniqueData.set(i.id, i);
    });

    uniqueData.forEach(i => {
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

        bancoInput.value = i.banco;
        tipoInput.value = i.tipo_produto;
        valorInput.value = i.valor.toFixed(2).replace('.', ',');
        dataInput.value = i.data_aporte.split('T')[0];
        vencimentoInput.value = i.data_vencimento;

        btnSubmit.innerText = 'Atualizar Aporte';
        btnCancelar.classList.remove('hidden');
      });

      // EXCLUIR
      div.querySelector('.btn-excluir').addEventListener('click', async () => {
        if (!confirm('Deseja excluir este aporte?')) return;
        const { error } = await supabase
          .from('investimentos')
          .delete()
          .eq('id', i.id);
        if (!error) carregarInvestimentos();
      });

      lista.appendChild(div);
    });
  }

  // SALVAR / ATUALIZAR
  form.addEventListener('submit', async e => {
    e.preventDefault();
    document.getElementById('form-error').innerText = '';

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      document.getElementById('form-error').innerText = 'Sessão inválida';
      return;
    }

    const valor = parseFloat(valorInput.value.replace(/\./g, '').replace(',', '.'));
    if (!valor || valor <= 0) {
      document.getElementById('form-error').innerText = 'Valor inválido';
      return;
    }

    const payload = {
      banco: bancoInput.value,
      tipo_produto: tipoInput.value,
      valor,
      data_aporte: dataInput.value,
      data_vencimento: vencimentoInput.value
    };

    let error;
    if (investimentoEditandoId) {
      ({ error } = await supabase
        .from('investimentos')
        .update(payload)
        .eq('id', investimentoEditandoId));
    } else {
      payload.usuario_id = userData.user.id;
      ({ error } = await supabase.from('investimentos').insert(payload));
    }

    if (error) {
      document.getElementById('form-error').innerText = error.message;
    } else {
      investimentoEditandoId = null;
      form.reset();
      btnSubmit.innerText = 'Salvar Aporte';
      btnCancelar.classList.add('hidden');
      carregarInvestimentos(); // sempre limpa e recarrega lista
    }
  });

  // CANCELAR EDIÇÃO
  btnCancelar.addEventListener('click', () => {
    investimentoEditandoId = null;
    form.reset();
    btnSubmit.innerText = 'Salvar Aporte';
    btnCancelar.classList.add('hidden');
  });
});
