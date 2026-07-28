/**
 * Ambient background: drifting colour blobs, a faint technical grid and a
 * vignette. Purely decorative, fixed behind the app, and cheap — three
 * blurred divs on their own compositor layers.
 */
export default function Aurora() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Drifting colour pools */}
      <div className="gpu absolute -left-40 -top-40 h-[38rem] w-[38rem] animate-drift rounded-full bg-brand-600/25 blur-[120px]" />
      <div
        className="gpu absolute -right-32 top-1/4 h-[32rem] w-[32rem] animate-drift rounded-full bg-violet-600/20 blur-[130px]"
        style={{ animationDelay: "-7s" }}
      />
      <div
        className="gpu absolute -bottom-20 left-1/3 h-[28rem] w-[28rem] animate-drift rounded-full bg-cyan-500/10 blur-[120px]"
        style={{ animationDelay: "-14s" }}
      />

      {/* Technical grid */}
      <div className="absolute inset-0 bg-grid-faint bg-grid [mask-image:radial-gradient(ellipse_at_50%_0%,#000_20%,transparent_75%)]" />

      {/* Vignette to keep the edges calm */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,transparent_35%,rgba(5,8,18,0.55)_100%)]" />
    </div>
  );
}
