import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Mock Interview",
  description: "Adaptive AI mock interviews with instant, personalized feedback.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
        <script
  defer
  data-website-id="9184ffba-29b6-4d79-af2a-36c73f2852b5"
  data-domain="https://ai-mock-interview-nu-virid.vercel.app"
  src="https://site-lens-omega.vercel.app/analytics.js">
</script>
        </head>

        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
           <Toaster />
            {children}
       </body>
      </html>
    </ClerkProvider>
  );
}
