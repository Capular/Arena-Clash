```typescript
import { Rajdhani } from "next/font/google"; // Import only Rajdhani
import "./globals.css";
import { AuthProvider } from "@/components/auth/AuthProvider";
import LayoutShell from "@/components/dashboard/LayoutShell"; // We need a client wrapper for state

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-rajdhani"
});

export const metadata = {
  title: "Arena Clash",
  description: "Esports Tournament Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${ rajdhani.variable } font - sans bg - background text - foreground`}>
        <AuthProvider>
          <LayoutShell>
            {children}
          </LayoutShell>
        </AuthProvider>
      </body>
    </html>
  );
}
```
