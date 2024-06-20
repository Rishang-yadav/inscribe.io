"use client";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { WalletProvider } from "bitcoin-wallet-adapter";

import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <WalletProvider>
      <html lang="en">
        <body >{children}</body>
      </html>
    </WalletProvider>
  );
}
