import Link from "next/link";
import { signIn } from "@/app/actions";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string; error?: string };
}) {
  const next = searchParams.next ?? "/";
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl border border-slate-200 p-6 sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold">
            EV
          </div>
          <h1 className="text-xl font-bold text-slate-900">Dashboard de Vendas</h1>
          <p className="text-sm text-slate-500">Entre com sua conta</p>
        </div>

        {searchParams.error ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {searchParams.error}
          </div>
        ) : null}

        <form action={signIn} className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">E-mail</label>
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
            <label className="mb-1 block text-sm font-medium text-slate-700">Senha</label>
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

        <p className="mt-6 text-center text-xs text-slate-500">
          Supabase Auth ·{" "}
          <Link className="underline hover:text-slate-700" href="/">
            Ir para o início
          </Link>
        </p>
      </div>
    </main>
  );
}
