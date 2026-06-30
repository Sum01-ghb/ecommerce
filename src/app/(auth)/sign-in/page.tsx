import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Sign In — Nike",
  description: "Sign in to your Nike account to access your orders, wishlist, and more.",
};

export default function SignInPage() {
  return <AuthForm mode="sign-in" />;
}
