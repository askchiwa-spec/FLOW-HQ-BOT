'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-gray-950 flex items-center justify-center font-sans antialiased">
        <div className="max-w-md mx-auto px-6 text-center">
          <div className="text-6xl font-bold text-red-500 mb-4">500</div>
          <h1 className="text-2xl font-bold text-white mb-3">Something went wrong</h1>
          <p className="text-gray-400 mb-8">
            An unexpected error occurred. Our team has been notified.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="px-6 py-3 rounded-xl bg-green-500 hover:bg-green-400 text-white font-medium transition-colors"
            >
              Try again
            </button>
            <a
              href="/"
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
            >
              Go home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
