import Image from "next/image";
import Link from "next/link";

/**
 * Auth group layout — clean split-screen design.
 * Left panel: brand imagery. Right panel: form content.
 * On mobile the brand panel is replaced by a compact top bar.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* ── Left brand panel (hidden on mobile) ─────────────────── */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-dark-900 flex-col">
        {/* Background image */}
        <Image
          src="/hero-bg.png"
          alt=""
          fill
          priority
          className="object-cover object-center opacity-30"
        />

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-dark-900/90 via-dark-900/60 to-transparent" />

        {/*/!* Shoe image *!/*/}
        {/*<div className="absolute inset-0">*/}
        {/*  <Image*/}
        {/*    src="/hero-shoe.png"*/}
        {/*    alt="Featured Nike shoe"*/}
        {/*    fill*/}
        {/*    priority*/}
        {/*    className="object-contain object-center scale-110"*/}
        {/*  />*/}
        {/*</div>*/}

        {/* Brand content */}
        <div className="relative z-10 flex flex-col justify-between h-full p-10 xl:p-14">
          {/* Logo */}
          <Link href="/" aria-label="Back to Nike store">
            <Image
              src="/logo.svg"
              alt="Nike"
              width={64}
              height={24}
              className="invert brightness-0 filter"
            />
          </Link>

          {/* Tagline */}
          <div className="max-w-sm">
            <p className="text-caption font-medium text-green uppercase tracking-widest mb-3">
              Just Do It
            </p>
            <h2 className="text-heading-2 font-bold text-light-100 leading-tight mb-4">
              Move with<br />Purpose.
            </h2>
            <p className="text-body text-dark-500">
              Join thousands of athletes and sneakerheads who trust Nike for
              performance-driven style.
            </p>
          </div>

          {/* Footer note */}
          <p className="text-footnote text-dark-700">
            &copy; {new Date().getFullYear()} Nike, Inc. All rights reserved.
          </p>
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen bg-light-200">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-dark-900">
          <Link href="/" aria-label="Back to Nike store">
            <Image
              src="/logo.svg"
              alt="Nike"
              width={52}
              height={19}
              className="invert brightness-0 filter"
            />
          </Link>
          <Link
            href="/"
            className="text-footnote text-dark-500 hover:text-light-100 transition-colors"
          >
            ← Back to store
          </Link>
        </header>

        {/* Form content */}
        <div className="flex-1 flex items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-105">{children}</div>
        </div>
      </div>
    </div>
  );
}
