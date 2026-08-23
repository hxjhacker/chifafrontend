"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { otherProducts } from "./products";
import { trackFunnel } from "./tracking";
import { TIERS } from "./cn";

export type TierQty = 1 | 2 | 3;

type CartState = {
  productSlug: string | null;
  tierQty: TierQty;
  crossSellSlug: string | null;
  drawerOpen: boolean;
  checkoutOpen: boolean;
  upsellOpen: boolean;
  orderId: string | null;
  eventId: string | null;
};

const empty: CartState = {
  productSlug: null,
  tierQty: 2,
  crossSellSlug: null,
  drawerOpen: false,
  checkoutOpen: false,
  upsellOpen: false,
  orderId: null,
  eventId: null,
};

type CartApi = CartState & {
  addAndOpen: (slug: string, qty: TierQty) => void;
  setTier: (qty: TierQty) => void;
  toggleCrossSell: () => void;
  openCheckout: () => void;
  closeAll: () => void;
  setDrawer: (open: boolean) => void;
  setCheckout: (open: boolean) => void;
  onOrderCreated: (orderId: string) => void;
  closeUpsell: () => void;
  itemCount: number;
  tierPrice: number;
  totalPreview: number;
  suggestedCross: string | null;
};

const Ctx = createContext<CartApi | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartState>(empty);

  const suggestedCross = state.productSlug
    ? otherProducts(state.productSlug)[0]?.slug ?? null
    : null;

  const addAndOpen = useCallback((slug: string, qty: TierQty) => {
    const eventId = trackFunnel("AddToCart", {
      value: TIERS.find((t) => t.qty === qty)?.price,
      contentIds: [slug],
    });
    setState((s) => ({
      ...s,
      productSlug: slug,
      tierQty: qty,
      drawerOpen: true,
      checkoutOpen: false,
      eventId,
      crossSellSlug: s.productSlug === slug ? s.crossSellSlug : null,
    }));
  }, []);

  const setTier = useCallback((qty: TierQty) => {
    setState((s) => ({ ...s, tierQty: qty }));
  }, []);

  const toggleCrossSell = useCallback(() => {
    setState((s) => {
      const next = suggestedCross && s.crossSellSlug ? null : suggestedCross;
      return { ...s, crossSellSlug: next };
    });
  }, [suggestedCross]);

  const openCheckout = useCallback(() => {
    trackFunnel("InitiateCheckout", {
      value: TIERS.find((t) => t.qty === state.tierQty)?.price,
      contentIds: state.productSlug ? [state.productSlug] : [],
    });
    setState((s) => ({ ...s, checkoutOpen: true, drawerOpen: true }));
  }, [state.tierQty, state.productSlug]);

  const closeAll = useCallback(() => setState((s) => ({ ...s, drawerOpen: false, checkoutOpen: false })), []);
  const setDrawer = useCallback((open: boolean) => setState((s) => ({ ...s, drawerOpen: open })), []);
  const setCheckout = useCallback((open: boolean) => setState((s) => ({ ...s, checkoutOpen: open })), []);

  const onOrderCreated = useCallback((orderId: string) => {
    setState((s) => ({
      ...s,
      orderId,
      checkoutOpen: false,
      drawerOpen: false,
      upsellOpen: true,
    }));
  }, []);

  const closeUpsell = useCallback(() => setState((s) => ({ ...s, upsellOpen: false })), []);

  const tierPrice = TIERS.find((t) => t.qty === state.tierQty)?.price ?? 199;
  const totalPreview = tierPrice + (state.crossSellSlug ? 199 : 0);
  const itemCount =
    (state.productSlug ? state.tierQty : 0) + (state.crossSellSlug ? 1 : 0);

  const api = useMemo<CartApi>(
    () => ({
      ...state,
      addAndOpen,
      setTier,
      toggleCrossSell,
      openCheckout,
      closeAll,
      setDrawer,
      setCheckout,
      onOrderCreated,
      closeUpsell,
      itemCount,
      tierPrice,
      totalPreview,
      suggestedCross,
    }),
    [
      state,
      addAndOpen,
      setTier,
      toggleCrossSell,
      openCheckout,
      closeAll,
      setDrawer,
      setCheckout,
      onOrderCreated,
      closeUpsell,
      itemCount,
      tierPrice,
      totalPreview,
      suggestedCross,
    ],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
