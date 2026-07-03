<h3 align="center">Nike Ecommerce Website</h3>

## 📋 <a name="table">Table of Contents</a>

1. ✨ [Introduction](#introduction)
2. ⚙️ [Tech Stack](#tech-stack)
3. 🔋 [Features](#features)
4. 🤸 [Quick Start](#quick-start)

## <a name="introduction">✨ Introduction</a>

**Name:** Sumit Patra

**Intern ID:** CITS5134

**Domain:** Full-Stack Web Development

Nike-style eCommerce built with  Next.js, Drizzle ORM, and Better Auth. This project includes sleek product pages powered by Next.js 16, TypeScript, and TailwindCSS. The backend runs on Neon PostgreSQL with Drizzle ORM, authentication is handled with Better Auth, and Zustand manages state — all packaged in a clean, modular UI.


## <a name="tech-stack">⚙️ Tech Stack</a>

- **[Better Auth](https://www.better-auth.com/)** is a framework-agnostic authentication and authorization library for TypeScript. It provides built-in support for email and password authentication, social sign-on and multi-factor authentication, simplifying user authentication and account management.

- **[Drizzle ORM](https://orm.drizzle.team/)** is a lightweight and performant TypeScript ORM designed with developer experience in mind. It provides a seamless interface between application code and database operations while maintaining high performance and reliability.

- **[Neon](https://neon.com/)** is a fully managed, serverless PostgreSQL database platform. It offers features like instant provisioning, autoscaling, and database branching, enabling developers to build scalable applications without managing infrastructure.

- **[Next.js](https://nextjs.org/docs)** is a powerful React framework for building full-stack web applications. It simplifies development with features like server-side rendering, static site generation, and API routes, enabling developers to focus on building products and shipping quickly.

- **[TailwindCSS](https://tailwindcss.com/)** is a utility-first CSS framework that allows developers to build custom, responsive designs quickly without leaving their HTML. It provides pre-defined classes for layout, typography, colors, and more.

- **[TypeScript](https://www.typescriptlang.org/)** is a superset of JavaScript that adds static typing, providing better tooling, code quality, and error detection for developers. It is ideal for building large-scale applications and enhances the development experience.

- **[Zustand](https://zustand-demo.pmnd.rs)** is a minimal, hook-based state management library for React. It lets you manage global state with zero boilerplate, no context providers, and excellent performance through selective state subscriptions.

- **[Stripe](https://stripe.com/)** is a secure and developer-friendly payment platform that enables seamless online transactions. It provides hosted Checkout, webhook support, and reliable payment processing, making it easy to integrate fast and secure payments into modern applications.

## <a name="features">🔋 Features</a>

👉 **Landing Page**: A fast, engaging homepage that introduces your brand and products with smooth animations and clear calls to action.

👉 **Product Listing Page**: Browse all products with filters, sorting, and real-time availability for dynamic updates.

👉 **Product Details Page**: Detailed product info, images, and reviews with AI-enhanced descriptions to help customers make confident buying decisions.

👉 **Auth Pages**: Secure and seamless user signup, login, and password recovery using Better Auth, ensuring smooth access without backend hassles.

👉 **Cart Functionality**: Authenticated users and guest users can seamlessly add, update, and manage products in their shopping cart, ensuring a smooth shopping experience across browsing sessions.

👉 **Stripe Payment Integration**: Securely complete purchases through Stripe Checkout with a fast and reliable payment flow.

## <a name="quick-start">🤸 Quick Start</a>

Follow these steps to set up the project locally on your machine.

**Prerequisites**

Make sure you have the following installed on your machine:

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/en)
- [npm](https://www.npmjs.com/) (Node Package Manager)

**Cloning the Repository**

```bash
git clone https://github.com/Sum01-ghb/ecommerce.git
cd ecommerce
```

**Installation**

Install the project dependencies using npm:

```bash
npm install
```

**Set Up Environment Variables**

Create a new file named `.env` in the root of your project and add the following content:

```env
# Database
DATABASE_URL="postgresql://username:password@host:port/database"

# App url
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Better Auth
BETTER_AUTH_SECRET="your-secret-key-here"
BETTER_AUTH_URL="http://localhost:3000"

# Stripe
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""

# Google OAuth (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
NEXT_PUBLIC_GOOGLE_ENABLED="true"
```

Replace the placeholder values with your credentials. You can get these by signing up at: [**NeonDB**](https://neon.com/), [**Better-Auth**](https://www.better-auth.com/), [**Stripe**](https://stripe.com/).

**Running the Project**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the project.