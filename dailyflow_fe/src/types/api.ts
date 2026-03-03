export interface User {
  id: number;
  name: string;
  email: string;
  slackWebhookUrl: string | null;
}

export interface AsanaProject {
  gid: string;
  name: string;
}

export interface AsanaTask {
  gid: string;
  name: string;
  notes: string;
  completed: boolean;
  completed_at: string | null;
  modified_at: string | null;
  due_on: string | null;
  projects: { name: string }[];
}

export interface AsanaTasksResponse {
  yesterday: AsanaTask[];
  workedOnYesterday: AsanaTask[];
  today: AsanaTask[];
}

export interface Daily {
  id: number;
  userId: number;
  date: string;
  content: string;
  selectedTasksSnapshot: AsanaTask[];
  createdAt: string;
  updatedAt: string;
}
