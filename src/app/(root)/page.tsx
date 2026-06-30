import React from "react";
import { db } from "@/db";
import { products } from "@/db/schema";
import Card from "@/components/Card";
import type { CardProps } from "@/components/Card";
import Image from "next/image";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

// ------------------------------------------------------------------
// Static fallback data used when the DB is not yet connected
// ------------------------------------------------------------------
const FALLBACK_PRODUCTS: CardProps[] = [
  {
    id: 1,
    name: "Nike Air Force 1 Mid '07",
    category: "Men's Shoes",
    colourCount: 4,
    price: 10500,
    imageSrc: "/shoes/shoe-1.jpg",
    badge: "best-seller",
  },
  {
    id: 2,
    name: "Nike Court Vision Low Next Nature",
    category: "Men's Shoes",
    colourCount: 4,
    price: 8000,
    originalPrice: 9500,
    imageSrc: "/shoes/shoe-2.webp",
    badge: "sale",
    discountLabel: "20% off",
  },
  {
    id: 3,
    name: "Nike Dunk Low Retro",
    category: "Men's Shoes",
    colourCount: 4,
    price: 11000,
    originalPrice: 13000,
    imageSrc: "/shoes/shoe-3.webp",
    badge: "sale",
    discountLabel: "15% off",
  },
  {
    id: 4,
    name: "Nike Air Max 270",
    category: "Men's Shoes",
    colourCount: 3,
    price: 15000,
    imageSrc: "/shoes/shoe-4.webp",
  },
  {
    id: 5,
    name: "Nike Pegasus 41",
    category: "Running Shoes",
    colourCount: 6,
    price: 14000,
    imageSrc: "/shoes/shoe-5.avif",
    badge: "new",
  },
  {
    id: 6,
    name: "Air Jordan 1 Retro High OG",
    category: "Basketball",
    colourCount: 2,
    price: 18000,
    imageSrc: "/shoes/shoe-6.avif",
  },
];

// ------------------------------------------------------------------
// DB query with fallback
// ------------------------------------------------------------------
async function getProducts() {
  try {
    const rows = await db.select().from(products);
    if (rows.length === 0) return { data: FALLBACK_PRODUCTS, usingFallback: true, empty: true };
    const mapped: CardProps[] = rows.map((p, i) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
      imageSrc: p.imageUrl,
      badge: i === 0 ? "best-seller" : i < 3 ? "sale" : "none",
      discountLabel: i < 3 && i !== 0 ? "20% off" : undefined,
      colourCount: 4,
    }));
    return { data: mapped, usingFallback: false, empty: false };
  } catch {
    return { data: FALLBACK_PRODUCTS, usingFallback: true, empty: false };
  }
}

