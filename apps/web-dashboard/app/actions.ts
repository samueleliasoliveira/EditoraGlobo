"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect, isRedirectError } from "next/navigation";

/**
 * Verifica se um valor "jogado" pelo Next eh um redirect interno.
 * O Next.js implementa `redirect()` como uma excecao de controle de fluxo;
 * se a capturarmos em um try/catch sem re-lancar, o redirect falha e o usuario
 * fica preso em paginas com erro como "NEXT_REDIRECT" na barra vermelha.
 */
function isNextRedirectSignal(err: unknown): boolean {
  if (typeof err === "undefined" || err === null) return false;
  try {
    if (typeof isRedirectError === "function" && isRedirectError(err)) {
      return true;
    }
  } catch {}
  // Fallback heuristico — versoes antigas do Next/edge runtime.
  const s = String(err);
  if (s === "NEXT_REDIRECT") return true;
  if (typeof (err as any).digest === "string" && (err as any).digest.startsWith("NEXT_REDIRECT")) {
    return true;
  }
  return false;
}

function safeErrMessage(raw: unknown, fallback: string): string {
  try {
    if (!raw) return fallback;
    // Nunca expor redirect signals como mensagem de erro.
    if (isNextRedirectSignal(raw)) return fallback;
    let msg: string;
    if (typeof raw === "symbol") return fallback;
    if (typeof raw === "string") msg = raw;
    else if (typeof raw === "object" && "message" in (raw as any))
      msg = String((raw as any).message ?? "");
    else msg = String(raw);

    // Filtrar secrets/JWT/PAT
    msg = msg
      .replace(/\bey[A-Za-z0-9_-]{20,}\b/g, "[REDACTED_JWT]")
      .replace(/\bsk-[A-Za-z0-9_-]{10,}\b/g, "[REDACTED_SK]")
      .replace(/\bghp_[A-Za-z0-9]{20,}\b/g, "[REDACTED_PAT]")
      .replace(/\b(api[_-]?token|secret|service[_-]?role[_-]?key)\s*[=:]\s*\S+/gi, "$1=[REDACTED]");

    if (!msg.trim() || msg.toUpperCase() === "NEXT_REDIRECT") return fallback;
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
    redirect(
      `/login?error=${encodeURIComponent("Informe e-mail e senha.")}&next=${encodeURIComponent(next)}`,
    );
  }

  let supabase: ReturnType<typeof createClient>;
  try {
    supabase = createClient();
  } catch (clientErr: any) {
    if (isNextRedirectSignal(clientErr)) throw clientErr;
    const msg = safeErrMessage(
      clientErr,
      "Configuração pendente. Verifique NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (ou ANON_KEY) nas variáveis de ambiente.",
    );
    redirect(
      `/login?error=${encodeURIComponent(msg)}&next=${encodeURIComponent(next)}`,
    );
  }

  try {
    // signInWithPassword PODE lancar alem de retornar { error } (URL/key invalidas).
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
      redirect(
        `/login?error=${encodeURIComponent(friendly)}&next=${encodeURIComponent(next)}`,
      );
    }
    redirect(next);
  } catch (topErr: any) {
    // ===== IMPORTANTE =====
    // Se o `redirect(next)` acima ou o proprio Next lancaram o sinal
    // de redirect interno, re-lancamos para o runtime interceptar e
    // de fato redirecionar o usuario.
    if (isNextRedirectSignal(topErr)) throw topErr;

    if (typeof console !== "undefined") {
      console.error(
        "[actions] signIn exception (auth/signInWithPassword?):",
        safeErrMessage(topErr, "n/a"),
      );
    }
    const msg = safeErrMessage(topErr, fallbackError);
    redirect(
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
      if (isNextRedirectSignal(inner)) throw inner;
      if (typeof console !== "undefined") {
        console.warn(
          "[actions] signOut auth.signOut falhou:",
          safeErrMessage(inner, "n/a"),
        );
      }
    }
  } catch (outer: any) {
    if (isNextRedirectSignal(outer)) throw outer;
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
