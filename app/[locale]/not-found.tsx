import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-[#FAFAFA]">
      {/* Subtle Background Blob */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(140,82,255,0.06)] blur-[100px]" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-xl px-6 py-20 text-center">
        {/* 404 Number */}
        <div className="mb-6">
          <span className="font-dm-sans bg-gradient-to-br from-[#8C52FF] to-[#A78BFA] bg-clip-text text-[120px] leading-none font-bold text-transparent sm:text-[160px]">
            404
          </span>
        </div>

        {/* Message */}
        <div className="mb-10 space-y-3">
          <h1 className="font-dm-sans text-2xl font-bold text-[#1E1F21] sm:text-3xl">
            Page Not Found
          </h1>
          <p className="font-dm-sans mx-auto max-w-md text-base leading-relaxed text-[#667085] sm:text-lg">
            Sorry, the page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/"
            className="font-dm-sans inline-flex items-center justify-center rounded-full bg-[#8C52FF] px-8 py-3.5 text-base font-semibold text-white transition-all duration-300 hover:bg-[#7C3AED] hover:shadow-lg"
          >
            <svg
              className="mr-2 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            Go to Homepage
          </Link>

          <Link
            href="/contact"
            className="font-dm-sans inline-flex items-center justify-center rounded-full border border-[#DBD5D5] px-8 py-3.5 text-base font-semibold text-[#667085] transition-all duration-300 hover:border-[#8C52FF] hover:text-[#8C52FF]"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </main>
  );
}
