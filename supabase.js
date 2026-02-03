// ===== SUPABASE CLIENT =====
const SUPABASE_URL = 'https://tibacvbntulfpmacbyea.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_LynNG8NU4hoieg-52BgjMw_QluqQbgi';

// Cria o client UMA VEZ
const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// Disponibiliza globalmente
window.supabaseClient = supabaseClient;
