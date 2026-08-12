/** Canto inferior direito do Hero — status estático, linguagem visual do site. */
export function SystemStatus() {
  return (
    <div
      aria-hidden="true"
      className="text-muted flex flex-col items-end gap-1 font-mono text-[10px] tracking-[0.15em] uppercase"
    >
      <span>System</span>
      <span className="text-accent flex items-center gap-1.5">
        <span className="bg-accent animate-system-pulse size-1.5 rounded-full" />
        Online
      </span>
    </div>
  );
}
