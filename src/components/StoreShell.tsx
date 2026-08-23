"use client";

import { CartProvider, useCart } from "@/lib/cart";
import { Footer, Header, TopBar } from "./Chrome";
import { CartDrawer } from "./CartDrawer";
import { CheckoutModal } from "./CheckoutModal";
import { UpsellModal } from "./UpsellModal";
import { PixelLoader } from "./PixelLoader";

function ShellInner({ children }: { children: React.ReactNode }) {
  const cart = useCart();
  return (
    <>
      <PixelLoader />
      <TopBar />
      <Header cartCount={cart.itemCount} onCart={() => cart.setDrawer(true)} />
      {children}
      <Footer />
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
