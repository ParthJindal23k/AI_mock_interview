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
  data-website-id="a5731c53-aa9f-4747-ae6d-2fbf75f4fc39"
  data-domain="http://localhost:3001"
  src="http://localhost:3000/analytics.js"
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
