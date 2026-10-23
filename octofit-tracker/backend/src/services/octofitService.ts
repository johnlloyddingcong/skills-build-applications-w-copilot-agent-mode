import { Types } from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function apiError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw apiError(400, 'Activity details are required');
  }

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;
  if (typeof userId !== 'string' || !Types.ObjectId.isValid(userId)) {
    throw apiError(400, 'A valid userId is required');
  }
  if (typeof teamId !== 'string' || !Types.ObjectId.isValid(teamId)) {
    throw apiError(400, 'A valid teamId is required');
  }
  if (!['run', 'cycle', 'strength', 'walk'].includes(String(type))) {
    throw apiError(400, 'A valid activity type is required');
  }
  if (typeof minutes !== 'number' || !Number.isInteger(minutes) || minutes < 1) {
    throw apiError(400, 'Minutes must be a positive whole number');
  }

  const [user, team] = await Promise.all([
    User.exists({ _id: userId }),
    Team.exists({ _id: teamId }),
  ]);
  if (!user || !team) throw apiError(404, 'User or team not found');

  const activity = await Activity.create({
    user: userId,
    team: teamId,
    type,
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw apiError(400, 'Team details are required');
  }

  const { name, mascot, members = [] } = input as Record<string, unknown>;
  if (typeof name !== 'string' || !name.trim()) throw apiError(400, 'A team name is required');
  if (typeof mascot !== 'string' || !mascot.trim()) throw apiError(400, 'A team mascot is required');
  if (!Array.isArray(members) || members.some((member) => typeof member !== 'string' || !Types.ObjectId.isValid(member))) {
    throw apiError(400, 'Members must be valid user IDs');
  }

  const memberIds = [...new Set(members as string[])];
  if (memberIds.length > 0) {
    const existingMembers = await User.countDocuments({ _id: { $in: memberIds } });
    if (existingMembers !== memberIds.length) throw apiError(404, 'One or more users were not found');
  }

  const team = await Team.create({ name: name.trim(), mascot: mascot.trim(), members: memberIds });
  if (memberIds.length > 0) {
    await Team.updateMany(
      { _id: { $ne: team._id }, members: { $in: memberIds } },
      { $pull: { members: { $in: memberIds } } },
    );
    await User.updateMany({ _id: { $in: memberIds } }, { $set: { team: team._id } });
  }
  return team.toObject();
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    {
      $lookup: {
        from: Team.collection.name,
        localField: '_id',
        foreignField: '_id',
        as: 'team',
      },
    },
    { $unwind: '$team' },
    { $project: { _id: 0, teamName: '$team.name', totalPoints: 1 } },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);
  return totals.map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.trim().toLowerCase() }).lean();
  if (!user) throw apiError(404, 'User not found');

  const [recentActivities, workouts] = await Promise.all([
    Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(10).lean(),
    Workout.find().lean(),
  ]);
  const activityFocus: Record<string, string> = {
    run: 'endurance',
    cycle: 'endurance',
    strength: 'strength',
    walk: 'mobility',
  };
  const recentActivity = recentActivities[0];
  const recentFocus = recentActivity ? activityFocus[recentActivity.type] : undefined;
  const goalHasWorkout = workouts.some((workout) => workout.focus === user.fitnessGoal);
  const preferredFocus = goalHasWorkout ? user.fitnessGoal : recentFocus;

  return workouts
    .sort((left, right) => {
      const leftMatches = left.focus === preferredFocus ? 1 : 0;
      const rightMatches = right.focus === preferredFocus ? 1 : 0;
      return rightMatches - leftMatches || left.title.localeCompare(right.title);
    })
    .slice(0, 3)
    .map((workout) => ({
      ...workout,
      reason: workout.focus === user.fitnessGoal
        ? `Matches your ${user.fitnessGoal} fitness goal${recentActivity ? ` and recent ${recentActivity.type} activity` : ''}.`
        : recentActivity && workout.focus === recentFocus
          ? `Recommended based on your recent ${recentActivity.type} activity.`
          : `Recommended as a complementary ${workout.focus} workout.`,
    }));
}

export { User };
