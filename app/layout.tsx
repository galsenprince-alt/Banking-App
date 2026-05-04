import type { Metadata } from "next";
import { Inter, IBM_Plex_Serif} from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });

const ibmPlexSerif = IBM_Plex_Serif ({
  subsets: ["latin"],
  weight: ['400', '700'],
  variable: '--font-ibm-plex-serif',
});

export const metadata: Metadata = {
  title: "M$F Banking",
  description: " M$F is a modern banking platform that offers a range of financial services to help you manage and budgetize your money effectively. With M$F, you can easily access your accounts, make transactions, and stay on top of your finances with our user-friendly interface and powerful features.",
icons: {
  icon: '/icons/logo.svg',
},
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={ `${inter.variable} ${ibmPlexSerif.variable}` }>{children}</body>
    </html>
  );
}
