"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function safeErrMessage(raw: unknown, fallback: string): string {
  try {
    if (!raw) return fallback;
    let msg: string;
    if (typeof raw === "string") msg = raw;
    else if (typeof raw === "object" && "message" in (raw as any))
      msg = String((raw as any).message ?? "");
    else msg = String(raw);

    // Filtrar (heurística) o que PODE ser secret/token/JWT — evitar vazar.
    msg = msg
      .replace(/\bey[A-Za-z0-9_-]{20,}\b/g, "[REDACTED_JWT]")
      .replace(/\bsk-[A-Za-z0-9_-]{10,}\b/g, "[REDACTED_SK]")
      .replace(/\bghp_[A-Za-z0-9]{20,}\b/g, "[REDACTED_PAT]")
      .replace(/\b(api[_-]?token|secret|service[_-]?role[_-]?key)\s*[=:]\s*\S+/gi, "$1=[REDACTED]");

    if (!msg.trim()) return fallback;
    return msg.slice(0, 300);
  } catch {
    return fallback;
  }
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nextRaw = String(formData.get("next") ?? "/");
  const next = nextRaw.startsWith("/") ? nextRaw : "/";
  const fallbackError =
    "Falha temporária ao autenticar. Tente novamente em alguns segundos.";

  if (!email || !password) {
    return redirect(
      `/login?error=${encodeURIComponent("Informe e-mail e senha.")}&next=${encodeURIComponent(next)}`,
    );
  }

  let supabase: ReturnType<typeof createClient>;
  try {
    supabase = createClient();
  } catch (clientErr: any) {
    const msg = safeErrMessage(
      clientErr,
      "Configuração pendente. Verifique NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (ou ANON_KEY) nas variáveis de ambiente.",
    );
    return redirect(
      `/login?error=${encodeURIComponent(msg)}&next=${encodeURIComponent(next)}`,
    );
  }

  try {
    // signInWithPassword PODE lançar em cenários de URL/key inválidas
    // (não é garantido que sempre retorne { error }).
    const result = await supabase.auth.signInWithPassword({ email, password });
    if (result?.error) {
      const msgRaw = result.error.message ?? "";
      const low = msgRaw.toLowerCase();
      const friendly =
        low.includes("invalid") ||
        low.includes("credentials") ||
        low.includes("password") ||
        low.includes("email")
          ? "E-mail ou senha inválidos."
          : safeErrMessage(result.error, fallbackError);
      return redirect(
        `/login?error=${encodeURIComponent(friendly)}&next=${encodeURIComponent(next)}`,
      );
    }
    return redirect(next);
  } catch (topErr: any) {
    // Aqui está o caminho que estava sendo pego (Digest 425477614 e mensagem generica).
    // Agora mostramos a mensagem REAL, filtrada contra secrets.
    if (typeof console !== "undefined") {
      console.error(
        "[actions] signIn exception (throw em auth/signInWithPassword?):",
        safeErrMessage(topErr, "n/a"),
      );
    }
    const msg = safeErrMessage(topErr, fallbackError);
    return redirect(
      `/login?error=${encodeURIComponent(msg)}&next=${encodeURIComponent(next)}`,
    );
  }
}

export async function signOut() {
  const next = "/login";
  try {
    const supabase = createClient();
    try {
      await supabase.auth.signOut();
    } catch (inner: any) {
      if (typeof console !== "undefined") {
        console.warn(
          "[actions] signOut auth.signOut falhou:",
          safeErrMessage(inner, "n/a"),
        );
      }
    }
  } catch (outer: any) {
    if (typeof console !== "undefined") {
      console.warn(
        "[actions] signOut createClient falhou:",
        safeErrMessage(outer, "n/a"),
      );
    }
  } finally {
    redirect(next);
  }
}
