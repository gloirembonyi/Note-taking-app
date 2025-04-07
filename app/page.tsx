import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to the notes page
  redirect('/notes');
  
  // This won't render, but Next.js requires a component to return JSX
  return null;
}

