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
 */
export function createClient() {
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error(
      "[supabase/server] NEXT_PUBLIC_SUPABASE_URL não configurada.",
    );
  }
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!publishableKey) {
    throw new Error(
      "[supabase/server] NEXT_PUBLIC_SUPABASE_ANON_KEY ou " +
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY não configurada.",
    );
  }

  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try { cookieStore.set({ name, value, ...options }); } catch {}
      },
      remove(name: string, options: CookieOptions) {
        try { cookieStore.set({ name, value: "", ...options }); } catch {}
      },
    },
  });
}
