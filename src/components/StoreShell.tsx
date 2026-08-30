"use client";

import { usePathname } from "next/navigation";
import { CartProvider } from "@/lib/cart";
import { BackToTop, Footer, Header, TopBar, WhatsAppFloat } from "./Chrome";
import { CartDrawer } from "./CartDrawer";
import { CheckoutModal } from "./CheckoutModal";
import { UpsellModal } from "./UpsellModal";
import { PixelLoader } from "./PixelLoader";

function ShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const raisedFloats = pathname === "/product" || pathname.startsWith("/products/");
  return (
    <>
      <PixelLoader />
      <TopBar />
      <Header />
      {children}
      <Footer />
      <WhatsAppFloat raised={raisedFloats} />
      <BackToTop raised={raisedFloats} />
      <CartDrawer />
      <CheckoutModal />
      <UpsellModal />
    </>
  );
}

export function StoreShell({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <ShellInner>{children}</ShellInner>
    </CartProvider>
  );
}
