//app/index.tsx

import React from "react";
import Link from "next/link";
import { FiBookOpen, FiEdit, FiShare2 } from "react-icons/fi";
import { SignedOut, SignInButton, SignedIn, UserButton } from "@clerk/nextjs";

type FeatureCardProps = {
  icon: React.ReactNode; // Assuming 'icon' is a JSX element or React component
  title: string;
  description: string;
};

export default function Note() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-5xl font-extrabold text-center mb-8 text-indigo-800">
          Welcome to Your Digital Note-Taking App
        </h1>
        <p className="text-xl text-center mb-12 text-gray-700 max-w-2xl mx-auto">
          Organize your thoughts, capture ideas, and boost your productivity
          with our powerful and intuitive note-taking tools.
        </p>

        <div className="flex justify-center mb-12">
          <Link
            href="/notes"
            className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition duration-300 text-lg"
          >
            Get Started
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <FeatureCard
            icon={<FiBookOpen className="w-10 h-10" />}
            title="Organize Effortlessly"
            description="Create folders, add tags, and easily categorize your notes for quick access."
          />
          <FeatureCard
            icon={<FiEdit className="w-10 h-10" />}
            title="Rich Text Editing"
            description="Format your notes with our powerful editor, supporting markdown and multimedia."
          />
          <FeatureCard
            icon={<FiShare2 className="w-10 h-10" />}
            title="Collaborate Seamlessly"
            description="Share notes with team members and collaborate in real-time."
          />
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4 text-indigo-800">
            Ready to transform your note-taking?
          </h2>
          <p className="text-lg text-gray-700 mb-6">
            Join thousands of users who have improved their productivity with
            our app.
          </p>
          <Link
            href="/signup"
            className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition duration-300"
          >
            Sign up for Free
          </Link>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition duration-300">
      <div className="text-indigo-600 mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}




// // pages/index.tsx
// import type { NextPage } from "next";
// import Link from "next/link";

// const Home: NextPage = () => {
//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen py-2">
//       <h1 className="text-4xl font-bold mb-4">
//         Welcome to Your Note-Taking App
//       </h1>
//       <Link href="/notes" legacyBehavior>
//         <a className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition duration-300">
//           My Notes {/* Change "View Notes" to any text you prefer */}
//         </a>
//       </Link>
//     </div>
//   );
// };

// export default Home;