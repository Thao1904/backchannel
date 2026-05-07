import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-start justify-center gap-6 px-6 py-16">
      <p className="art-label text-xs text-slate-500">404</p>
      <h1 className="text-5xl text-stone-100">The room is not here.</h1>
      <p className="max-w-xl text-base leading-7 text-slate-300">
        This route does not exist yet, or one of the devices hid it out of spite.
      </p>
      <Link
        href="/"
        className="rounded-full border border-sky-300/60 bg-sky-200/10 px-5 py-3 text-sm text-sky-100"
      >
        Return home
      </Link>
    </main>
  );
}
