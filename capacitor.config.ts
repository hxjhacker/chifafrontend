import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.chifaglow.admin",
  appName: "Admin Dashboard",
  webDir: "public",
  server: {
    url: "https://chifaglow.com/mydashboard",
    cleartext: true,
  },
};

export default config;
