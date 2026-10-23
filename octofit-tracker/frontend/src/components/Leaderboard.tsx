import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  return (
    <CapabilityCard<LeaderboardEntry>
      title="Leaderboard"
      description="Compare team point totals."
      path="/api/leaderboard"
      resourceKey="leaderboard"
      emptyText="No leaderboard scores yet."
      itemKey={(entry) => `${entry.teamName}-${entry.rank}`}
      renderItem={(entry) => (
        <div className="d-flex justify-content-between gap-3">
          <span><span className="fw-semibold">#{entry.rank}</span> {entry.teamName}</span>
          <span className="fw-semibold">{entry.totalPoints} points</span>
        </div>
      )}
    />
  );
}
