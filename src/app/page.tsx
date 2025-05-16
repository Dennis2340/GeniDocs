'use client';

import React from 'react';
import Link from 'next/link';
import { useSession, signIn } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-24 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-72 h-72 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-500/20 rounded-full blur-xl"></div>
        </div>
        <div className="container mx-auto px-6 text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            AI-Powered Documentation<br />for Your GitHub Repos
          </h1>
          <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto font-light">
            Create beautiful, comprehensive documentation in minutes, not hours.
            Let AI understand your code and explain it for you.
          </p>
          {session ? (
            <Link 
              href="/dashboard" 
              className="bg-white text-blue-600 hover:bg-blue-50 font-bold py-4 px-10 rounded-lg shadow-lg transition duration-300 text-lg inline-flex items-center"
            >
              <span>Go to Dashboard</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          ) : (
            <button 
              onClick={() => signIn('github')} 
              className="bg-white text-blue-600 hover:bg-blue-50 font-bold py-4 px-10 rounded-lg shadow-lg transition duration-300 text-lg inline-flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="mr-3" viewBox="0 0 16 16">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
              </svg>
              Sign in with GitHub
            </button>
          )}
          
          <div className="mt-16 flex justify-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 inline-flex space-x-3">
              <div className="flex items-center px-4 py-2 rounded-lg bg-white/10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Supports all languages</span>
              </div>
              <div className="flex items-center px-4 py-2 rounded-lg bg-white/10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Markdown & HTML</span>
              </div>
              <div className="flex items-center px-4 py-2 rounded-lg bg-white/10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Automatic updates</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-4 text-gray-900">Why Choose GeniDocs?</h2>
          <p className="text-xl text-center text-gray-600 mb-16 max-w-3xl mx-auto">
            Stop spending hours writing documentation. Let our AI analyze your code and create comprehensive docs that your team will love.
          </p>
          
          <div className="grid md:grid-cols-3 gap-10">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl shadow-sm border border-blue-100 transform transition hover:scale-105 hover:shadow-md">
              <div className="text-blue-600 bg-blue-100 p-3 rounded-xl inline-block mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-gray-900">Lightning Fast</h3>
              <p className="text-gray-600 text-lg">Generate comprehensive documentation for your entire codebase in minutes, not hours.</p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl shadow-sm border border-blue-100 transform transition hover:scale-105 hover:shadow-md">
              <div className="text-blue-600 bg-blue-100 p-3 rounded-xl inline-block mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-gray-900">AI-Powered</h3>
              <p className="text-gray-600 text-lg">Leverages advanced AI to understand your code and generate meaningful, contextual documentation.</p>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl shadow-sm border border-blue-100 transform transition hover:scale-105 hover:shadow-md">
              <div className="text-blue-600 bg-blue-100 p-3 rounded-xl inline-block mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-gray-900">Customizable</h3>
              <p className="text-gray-600 text-lg">Tailor documentation to your needs with customizable templates and formatting options.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-4 text-gray-900">How It Works</h2>
          <p className="text-xl text-center text-gray-600 mb-16 max-w-3xl mx-auto">
            Three simple steps to generate comprehensive documentation for your repositories
          </p>
          
          <div className="relative">
            {/* Progress line */}
            <div className="absolute hidden md:block left-0 right-0 h-1 bg-blue-200 top-24 transform -translate-y-1/2 mx-[10%] z-0"></div>
            
            <div className="flex flex-col md:flex-row justify-between items-center md:items-start space-y-12 md:space-y-0 md:space-x-6 relative z-10">
              <div className="flex flex-col items-center text-center md:w-1/3">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mb-6 shadow-md">1</div>
                <h3 className="text-2xl font-semibold mb-3 text-gray-900">Connect GitHub</h3>
                <p className="text-gray-600 text-lg px-4">Sign in with your GitHub account to access your repositories securely.</p>
              </div>
              
              <div className="flex flex-col items-center text-center md:w-1/3">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mb-6 shadow-md">2</div>
                <h3 className="text-2xl font-semibold mb-3 text-gray-900">Select Repository</h3>
                <p className="text-gray-600 text-lg px-4">Choose which repositories you want to generate documentation for.</p>
              </div>
              
              <div className="flex flex-col items-center text-center md:w-1/3">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mb-6 shadow-md">3</div>
                <h3 className="text-2xl font-semibold mb-3 text-gray-900">Generate Docs</h3>
                <p className="text-gray-600 text-lg px-4">Our AI analyzes your code and generates comprehensive documentation instantly.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to simplify your documentation?</h2>
          <p className="text-xl mb-10 max-w-2xl mx-auto">
            Join developers who are saving time and improving their code quality with GeniDocs.
          </p>
          {session ? (
            <Link 
              href="/dashboard" 
              className="bg-white text-blue-600 hover:bg-blue-50 font-bold py-4 px-10 rounded-lg shadow-lg transition duration-300 text-lg inline-flex items-center"
            >
              <span>Go to Dashboard</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          ) : (
            <button 
              onClick={() => signIn('github')} 
              className="bg-white text-blue-600 hover:bg-blue-50 font-bold py-4 px-10 rounded-lg shadow-lg transition duration-300 text-lg inline-flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="mr-3" viewBox="0 0 16 16">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
              </svg>
              Get Started Now
            </button>
          )}
          
          <div className="mt-10 flex justify-center space-x-6">
            <div className="flex items-center bg-white/10 px-5 py-3 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Secure GitHub Integration</span>
            </div>
            <div className="flex items-center bg-white/10 px-5 py-3 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
              <span>Cloud-based Generation</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-10">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <div className="text-2xl font-bold flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
                GeniDocs
              </div>
              <p className="text-gray-400 mt-2">AI-powered documentation for developers</p>
            </div>
            <div className="flex space-x-8">
              <Link href="/dashboard" className="text-gray-300 hover:text-white transition duration-200">
                Dashboard
              </Link>
              <Link href="/" className="text-gray-300 hover:text-white transition duration-200">
                Features
              </Link>
              <a href="https://github.com/login/oauth/authorize" className="text-gray-300 hover:text-white transition duration-200">
                GitHub
              </a>
              <Link href="/" className="text-gray-300 hover:text-white transition duration-200">
                About
              </Link>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>© {new Date().getFullYear()} GeniDocs. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}