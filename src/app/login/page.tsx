"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { FormEvent, Suspense, useState, useEffect } from "react";
import { Brand } from "@/components/brand";
function LoginForm() {
    const router = useRouter();
    const params = useSearchParams();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        if (params.get("guest") === "1") {
            void (async () => {
                setLoading(true);
                const res = await signIn("guest", { redirect: false });
                if (res?.ok)
                    router.push("/onboarding");
                else
                    setError("Could not start guest session");
                setLoading(false);
            })();
        }
    }, [params, router]);
    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");
        const res = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });
        setLoading(false);
        if (res?.error) {
            setError("Invalid email or password");
            return;
        }
        router.push("/learn");
        router.refresh();
    }
    return (<div className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center px-4 py-10">
      <Brand className="mb-8 self-start"/>
      <h1 className="text-2xl font-bold">Welcome back</h1>
      <p className="mt-2 text-ink-muted">Log in to continue decoding Arabic.</p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="focus-ring rounded-xl border border-black/10 bg-white px-3 py-3 text-base font-normal" autoComplete="email"/>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Password
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="focus-ring rounded-xl border border-black/10 bg-white px-3 py-3 text-base font-normal" autoComplete="current-password"/>
        </label>
        {error && (<p className="text-sm text-error" role="alert">
            {error}
          </p>)}
        <button type="submit" className="btn btn-primary focus-ring" disabled={loading}>
          {loading ? "Signing in…" : "Log in"}
        </button>
      </form>

      <div className="mt-6 flex flex-col gap-3 text-sm">
        <Link href="/forgot-password" className="text-teal hover:underline">
          Forgot password?
        </Link>
        <button type="button" className="btn btn-secondary focus-ring" disabled={loading} onClick={async () => {
            setLoading(true);
            const res = await signIn("guest", { redirect: false });
            if (res?.ok)
                router.push("/onboarding");
            else
                setError("Could not start guest session");
            setLoading(false);
        }}>
          Continue as guest
        </button>
        <p className="text-ink-muted">
          New here?{" "}
          <Link href="/signup" className="font-medium text-teal hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>);
}
export default function LoginPage() {
    return (<Suspense>
      <LoginForm />
    </Suspense>);
}
