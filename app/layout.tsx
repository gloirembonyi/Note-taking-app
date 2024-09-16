// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs';
import Layout from '@/components/Layout';
import '../styles/globals.css';

export const metadata = {
  title: 'Digital Note Taking',
  description: 'A Next.js-powered digital note-taking application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <Layout>{children}</Layout>
        </body>
      </html>
    </ClerkProvider>
  );
}

