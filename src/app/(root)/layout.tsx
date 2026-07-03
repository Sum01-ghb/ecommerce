import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import CartProvider from "@/components/CartProvider";

/**
 * Root group layout — wraps all standard storefront pages
 * with the shared Navbar, Footer, CartDrawer, and CartProvider.
 *
 * CartProvider hydrates the Zustand cart store from the server
 * on first client mount so every page starts with accurate cart state.
 */
export default function RootGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <CartProvider />
      <Navbar />
      <CartDrawer />
      <main className="flex-1 flex flex-col">{children}</main>
      <Footer />
    </>
  );
}
