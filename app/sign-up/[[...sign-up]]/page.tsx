import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-indigo-700 mb-2">NoteGenius</h1>
            <p className="text-gray-600">Your AI-powered note-taking assistant</p>
          </Link>
        </div>
        
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <SignUp
            appearance={{
              elements: {
                formButtonPrimary: 
                  "bg-indigo-600 hover:bg-indigo-700 text-white",
                footerActionLink: 
                  "text-indigo-600 hover:text-indigo-800",
              },
            }}
          />
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/sign-in" className="text-indigo-600 font-medium hover:text-indigo-800">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 