import { createClient } from "@supabase/supabase-js";
import { type Database } from "@/types";

/**
 * Cliente SERVICE ROLE — Bypass de RLS.
 *
 * 🚨 REGRA ABSOLUTA DE SEGURANÇA — NÃO USE ESTE ARQUIVO EM CÓDIGO QUE VÁ PRO
 *    BUNDLE DO NAVEGADOR (componentes ".tsx", libs client, etc).
 *    Importar SOMENTE em:
 *      - app/api/**\/*route.ts
 *      - Server Actions ('use server')
 *      - Server Components que NÃO passam o client para frente
 *
 * @throws Se executado em runtime com NEXT_PUBLIC nas chaves secretas (ele
 *         falha rápido — o string é checado em runtime).
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error(
      "[supabase/service] NEXT_PUBLIC_SUPABASE_URL não configurada.",
    );
  }

  const secretKey =
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secretKey) {
    throw new Error(
      "[supabase/service] Variável SECRETA não configurada: " +
      "adicione SUPABASE_SECRET_KEY ou SUPABASE_SERVICE_ROLE_KEY " +
      "(SOMENTE em vars de ambiente do servidor / Vercel, nunca NEXT_PUBLIC_*).",
    );
  }

  if (secretKey.startsWith("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9") === false) {
    // Não bloquear (outras chaves podem ter prefixos diferentes em versões
    // futuras do Supabase), mas logar warning para facilitar diagnóstico.
    if (typeof console !== "undefined") {
      console.warn(
        "[supabase/service] SUPABASE_SECRET_KEY não parece uma JWT válida do " +
        "Supabase. Verifique em Project Settings → API.",
      );
    }
  }

  return createClient<Database>(url, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
