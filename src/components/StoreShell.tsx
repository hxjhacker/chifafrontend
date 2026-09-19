"use client";

import { usePathname } from "next/navigation";
import { CartProvider } from "@/lib/cart";
import { BackToTop, Footer, Header, ThemeSync, TopBar, WhatsAppFloat } from "./Chrome";
import { PixelLoader } from "./PixelLoader";

function ShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/mydashboard") || pathname?.startsWith("/admin")) {
    return (
      <>
        <ThemeSync />
        {children}
      </>
    );
  }
  if (pathname?.startsWith("/lp")) {
    return (
      <>
        <ThemeSync />
        <PixelLoader />
        {children}
      </>
    );
  }
  const raisedFloats = pathname === "/" || pathname.startsWith("/products/");
  return (
    <>
      <ThemeSync />
      <PixelLoader />
      <div className={pathname === "/" ? "hidden md:block" : undefined}>
        <TopBar />
        <Header />
      </div>
      {children}
      <div className={pathname === "/" ? "hidden md:block" : undefined}>
        <Footer />
      </div>
      <WhatsAppFloat raised={raisedFloats} />
      <BackToTop raised={raisedFloats} />
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
