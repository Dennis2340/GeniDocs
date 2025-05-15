'use client';

import React from 'react';
import Link from 'next/link';
import { useSession, signIn } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-6">GeniDocs</h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            AI-powered documentation generator for your GitHub repositories. Create beautiful, comprehensive documentation in minutes.
          </p>
          {session ? (
            <Link 
              href="/dashboard" 
              className="bg-white text-blue-600 hover:bg-gray-100 font-bold py-3 px-8 rounded-lg shadow-lg transition duration-300"
            >
              Go to Dashboard
            </Link>
          ) : (
            <button 
              onClick={() => signIn('github')} 
              className="bg-white text-blue-600 hover:bg-gray-100 font-bold py-3 px-8 rounded-lg shadow-lg transition duration-300"
            >
              Sign in with GitHub
            </button>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose GeniDocs?</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-6 rounded-lg shadow-md">
              <div className="text-blue-600 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
              <p className="text-gray-600">Generate comprehensive documentation for your entire codebase in minutes, not hours.</p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg shadow-md">
              <div className="text-blue-600 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered</h3>
              <p className="text-gray-600">Leverages advanced AI to understand your code and generate meaningful, contextual documentation.</p>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg shadow-md">
              <div className="text-blue-600 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Customizable</h3>
              <p className="text-gray-600">Tailor documentation to your needs with customizable templates and formatting options.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          
          <div className="flex flex-col md:flex-row justify-between items-center space-y-8 md:space-y-0 md:space-x-8">
            <div className="flex flex-col items-center text-center md:w-1/3">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mb-4">1</div>
              <h3 className="text-xl font-semibold mb-2">Connect GitHub</h3>
              <p className="text-gray-600">Sign in with your GitHub account to access your repositories.</p>
            </div>
            
            <div className="flex flex-col items-center text-center md:w-1/3">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mb-4">2</div>
              <h3 className="text-xl font-semibold mb-2">Select Repository</h3>
              <p className="text-gray-600">Choose the repository you want to document from your dashboard.</p>
            </div>
            
            <div className="flex flex-col items-center text-center md:w-1/3">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mb-4">3</div>
              <h3 className="text-xl font-semibold mb-2">Generate Docs</h3>
              <p className="text-gray-600">Our AI analyzes your code and generates comprehensive documentation.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to simplify your documentation?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of developers who are saving time and improving their code quality with GeniDocs.
          </p>
          {session ? (
            <Link 
              href="/dashboard" 
              className="bg-white text-blue-600 hover:bg-gray-100 font-bold py-3 px-8 rounded-lg shadow-lg transition duration-300"
            >
              Go to Dashboard
            </Link>
          ) : (
            <button 
              onClick={() => signIn('github')} 
              className="bg-white text-blue-600 hover:bg-gray-100 font-bold py-3 px-8 rounded-lg shadow-lg transition duration-300"
            >
              Get Started Now
            </button>
          )}
        </div>
      </section>
    </div>
  );
}