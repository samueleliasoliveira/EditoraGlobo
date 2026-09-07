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
 * 🛟 ROBUSTEZ PRODUÇÃO:
 * - NÃO faz throw se variaveis faltarem.
 * - Em vez de crashar o SSR, loga warning e retorna client com placeholders.
 *   A pagina abre; a tela amigavel de configuracao pendente (page.tsx /
 *   dashboard-data route) exibe checklist vars.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  const secretKey =
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    "";

  if (!url) {
    if (typeof console !== "undefined") {
      console.warn(
        "[supabase/service] NEXT_PUBLIC_SUPABASE_URL nao configurada. " +
          "Client criado com placeholder — ajuste var de ambiente na Vercel.",
      );
    }
  }
  if (!secretKey) {
    if (typeof console !== "undefined") {
      console.warn(
        "[supabase/service] SUPABASE_SECRET_KEY ou SUPABASE_SERVICE_ROLE_KEY " +
          "nao configurada. Client criado com placeholder — ajuste var SECRETA " +
          "na Vercel (nunca NEXT_PUBLIC_*).",
      );
    }
  }
  if (
    secretKey &&
    secretKey.startsWith("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9") === false
  ) {
    if (typeof console !== "undefined") {
      console.warn(
        "[supabase/service] SUPABASE_SECRET_KEY nao parece JWT do Supabase. " +
          "Verifique em Project Settings -> API.",
      );
    }
  }

  const safeUrl = url || "https://placeholder-project.supabase.co";
  const safeKey =
    secretKey || "placeholder-secret-service-role-key-do-not-use-in-production";

  return createClient<Database>(safeUrl, safeKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
