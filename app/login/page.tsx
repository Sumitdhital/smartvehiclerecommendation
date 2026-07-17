"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  AuthLayout,
  Field,
  PasswordField,
  FormError,
  SubmitButton,
  mapAuthError,
} from "@/components/auth/AuthUI";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Send already-authenticated visitors straight to the app.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/");
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Enter your email and password to continue.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setLoading(false);
      setError(mapAuthError(error.message));
      return;
    }
    router.push("/");
    router.refresh();
  };

  return (
    <AuthLayout>
      <div className="duration-500 animate-in fade-in slide-in-from-bottom-2 motion-reduce:animate-none">
        <h2 className="text-3xl font-black tracking-tight text-slate-900">Sign in</h2>
        <p className="mt-2 text-sm font-medium text-slate-500">
          Welcome back. Sign in to your SaaS Nepal account.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
          <Field
            id="email-input"
            label="Email address"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            autoComplete="email"
          />
          <PasswordField
            id="password-input"
            label="Password"
            value={password}
            onChange={setPassword}
            placeholder="Enter your password"
            autoComplete="current-password"
          />
          <FormError>{error}</FormError>
          <SubmitButton id="login-submit-btn" loading={loading} loadingText="Signing in…">
            Sign in
          </SubmitButton>
        </form>

        <p className="mt-6 text-center text-sm font-medium text-slate-500">
          New to SaaS Nepal?{" "}
          <Link href="/signup" className="font-bold text-blue-600 transition-colors hover:text-blue-700">
            Create an account
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
