"use client";
import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Brand } from "@/components/brand";
import { resetPassword } from "@/lib/actions/lesson";
import Link from "next/link";
function ResetForm() {
    const params = useSearchParams();
    const token = params.get("token") ?? "";
    const router = useRouter();
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await resetPassword(token, password);
            router.push("/login");
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Reset failed");
        }
        finally {
            setLoading(false);
        }
    }
    if (!token) {
        return (<p className="text-error">
        Missing token.{" "}
        <Link href="/forgot-password" className="underline">
          Request a new one
        </Link>
      </p>);
    }
    return (<form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        New password
        <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="focus-ring rounded-xl border border-black/10 bg-white px-3 py-3"/>
      </label>
      {error && <p className="text-sm text-error">{error}</p>}
      <button type="submit" className="btn btn-primary" disabled={loading}>
        Update password
      </button>
    </form>);
}
export default function ResetPasswordPage() {
    return (<div className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center px-4">
      <Brand className="mb-8"/>
      <h1 className="text-2xl font-bold">Choose a new password</h1>
      <Suspense>
        <ResetForm />
      </Suspense>
    </div>);
}
