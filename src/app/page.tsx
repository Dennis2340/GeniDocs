'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSession, signIn } from "next-auth/react";
import Image from 'next/image';

export default function Home() {
  const { data: session } = useSession();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section ref={heroRef} className="min-h-screen pt-32 pb-20 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 z-[-1]">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-r from-indigo-600/20 to-blue-600/20 blur-[100px] animate-[float_15s_ease-in-out_infinite]" 
               style={{ transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)` }}></div>
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-r from-violet-600/20 to-purple-600/20 blur-[100px] animate-[float_20s_ease-in-out_infinite_reverse]" 
               style={{ transform: `translate(${-mousePosition.x * 0.01}px, ${-mousePosition.y * 0.01}px)` }}></div>
          <div className="absolute top-1/2 right-1/3 w-[300px] h-[300px] rounded-full bg-gradient-to-r from-blue-400/10 to-cyan-400/10 blur-[80px] animate-[float_25s_ease-in-out_infinite_1s]" 
               style={{ transform: `translate(${mousePosition.x * 0.015}px, ${mousePosition.y * 0.015}px)` }}></div>
        </div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        
        {/* Noise texture overlay */}
        <div className="absolute inset-0 bg-noise"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="inline-flex items-center justify-center mb-6 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-blue-400/20 rounded-full blur-xl"></div>
              <div className="relative z-10 bg-gradient-to-r from-indigo-600 to-blue-500 text-white px-5 py-2 rounded-full text-sm font-medium">
                AI-Powered Documentation Generator
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight font-space">
              <span className="text-gradient">Intelligent Docs</span><br />
              <span className="text-white">for Your GitHub Repos</span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto font-light text-white/80">
              Create beautiful, comprehensive documentation in minutes, not hours.
              Let our AI understand your code and explain it for humans.
            </p>
            
            {session ? (
              <Link 
                href="/dashboard" 
                className="ai-button group text-lg"
              >
                <span>Go to Dashboard</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            ) : (
              <button 
                onClick={() => signIn('github')} 
                className="ai-button group text-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="mr-3" viewBox="0 0 16 16">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
                </svg>
                Sign in with GitHub
              </button>
            )}
            
            <div className="mt-16 flex flex-wrap justify-center gap-3">
              <div className="glass-effect px-4 py-3 rounded-xl flex items-center border-glow">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>Supports all languages</span>
              </div>
              <div className="glass-effect px-4 py-3 rounded-xl flex items-center border-glow">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>Markdown & HTML</span>
              </div>
              <div className="glass-effect px-4 py-3 rounded-xl flex items-center border-glow">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span>Automatic updates</span>
              </div>
            </div>
            
            {/* Floating code preview */}
            <div className="relative mt-20 w-full max-w-4xl mx-auto">
              <div className="absolute -top-6 -left-6 w-20 h-20 bg-gradient-to-r from-indigo-500/20 to-blue-500/20 rounded-full blur-xl animate-pulse"></div>
              <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-full blur-xl animate-pulse"></div>
              
              <div className="ai-card p-6 floating">
                <div className="flex items-center mb-4">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="ml-4 text-xs text-white/60">documentation.md</div>
                </div>
                <div className="text-sm font-mono text-white/80 overflow-hidden">
                  <div className="flex">
                    <span className="text-gray-500 mr-4">1</span>
                    <span><span className="text-purple-400">## </span><span className="text-blue-400">AuthService</span></span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 mr-4">2</span>
                    <span className="text-white/70">The authentication service handles user authentication and session management.</span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 mr-4">3</span>
                    <span></span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 mr-4">4</span>
                    <span><span className="text-purple-400">### </span><span className="text-blue-400">Methods</span></span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 mr-4">5</span>
                    <span></span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 mr-4">6</span>
                    <span><span className="text-purple-400">#### </span><span className="text-green-400">login(username: string, password: string): Promise&lt;User&gt;</span></span>
                  </div>
                  <div className="flex">
                    <span className="text-gray-500 mr-4">7</span>
                    <span className="text-white/70">Authenticates a user with the provided credentials.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 z-[-1] bg-gradient-to-b from-black/80 to-indigo-950/20"></div>
        <div className="absolute inset-0 z-[-1] bg-noise opacity-10"></div>
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px]"></div>
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px]"></div>
        
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center mb-16">
            <div className="inline-block mb-3">
              <div className="text-xs font-medium text-indigo-400 bg-indigo-950/50 px-3 py-1 rounded-full border border-indigo-800/50">
                POWERFUL FEATURES
              </div>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 font-space">
              <span className="text-gradient">Why Choose</span> <span className="text-white">GeniDocs?</span>
            </h2>
            <p className="text-xl text-center text-white/70 mb-8 max-w-3xl mx-auto">
              Stop spending hours writing documentation. Let our AI analyze your code and create comprehensive docs that your team will love.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 lg:gap-10">
            <div className="ai-card p-8 group">
              <div className="relative mb-6 w-16 h-16 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 to-blue-500 rounded-xl opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-400 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-white group-hover:text-indigo-300 transition-colors duration-300">Lightning Fast</h3>
              <p className="text-white/70 text-lg">Generate comprehensive documentation for your entire codebase in minutes, not hours.</p>
            </div>
            
            <div className="ai-card p-8 group">
              <div className="relative mb-6 w-16 h-16 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 to-blue-500 rounded-xl opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-400 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-white group-hover:text-indigo-300 transition-colors duration-300">AI-Powered</h3>
              <p className="text-white/70 text-lg">Leverages advanced AI to understand your code and generate meaningful, contextual documentation.</p>
            </div>
            
            <div className="ai-card p-8 group">
              <div className="relative mb-6 w-16 h-16 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 to-blue-500 rounded-xl opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-400 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-white group-hover:text-indigo-300 transition-colors duration-300">Customizable</h3>
              <p className="text-white/70 text-lg">Tailor documentation to your needs with customizable templates and formatting options.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 z-[-1] bg-gradient-to-b from-indigo-950/20 to-black/80"></div>
        <div className="absolute inset-0 z-[-1] bg-noise opacity-10"></div>
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px]"></div>
        <div className="absolute bottom-1/3 left-1/3 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px]"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col items-center mb-16">
            <div className="inline-block mb-3">
              <div className="text-xs font-medium text-indigo-400 bg-indigo-950/50 px-3 py-1 rounded-full border border-indigo-800/50">
                SIMPLE PROCESS
              </div>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 font-space">
              <span className="text-white">How It </span><span className="text-gradient">Works</span>
            </h2>
            <p className="text-xl text-center text-white/70 mb-8 max-w-3xl mx-auto">
              Three simple steps to generate comprehensive documentation for your repositories
            </p>
          </div>
          
          <div className="relative">
            {/* Progress line */}
            <div className="absolute hidden md:block left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-600/20 via-indigo-500/40 to-indigo-600/20 top-24 transform -translate-y-1/2 mx-[10%] z-0 glow-effect"></div>
            
            <div className="flex flex-col md:flex-row justify-between items-center md:items-start space-y-12 md:space-y-0 md:space-x-6 relative z-10">
              <div className="flex flex-col items-center text-center md:w-1/3 group">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-500 rounded-full blur-md opacity-50 group-hover:opacity-70 transition-opacity duration-300"></div>
                  <div className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold relative z-10 border border-indigo-400/30">
                    1
                  </div>
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-white group-hover:text-indigo-300 transition-colors duration-300">Connect GitHub</h3>
                <p className="text-white/70 text-lg px-4">Sign in with your GitHub account to access your repositories securely.</p>
              </div>
              
              <div className="flex flex-col items-center text-center md:w-1/3 group">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-500 rounded-full blur-md opacity-50 group-hover:opacity-70 transition-opacity duration-300"></div>
                  <div className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold relative z-10 border border-indigo-400/30">
                    2
                  </div>
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-white group-hover:text-indigo-300 transition-colors duration-300">Select Repository</h3>
                <p className="text-white/70 text-lg px-4">Choose which repositories you want to generate documentation for.</p>
              </div>
              
              <div className="flex flex-col items-center text-center md:w-1/3 group">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-500 rounded-full blur-md opacity-50 group-hover:opacity-70 transition-opacity duration-300"></div>
                  <div className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold relative z-10 border border-indigo-400/30">
                    3
                  </div>
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-white group-hover:text-indigo-300 transition-colors duration-300">Generate Docs</h3>
                <p className="text-white/70 text-lg px-4">Our AI analyzes your code and generates comprehensive documentation instantly.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 z-[-1]">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 to-black"></div>
          <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-r from-indigo-600/20 to-blue-600/20 blur-[100px]"></div>
          <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-gradient-to-r from-violet-600/20 to-purple-600/20 blur-[100px]"></div>
        </div>
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        
        <div className="container mx-auto px-6 relative z-10 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 font-space">
              <span className="text-gradient">Ready to simplify</span> <span className="text-white">your documentation?</span>
            </h2>
            <p className="text-xl mb-10 text-white/80 mx-auto">
              Join developers who are saving time and improving their code quality with GeniDocs.
            </p>
            
            {session ? (
              <Link 
                href="/dashboard" 
                className="ai-button group text-lg"
              >
                <span>Go to Dashboard</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            ) : (
              <button 
                onClick={() => signIn('github')} 
                className="ai-button group text-lg"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="mr-3" viewBox="0 0 16 16">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
                </svg>
                Get Started Now
              </button>
            )}
            
            <div className="mt-12 flex flex-wrap justify-center gap-4">
              <div className="glass-effect px-5 py-3 rounded-xl flex items-center border-glow">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <span>Secure GitHub Integration</span>
              </div>
              <div className="glass-effect px-5 py-3 rounded-xl flex items-center border-glow">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                </div>
                <span>Cloud-based Generation</span>
              </div>
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