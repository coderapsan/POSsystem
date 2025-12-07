import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
      <div className="bg-white shadow-lg rounded-xl px-8 py-10 max-w-md w-full">
        <p className="text-sm uppercase tracking-widest text-orange-600 mb-2">
          404 Error
        </p>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Page not found</h1>
        <p className="text-gray-600 mb-6">
          Looks like the page you were trying to reach doesn&apos;t exist. Use the
          button below to return to the POS home screen.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center bg-orange-600 hover:bg-orange-700 text-white font-semibold px-5 py-2 rounded"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
