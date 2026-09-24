import type { Metadata } from "next";
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
import { isLanguage } from '@/i18n/runtime';

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
  const savedLang = cookieStore.get("lang")?.value;
  const initialLang = isLanguage(savedLang) ? savedLang : undefined;
  return (
    <html lang={initialLang || 'si'} className="scroll-smooth" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={APP_CONFIG.name} />
        <meta name="msapplication-TileColor" content="#0ea5e9" />
        <meta name="msapplication-tap-highlight" content="no" />
        {/* Sinhala font for proper glyph rendering */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Sinhala:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased touch-manipulation">
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

