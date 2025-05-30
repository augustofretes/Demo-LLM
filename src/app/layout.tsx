import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LLM Features Demo",
  description: "A demonstration of various LLM capabilities including RAG, tool calling, and agent loops",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="bg-gray-800 text-white p-4">
          <div className="container mx-auto flex justify-between items-center">
            <Link href="/" className="text-xl font-bold">
              LLM Demo
            </Link>
            <div className="space-x-4">
              <Link href="/basic" className="hover:text-gray-300">
                Basic LLM
              </Link>
              <Link href="/rag" className="hover:text-gray-300">
                RAG
              </Link>
              <Link href="/tools" className="hover:text-gray-300">
                Tool Calling
              </Link>
              <Link href="/agent" className="hover:text-gray-300">
                Agent Loops
              </Link>
            </div>
          </div>
        </nav>
        <main className="container mx-auto p-4">
          {children}
        </main>
      </body>
    </html>
  );
}
