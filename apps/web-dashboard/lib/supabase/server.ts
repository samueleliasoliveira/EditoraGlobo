import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { type Database } from "@/types";

/**
 * Cliente Supabase SERVER-SIDE para validar SESSÃO DO USUÁRIO logado.
 *
 * 🔒 SEGURANÇA:
 * - Usa Publishable/Anon key (NÃO usa secret/service).
 * - Serve apenas para autenticar sessão vinda dos cookies do navegador.
 * - Se você precisar ler/escrever dados das tabelas ignorando RLS
 *   (leitura dashboard / sync API), use createServiceClient ao invés.
 *
 * 🛟 ROBUSTEZ PRODUÇÃO:
 * - NÃO faz throw se variaveis faltarem.
 * - Em vez de crashar o SSR, loga um warning e retorna um client com
 *   placeholders. A pagina carrega normalmente e mostra erro amigavel
 *   (ex: tela de "configuracao pendente" no page.tsx try/catch ou
 *   mensagem de erro no login).
 */
export function createClient() {
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "";

  if (!url) {
    if (typeof console !== "undefined") {
      console.warn(
        "[supabase/server] NEXT_PUBLIC_SUPABASE_URL nao configurada. " +
          "Client sera criado com placeholder — ajuste var de ambiente na Vercel.",
      );
    }
  }
  if (!publishableKey) {
    if (typeof console !== "undefined") {
      console.warn(
        "[supabase/server] NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ou " +
          "NEXT_PUBLIC_SUPABASE_ANON_KEY nao configurada. " +
          "Criando client com placeholder — ajuste var de ambiente.",
      );
    }
  }

  const safeUrl = url || "https://placeholder-project.supabase.co";
  const safeKey =
    publishableKey ||
    "placeholder-publishable-key-do-not-use-in-production-xxxxxxxx";

  return createServerClient<Database>(safeUrl, safeKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {}
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {}
      },
    },
  });
}
