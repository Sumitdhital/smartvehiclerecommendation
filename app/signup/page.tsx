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

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/");
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Enter your full name.");
      return;
    }
    if (!email || !password) {
      setError("Enter your email and a password to continue.");
      return;
    }
    if (password.length < 6) {
      setError("Use at least 6 characters for your password.");
      return;
    }

    setLoading(true);

    // Create the account server-side (already confirmed), then sign in.
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, fullName: name.trim() }),
    });
    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      setLoading(false);
      setError(body.error || "Could not create your account. Please try again.");
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      // Account exists now, but sign-in hiccuped — send them to the login page.
      setError(mapAuthError(signInError.message));
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <AuthLayout>
      <div className="duration-500 animate-in fade-in slide-in-from-bottom-2 motion-reduce:animate-none">
        <h2 className="text-3xl font-black tracking-tight text-slate-900">Create your account</h2>
        <p className="mt-2 text-sm font-medium text-slate-500">
          Join SaaS Nepal to save comparisons and track EV prices.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
          <Field
            id="name-input"
            label="Full name"
            value={name}
            onChange={setName}
            placeholder="Bikram Shrestha"
            autoComplete="name"
          />
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
            placeholder="Create a password"
            autoComplete="new-password"
            hint="At least 6 characters."
          />
          <FormError>{error}</FormError>
          <SubmitButton id="signup-submit-btn" loading={loading} loadingText="Creating account…">
            Create account
          </SubmitButton>
        </form>

        <p className="mt-6 text-center text-sm font-medium text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-blue-600 transition-colors hover:text-blue-700">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
