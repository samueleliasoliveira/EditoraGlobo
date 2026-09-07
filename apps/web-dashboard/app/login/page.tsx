import Link from "next/link";
import { signIn } from "@/app/actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string };
}) {
  try {
    const next = searchParams.next ?? "/";
    const errorMsg = searchParams.error
      ? String(searchParams.error).slice(0, 500)
      : null;
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl border border-slate-200 p-6 sm:p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">
              EV
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              Dashboard de Vendas
            </h1>
            <p className="text-sm text-slate-500">Entre com sua conta</p>
          </div>

          {errorMsg ? (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMsg}
            </div>
          ) : null}

          <form action={signIn} className="space-y-4">
            <input type="hidden" name="next" value={next} />
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                E-mail
              </label>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                placeholder="voce@empresa.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Senha
              </label>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              Entrar
            </button>
          </form>

          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-500">
            <p className="font-semibold text-slate-600 mb-1">
              Variáveis esperadas na Vercel:
            </p>
            <ul className="space-y-0.5">
              <li>
                ·{" "}
                <code className="px-1 rounded bg-white text-[10.5px] text-slate-700">
                  NEXT_PUBLIC_SUPABASE_URL
                </code>
              </li>
              <li>
                ·{" "}
                <code className="px-1 rounded bg-white text-[10.5px] text-slate-700">
                  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
                </code>{" "}
                <span className="text-slate-400">
                  (fallback ANON_KEY aceito)
                </span>
              </li>
              <li>
                ·{" "}
                <code className="px-1 rounded bg-white text-[10.5px] text-slate-700">
                  SUPABASE_SECRET_KEY
                </code>{" "}
                <span className="text-slate-400">
                  (fallback SERVICE_ROLE_KEY, marcada Secret)
                </span>
              </li>
              <li>
                ·{" "}
                <code className="px-1 rounded bg-white text-[10.5px] text-slate-700">
                  NEXTAUTH_SECRET
                </code>
              </li>
            </ul>
          </div>

          <p className="mt-4 text-center text-xs text-slate-500">
            Supabase Auth ·{" "}
            <Link className="underline hover:text-slate-700" href="/">
              Ir para o início
            </Link>
          </p>
        </div>
      </main>
    );
  } catch (topErr: any) {
    if (typeof console !== "undefined") {
      console.error(
        "[login/page] SSR top-level exception:",
        topErr?.message ?? String(topErr),
      );
    }
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-amber-200 bg-white shadow-xl p-6 sm:p-8">
          <h1 className="text-lg font-bold text-slate-900 mb-3">
            Falha temporária
          </h1>
          <p className="text-sm text-slate-600">
            Não foi possível carregar a página de login agora. Verifique as
            variáveis de ambiente na Vercel ou atualize a página.
          </p>
          <p className="mt-5 text-center">
            <Link
              href="/login"
              className="inline-block rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-semibold hover:bg-slate-800"
            >
              Tentar novamente
            </Link>
          </p>
        </div>
      </main>
    );
  }
}
