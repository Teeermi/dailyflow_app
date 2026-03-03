import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AsanaService } from './asana.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

const mockFetch = jest.fn();
global.fetch = mockFetch as any;

const mockUpdateTokens = jest.fn();

const baseUser: User = {
  id: 1,
  asanaId: 'asana-1',
  name: 'Test User',
  email: 'test@example.com',
  accessToken: 'valid-token',
  refreshToken: 'refresh-token',
  tokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
  slackWebhookUrl: null,
  createdAt: new Date(),
  dailies: [],
};

const makeWorkspaceResponse = () =>
  Promise.resolve({ ok: true, json: () => Promise.resolve({ data: [{ gid: 'ws-1' }] }) });

const makeTasksResponse = (tasks: any[]) =>
  Promise.resolve({ ok: true, json: () => Promise.resolve({ data: tasks }) });

const makeStoriesResponse = (stories: any[]) =>
  Promise.resolve({ ok: true, json: () => Promise.resolve({ data: stories }) });

describe('AsanaService', () => {
  let service: AsanaService;

  beforeEach(async () => {
    mockFetch.mockReset();
    mockUpdateTokens.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AsanaService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => {
              const map: Record<string, string> = {
                ASANA_CLIENT_ID: 'client-id',
                ASANA_CLIENT_SECRET: 'client-secret',
              };
              return map[key] ?? null;
            },
          },
        },
        {
          provide: UsersService,
          useValue: { updateTokens: mockUpdateTokens },
        },
      ],
    }).compile();

    service = module.get<AsanaService>(AsanaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('ensureFreshToken', () => {
    it('returns existing token when not near expiry', async () => {
      mockFetch
        .mockResolvedValueOnce(makeWorkspaceResponse())
        .mockResolvedValueOnce(makeTasksResponse([]))
        .mockResolvedValueOnce(makeTasksResponse([]));

      await service.getTasks(baseUser);

      // fetch called for workspace + 2 task queries, NOT for token refresh
      const tokenRefreshCall = mockFetch.mock.calls.find(
        (c) => c[0] === 'https://app.asana.com/-/oauth_token',
      );
      expect(tokenRefreshCall).toBeUndefined();
    });

    it('refreshes token when near expiry (< 5 min)', async () => {
      const expiringUser: User = {
        ...baseUser,
        tokenExpiresAt: new Date(Date.now() + 2 * 60 * 1000),
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              access_token: 'new-token',
              refresh_token: 'new-refresh',
              expires_in: 3600,
            }),
        })
        .mockResolvedValueOnce(makeWorkspaceResponse())
        .mockResolvedValueOnce(makeTasksResponse([]))
        .mockResolvedValueOnce(makeTasksResponse([]));

      await service.getTasks(expiringUser);

      expect(mockUpdateTokens).toHaveBeenCalledWith(1, 'new-token', 'new-refresh', expect.any(Date));
    });

    it('throws UnauthorizedException when token refresh fails', async () => {
      const expiringUser: User = {
        ...baseUser,
        tokenExpiresAt: new Date(Date.now() + 2 * 60 * 1000),
      };

      mockFetch.mockResolvedValueOnce({ ok: false });

      await expect(service.getTasks(expiringUser)).rejects.toThrow(UnauthorizedException);
    });

    it('uses access token as-is when no refresh token exists', async () => {
      const noRefreshUser: User = {
        ...baseUser,
        refreshToken: null,
        tokenExpiresAt: new Date(Date.now() + 2 * 60 * 1000),
      };

      mockFetch
        .mockResolvedValueOnce(makeWorkspaceResponse())
        .mockResolvedValueOnce(makeTasksResponse([]))
        .mockResolvedValueOnce(makeTasksResponse([]));

      await service.getTasks(noRefreshUser);
      expect(mockUpdateTokens).not.toHaveBeenCalled();
    });
  });

  describe('getTasks', () => {
    it('returns yesterday, workedOnYesterday, and today task arrays', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const completedTask = { gid: 't1', name: 'Done task', completed: true, notes: '', completed_at: `${yesterdayStr}T10:00:00`, modified_at: `${yesterdayStr}T10:00:00`, due_on: null, projects: [] };
      const activeTask = { gid: 't2', name: 'Active task', completed: false, notes: '', completed_at: null, modified_at: null, due_on: null, projects: [] };
      const inProgressTask = { gid: 't3', name: 'In progress task', completed: false, notes: '', completed_at: null, modified_at: `${yesterdayStr}T15:00:00`, due_on: null, projects: [] };

      mockFetch
        .mockResolvedValueOnce(makeWorkspaceResponse())
        .mockResolvedValueOnce(makeTasksResponse([completedTask, activeTask])) // completed_since
        .mockResolvedValueOnce(makeTasksResponse([inProgressTask]));           // modified_since

      const result = await service.getTasks(baseUser);
      expect(result.yesterday).toHaveLength(1);
      expect(result.yesterday[0].name).toBe('Done task');
      expect(result.workedOnYesterday).toHaveLength(1);
      expect(result.workedOnYesterday[0].name).toBe('In progress task');
      expect(result.today).toHaveLength(1);
      expect(result.today[0].name).toBe('Active task');
    });

    it('excludes workedOnYesterday tasks from today bucket', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const sharedTask = { gid: 't1', name: 'Shared task', completed: false, notes: '', completed_at: null, modified_at: `${yesterdayStr}T09:00:00`, due_on: null, projects: [] };

      mockFetch
        .mockResolvedValueOnce(makeWorkspaceResponse())
        .mockResolvedValueOnce(makeTasksResponse([sharedTask])) // completed_since
        .mockResolvedValueOnce(makeTasksResponse([sharedTask])); // modified_since

      const result = await service.getTasks(baseUser);
      expect(result.workedOnYesterday).toHaveLength(1);
      expect(result.today).toHaveLength(0);
    });

    it('appends project filter to both queries when projectGid provided', async () => {

      mockFetch
        .mockResolvedValueOnce(makeWorkspaceResponse())
        .mockResolvedValueOnce(makeTasksResponse([]))
        .mockResolvedValueOnce(makeTasksResponse([]));

      await service.getTasks(baseUser, 'proj-123');

      const taskCalls = mockFetch.mock.calls.filter(
        (c) => typeof c[0] === 'string' && (c[0] as string).includes('/tasks'),
      );
      expect(taskCalls.length).toBe(2);
      taskCalls.forEach((c) => expect(c[0]).toContain('projects=proj-123'));
    });
  });

  describe('enrichTasksWithComments', () => {
    const baseTask = {
      gid: 't1',
      name: 'DLY-1005',
      notes: '',
      completed: false,
      completed_at: null,
      modified_at: null,
      due_on: null,
      projects: [],
    };

    it('attaches comments to each task', async () => {
      const stories = [
        { type: 'comment', text: 'Please fix X', created_by: { name: 'Tester' }, created_at: '2026-03-01T10:00:00Z' },
        { type: 'comment', text: 'Fixed in latest build', created_by: { name: 'Dev' }, created_at: '2026-03-02T09:00:00Z' },
      ];
      mockFetch.mockResolvedValueOnce(makeStoriesResponse(stories));

      const result = await service.enrichTasksWithComments(baseUser, [baseTask]);

      expect(result).toHaveLength(1);
      expect(result[0].comments).toHaveLength(2);
      expect(result[0].comments![0]).toEqual({ author: 'Tester', text: 'Please fix X', created_at: '2026-03-01T10:00:00Z' });
      expect(result[0].comments![1]).toEqual({ author: 'Dev', text: 'Fixed in latest build', created_at: '2026-03-02T09:00:00Z' });
    });

    it('filters out system stories', async () => {
      const stories = [
        { type: 'system', text: 'moved to project X', created_by: { name: 'Asana' }, created_at: '2026-03-01T08:00:00Z' },
        { type: 'comment', text: 'Check item 2', created_by: { name: 'Tester' }, created_at: '2026-03-01T10:00:00Z' },
      ];
      mockFetch.mockResolvedValueOnce(makeStoriesResponse(stories));

      const result = await service.enrichTasksWithComments(baseUser, [baseTask]);

      expect(result[0].comments).toHaveLength(1);
      expect(result[0].comments![0].author).toBe('Tester');
    });

    it('returns empty comments array when stories request fails', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, text: () => Promise.resolve('Error') });

      const result = await service.enrichTasksWithComments(baseUser, [baseTask]);

      expect(result[0].comments).toEqual([]);
    });

    it('returns empty array immediately when no tasks provided', async () => {
      const result = await service.enrichTasksWithComments(baseUser, []);
      expect(result).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});
