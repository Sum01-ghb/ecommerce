import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";

export const metadata: Metadata = {
  title: "Sign Up — Nike",
  description: "Create a Nike account to start shopping, track orders, and save your favourites.",
};

export default function SignUpPage() {
  return <AuthForm mode="sign-up" />;
}
