import { CapabilityCard } from './CapabilityCard.js';

type ActivityItem = { _id?: string; type: string; minutes: number; points: number };

export default function Activities() {
  return (
    <CapabilityCard<ActivityItem>
      title="Activities"
      description="Track student activity minutes and points."
      path="/api/activities"
      resourceKey="activities"
      emptyText="No activities yet."
      itemKey={(activity, index) => activity._id ?? `${activity.type}-${index}`}
      renderItem={(activity) => (
        <>
          <h3 className="h6 text-capitalize mb-1">{activity.type}</h3>
          <p className="mb-0">{activity.minutes} minutes - {activity.points} points</p>
        </>
      )}
    />
  );
}
