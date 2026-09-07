"use server";

import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { redirect } from "next/navigation";

function getSupabaseEnv() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonOrPublishable =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return { url, anonOrPublishable };
}

function makeClientForServerAction() {
  const cookieStore = cookies();
  const { url, anonOrPublishable } = getSupabaseEnv();
  if (!url || !anonOrPublishable) {
    if (typeof console !== "undefined") {
      console.error(
        "[actions] Variaveis Supabase ausentes. URL=" +
          (url ? "ok" : "faltando NEXT_PUBLIC_SUPABASE_URL") +
          " KEY=" +
          (anonOrPublishable
            ? "ok"
            : "faltando NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ou NEXT_PUBLIC_SUPABASE_ANON_KEY"),
      );
    }
    return null;
  }
  return createServerClient(url, anonOrPublishable, {
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

export async function signIn(formData: FormData) {
  try {
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const nextRaw = String(formData.get("next") ?? "/");
    const next = nextRaw.startsWith("/") ? nextRaw : "/";

    if (!email || !password) {
      return redirect(
        `/login?error=${encodeURIComponent("Informe e-mail e senha.")}&next=${encodeURIComponent(next)}`,
      );
    }

    const supabase = makeClientForServerAction();
    if (!supabase) {
      return redirect(
        `/login?error=${encodeURIComponent("Configuração pendente. Verifique NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (ou ANON_KEY) nas variáveis de ambiente da Vercel.")}&next=${encodeURIComponent(next)}`,
      );
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const msg =
        error?.message?.toLowerCase?.()?.includes("invalid") ||
        error?.message?.toLowerCase?.()?.includes("credentials")
          ? "E-mail ou senha inválidos."
          : error?.message ?? "Não foi possível entrar agora.";
      return redirect(
        `/login?error=${encodeURIComponent(msg)}&next=${encodeURIComponent(next)}`,
      );
    }
    return redirect(next);
  } catch (topErr: any) {
    if (typeof console !== "undefined") {
      console.error(
        "[actions] signIn top-level exception:",
        topErr?.message ?? String(topErr),
      );
    }
    return redirect(
      `/login?error=${encodeURIComponent("Falha temporária ao autenticar. Tente novamente em alguns segundos.")}&next=${encodeURIComponent("%2F")}`,
    );
  }
}

export async function signOut() {
  try {
    const supabase = makeClientForServerAction();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (inner: any) {
        if (typeof console !== "undefined") {
          console.warn(
            "[actions] signOut auth.signOut falhou:",
            inner?.message ?? String(inner),
          );
        }
      }
    }
  } catch (topErr: any) {
    if (typeof console !== "undefined") {
      console.warn(
        "[actions] signOut top-level exception:",
        topErr?.message ?? String(topErr),
      );
    }
  } finally {
    redirect("/login");
  }
}
