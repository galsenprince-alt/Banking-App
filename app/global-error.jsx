"use client";

export default function GlobalError({ error, reset }) {
  return (
    <html>
      <body>
        <div className="flex h-screen flex-col items-center justify-center gap-4">
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <button
            className="rounded-md bg-blue-600 px-4 py-2 text-white"
            onClick={() => reset()}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
