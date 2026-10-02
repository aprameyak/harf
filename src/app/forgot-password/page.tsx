"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import { Brand } from "@/components/brand";
import { requestPasswordReset } from "@/lib/actions/lesson";
export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [done, setDone] = useState(false);
    const [devToken, setDevToken] = useState<string | undefined>();
    const [loading, setLoading] = useState(false);
    async function onSubmit(e: FormEvent) {
        e.preventDefault();
        setLoading(true);
        const res = await requestPasswordReset(email);
        setDevToken(res.devToken);
        setDone(true);
        setLoading(false);
    }
    return (<div className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center px-4">
      <Brand className="mb-8"/>
      <h1 className="text-2xl font-bold">Reset password</h1>
      {!done ? (<form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Email
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="focus-ring rounded-xl border border-black/10 bg-white px-3 py-3"/>
          </label>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            Send reset link
          </button>
        </form>) : (<div className="mt-6 space-y-3 text-ink-muted">
          <p>If that email exists, a reset token was created. Email delivery is not wired yet — use the local link below in development.</p>
          {devToken && (<p className="rounded-xl bg-teal-soft p-3 text-sm text-teal-deep">
              Dev link:{" "}
              <Link className="underline" href={`/reset-password?token=${devToken}`}>
                Reset now
              </Link>
            </p>)}
        </div>)}
      <Link href="/login" className="mt-6 text-sm text-teal hover:underline">
        Back to login
      </Link>
    </div>);
}
