import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { DailyService } from './daily.service';
import { Daily } from './entities/daily.entity';
import { AiService } from '../ai/ai.service';
import { AsanaService } from '../asana/asana.service';
import type { AsanaTask } from '../asana/asana.service';
import { User } from '../users/entities/user.entity';

const mockFetch = jest.fn();
global.fetch = mockFetch as any;

const mockRepo = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
};

const mockAiService = {
  generateStandup: jest.fn(),
};

const mockAsanaService = {
  enrichTasksWithComments: jest.fn(),
};

const user: User = {
  id: 1,
  asanaId: 'a1',
  name: 'Alice',
  email: 'alice@example.com',
  accessToken: 'tok',
  refreshToken: 'ref',
  tokenExpiresAt: new Date(),
  slackWebhookUrl: null,
  createdAt: new Date(),
  dailies: [],
};

const makeDaily = (overrides: Partial<Daily> = {}): Daily =>
  ({
    id: 42,
    userId: 1,
    date: '2024-03-01',
    content: '**Yesterday**\nDone.\n\n**Today**\nWork.\n\n**Blockers**\nNone',
    selectedTasksSnapshot: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    user,
    ...overrides,
  } as Daily);

describe('DailyService', () => {
  let service: DailyService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DailyService,
        { provide: getRepositoryToken(Daily), useValue: mockRepo },
        { provide: AiService, useValue: mockAiService },
        { provide: AsanaService, useValue: mockAsanaService },
      ],
    }).compile();

    service = module.get<DailyService>(DailyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generate', () => {
    it('calls aiService.generateStandup and saves the result', async () => {
      const aiContent = '**Yesterday**\nDone.\n\n**Today**\nWork.\n\n**Blockers**\nNone';
      mockAiService.generateStandup.mockResolvedValue(aiContent);
      mockAsanaService.enrichTasksWithComments.mockImplementation(async (_u: any, tasks: any[]) => tasks);
      const saved = makeDaily({ content: aiContent });
      mockRepo.create.mockReturnValue(saved);
      mockRepo.save.mockResolvedValue(saved);

      const dto = { selectedTasks: [] as AsanaTask[], workedOnYesterdayTasks: [] as AsanaTask[], date: '2024-03-01' };
      const result = await service.generate(user, dto as any);

      expect(mockAsanaService.enrichTasksWithComments).toHaveBeenCalledTimes(2);
      expect(mockAiService.generateStandup).toHaveBeenCalledWith([], [], '2024-03-01');
      expect(mockRepo.save).toHaveBeenCalledTimes(1);
      expect(result.content).toBe(aiContent);
    });
  });

  describe('findOne', () => {
    it('returns the daily when it belongs to the user', async () => {
      const daily = makeDaily();
      mockRepo.findOne.mockResolvedValue(daily);

      const result = await service.findOne(user, 42);
      expect(result.id).toBe(42);
    });

    it('throws NotFoundException when daily does not exist', async () => {
      mockRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne(user, 999)).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when daily belongs to another user', async () => {
      const daily = makeDaily({ userId: 99 });
      mockRepo.findOne.mockResolvedValue(daily);
      await expect(service.findOne(user, 42)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('updates content and saves', async () => {
      const daily = makeDaily();
      mockRepo.findOne.mockResolvedValue(daily);
      mockRepo.save.mockResolvedValue({ ...daily, content: 'Updated content' });

      const result = await service.update(user, 42, { content: 'Updated content' });
      expect(result.content).toBe('Updated content');
    });
  });

  describe('postToSlack', () => {
    it('throws BadRequestException when no webhook URL configured', async () => {
      await expect(service.postToSlack({ ...user, slackWebhookUrl: null }, 42)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('posts to Slack and returns { ok: true }', async () => {
      const daily = makeDaily();
      mockRepo.findOne.mockResolvedValue(daily);
      mockFetch.mockResolvedValue({ ok: true });

      const userWithSlack = { ...user, slackWebhookUrl: 'https://hooks.slack.com/test' };
      const result = await service.postToSlack(userWithSlack, 42);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://hooks.slack.com/test',
        expect.objectContaining({ method: 'POST' }),
      );
      expect(result).toEqual({ ok: true });
    });

    it('throws InternalServerErrorException when Slack returns non-ok', async () => {
      const daily = makeDaily();
      mockRepo.findOne.mockResolvedValue(daily);
      mockFetch.mockResolvedValue({ ok: false });

      const userWithSlack = { ...user, slackWebhookUrl: 'https://hooks.slack.com/test' };
      await expect(service.postToSlack(userWithSlack, 42)).rejects.toThrow();
    });
  });
});
