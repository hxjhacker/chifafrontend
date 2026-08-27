"use client";

import { usePathname } from "next/navigation";
import { CartProvider, useCart } from "@/lib/cart";
import { Footer, Header, TopBar } from "./Chrome";
import { AnnouncementBar } from "./educative/AnnouncementBar";
import { CartDrawer } from "./CartDrawer";
import { CheckoutModal } from "./CheckoutModal";
import { UpsellModal } from "./UpsellModal";
import { PixelLoader } from "./PixelLoader";

function ShellInner({ children }: { children: React.ReactNode }) {
  const cart = useCart();
  const pathname = usePathname();
  const isProductLp = pathname === "/product" || pathname.startsWith("/products/");
  return (
    <>
      <PixelLoader />
      <div className={isProductLp ? "block" : "hidden"} hidden={!isProductLp}>
        <AnnouncementBar />
      </div>
      <div className={isProductLp ? "hidden" : "block"} hidden={isProductLp}>
        <TopBar />
      </div>
      {isProductLp ? null : <Header cartCount={cart.itemCount} onCart={() => cart.setDrawer(true)} />}
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
