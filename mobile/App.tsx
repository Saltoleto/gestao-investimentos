import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Investment, InvestmentCard } from './src/components/InvestmentCard';
import { supabase } from './src/lib/supabase';

type AuthMode = 'login' | 'signup';

type FormState = {
  banco: string;
  tipo: string;
  valor: string;
  liquidez: 'diaria' | 'prazo';
  vencimento: string;
};

const DEFAULT_FORM: FormState = {
  banco: 'Nubank',
  tipo: 'CDB',
  valor: '1000',
  liquidez: 'diaria',
  vencimento: ''
};

export default function App() {
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [formState, setFormState] = useState<FormState>(DEFAULT_FORM);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session?.user?.email) {
        setSessionEmail(data.session.user.email);
        await carregarInvestimentos();
      }
    };

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionEmail(session?.user?.email ?? null);
      if (!session) {
        setInvestments([]);
      }
    });

    init();

    return () => subscription.unsubscribe();
  }, []);

  const totalAplicado = useMemo(() => {
    return investments.reduce((total, item) => total + item.valor, 0);
  }, [investments]);

  const handleAuth = async () => {
    setIsLoading(true);
    setFeedback('');

    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) {
          setFeedback(error.message);
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password
        });
        if (error) {
          setFeedback(error.message);
        } else {
          setFeedback('Conta criada! Verifique seu e-mail para confirmar.');
        }
      }
    } catch (error) {
      setFeedback('Não foi possível autenticar.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const carregarInvestimentos = async () => {
    setIsLoading(true);
    setFeedback('');
    const { data, error } = await supabase
      .from('investimentos')
      .select('id, banco, tipo, valor, liquidez, vencimento')
      .order('created_at', { ascending: false });

    if (error) {
      setFeedback('Não foi possível carregar os investimentos.');
    } else if (data) {
      const parsed = data.map((item: any) => ({
        id: String(item.id),
        banco: item.banco,
        tipo: item.tipo,
        valor: Number(item.valor),
        liquidez: item.liquidez,
        vencimento: item.vencimento
      })) as Investment[];
      setInvestments(parsed);
    }
    setIsLoading(false);
  };

  const handleCreate = async () => {
    setIsLoading(true);
    setFeedback('');

    const payload = {
      banco: formState.banco,
      tipo: formState.tipo,
      valor: Number(formState.valor),
      liquidez: formState.liquidez,
      vencimento: formState.vencimento ? formState.vencimento : null
    };

    const { error } = await supabase.from('investimentos').insert(payload);

    if (error) {
      setFeedback('Não foi possível salvar o investimento.');
    } else {
      setFormState(DEFAULT_FORM);
      await carregarInvestimentos();
    }

    setIsLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.title}>Gestão de Investimentos</Text>
        <Text style={styles.subtitle}>
          Protótipo React Native com Supabase
        </Text>
      </View>

      {!sessionEmail ? (
        <View style={styles.authCard}>
          <Text style={styles.sectionTitle}>
            {authMode === 'login' ? 'Acessar carteira' : 'Criar conta'}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="E-mail"
            placeholderTextColor="#94a3b8"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Senha"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleAuth}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#0f172a" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {authMode === 'login' ? 'Entrar' : 'Cadastrar'}
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkButton}
            onPress={() =>
              setAuthMode(authMode === 'login' ? 'signup' : 'login')
            }
          >
            <Text style={styles.linkText}>
              {authMode === 'login'
                ? 'Precisa de conta? Criar agora.'
                : 'Já tenho conta. Voltar ao login.'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.userRow}>
            <View>
              <Text style={styles.sectionTitle}>Olá, {sessionEmail}</Text>
              <Text style={styles.sectionSubtitle}>
                Total aplicado: R$ {totalAplicado.toFixed(2)}
              </Text>
            </View>
            <TouchableOpacity style={styles.outlineButton} onPress={handleLogout}>
              <Text style={styles.outlineButtonText}>Sair</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Novo investimento</Text>
            <TextInput
              style={styles.input}
              placeholder="Banco"
              placeholderTextColor="#94a3b8"
              value={formState.banco}
              onChangeText={(text) =>
                setFormState((prev) => ({ ...prev, banco: text }))
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Produto"
              placeholderTextColor="#94a3b8"
              value={formState.tipo}
              onChangeText={(text) =>
                setFormState((prev) => ({ ...prev, tipo: text }))
              }
            />
            <TextInput
              style={styles.input}
              placeholder="Valor aplicado"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              value={formState.valor}
              onChangeText={(text) =>
                setFormState((prev) => ({ ...prev, valor: text }))
              }
            />
            <View style={styles.row}>
              <TouchableOpacity
                style={
                  formState.liquidez === 'diaria'
                    ? styles.choiceButtonActive
                    : styles.choiceButton
                }
                onPress={() =>
                  setFormState((prev) => ({ ...prev, liquidez: 'diaria' }))
                }
              >
                <Text style={styles.choiceText}>Liquidez diária</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={
                  formState.liquidez === 'prazo'
                    ? styles.choiceButtonActive
                    : styles.choiceButton
                }
                onPress={() =>
                  setFormState((prev) => ({ ...prev, liquidez: 'prazo' }))
                }
              >
                <Text style={styles.choiceText}>Com vencimento</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Vencimento (DD/MM/AAAA)"
              placeholderTextColor="#94a3b8"
              value={formState.vencimento}
              onChangeText={(text) =>
                setFormState((prev) => ({ ...prev, vencimento: text }))
              }
            />
            {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleCreate}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#0f172a" />
              ) : (
                <Text style={styles.primaryButtonText}>Salvar</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>Carteira</Text>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={carregarInvestimentos}
            >
              <Text style={styles.linkText}>Atualizar</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={investments}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <InvestmentCard item={item} />}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                Nenhum investimento cadastrado ainda.
              </Text>
            }
            contentContainerStyle={{ paddingBottom: 24 }}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 20
  },
  header: {
    marginBottom: 16
  },
  title: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '700'
  },
  subtitle: {
    color: '#94a3b8',
    marginTop: 6
  },
  authCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1f2937'
  },
  content: {
    flex: 1
  },
  formCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginBottom: 20
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '600'
  },
  sectionSubtitle: {
    color: '#94a3b8',
    marginTop: 4
  },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    color: '#f8fafc',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#1f2a44'
  },
  primaryButton: {
    backgroundColor: '#38bdf8',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16
  },
  primaryButtonText: {
    color: '#0f172a',
    fontWeight: '700'
  },
  linkButton: {
    marginTop: 12
  },
  linkText: {
    color: '#38bdf8'
  },
  feedback: {
    color: '#fbbf24',
    marginTop: 8
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: '#38bdf8',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 6
  },
  outlineButtonText: {
    color: '#38bdf8'
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12
  },
  choiceButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#1f2a44',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center'
  },
  choiceButtonActive: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#38bdf8',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#0b2a3c'
  },
  choiceText: {
    color: '#e2e8f0',
    fontSize: 12
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  emptyText: {
    color: '#94a3b8',
    marginTop: 12
  }
});
