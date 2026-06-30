"use client";

import React, { useState } from "react";
import { useCartStore } from "@/store/useCartStore";
import { ShoppingBag, User, X, LogIn } from "lucide-react";

export default function Navigation() {
  const { items, setIsOpen, toggleCart } = useCartStore();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate auth request for demo purposes (hooking up with Better Auth backend is done, this is client display)
    setTimeout(() => {
      setUser({ name: name || "Nike Fan", email });
      setShowAuthModal(false);
      setLoading(false);
      // Reset fields
      setName("");
      setEmail("");
      setPassword("");
    }, 1000);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-neutral-200/50 bg-white/80 backdrop-blur-md dark:border-neutral-800/50 dark:bg-neutral-900/80 transition-colors duration-300">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-widest text-neutral-900 dark:text-white uppercase">
              Nike Select
            </span>
            <span className="rounded bg-neutral-900 px-1.5 py-0.5 text-[10px] font-bold text-white uppercase dark:bg-white dark:text-neutral-900">
              Lab
            </span>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-neutral-600 dark:text-neutral-300">
            <a href="#" className="hover:text-black dark:hover:text-white transition-colors duration-200">New Releases</a>
            <a href="#" className="hover:text-black dark:hover:text-white transition-colors duration-200">Running</a>
            <a href="#" className="hover:text-black dark:hover:text-white transition-colors duration-200">Lifestyle</a>
            <a href="#" className="hover:text-black dark:hover:text-white transition-colors duration-200">Basketball</a>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* User Profile */}
            {user ? (
              <div className="flex items-center space-x-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 font-semibold text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {user.name}
                </span>
                <button
                  onClick={() => setUser(null)}
                  className="text-xs text-neutral-400 hover:text-red-500 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthMode("login");
                  setShowAuthModal(true);
                }}
                className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-all duration-200"
              >
                <LogIn size={15} />
                <span>Sign In</span>
              </button>
            )}

            {/* Shopping Cart Button */}
            <button
              onClick={toggleCart}
              className="relative rounded-full p-2.5 text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-all duration-200"
              aria-label="Shopping Cart"
            >
              <ShoppingBag size={20} />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black text-[10px] font-black text-white animate-pulse dark:bg-white dark:text-black">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-neutral-100 bg-white p-6 shadow-2xl dark:border-neutral-800 dark:bg-neutral-950 animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white mb-6">
              {authMode === "login" ? "Sign in to your account" : "Create your account"}
            </h3>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === "signup" && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm outline-none focus:border-black dark:border-neutral-800 dark:bg-neutral-900 dark:focus:border-white transition-colors"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm outline-none focus:border-black dark:border-neutral-800 dark:bg-neutral-900 dark:focus:border-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-sm outline-none focus:border-black dark:border-neutral-800 dark:bg-neutral-900 dark:focus:border-white transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-black py-3 text-sm font-bold text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-200 transition-colors"
              >
                {loading ? "Please wait..." : authMode === "login" ? "Sign In" : "Register"}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-neutral-500">
              {authMode === "login" ? (
                <p>
                  Don't have an account?{" "}
                  <button
                    onClick={() => setAuthMode("signup")}
                    className="font-bold text-black dark:text-white hover:underline"
                  >
                    Sign up
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{" "}
                  <button
                    onClick={() => setAuthMode("login")}
                    className="font-bold text-black dark:text-white hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
