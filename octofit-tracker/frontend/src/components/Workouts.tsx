import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = { _id?: string; title: string; focus: string; minutes: number; difficulty: string; reason: string };
const loadWorkoutSuggestions = () => getJson<{ suggestions: WorkoutSuggestion[] }>(`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`).then(({ suggestions }) => suggestions);

export default function Workouts() {
  return (
    <CapabilityCard<WorkoutSuggestion>
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      loadItems={loadWorkoutSuggestions}
      emptyText="No workout suggestions yet."
      itemKey={(workout, index) => workout._id ?? `${workout.title}-${index}`}
      renderItem={(workout) => (
        <>
          <h3 className="h6 mb-1">{workout.title}</h3>
          <p className="mb-1">{workout.focus} - {workout.minutes} minutes - {workout.difficulty}</p>
          <p className="mb-0 text-body-secondary">{workout.reason}</p>
        </>
      )}
    />
  );
}
