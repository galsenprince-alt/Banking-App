import Image from "next/image";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="flex min-h-screen w-full font-dm-sans">
      {/* ── Left: auth form ── */}
      <div
        className="flex flex-1 items-center justify-center px-6 py-12"
        style={{ background: "#F5EFE0" }}
      >
        {children}
      </div>

      {/* ── Right: M$F Banking brand panel ── */}
      <aside className="hidden lg:flex lg:w-[45%] xl:w-[50%] flex-col items-center justify-center relative overflow-hidden bg-[#070e1f]">

        {/* Decorative background glow blobs */}
        <div className="absolute top-[-80px] left-[-80px] w-[360px] h-[360px] rounded-full bg-blue-700/20 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-60px] right-[-60px] w-[300px] h-[300px] rounded-full bg-blue-500/10 blur-[80px] pointer-events-none" />
        <div className="absolute top-[40%] right-[10%] w-[200px] h-[200px] rounded-full bg-indigo-700/15 blur-[70px] pointer-events-none" />

        {/* Grid dot overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #60a5fa 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Central content */}
        <div className="relative z-10 flex flex-col items-center gap-8 px-10 text-center">

          {/* Big logo */}
          <div className="flex items-center justify-center rounded-full shadow-[0_0_60px_rgba(37,99,235,0.4)]">
            <Image
              src="/icons/logo.svg"
              width={180}
              height={180}
              alt="M$F Banking logo"
              priority
            />
          </div>

          {/* Brand name */}
          <div className="flex flex-col items-center gap-2">
            <h1 className="text-4xl font-bold tracking-tight text-white font-space-grotesk">
              M<span className="text-blue-400">$</span>F Banking
            </h1>
            <p className="text-base text-slate-400 max-w-[320px] leading-relaxed">
              Your all-in-one platform to connect banks, track spending, and transfer funds — securely and in real time.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {[
              "🏦 Multi-bank linking",
              "📊 Spending insights",
              "💸 Instant transfers",
              "🔒 SSR auth",
            ].map((f) => (
              <span
                key={f}
                className="rounded-full border border-blue-800/60 bg-blue-950/60 px-4 py-1.5 text-sm text-blue-300 backdrop-blur-sm"
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom tagline */}
        <p className="absolute bottom-8 text-xs tracking-[4px] text-slate-600 uppercase font-space-grotesk">
          Powered by    Plaid · Stripe · Appwrite
        </p>
      </aside>
    </main>
  );
}
