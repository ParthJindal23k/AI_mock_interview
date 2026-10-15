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
            data-website-id="09926117-c4ab-41eb-9da1-3ca82207d3d1"
            data-domain="https://ai-mock-interview-nu-virid.vercel.app/"
            src="https://insightica.vercel.app/analytics.js"
          />
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
