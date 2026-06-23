
function ReactionLayer({ reactions }: { reactions: LiveReaction[] }) {
  if (reactions.length === 0) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 -top-2 z-10">
      {reactions.map((r) => (
        <span
          key={r.id}
          className="reaction-float absolute left-1/2 text-3xl drop-shadow-lg"
        >
          {r.emoji}
        </span>
      ))}
    </div>
  );
}
