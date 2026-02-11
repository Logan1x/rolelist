import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RoleList - Track Your Job Applications",
  description: "Keep a clean list of roles to apply to. Track applications, stay organized.",
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Google+Sans:ital,wght@0,400;0,500;0,700;1,400;1,500;1,700&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body
        className="antialiased"
        style={{ 
          fontFamily: "'Google Sans', sans-serif",
          backgroundColor: '#fffffe',
          color: '#2b2c34'
        }}
      >
        {children}
      </body>
    </html>
  );
}
