import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type TeamItem = { _id?: string; name: string; mascot: string; members?: string[] };
const loadTeams = () => getJson<{ teams: TeamItem[] }>('/api/teams').then(({ teams }) => teams);

export default function Teams() {
  return (
    <CapabilityCard<TeamItem>
      title="Teams"
      description="Manage teams and members."
      loadItems={loadTeams}
      emptyText="No teams yet."
      itemKey={(team, index) => team._id ?? `${team.name}-${index}`}
      renderItem={(team) => (
        <>
          <h3 className="h6 mb-1">{team.name}</h3>
          <p className="mb-0">{team.mascot} - {team.members?.length ?? 0} members</p>
        </>
      )}
    />
  );
}
