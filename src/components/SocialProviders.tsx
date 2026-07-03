"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";

const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_ENABLED === "true";
const APPLE_ENABLED  = process.env.NEXT_PUBLIC_APPLE_ENABLED  === "true";

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
    >
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

interface SocialProvidersProps {

  action?: string;

  callbackUrl?: string;
}

export default function SocialProviders({
  action = "Continue",
  callbackUrl = "/",
}: SocialProvidersProps) {
  const [loadingProvider, setLoadingProvider] = useState<
    "google" | "apple" | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  if (!GOOGLE_ENABLED && !APPLE_ENABLED) return null;

  async function handleSocialSignIn(provider: "google" | "apple") {
    if (loadingProvider) return;
    setError(null);
    setLoadingProvider(provider);

    try {
      await authClient.signIn.social({
        provider,
        callbackURL: callbackUrl,

        errorCallbackURL: "/sign-in?error=oauth",
      });

    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : `Failed to sign in with ${provider}`;
      setError(msg);
      setLoadingProvider(null);
    }
  }

  return (
    <div className="space-y-3">
      {}
      {error && (
        <p role="alert" className="text-footnote text-red text-center">
          {error}
        </p>
      )}

      {}
      {GOOGLE_ENABLED && (
        <button
          type="button"
          aria-label="Continue with Google"
          disabled={loadingProvider !== null}
          onClick={() => handleSocialSignIn("google")}
          className="
            w-full flex items-center justify-center gap-3
            rounded-sm border border-light-400 bg-light-100
            px-4 py-3 text-caption font-medium text-dark-900
            hover:bg-light-200 hover:border-dark-500 cursor-pointer
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dark-900 focus-visible:ring-offset-2
            disabled:opacity-60 disabled:cursor-not-allowed
            transition-colors duration-150
          "
        >
          {loadingProvider === "google" ? (
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          ) : (
            <GoogleIcon />
          )}
          <span>
            {loadingProvider === "google" ? "Redirecting…" : `${action} with Google`}
          </span>
        </button>
      )}

      {}
      {APPLE_ENABLED && (
        <button
          type="button"
          aria-label="Continue with Apple"
          disabled={loadingProvider !== null}
          onClick={() => handleSocialSignIn("apple")}
          className="
            w-full flex items-center justify-center gap-3
            rounded-sm border border-dark-900 bg-dark-900
            px-4 py-3 text-caption font-medium text-light-100
            hover:bg-black hover:border-black cursor-pointer
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dark-900 focus-visible:ring-offset-2
            disabled:opacity-60 disabled:cursor-not-allowed
            transition-colors duration-150
          "
        >
          {loadingProvider === "apple" ? (
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          ) : (
            <AppleIcon />
          )}
          <span>
            {loadingProvider === "apple" ? "Redirecting…" : `${action} with Apple`}
          </span>
        </button>
      )}
    </div>
  );
}