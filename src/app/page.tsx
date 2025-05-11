import Link from 'next/link';
import { getServerSession } from 'next-auth';

export default async function Home() {
  const session = await getServerSession();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            AI-Powered Documentation Builder
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Automatically generate beautiful documentation for your GitHub repositories using AI.
            Save time and create comprehensive docs that your team will love.
          </p>
          {!session ? (
            <Link
              href="/auth/signin"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors"
            >
              Get Started with GitHub
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors"
            >
              Go to Dashboard
            </Link>
          )}
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="text-blue-500 text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-bold text-white mb-2">Quick Setup</h3>
            <p className="text-gray-300">
              Connect your GitHub repository and let our AI analyze your codebase in minutes.
            </p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="text-blue-500 text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-bold text-white mb-2">AI-Powered</h3>
            <p className="text-gray-300">
              Advanced AI algorithms understand your code and generate comprehensive documentation.
            </p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="text-blue-500 text-4xl mb-4">📚</div>
            <h3 className="text-xl font-bold text-white mb-2">Beautiful Docs</h3>
            <p className="text-gray-300">
              Get professional, well-structured documentation that's easy to navigate and maintain.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="bg-blue-600 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to transform your documentation?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of developers who are already saving time with AI-powered documentation.
          </p>
          {!session ? (
            <Link
              href="/auth/signin"
              className="bg-white text-blue-600 hover:bg-gray-100 font-bold py-3 px-8 rounded-lg text-lg transition-colors"
            >
              Start Free Trial
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className="bg-white text-blue-600 hover:bg-gray-100 font-bold py-3 px-8 rounded-lg text-lg transition-colors"
            >
              Go to Dashboard
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
