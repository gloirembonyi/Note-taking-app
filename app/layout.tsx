// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs';
import '../styles/globals.css';

export const metadata = {
  title: 'NoteGenius - AI-Powered Note Taking',
  description: 'Transform your ideas into organized, beautifully formatted notes with our AI assistant',
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
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}

