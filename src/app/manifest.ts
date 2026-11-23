import type { MetadataRoute } from "next";
import { APP_HOME } from "@/lib/paths";

/** Makes the site installable as an app; the shortcuts appear on a long press of the home-screen icon. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "M.A. Mastatine",
    short_name: "Mastatine",
    description: "Activities, MastApps and the finest masts of M.A. Mastatine.",
    start_url: APP_HOME,
    scope: "/",
    display: "standalone",
    background_color: "#fff4e2",
    // The app bar's surface (tokens.css), so the title bar and the app bar are one colour while the page loads.
    theme_color: "#f3f4f6",
    categories: ["social", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      // Android 13+ themed icons recolour this silhouette to match the user's wallpaper.
      { src: "/icons/monochrome-512.png", sizes: "512x512", type: "image/png", purpose: "monochrome" },
    ],
    shortcuts: [
      { name: "Activities", url: "/mastapps/activities", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Masts", url: "/masts", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "MastApps", url: "/mastapps", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
