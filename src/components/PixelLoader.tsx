"use client";

import Script from "next/script";
import { useEffect } from "react";
import { markPixelsReady, newEventId, trackBrowser } from "@/lib/tracking";

const ENABLED = process.env.NEXT_PUBLIC_ENABLE_PIXELS !== "false";
const FB = ENABLED ? process.env.NEXT_PUBLIC_FB_PIXEL_ID || "" : "";
const TT = ENABLED ? process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || "" : "";
const SNAP = ENABLED ? process.env.NEXT_PUBLIC_SNAPCHAT_PIXEL_ID || "" : "";

export function PixelLoader() {
  useEffect(() => {
    if (!ENABLED) return;
    const boot = () => {
      markPixelsReady();
      trackBrowser("PageView", newEventId());
    };
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number })
      .requestIdleCallback;
    if (idle) {
      idle(boot);
      return;
    }
    const t = window.setTimeout(boot, 2500);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <>
      {FB ? (
        <Script id="fb-pixel" strategy="lazyOnload">{`
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
          n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
          fbq('init','${FB}');
        `}</Script>
      ) : null}
      {TT ? (
        <Script id="tt-pixel" strategy="lazyOnload">{`
          !function (w, d, t) { w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
          ttq.methods=["page","track","identify"]; ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat([].slice.call(arguments,0)))}};
          for(var i=0;i<ttq.methods.length;i++) ttq.setAndDefer(ttq,ttq.methods[i]);
          ttq.load=function(e){var i="https://analytics.tiktok.com/i18n/pixel/events.js";
          ttq._i=ttq._i||{};ttq._i[e]=[];ttq._t=ttq._t||{};ttq._t[e]=+new Date;
          var o=d.createElement("script");o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;
          var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
          ttq.load('${TT}'); ttq.page(); }(window, document, 'ttq');
        `}</Script>
      ) : null}
      {SNAP ? (
        <Script id="snap-pixel" strategy="lazyOnload">{`
          (function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function(){a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};
          a.queue=[];var s=t.createElement("script");s.async=!0;s.src="https://sc-static.net/scevent.min.js";
          var r=t.getElementsByTagName("script")[0];r.parentNode.insertBefore(s,r);})(window,document);
          snaptr('init','${SNAP}');
        `}</Script>
      ) : null}
    </>
  );
}
