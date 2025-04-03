import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-indigo-700">NoteGenius</h1>
          </Link>
          <p className="mt-2 text-gray-600">Welcome back! Sign in to your account.</p>
        </div>
        
        <div className="overflow-hidden rounded-xl bg-white/80 shadow-xl backdrop-blur-sm">
          <SignIn 
            appearance={{
              elements: {
                formButtonPrimary: "bg-indigo-600 hover:bg-indigo-700",
                footerActionLink: "text-indigo-600 hover:text-indigo-800"
              }
            }}
          />
        </div>
        
        <div className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{" "}
          <Link href="/sign-up" className="font-medium text-indigo-600 hover:text-indigo-800">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
} 