# Protótipo mobile (React Native + Supabase)

Este diretório contém um protótipo interativo para gestão de investimentos usando React Native (Expo) e Supabase.

## Pré-requisitos
- Node.js + npm
- Expo CLI (`npm install -g expo-cli`)
- Credenciais do Supabase

## Configuração
Defina as variáveis de ambiente usadas no Expo:

```bash
export EXPO_PUBLIC_SUPABASE_URL="https://SEU_PROJETO.supabase.co"
export EXPO_PUBLIC_SUPABASE_ANON_KEY="SUA_CHAVE_ANON"
```

Crie a tabela `investimentos` no Supabase com os campos:
- `id` (uuid, default)
- `banco` (text)
- `tipo` (text)
- `valor` (numeric)
- `liquidez` (text)
- `vencimento` (text, nullable)
- `created_at` (timestamp, default)

## Como rodar
```bash
cd mobile
npm install
npm run start
```

Abra o app no emulador ou no Expo Go.
