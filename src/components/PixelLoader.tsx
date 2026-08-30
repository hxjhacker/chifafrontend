"use client";

import Script from "next/script";
import { useEffect } from "react";
import { FB_PIXEL_ID, SNAPCHAT_PIXEL_ID, TIKTOK_PIXEL_ID } from "@/lib/pixels";
import { markPixelsReady, newEventId, trackBrowser } from "@/lib/tracking";

const ENABLED = Boolean(FB_PIXEL_ID || TIKTOK_PIXEL_ID || SNAPCHAT_PIXEL_ID);
const TT = TIKTOK_PIXEL_ID;
const SNAP = SNAPCHAT_PIXEL_ID;

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
