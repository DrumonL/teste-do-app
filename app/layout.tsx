import type { Metadata } from "next";
import "./globals.css";
import "./mobile.css";
import PendingBanner from "@/components/PendingBanner";
import ViewportDebugPanel from "@/components/ViewportDebugPanel";
import { LanguageProvider } from "@/lib/i18n";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Beef Choice Study",
  description: "Data collection app for beef choice experiments",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <LanguageProvider>
          <PendingBanner />
          <ViewportDebugPanel />
          <Providers>{children}</Providers>
        </LanguageProvider>
      </body>
    </html>
  );
}
