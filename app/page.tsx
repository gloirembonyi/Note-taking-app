'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import Link from "next/link";
import { 
  BrainCircuit, 
  FileText, 
  Mic,
  Sparkles, 
  Clock, 
  Layers,
  Video,
  MessageSquare,
  LucideIcon,
  ArrowRight
} from "lucide-react";
import { SignedOut, SignedIn, UserButton } from "@clerk/nextjs";

// Feature card component for the landing page
interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

function FeatureCard({ title, description, icon: Icon }: FeatureCardProps) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="bg-indigo-50 w-12 h-12 rounded-lg flex items-center justify-center text-indigo-600 mb-4">
        <Icon size={24} />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();

  useEffect(() => {
    // Redirect to notes page if the user is signed in
    if (isLoaded && isSignedIn) {
      router.push('/notes');
    }
  }, [isSignedIn, isLoaded, router]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 py-8 flex justify-between items-center">
          <div className="flex items-center">
            <BrainCircuit size={32} className="mr-2" />
            <h1 className="text-2xl font-bold">NoteGenius</h1>
          </div>
          
          <div>
            <SignedOut>
              <div className="space-x-4">
                <Link href="/sign-in" className="text-white hover:text-indigo-100">
                  Sign In
                </Link>
                <Link href="/sign-up" className="bg-white text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors">
                  Sign Up
                </Link>
              </div>
            </SignedOut>
            
            <SignedIn>
              <div className="flex items-center space-x-4">
                <Link href="/notes" className="text-white hover:text-indigo-100">
                  My Notes
                </Link>
                <UserButton afterSignOutUrl="/" />
              </div>
            </SignedIn>
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-20 flex flex-col items-center text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            AI-Powered Note Taking for<br />Modern Professionals
          </h2>
          <p className="text-xl mb-8 max-w-2xl">
            Capture, organize, and enhance your ideas with the power of AI.
            Transform your notes with intelligent suggestions and real-time collaboration.
          </p>
          
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/sign-up" className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-medium hover:bg-indigo-50 transition-colors flex items-center">
              Get Started
              <ArrowRight size={16} className="ml-2" />
            </Link>
            
            <SignedIn>
              <Link href="/notes" className="bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-800 transition-colors">
                Go to My Notes
              </Link>
            </SignedIn>
          </div>
        </div>
      </header>
      
      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Supercharge Your Note-Taking</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              title="AI-Powered Suggestions" 
              description="Get real-time suggestions and formatting help as you type, making your notes clearer and more organized."
              icon={Sparkles}
            />
            
            <FeatureCard 
              title="Speech-to-Text" 
              description="Record meetings or ideas on the go with high-quality transcription that identifies speakers and key topics."
              icon={Mic}
            />
            
            <FeatureCard 
              title="Real-Time Collaboration" 
              description="Work on notes simultaneously with teammates, seeing their edits and cursor positions in real-time."
              icon={MessageSquare}
            />
            
            <FeatureCard 
              title="Smart Organization" 
              description="Automatically categorize and tag your notes for easy retrieval when you need them most."
              icon={Layers}
            />
            
            <FeatureCard 
              title="Meeting Enhancement" 
              description="Transform messy meeting transcripts into structured notes with action items automatically highlighted."
              icon={Video}
            />
            
            <FeatureCard 
              title="Revision History" 
              description="Track changes and revert to previous versions at any time, ensuring you never lose important information."
              icon={Clock}
            />
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 bg-indigo-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Notes?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of professionals who are saving time and enhancing their productivity with NoteGenius.
          </p>
          
          <SignedOut>
            <Link href="/sign-up" className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-medium hover:bg-indigo-50 transition-colors inline-block">
              Create Your Free Account
            </Link>
          </SignedOut>
          
          <SignedIn>
            <Link href="/notes" className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-medium hover:bg-indigo-50 transition-colors inline-block">
              Go to My Notes
            </Link>
          </SignedIn>
        </div>
      </section>
    </div>
  );
}

