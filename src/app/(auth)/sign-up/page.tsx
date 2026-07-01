import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";
import { signUp } from "@/lib/auth/actions";

export const metadata: Metadata = {
  title: "Sign Up — Nike",
  description:
    "Create a Nike account to start shopping, track orders, and save your favourites.",
};

interface Props {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function SignUpPage({ searchParams }: Props) {
  const { callbackUrl } = await searchParams;

  // Sanitise: only allow relative paths to prevent open-redirect attacks
  const safeCallbackUrl =
    callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/";

  return (
    <AuthForm mode="sign-up" callbackUrl={safeCallbackUrl} />
  );
}
