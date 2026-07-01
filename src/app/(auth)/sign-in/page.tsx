import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";
import { signIn } from "@/lib/auth/actions";

export const metadata: Metadata = {
  title: "Sign In — Nike",
  description:
    "Sign in to your Nike account to access your orders, wishlist, and more.",
};

interface Props {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function SignInPage({ searchParams }: Props) {
  const { callbackUrl } = await searchParams;

  // Sanitise: only allow relative paths to prevent open-redirect attacks
  const safeCallbackUrl =
    callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/";

  return (
    <AuthForm mode="sign-in" callbackUrl={safeCallbackUrl} />
  );
}
