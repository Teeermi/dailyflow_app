import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

export interface AsanaComment {
  author: string;
  text: string;
  created_at: string;
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
  comments?: AsanaComment[];
}

export interface AsanaProject {
  gid: string;
  name: string;
}

@Injectable()
export class AsanaService {
  private readonly asanaBase = 'https://app.asana.com/api/1.0';

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  private async ensureFreshToken(user: User): Promise<string> {
    const fiveMinutes = 5 * 60 * 1000;
    const isExpiredOrExpiringSoon =
      !user.tokenExpiresAt ||
      user.tokenExpiresAt.getTime() - Date.now() < fiveMinutes;

    if (!isExpiredOrExpiringSoon) return user.accessToken;
    if (!user.refreshToken) {
      return user.accessToken;
    }

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.configService.get<string>('ASANA_CLIENT_ID'),
      client_secret: this.configService.get<string>('ASANA_CLIENT_SECRET'),
      refresh_token: user.refreshToken,
    });

    const res = await fetch('https://app.asana.com/-/oauth_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!res.ok) {
      throw new UnauthorizedException('Token refresh failed');
    }

    const data = await res.json();
    const newExpiry = new Date(Date.now() + data.expires_in * 1000);

    await this.usersService.updateTokens(
      user.id,
      data.access_token,
      data.refresh_token || user.refreshToken,
      newExpiry,
    );

    return data.access_token;
  }

  private async asanaGet(path: string, token: string): Promise<any> {
    const res = await fetch(`${this.asanaBase}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Asana API error ${res.status}: ${text}`);
    }

    const body = await res.json();
    return body.data;
  }

  private async getWorkspaceGid(token: string): Promise<string> {
    const workspaces = await this.asanaGet('/workspaces', token);
    if (!workspaces || workspaces.length === 0) {
      throw new Error('No Asana workspaces found');
    }
    return workspaces[0].gid;
  }

  async getProjects(user: User): Promise<AsanaProject[]> {
    const token = await this.ensureFreshToken(user);
    const workspaceGid = await this.getWorkspaceGid(token);
    const projects = await this.asanaGet(
      `/projects?workspace=${workspaceGid}&archived=false&opt_fields=gid,name`,
      token,
    );
    return (projects || []) as AsanaProject[];
  }

  async getTasks(
    user: User,
    projectGid?: string,
  ): Promise<{ yesterday: AsanaTask[]; workedOnYesterday: AsanaTask[]; today: AsanaTask[] }> {
    const token = await this.ensureFreshToken(user);
    const workspaceGid = await this.getWorkspaceGid(token);

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const fmt = (d: Date) => d.toISOString().split('T')[0];
    const todayStr = fmt(today);
    const yesterdayStr = fmt(yesterday);

    const optFields = 'gid,name,notes,completed,completed_at,modified_at,due_on,projects.name';
    const projectFilter = projectGid ? `&projects=${projectGid}` : '';

    // Query 1: completed_since returns all incomplete tasks + recently completed.
    // Query 2: modified_since + completed=false gives us tasks worked on recently.
    const [recentTasks, modifiedTasks] = await Promise.all([
      this.asanaGet(
        `/tasks?assignee=me&workspace=${workspaceGid}&completed_since=${yesterdayStr}T00:00:00&opt_fields=${optFields}${projectFilter}`,
        token,
      ) as Promise<AsanaTask[]>,
      this.asanaGet(
        `/tasks?assignee=me&workspace=${workspaceGid}&completed=false&modified_since=${yesterdayStr}T00:00:00&opt_fields=${optFields}${projectFilter}`,
        token,
      ) as Promise<AsanaTask[]>,
    ]);

    const safeRecent: AsanaTask[] = recentTasks ?? [];
    const safeModified: AsanaTask[] = modifiedTasks ?? [];

    const completedYesterday = safeRecent.filter(
      (t) =>
        t.completed &&
        t.completed_at &&
        (
          // Completed within yesterday's window
          (t.completed_at >= `${yesterdayStr}T00:00:00` && t.completed_at < `${todayStr}T00:00:00`) ||
          // Or completed today but was due yesterday (finished late)
          (t.completed_at >= `${todayStr}T00:00:00` && t.due_on === yesterdayStr)
        ),
    );

    // Incomplete tasks whose last modification fell within yesterday.
    const workedOnYesterday = safeModified.filter(
      (t) =>
        t.modified_at &&
        t.modified_at >= `${yesterdayStr}T00:00:00` &&
        t.modified_at < `${todayStr}T00:00:00`,
    );

    const workedOnYesterdayGids = new Set(workedOnYesterday.map((t) => t.gid));

    // Active today = incomplete tasks NOT already in workedOnYesterday.
    const activeToday = safeRecent.filter(
      (t) => !t.completed && !workedOnYesterdayGids.has(t.gid),
    );

    return { yesterday: completedYesterday, workedOnYesterday, today: activeToday };
  }

  private async fetchTaskComments(token: string, taskGid: string): Promise<AsanaComment[]> {
    try {
      const stories = await this.asanaGet(
        `/tasks/${taskGid}/stories?opt_fields=text,created_by.name,created_at,type`,
        token,
      );
      return (stories || [])
        .filter((s: any) => s.type === 'comment' && s.text)
        .slice(-15)
        .map((s: any) => ({
          author: s.created_by?.name ?? 'Unknown',
          text: s.text.slice(0, 300),
          created_at: s.created_at,
        }));
    } catch {
      return [];
    }
  }

  async enrichTasksWithComments(user: User, tasks: AsanaTask[]): Promise<AsanaTask[]> {
    if (tasks.length === 0) return [];
    const token = await this.ensureFreshToken(user);
    return Promise.all(
      tasks.map(async (task) => ({
        ...task,
        comments: await this.fetchTaskComments(token, task.gid),
      })),
    );
  }
}
