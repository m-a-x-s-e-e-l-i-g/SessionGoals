import type { Challenge, CreateChallengeInput } from '$lib/types';
import { runDataAction } from './api';
import { getAppState, updateAppState } from './state';

export function getChallenges(): Challenge[] {
  return getAppState().challenges;
}

export function getChallengeById(id: string): Challenge | undefined {
  return getAppState().challenges.find((challenge) => challenge.id === id);
}

export async function createChallenge(input: CreateChallengeInput): Promise<Challenge> {
  const challenge = await runDataAction<Challenge>('createChallenge', { input });
  updateAppState((state) => ({
    ...state,
    challenges: [challenge, ...state.challenges],
  }));
  return challenge;
}

export async function updateChallenge(
  id: string,
  patch: Partial<Pick<Challenge, 'title' | 'description' | 'status' | 'difficulty' | 'spotIds' | 'goalIds'>>,
): Promise<Challenge | undefined> {
  const challenge = await runDataAction<Challenge>('updateChallenge', { id, patch });
  updateAppState((state) => ({
    ...state,
    challenges: state.challenges.map((entry) => (entry.id === id ? challenge : entry)),
  }));
  return challenge;
}

export async function addSpotToChallenge(challengeId: string, spotId: string): Promise<Challenge | undefined> {
  return updateChallenge(challengeId, {
    spotIds: [...(getChallengeById(challengeId)?.spotIds ?? []), spotId],
  });
}

export async function addGoalToChallenge(challengeId: string, goalId: string): Promise<Challenge | undefined> {
  return updateChallenge(challengeId, {
    goalIds: [...(getChallengeById(challengeId)?.goalIds ?? []), goalId],
  });
}
