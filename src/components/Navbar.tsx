"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/cart.store";
import { authClient } from "@/lib/auth-client";

const NAV_LINKS = [
  { label: "Men",         href: "/products?gender=men" },
  { label: "Women",       href: "/products?gender=women" },
  { label: "Kids",        href: "/products?gender=kids" },
  { label: "Collections", href: "/products" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { items, toggleCart } = useCartStore();
  const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
  const { data: session } = authClient.useSession();
  const profileRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    await authClient.signOut();
    setProfileOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileOpen]);

  return (
    <header className="sticky top-0 z-50 bg-dark-900 text-light-100">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-16">
        <div className="flex h-14 items-center justify-between gap-6">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0" aria-label="Nike Home">
            <Image
              src="/logo.svg"
              alt="Nike"
              width={58}
              height={21}
              className="invert brightness-0 filter"
              priority
            />
          </Link>

          {/* Desktop Nav Links */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-6"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-footnote font-medium text-light-300 hover:text-light-100 transition-colors duration-150"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-5">
            {/* Profile / Sign In */}
            {session ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen((prev) => !prev)}
                  className="text-footnote font-medium text-light-300 hover:text-light-100 transition-colors duration-150 flex items-center gap-1.5"
                  aria-label="Profile"
                  aria-expanded={profileOpen}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Profile
                </button>

                {/* Profile Dropdown */}
                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-light-100 rounded-sm shadow-lg border border-light-400 py-2 z-50">
                    <div className="px-4 py-2 border-b border-light-300">
                      <p className="text-caption text-dark-500">Signed in as</p>
                      <p className="text-body font-medium text-dark-900 truncate">
                        {session.user.email}
                      </p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-body text-dark-700 hover:bg-light-300 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/sign-in"
                className="text-footnote font-medium text-light-300 hover:text-light-100 transition-colors duration-150"
              >
                Sign In
              </Link>
            )}

            {/* Cart */}
            <button
              onClick={toggleCart}
              aria-label={`Shopping cart, ${totalItems} items`}
              className="relative text-footnote font-medium text-light-300 hover:text-light-100 transition-colors duration-150 flex items-center gap-1.5"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="8" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              </svg>
              My Cart
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-3 flex h-4 w-4 items-center justify-center rounded-full bg-red text-[9px] font-bold text-white">
                  {totalItems}
                </span>
              )}
            </button>
          </div>

          {/* Mobile: cart + hamburger */}
          <div className="flex md:hidden items-center gap-4">
            <button
              onClick={toggleCart}
              aria-label="Cart"
              className="relative text-light-300 hover:text-light-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="8" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red text-[9px] font-bold text-white">
                  {totalItems}
                </span>
              )}
            </button>

            <button
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((prev) => !prev)}
              className="text-light-300 hover:text-light-100"
            >
              {mobileOpen ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="4" x2="20" y1="12" y2="12" />
                  <line x1="4" x2="20" y1="6" y2="6" />
                  <line x1="4" x2="20" y1="18" y2="18" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileOpen && (
        <nav
          aria-label="Mobile navigation"
          className="md:hidden border-t border-white/10 bg-dark-900"
        >
          <ul className="flex flex-col">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="block px-6 py-3.5 text-body text-light-300 hover:bg-white/5 hover:text-light-100 transition-colors border-b border-white/5"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              {session ? (
                <>
                  <div className="px-6 py-3.5 text-body text-light-300 border-b border-white/5">
                    {session.user.email}
                  </div>
                  <button
                    onClick={async () => {
                      await authClient.signOut();
                      setMobileOpen(false);
                    }}
                    className="w-full text-left px-6 py-3.5 text-body text-light-300 hover:bg-white/5 hover:text-light-100 transition-colors border-b border-white/5"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/sign-in"
                  className="block px-6 py-3.5 text-body text-light-300 hover:bg-white/5 hover:text-light-100 transition-colors border-b border-white/5"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign In
                </Link>
              )}
            </li>
            <li>
              <Link
                href="/sign-up"
                className="block px-6 py-3.5 text-body text-light-300 hover:bg-white/5 hover:text-light-100 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                Sign Up
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
