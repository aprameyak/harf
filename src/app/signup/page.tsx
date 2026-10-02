"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { FormEvent, useState } from "react";
import { Brand } from "@/components/brand";
import { registerUser } from "@/lib/actions/lesson";
export default function SignupPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await registerUser({ email, password, name });
            const res = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });
            if (res?.error) {
                setError("Account created — please log in");
                router.push("/login");
                return;
            }
            router.push("/onboarding");
            router.refresh();
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Could not sign up");
        }
        finally {
            setLoading(false);
        }
    }
    return (<div className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center px-4 py-10">
      <Brand className="mb-8 self-start"/>
      <h1 className="text-2xl font-bold">Create your account</h1>
      <p className="mt-2 text-ink-muted">
        Save progress as you learn to read Arabic script.
      </p>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Name
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="focus-ring rounded-xl border border-black/10 bg-white px-3 py-3 text-base font-normal" autoComplete="name"/>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="focus-ring rounded-xl border border-black/10 bg-white px-3 py-3 text-base font-normal" autoComplete="email"/>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Password
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="focus-ring rounded-xl border border-black/10 bg-white px-3 py-3 text-base font-normal" autoComplete="new-password"/>
        </label>
        {error && (<p className="text-sm text-error" role="alert">
            {error}
          </p>)}
        <button type="submit" className="btn btn-primary focus-ring" disabled={loading}>
          {loading ? "Creating…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-sm text-ink-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-teal hover:underline">
          Log in
        </Link>
      </p>
    </div>);
}
