export const DASHBOARD_HOME = "/mydashboard";
export const DASHBOARD_LOGIN = "/mydashboard/login";

/** Collapse protocol-relative paths like //mydashboard into a same-origin path. */
export function adminPath(path: string): string {
  const raw = (path || DASHBOARD_HOME).trim();
  const withoutOrigin = raw.replace(/^https?:\/\/[^/]+/i, "");
  const collapsed = `/${withoutOrigin.replace(/^\/+/, "")}`;
  return collapsed.replace(/\/{2,}/g, "/") || DASHBOARD_HOME;
}

export function sameOriginAdminUrl(path: string): string {
  const href = adminPath(path);
  if (typeof window === "undefined") return href;
  return new URL(href, window.location.origin).toString();
}

export function goAdmin(path: string) {
  window.location.replace(sameOriginAdminUrl(path));
}

/** Runs in <head> before hydration so Next.js replaceState cannot throw a cross-origin SecurityError. */
export const HISTORY_GUARD_SCRIPT = `(function(){try{function sanitize(url){if(url==null||url==="")return url;var s=String(url);try{var u=new URL(s,location.origin);if(u.hostname==="mydashboard"){var rest=u.pathname==="/"?"":u.pathname;return"/mydashboard"+rest+u.search+u.hash}}catch(e){}if(s.indexOf("//mydashboard")===0)return"/mydashboard"+s.slice("//mydashboard".length);return url}var push=History.prototype.pushState;var replace=History.prototype.replaceState;History.prototype.pushState=function(a,b,c){return push.call(this,a,b,arguments.length>2?sanitize(c):c)};History.prototype.replaceState=function(a,b,c){return replace.call(this,a,b,arguments.length>2?sanitize(c):c)}}catch(e){}})();`;
