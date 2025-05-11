import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Image from 'next/image';

export default async function SignIn() {
  const session = await getServerSession();

  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-400">Sign in to continue to Doc Builder</p>
        </div>

        <div className="space-y-4">
          <a
            href="/api/auth/signin/github"
            className="flex items-center justify-center gap-3 w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            <Image
              src="/github-mark-white.svg"
              alt="GitHub"
              width={24}
              height={24}
            />
            Continue with GitHub
          </a>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400">
            By signing in, you agree to our{' '}
            <a href="/terms" className="text-blue-400 hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-blue-400 hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
} 