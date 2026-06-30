import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";

/**
 * Root group layout — wraps all standard storefront pages
 * with the shared Navbar, Footer, and CartDrawer.
 */
export default function RootGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <CartDrawer />
      <main className="flex-1 flex flex-col">{children}</main>
      <Footer />
    </>
  );
}
