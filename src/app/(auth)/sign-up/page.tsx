import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";

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

  const safeCallbackUrl =
    callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/";

  return <AuthForm mode="sign-up" callbackUrl={safeCallbackUrl} />;
}