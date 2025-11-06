import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { APP_CONFIG } from "@/constants";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { cookies } from "next/headers";
import { ToastProvider } from "@/components/ui/toast";
import { ThemeSettingsProvider } from "@/contexts/ThemeSettingsContext";
import { GlobalThemeProvider } from "@/contexts/GlobalThemeProvider";
import { AppChrome } from "@/components/app/AppChrome";
import { PlayerProvider } from "@/contexts/PlayerContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: APP_CONFIG.name,
  description: APP_CONFIG.description,
  authors: [{ name: APP_CONFIG.author }],
  keywords: ["meditation", "buddhism", "theravada", "mindfulness", "dhamma"],
  manifest: "/manifest.json",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#0ea5e9",
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const initialLang = (cookieStore.get("lang")?.value as "en" | "si") || "en";
  return (
    <html lang={initialLang} className="scroll-smooth" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={APP_CONFIG.name} />
        <meta name="msapplication-TileColor" content="#0ea5e9" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased touch-manipulation`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
          <LanguageProvider initialLanguage={initialLang}>
            <ThemeSettingsProvider>
              <GlobalThemeProvider>
                <ToastProvider>
                  <PlayerProvider>
                    <AppChrome>{children}</AppChrome>
                  </PlayerProvider>
                </ToastProvider>
              </GlobalThemeProvider>
            </ThemeSettingsProvider>
          </LanguageProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

