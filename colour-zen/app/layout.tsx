import "./globals.css";
import { Afacad_Flux } from 'next/font/google'

const afacadFlux = Afacad_Flux({
  weight: ['400'],
});

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${afacadFlux.className}`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
