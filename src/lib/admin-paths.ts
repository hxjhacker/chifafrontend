export const DASHBOARD_HOME = "/mydashboard";
export const DASHBOARD_LOGIN = "/mydashboard/login";

/** Collapse protocol-relative and bogus https://mydashboard URLs into a same-origin path. */
export function adminPath(path: string): string {
  let raw = (path || DASHBOARD_HOME).trim();
  if (/^https?:\/\/mydashboard(?=[/:?]|$)/i.test(raw)) {
    raw = raw.replace(/^https?:\/\/mydashboard/i, DASHBOARD_HOME);
  }
  if (raw.startsWith("//mydashboard")) {
    raw = `${DASHBOARD_HOME}${raw.slice("//mydashboard".length)}`;
  } else if (raw.startsWith("//")) {
    raw = `/${raw.replace(/^\/+/, "")}`;
  } else {
    raw = raw.replace(/^https?:\/\/[^/]+/i, "") || DASHBOARD_HOME;
  }
  const collapsed = `/${raw.replace(/^\/+/, "")}`.replace(/\/{2,}/g, "/");
  if (!collapsed || collapsed === "/") return DASHBOARD_HOME;
  return collapsed.endsWith("/") && collapsed.length > 1 ? collapsed.slice(0, -1) : collapsed;
}

export function sameOriginAdminUrl(path: string): string {
  const href = adminPath(path);
  if (typeof window === "undefined") return href;
  return `${window.location.origin}${href}`;
}

export function goAdmin(path: string) {
  window.location.replace(sameOriginAdminUrl(path));
}

/** Runs in <head> before hydration so Next.js replaceState cannot throw a cross-origin SecurityError. */
export const HISTORY_GUARD_SCRIPT = `(function(){try{if(window.__cgHistoryGuard)return;window.__cgHistoryGuard=true;function sanitize(url){if(url==null||url==="")return url;var s=String(url);try{if(s.charAt(0)==="/"&&s.charAt(1)==="/")s=location.protocol+s;var u=new URL(s,location.origin);var path=u.hostname==="mydashboard"?("/mydashboard"+(u.pathname==="/"?"":u.pathname)):(u.pathname||"/");if(path.charAt(0)!=="/")path="/"+path;while(path.indexOf("//")===0)path="/"+path.replace(/^\\/+/,"");return path+u.search+u.hash}catch(e){if(s.indexOf("//mydashboard")===0)return"/mydashboard"+s.slice("//mydashboard".length);if(s.indexOf("//")===0)return"/"+s.replace(/^\\/+/,"");return s}}var push=History.prototype.pushState;var replace=History.prototype.replaceState;History.prototype.pushState=function(a,b,c){return push.call(this,a,b,arguments.length>2?sanitize(c):c)};History.prototype.replaceState=function(a,b,c){return replace.call(this,a,b,arguments.length>2?sanitize(c):c)}}catch(e){}})();`;
