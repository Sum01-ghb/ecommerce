import type { BadgeVariant } from "@/components/Card";

export type GenderSlug = "men" | "women" | "kids" | "unisex";
export type ColorSlug = "white" | "black" | "red" | "blue" | "grey" | "green" | "brown";
export type SizeSlug =
  "us-6" | "us-7" | "us-8" | "us-9" | "us-10" | "us-11" | "us-12" | "us-13";
export type CategorySlug = "lifestyle" | "running" | "basketball" | "trail";

export interface MockColor {
  slug: ColorSlug;
  name: string;
  hexCode: string;
}

export interface MockProduct {
  id: number;
  name: string;

  category: string;
  categorySlug: CategorySlug;
  gender: string;
  genderSlug: GenderSlug;

  colors: MockColor[];

  sizes: SizeSlug[];

  price: number;

  originalPrice?: number;
  imageSrc: string;
  badge?: BadgeVariant;
  discountLabel?: string;

  createdAt: number;
  description: string;
}

const WHITE: MockColor = { slug: "white", name: "White", hexCode: "#FFFFFF" };
const BLACK: MockColor = { slug: "black", name: "Black", hexCode: "#000000" };
const RED: MockColor = { slug: "red", name: "Red", hexCode: "#D33918" };
const BLUE: MockColor = { slug: "blue", name: "Blue", hexCode: "#1E40AF" };
const GREY: MockColor = { slug: "grey", name: "Grey", hexCode: "#808080" };
const GREEN: MockColor = { slug: "green", name: "Green", hexCode: "#007D48" };
const BROWN: MockColor = { slug: "brown", name: "Brown", hexCode: "#964B00" };

const ALL_SIZES: SizeSlug[] = [
  "us-6",
  "us-7",
  "us-8",
  "us-9",
  "us-10",
  "us-11",
  "us-12",
  "us-13",
];

