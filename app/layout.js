import { Inter, Noto_Sans_SC } from "next/font/google";
import { I18nProvider } from "@/i18n/context";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const notoSansSC = Noto_Sans_SC({
  variable: "--font-noto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata = {
  title: "ValoStore",
  description: "Valorant Daily Store & Match History",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${notoSansSC.variable} h-full antialiased`}
      style={{ "--font-sans": "var(--font-inter), var(--font-noto), sans-serif" }}
    >
      <body className="min-h-full flex flex-col text-white">
        <I18nProvider>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
