export type Activity = {
  id: string;
  userId: string;
  date: string; // ISO date (YYYY-MM-DD)
  duration?: number; // minutes
  notes?: string;
  linkedGoalId?: string;
  createdAt: string;
};