export const MOCK_PRODUCTS: MockProduct[] = [
  {
    id: 1,
    name: "Nike Air Force 1 Mid '07",
    category: "Men's Shoes",
    categorySlug: "lifestyle",
    gender: "Men",
    genderSlug: "men",
    colors: [WHITE, BLACK, GREY],
    sizes: ["us-8", "us-9", "us-10", "us-11", "us-12"],
    price: 10500,
    imageSrc: "/shoes/shoe-1.jpg",
    badge: "best-seller",
    createdAt: 1_700_000_003,
    description:
      "The radiance lives on in the Nike Air Force 1 '07 — the basketball original with durably stitched overlays and the perfect amount of flash.",
  },
  {
    id: 2,
    name: "Nike Court Vision Low Next Nature",
    category: "Women's Shoes",
    categorySlug: "lifestyle",
    gender: "Women",
    genderSlug: "women",
    colors: [WHITE, GREY, GREEN],
    sizes: ["us-6", "us-7", "us-8", "us-9", "us-10"],
    price: 8000,
    originalPrice: 9500,
    imageSrc: "/shoes/shoe-2.webp",
    badge: "sale",
    discountLabel: "15% off",
    createdAt: 1_700_000_010,
    description:
      "Born from the hardwood, built for the streets. Made with at least 20% recycled content by weight.",
  },
  {
    id: 3,
    name: "Nike Dunk Low Premium",
    category: "Unisex Shoes",
    categorySlug: "lifestyle",
    gender: "Unisex",
    genderSlug: "unisex",
    colors: [WHITE, BLACK, RED, BLUE],
    sizes: ALL_SIZES,
    price: 11000,
    originalPrice: 13000,
    imageSrc: "/shoes/shoe-3.webp",
    badge: "sale",
    discountLabel: "15% off",
    createdAt: 1_700_000_008,
    description:
      "Created for the hardwood but taken to the streets — the Dunk Low Retro channels '80s vibes with a modern twist.",
  },
  {
    id: 4,
    name: "Nike Air Max 270",
    category: "Men's Shoes",
    categorySlug: "lifestyle",
    gender: "Men",
    genderSlug: "men",
    colors: [BLACK, GREY, BLUE],
    sizes: ["us-8", "us-9", "us-10", "us-11", "us-12", "us-13"],
    price: 15000,
    imageSrc: "/shoes/shoe-4.webp",
    badge: "new",
    createdAt: 1_700_000_015,
    description:
      "Featuring Nike's first lifestyle Air unit — visible cushioning under every step with a nod to the 1991 Air Max 180.",
  },
  {
    id: 5,
    name: "Nike Pegasus 41",
    category: "Men's Running Shoes",
    categorySlug: "running",
    gender: "Men",
    genderSlug: "men",
    colors: [BLUE, BLACK, GREEN],
    sizes: ["us-7", "us-8", "us-9", "us-10", "us-11", "us-12"],
    price: 14000,
    imageSrc: "/shoes/shoe-5.avif",
    badge: "new",
    createdAt: 1_700_000_020,
    description:
      "Responsive cushioning for everyday road running with dual ReactX foam delivering 13% more energy return.",
  },
  {
    id: 6,
    name: "Air Jordan 1 Retro High OG",
    category: "Men's Basketball Shoes",
    categorySlug: "basketball",
    gender: "Men",
    genderSlug: "men",
    colors: [BLACK, RED, WHITE],
    sizes: ["us-8", "us-9", "us-10", "us-11", "us-12"],
    price: 18000,
    imageSrc: "/shoes/shoe-6.avif",
    badge: "best-seller",
    createdAt: 1_700_000_001,
    description:
      "Familiar but always fresh — the iconic AJ1 remastered with premium leather and a visible Air-Sole unit.",
  },
  {
    id: 7,
    name: "Nike ZoomX Vaporfly Next% 3",
    category: "Running Shoes",
    categorySlug: "running",
    gender: "Unisex",
    genderSlug: "unisex",
    colors: [WHITE, GREEN, BLUE],
    sizes: ["us-7", "us-8", "us-9", "us-10", "us-11"],
    price: 26000,
    imageSrc: "/shoes/shoe-7.avif",
    createdAt: 1_700_000_018,
    description:
      "Race-day speed with an updated ZoomX foam formula and a new mesh upper for a smoother, more comfortable fit.",
  },
  {
    id: 8,
    name: "Nike React Presto",
    category: "Men's Shoes",
    categorySlug: "lifestyle",
    gender: "Men",
    genderSlug: "men",
    colors: [BLACK, GREY, RED],
    sizes: ["us-7", "us-8", "us-9", "us-10", "us-11"],
    price: 13000,
    originalPrice: 15000,
    imageSrc: "/shoes/shoe-8.avif",
    badge: "sale",
    discountLabel: "13% off",
    createdAt: 1_700_000_006,
    description:
      "React foam delivers a smooth, comfortable ride while the elastic upper hugs your foot for a sock-like fit.",
  },
  {
    id: 9,
    name: "Nike Air Max 97",
    category: "Unisex Shoes",
    categorySlug: "lifestyle",
    gender: "Unisex",
    genderSlug: "unisex",
    colors: [WHITE, BLACK, GREY, BLUE],
    sizes: ALL_SIZES,
    price: 17500,
    imageSrc: "/shoes/shoe-9.avif",
    badge: "best-seller",
    createdAt: 1_700_000_002,
    description:
      "Iconic wavy lines inspired by bullet trains and full-length Nike Air cushioning for a smooth, retro ride.",
  },
  {
    id: 10,
    name: "Nike Invincible 3",
    category: "Women's Running Shoes",
    categorySlug: "running",
    gender: "Women",
    genderSlug: "women",
    colors: [WHITE, GREY, GREEN],
    sizes: ["us-6", "us-7", "us-8", "us-9", "us-10"],
    price: 19000,
    imageSrc: "/shoes/shoe-10.avif",
    badge: "new",
    createdAt: 1_700_000_022,
    description:
      "Our softest ZoomX foam yet provides an ultra-plush feel mile after mile without sacrificing responsiveness.",
  },
  {
    id: 11,
    name: "Nike Air Zoom Pegasus Trail 4",
    category: "Men's Trail Shoes",
    categorySlug: "trail",
    gender: "Men",
    genderSlug: "men",
    colors: [GREEN, GREY, BLACK],
    sizes: ["us-8", "us-9", "us-10", "us-11", "us-12"],
    price: 16000,
    imageSrc: "/shoes/shoe-11.avif",
    createdAt: 1_700_000_011,
    description:
      "Responsive, protected trail running from gravel paths to technical terrain.",
  },
  {
    id: 12,
    name: "Nike Blazer Mid '77 Vintage",
    category: "Unisex Shoes",
    categorySlug: "lifestyle",
    gender: "Unisex",
    genderSlug: "unisex",
    colors: [WHITE, BLACK],
    sizes: ALL_SIZES,
    price: 10000,
    imageSrc: "/shoes/shoe-12.avif",
    createdAt: 1_700_000_004,
    description:
      "Inspired by Nike's earliest basketball forays, the Blazer Mid '77 brings back the look of the '70s.",
  },
  {
    id: 13,
    name: "Nike Free Run 5.0",
    category: "Women's Running Shoes",
    categorySlug: "running",
    gender: "Women",
    genderSlug: "women",
    colors: [WHITE, RED, BLUE],
    sizes: ["us-6", "us-7", "us-8", "us-9", "us-10"],
    price: 12000,
    imageSrc: "/shoes/shoe-13.avif",
    badge: "new",
    createdAt: 1_700_000_019,
    description:
      "Natural motion with a flexible sole that expands and contracts with your foot for fluid, unrestricted strides.",
  },
  {
    id: 14,
    name: "Nike Air Huarache",
    category: "Men's Shoes",
    categorySlug: "lifestyle",
    gender: "Men",
    genderSlug: "men",
    colors: [BLACK, WHITE, GREY],
    sizes: ["us-7", "us-8", "us-9", "us-10", "us-11", "us-12"],
    price: 13000,
    imageSrc: "/shoes/shoe-14.avif",
    badge: "best-seller",
    createdAt: 1_700_000_005,
    description:
      "Fusing 1991 roots with modern performance — neoprene inner sleeve and a lightweight outer shell.",
  },
  {
    id: 15,
    name: "Nike Revolution 7",
    category: "Kids' Running Shoes",
    categorySlug: "running",
    gender: "Kids",
    genderSlug: "kids",
    colors: [RED, BLUE, GREEN],
    sizes: ["us-6", "us-7", "us-8"],
    price: 7500,
    imageSrc: "/shoes/shoe-15.avif",
    badge: "new",
    createdAt: 1_700_000_025,
    description:
      "Lightweight cushioning for a smooth feel, perfect for your next run.",
  },
];

export const GENDER_OPTIONS = [
  { slug: "men", label: "Men" },
  { slug: "women", label: "Women" },
  { slug: "kids", label: "Kids" },
  { slug: "unisex", label: "Unisex" },
] as const;

export const COLOR_OPTIONS: MockColor[] = [
  WHITE,
  BLACK,
  RED,
  BLUE,
  GREY,
  GREEN,
  BROWN,
];

export const SIZE_OPTIONS = [
  { slug: "us-6", label: "US 6" },
  { slug: "us-7", label: "US 7" },
  { slug: "us-8", label: "US 8" },
  { slug: "us-9", label: "US 9" },
  { slug: "us-10", label: "US 10" },
  { slug: "us-11", label: "US 11" },
  { slug: "us-12", label: "US 12" },
  { slug: "us-13", label: "US 13" },
] as const;

export const PRICE_RANGES = [
  { label: "Under $50", min: 0, max: 5000 },
  { label: "$50 – $100", min: 5000, max: 10000 },
  { label: "$100 – $150", min: 10000, max: 15000 },
  { label: "Over $150", min: 15000, max: Infinity },
] as const;