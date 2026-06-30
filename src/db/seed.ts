import "dotenv/config";
import { db } from "./index";
import { products } from "./schema";
import { eq } from "drizzle-orm";

// All images use local /public/shoes/ assets — no external hosts required
const nikeItems = [
  {
    name: "Nike Air Force 1 Mid '07",
    description:
      "The radiance lives on in the Nike Air Force 1 '07, the basketball original that puts a fresh spin on what you know best: durably stitched overlays, clean finishes and the perfect amount of flash.",
    price: 10500, // $105.00
    imageUrl: "/shoes/shoe-1.jpg",
    category: "Lifestyle",
  },
  {
    name: "Nike Court Vision Low Next Nature",
    description:
      "Born from the hardwood and built for the streets. The Nike Court Vision Low Next Nature uses at least 20% recycled content by weight, so you can look good and feel good about it.",
    price: 8000, // $80.00
    imageUrl: "/shoes/shoe-2.webp",
    category: "Lifestyle",
  },
  {
    name: "Nike Dunk Low Premium",
    description:
      "Created for the hardwood but taken to the streets, the Nike Dunk Low Retro returns with crisp overlays and original team colors. This basketball icon channels '80s vibes.",
    price: 11000, // $110.00
    imageUrl: "/shoes/shoe-3.webp",
    category: "Lifestyle",
  },
  {
    name: "Nike Air Max 270",
    description:
      "Featuring Nike's first lifestyle Air unit, the Nike Air Max 270 delivers visible cushioning under every step. Updated for modern comfort, it nods to the original 1991 Air Max 180.",
    price: 15000, // $150.00
    imageUrl: "/shoes/shoe-4.webp",
    category: "Lifestyle",
  },
  {
    name: "Nike Pegasus 41",
    description:
      "Responsive cushioning in the Pegasus provides an energized ride for everyday road running. Experience lightweight energy return with dual ReactX foam technology.",
    price: 14000, // $140.00
    imageUrl: "/shoes/shoe-5.avif",
    category: "Running",
  },
  {
    name: "Air Jordan 1 Retro High OG",
    description:
      "Familiar but always fresh, the iconic Air Jordan 1 is remastered for today's sneakerhead culture. This Retro High OG edition features premium leather and comfortable cushioning.",
    price: 18000, // $180.00
    imageUrl: "/shoes/shoe-6.avif",
    category: "Basketball",
  },
  {
    name: "Nike ZoomX Vaporfly Next% 3",
    description:
      "Catch 'em if you can. Giving you race-day speed to conquer any distance, the Nike ZoomX Vaporfly Next% 3 is made for the seekers, the racers and the elevated pacers.",
    price: 26000, // $260.00
    imageUrl: "/shoes/shoe-7.avif",
    category: "Running",
  },
  {
    name: "Nike React Presto",
    description:
      "The Nike React Presto blends innovation with a bold look. React foam gives a smooth, comfortable ride for everyday life, while an elastic upper hugs your foot for a snug fit.",
    price: 13000, // $130.00
    imageUrl: "/shoes/shoe-8.avif",
    category: "Lifestyle",
  },
  {
    name: "Nike Air Max 97",
    description:
      "The iconic wavy lines of the Nike Air Max 97 are inspired by bullet trains and Japanese water ripples. Full-length Nike Air cushioning gives you a smooth, comfortable ride.",
    price: 17500, // $175.00
    imageUrl: "/shoes/shoe-9.avif",
    category: "Lifestyle",
  },
  {
    name: "Nike Invincible 3",
    description:
      "The Nike Invincible 3 will keep you on the run. Our softest ZoomX foam cushioning yet provides an ultra-plush feel with every step, keeping you going mile after mile.",
    price: 19000, // $190.00
    imageUrl: "/shoes/shoe-10.avif",
    category: "Running",
  },
  {
    name: "Nike Air Zoom Pegasus Trail 4",
    description:
      "Hit the trail with the Nike Air Zoom Pegasus Trail 4. Whether you're on gravel paths or light technical terrain, this shoe gives you the responsiveness and traction you need.",
    price: 16000, // $160.00
    imageUrl: "/shoes/shoe-11.avif",
    category: "Running",
  },
  {
    name: "Nike Blazer Mid '77 Vintage",
    description:
      "Inspired by Nike's earliest forays into basketball, the Nike Blazer Mid '77 Vintage brings back the look of the '70s with a high-stacked foxing, vintage styling and premium materials.",
    price: 10000, // $100.00
    imageUrl: "/shoes/shoe-12.avif",
    category: "Lifestyle",
  },
];

async function main() {
  console.log("Clearing existing products...");
  try {
    // Delete all existing rows so we don't duplicate on re-seed
    await db.delete(products);
    console.log("Existing products cleared.");

    console.log("Seeding database with Nike items...");
    for (const item of nikeItems) {
      await db.insert(products).values(item);
      console.log(`  ✓ ${item.name}`);
    }
    console.log(`\nDatabase seeded successfully with ${nikeItems.length} products!`);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

main();
