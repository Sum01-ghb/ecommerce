"use client";
import React, { useState, useId, useTransition } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import SocialProviders from "@/components/SocialProviders";
import { signIn, signUp } from "@/lib/auth/actions";
import { useCartStore } from "@/store/cart.store";

export type AuthMode = "sign-in" | "sign-up";

export interface AuthFormProps {
  mode: AuthMode;
  callbackUrl?: string;
}

interface InputFieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  required?: boolean;
  error?: string;
  placeholder?: string;
  suffix?: React.ReactNode;
  disabled?: boolean;
}

function InputField({
  id,
  label,
  type = "text",
  value,
  onChange,
  autoComplete,
  required,
  error,
  placeholder,
  suffix,
  disabled,
}: InputFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-caption font-medium text-dark-900">
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-red">
            *
          </span>
        )}
      </label>

      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required={required}
          placeholder={placeholder}
          disabled={disabled}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-invalid={!!error}
          className={[
            "w-full rounded-sm border bg-light-100 px-4 py-3",
            "text-body text-dark-900 placeholder:text-dark-500",
            "focus:outline-none focus:ring-2 focus:ring-dark-900 focus:ring-offset-1",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-colors duration-150",
            suffix ? "pr-11" : "",
            error ? "border-red" : "border-light-400 hover:border-dark-500",
          ]
            .join(" ")
            .trim()}
        />
        {suffix && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {suffix}
          </div>
        )}
      </div>

      {error && (
        <p id={`${id}-error`} role="alert" className="text-footnote text-red">
          {error}
        </p>
      )}
    </div>
  );
}

function Divider() {
  return (
    <div className="relative flex items-center gap-3 my-1">
      <span className="flex-1 border-t border-light-400" aria-hidden="true" />
      <span className="text-footnote text-dark-500 whitespace-nowrap">or</span>
      <span className="flex-1 border-t border-light-400" aria-hidden="true" />
    </div>
  );
}

export default function AuthForm({ mode, callbackUrl = "/" }: AuthFormProps) {
  const uid = useId();
  const isSignUp = mode === "sign-up";
  const [isPending, startTransition] = useTransition();

  const cartItems = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearItems);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (isSignUp && !name.trim()) errs.name = "Full name is required.";
    if (!email.trim()) {
      errs.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = "Enter a valid email address.";
    }
    if (!password) {
      errs.password = "Password is required.";
    } else if (password.length < 8) {
      errs.password = "Password must be at least 8 characters.";
    }
    return errs;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});

    const guestCartJson = JSON.stringify(cartItems);

    startTransition(async () => {
      if (isSignUp) {
        const result = await signUp(
          { name, email, password },
          callbackUrl,
          guestCartJson,
        );
        if (result && !result.success) {
          setFormError(result.error);
          if (result.fieldErrors) {
            const flat: Record<string, string> = {};
            for (const [k, v] of Object.entries(result.fieldErrors)) {
              if (Array.isArray(v) && v.length > 0) flat[k] = v[0];
            }
            setFieldErrors(flat);
          }
        } else {
          clearCart();
        }
      } else {
        const result = await signIn(
          { email, password },
          callbackUrl,
          guestCartJson,
        );
        if (result && !result.success) {
          setFormError(result.error);
          if (result.fieldErrors) {
            const flat: Record<string, string> = {};
            for (const [k, v] of Object.entries(result.fieldErrors)) {
              if (Array.isArray(v) && v.length > 0) flat[k] = v[0];
            }
            setFieldErrors(flat);
          }
        } else {
          clearCart();
        }
      }
    });
  }

  const heading = isSignUp ? "Create your account" : "Welcome back";
  const subheading = isSignUp
    ? "Sign up to start shopping Nike."
    : "Sign in to your Nike account.";
  const submitLabel = isSignUp ? "Create account" : "Sign in";
  const switchText = isSignUp
    ? "Already have an account?"
    : "Don't have an account?";
  const switchLinkLabel = isSignUp ? "Sign in" : "Sign up";
  const switchHref = isSignUp
    ? `/sign-in${callbackUrl !== "/" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`
    : `/sign-up${callbackUrl !== "/" ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`;

  return (
    <div className="space-y-7">
      <div className="space-y-1">
        <h1 className="text-heading-3 font-medium text-dark-900">{heading}</h1>
        <p className="text-body text-dark-700">{subheading}</p>
      </div>

      {}
      <SocialProviders
        action={isSignUp ? "Sign up" : "Sign in"}
        callbackUrl={callbackUrl}
      />

      {}
      <Divider />

      {}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {}
        {formError && (
          <div
            role="alert"
            aria-live="assertive"
            className="rounded-sm border border-red/30 bg-red/5 px-4 py-3 text-caption text-red"
          >
            {formError}
          </div>
        )}

        {}
        {isSignUp && (
          <InputField
            id={`${uid}-name`}
            label="Full name"
            value={name}
            onChange={setName}
            autoComplete="name"
            required
            placeholder="Jordan Smith"
            error={fieldErrors.name}
            disabled={isPending}
          />
        )}

        {}
        <InputField
          id={`${uid}-email`}
          label="Email address"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete={isSignUp ? "email" : "username"}
          required
          placeholder="you@example.com"
          error={fieldErrors.email}
          disabled={isPending}
        />

        {}
        <InputField
          id={`${uid}-password`}
          label="Password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={setPassword}
          autoComplete={isSignUp ? "new-password" : "current-password"}
          required
          placeholder={isSignUp ? "At least 8 characters" : "••••••••"}
          error={fieldErrors.password}
          disabled={isPending}
          suffix={
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="text-dark-500 hover:text-dark-900 focus-visible:outline-none"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />

        {}
        {!isSignUp && (
          <div className="flex justify-end">
            <Link
              href="#"
              className="text-footnote text-dark-700 hover:text-dark-900 hover:underline transition-colors cursor-pointer"
            >
              Forgot password?
            </Link>
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="
            w-full flex items-center justify-center gap-2
            rounded-sm bg-dark-900 px-6 py-3.5
            text-caption font-medium text-light-100
            hover:bg-black cursor-pointer
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dark-900 focus-visible:ring-offset-2
            disabled:opacity-60 disabled:cursor-not-allowed
            transition-colors duration-150
          "
        >
          {isPending && (
            <Loader2 size={15} className="animate-spin" aria-hidden="true" />
          )}
          {isPending ? (isSignUp ? "Creating…" : "Signing in…") : submitLabel}
        </button>
      </form>

      <p className="text-center text-caption text-dark-700">
        {switchText}{" "}
        <Link
          href={switchHref}
          className="font-medium text-dark-900 underline underline-offset-2 hover:text-black transition-colors cursor-pointer"
        >
          {switchLinkLabel}
        </Link>
      </p>

      {isSignUp && (
        <p className="text-center text-footnote text-dark-500 leading-relaxed">
          By creating an account, you agree to Nike&apos;s{" "}
          <Link
            href="#"
            className="underline hover:text-dark-700 transition-colors cursor-pointer"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="#"
            className="underline hover:text-dark-700 transition-colors cursor-pointer"
          >
            Privacy Policy
          </Link>
          .
        </p>
      )}
    </div>
  );
}