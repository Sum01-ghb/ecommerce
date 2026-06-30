import "dotenv/config";
import { db } from "./index";
import { products } from "./schema";

const nikeItems = [
  {
    name: "Nike Air Max 270",
    description: "Featuring Nike's first lifestyle Air unit, the Nike Air Max 270 delivers visible cushioning under every step. Updated for modern comfort, it nods to the original 1991 Air Max 180.",
    price: 15000, // $150.00
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop",
    category: "Lifestyle",
  },
  {
    name: "Nike Air Force 1 '07",
    description: "The radiance lives on in the Nike Air Force 1 '07, the basketball original that puts a fresh spin on what you know best: durably stitched overlays, clean finishes and the perfect amount of flash.",
    price: 11500, // $115.00
    imageUrl: "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=80&w=600&auto=format&fit=crop",
    category: "Lifestyle",
  },
  {
    name: "Nike ZoomX Vaporfly Next% 3",
    description: "Catch 'em if you can. Giving you race-day speed to conquer any distance, the Nike ZoomX Vaporfly Next% 3 is made for the seekers, the racers and the elevated pacers who can't turn down the thrill of the chase.",
    price: 26000, // $260.00
    imageUrl: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?q=80&w=600&auto=format&fit=crop",
    category: "Running",
  },
  {
    name: "Nike Dunk Low Premium",
    description: "Created for the hardwood but taken to the streets, the Nike Dunk Low Retro returns with crisp overlays and original team colors. This basketball icon channels '80s vibes.",
    price: 12500, // $125.00
    imageUrl: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=600&auto=format&fit=crop",
    category: "Lifestyle",
  },
  {
    name: "Nike Pegasus 41",
    description: "Responsive cushioning in the Pegasus provides an energized ride for everyday road running. Experience lightweight energy return with dual ReactX foam technology.",
    price: 14000, // $140.00
    imageUrl: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?q=80&w=600&auto=format&fit=crop",
    category: "Running",
  },
  {
    name: "Air Jordan 1 Retro High OG",
    description: "Familiar but always fresh, the iconic Air Jordan 1 is remastered for today's sneakerhead culture. This Retro High OG edition features premium leather and comfortable cushioning.",
    price: 18000, // $180.00
    imageUrl: "https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=600&auto=format&fit=crop",
    category: "Basketball",
  },
];

async function main() {
  console.log("Seeding database with Nike items...");
  try {
    for (const item of nikeItems) {
      await db.insert(products).values(item);
      console.log(`Inserted product: ${item.name}`);
    }
    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

main();
