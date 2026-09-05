import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase SÓ PARA USO EM COMPONENTES / CÓDIGO QUE RODA NO BROWSER.
 *
 * 🔒 SEGURANÇA:
 * - Usa SOMENTE variáveis com prefixo NEXT_PUBLIC_.
 * - NUNCA usa SUPABASE_SERVICE_ROLE_KEY / SUPABASE_SECRET_KEY (elas não existem
 *   nesse arquivo de propósito).
 * - O client browser usa PublishableKey / AnonKey e está sujeito a RLS.
 *   Como RLS nega TUDO nessas tabelas, quem lê dados é o server-side / API.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error(
      "[supabase/client] NEXT_PUBLIC_SUPABASE_URL não configurada. " +
      "Adicione em .env.local / Vercel Env Vars",
    );
  }
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!publishableKey) {
    throw new Error(
      "[supabase/client] NEXT_PUBLIC_SUPABASE_ANON_KEY ou NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY " +
      "não configurada.",
    );
  }
  return createBrowserClient(url, publishableKey);
}
