import type { Metadata, Viewport } from "next";
import { Sora, Noto_Naskh_Arabic } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
const sora = Sora({
    variable: "--font-sora",
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
});
const naskh = Noto_Naskh_Arabic({
    variable: "--font-naskh",
    subsets: ["arabic"],
    weight: ["400", "500", "600", "700"],
});
export const metadata: Metadata = {
    title: "Harf — Learn to Read Arabic Script",
    description: "Decode Arabic letters into Latin sounds. Visual recognition, short lessons, and progressive reading practice — no audio required.",
    applicationName: "Harf",
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        title: "Harf",
        statusBarStyle: "default",
    },
    icons: {
        icon: "/icon.svg",
    },
};
export const viewport: Viewport = {
    themeColor: "#1a6b5a",
    width: "device-width",
    initialScale: 1,
};
export default function RootLayout({ children, }: Readonly<{
    children: React.ReactNode;
}>) {
    return (<html lang="en" className={`${sora.variable} ${naskh.variable} h-full`}>
      <body className="min-h-full antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>);
}
