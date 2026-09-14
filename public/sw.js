self.addEventListener("push", function (event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "طلب جديد في المتجر! 🔔";
  const options = {
    body: data.body || "تم تسجيل طلبية جديدة للتو.",
    icon: "/icon.svg",
    badge: "/badge.svg",
    vibrate: [200, 100, 200],
    data: { url: data.url || "/mydashboard" },
    dir: "rtl",
    lang: "ar",
    tag: data.tag || "chifaglow-new-order",
    renotify: true,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  var raw = event.notification.data && event.notification.data.url ? String(event.notification.data.url) : "/mydashboard";
  if (raw.indexOf("https://mydashboard") === 0) raw = "/mydashboard" + raw.slice("https://mydashboard".length);
  if (raw.indexOf("http://mydashboard") === 0) raw = "/mydashboard" + raw.slice("http://mydashboard".length);
  if (raw.indexOf("//mydashboard") === 0) raw = "/mydashboard" + raw.slice("//mydashboard".length);
  if (raw.charAt(0) !== "/") raw = "/" + raw.replace(/^\/+/, "");
  var url = raw;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i += 1) {
        const client = clientList[i];
        if (client.url && client.url.includes("/mydashboard") && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
      return undefined;
    }),
  );
});
