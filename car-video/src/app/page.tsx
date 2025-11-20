import { CarVideoStudio } from "@/components/CarVideoStudio";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-slate-950">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-48 top-10 h-96 w-96 rounded-full bg-sky-500/40 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-indigo-500/30 blur-3xl" />
        <div className="absolute -bottom-32 right-10 h-[420px] w-[420px] rounded-full bg-purple-700/30 blur-3xl" />
      </div>
      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-6 pb-24 pt-24 md:px-10 lg:px-16">
        <header className="flex flex-col items-center gap-5 text-center text-white md:items-start md:text-left">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-sky-200">
            Hyperdrive Studio
          </span>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Generate cinematic car driving videos in your browser.
          </h1>
          <p className="max-w-2xl text-base text-sky-100/90 sm:text-lg">
            Craft a custom loop, pick your scene, tune the speed, and record a
            high-quality WebM clip ready for socials, prototypes, or hero
            sections.
          </p>
        </header>
        <CarVideoStudio />
        <footer className="mx-auto flex w-full flex-col items-center gap-3 text-center text-xs text-slate-200/70 sm:text-sm md:flex-row md:justify-between md:text-left">
          <div>Made with ❤️ for car lovers and motion designers.</div>
          <div className="flex items-center gap-4 font-medium text-slate-200/80">
            <span>60 FPS canvas capture</span>
            <span>Instant downloads</span>
            <span>Fully browser based</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