// ------------------------------------------------------------------
// Page
// ------------------------------------------------------------------
export default async function Home() {
  const { data, usingFallback } = await getProducts();

  return (
    <div className="flex-1">
      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative w-full min-h-[480px] md:min-h-[560px] overflow-hidden bg-light-300">
        {/* Background image */}
        <Image
          src="/hero-bg.png"
          alt=""
          fill
          priority
          className="object-cover object-center"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-light-100/80 via-light-100/40 to-transparent" />

        {/* Hero shoe */}
        <div className="absolute right-0 inset-y-0 w-1/2 hidden sm:block">
          <Image
            src="/hero-shoe.png"
            alt="Featured shoe"
            fill
            priority
            className="object-contain object-right-bottom"
          />
        </div>

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-16 h-full flex items-center py-20 sm:py-28">
          <div className="max-w-lg">
            <p className="text-caption font-medium text-green uppercase tracking-widest mb-2">
              Bold &amp; Sports
            </p>
            <h1 className="text-heading-2 font-bold text-dark-900 leading-tight mb-4">
              Style That Moves<br className="hidden sm:block" /> With You.
            </h1>
            <p className="text-body text-dark-700 mb-8 max-w-sm">
              Not just style. Not just comfort. Footwear that effortlessly moves
              with your every step.
            </p>
            <Link
              href="#collection"
              className="inline-block rounded-sm bg-dark-900 px-6 py-3 text-caption font-medium text-light-100 hover:bg-black transition-colors duration-150"
            >
              Find Your Store
            </Link>
          </div>
        </div>
      </section>

      {/* ── DB warning ─────────────────────────────────────────── */}
      {usingFallback && (
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-16 mt-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-sm border border-orange/40 bg-orange/5 px-4 py-3">
            <AlertTriangle size={18} className="flex-shrink-0 text-orange mt-0.5 sm:mt-0" />
            <div className="flex-1 min-w-0">
              <p className="text-caption font-medium text-dark-900">Showing demo products</p>
              <p className="text-footnote text-dark-700 mt-0.5">
                Add a valid <code className="font-mono bg-light-300 px-1 rounded">DATABASE_URL</code> to{" "}
                <code className="font-mono bg-light-300 px-1 rounded">.env</code>, then run{" "}
                <code className="font-mono bg-light-300 px-1 rounded">npm run db:migrate</code> and{" "}
                <code className="font-mono bg-light-300 px-1 rounded">npm run db:seed</code>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Best of Air Max ────────────────────────────────────── */}
      <section id="collection" className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-16 py-12">
        <h2 className="text-heading-3 font-medium text-dark-900 mb-6">Best of Air Max</h2>
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-2 md:grid-cols-3 lg:gap-x-6">
          {data.map((product) => (
            <Card key={product.id} {...product} />
          ))}
        </div>
      </section>

      {/* ── Trending Now ───────────────────────────────────────── */}
      <section className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-16 pb-16">
        <h2 className="text-heading-3 font-medium text-dark-900 mb-6">Trending Now</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Large feature card */}
          <div className="relative col-span-1 md:row-span-2 aspect-[4/3] md:aspect-auto overflow-hidden rounded-sm bg-dark-900 min-h-[300px]">
            <Image
              src="/trending-1.png"
              alt="React Presto"
              fill
              className="object-cover object-center opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-900/70 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 p-6 sm:p-8">
              <h3 className="text-heading-2 font-bold text-light-100 uppercase mb-2">
                React Presto
              </h3>
              <p className="text-body text-light-300 mb-5 max-w-xs">
                With React foam for the most comfortable Presto ever.
              </p>
              <Link
                href="#"
                className="inline-block rounded-full bg-light-100 px-5 py-2.5 text-caption font-medium text-dark-900 hover:bg-light-300 transition-colors duration-150"
              >
                Shop Now
              </Link>
            </div>
          </div>

          {/* Two smaller trending cards */}
          <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-dark-700 min-h-[200px]">
            <Image
              src="/trending-2.png"
              alt="Summer Must-Haves: Air Max Dia"
              fill
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-900/60 to-transparent" />
            <p className="absolute bottom-4 left-5 text-body-medium font-medium text-light-100">
              Summer Must-Haves: Air Max Dia
            </p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-dark-700 min-h-[200px]">
            <Image
              src="/trending-3.png"
              alt="Air Jordan 11 Retro Low LE"
              fill
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-900/60 to-transparent" />
            <p className="absolute bottom-4 left-5 text-body-medium font-medium text-light-100">
              Air Jordan 11 Retro Low LE
            </p>
          </div>
        </div>
      </section>

      {/* ── Feature CTA Banner ─────────────────────────────────── */}
      <section className="relative overflow-hidden bg-light-300 min-h-[400px]">
        {/* Diagonal orange accent */}
        <div className="absolute right-0 top-0 h-full w-1/3 bg-orange/20 skew-x-[-12deg] origin-top-right" />

        {/* Feature shoe */}
        <div className="absolute right-0 inset-y-0 w-1/2 hidden sm:block">
          <Image
            src="/feature.png"
            alt="Nike React Presto By You"
            fill
            className="object-contain object-right-bottom"
          />
        </div>

        <div className="relative z-10 mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-16 py-20 sm:py-28">
          <div className="max-w-md">
            <p className="text-caption font-medium text-green uppercase tracking-widest mb-2">
              Bold &amp; Sports
            </p>
            <h2 className="text-heading-2 font-bold text-dark-900 uppercase mb-4">
              Nike React<br />Presto By You
            </h2>
            <p className="text-body text-dark-700 mb-8">
              Take advantage of brand new, proprietary cushioning technology with a
              fresh pair of Nike react shoes.
            </p>
            <Link
              href="#"
              className="inline-block rounded-sm bg-dark-900 px-6 py-3 text-caption font-medium text-light-100 hover:bg-black transition-colors duration-150"
            >
              Shop Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
