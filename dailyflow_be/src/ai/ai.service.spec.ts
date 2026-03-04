import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { InternalServerErrorException } from '@nestjs/common';
import { AiService } from './ai.service';
import type { AsanaTask } from '../asana/asana.service';

const mockChat = jest.fn();

jest.mock('ollama', () => ({
  Ollama: jest.fn().mockImplementation(() => ({ chat: mockChat })),
}));

const makeTasks = (): AsanaTask[] => [
  {
    gid: '1',
    name: 'Fix login bug',
    notes: 'Resolved the session issue',
    completed: true,
    completed_at: '2024-03-01T10:00:00.000Z',
    modified_at: '2024-03-01T10:00:00.000Z',
    due_on: null,
    projects: [{ name: 'Backend' }],
  },
  {
    gid: '2',
    name: 'Implement Slack integration',
    notes: '',
    completed: false,
    completed_at: null,
    modified_at: null,
    due_on: '2024-03-02',
    projects: [],
  },
];

describe('AiService', () => {
  let service: AiService;

  beforeEach(async () => {
    mockChat.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, fallback?: string) => fallback,
          },
        },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('splits completed vs active tasks and calls ollama', async () => {
    mockChat.mockResolvedValue({
      message: { content: '**Yesterday**\nFixed bug.\n\n**Today**\nSlack.\n\n**Blockers**\nNone' },
    });

    const tasks = makeTasks();
    const result = await service.generateStandup(tasks, [], '2024-03-01');

    expect(mockChat).toHaveBeenCalledTimes(1);
    const callArg = mockChat.mock.calls[0][0];
    expect(callArg.messages[0].content).toContain('Fix login bug');
    expect(callArg.messages[0].content).toContain('Implement Slack integration');
    expect(callArg.messages[0].content).toContain('COMPLETED YESTERDAY');
    expect(callArg.messages[0].content).toContain('ACTIVE TODAY');
    expect(result).toContain('**Yesterday**');
  });

  it('includes workedOnYesterday tasks in prompt', async () => {
    mockChat.mockResolvedValue({
      message: { content: '**Yesterday**\nWorked on X.\n\n**Today**\n(none)\n\n**Blockers**\nNone' },
    });

    const inProgressTask: AsanaTask = {
      gid: '3',
      name: 'Refactor auth module',
      notes: '',
      completed: false,
      completed_at: null,
      modified_at: '2024-03-01T14:00:00.000Z',
      due_on: null,
      projects: [],
    };
    const result = await service.generateStandup([], [inProgressTask], '2024-03-02');

    const prompt = mockChat.mock.calls[0][0].messages[0].content;
    expect(prompt).toContain('IN PROGRESS YESTERDAY');
    expect(prompt).toContain('Refactor auth module');
    expect(result).toBeTruthy();
  });

  it('handles all-completed tasks (empty active section)', async () => {
    mockChat.mockResolvedValue({
      message: { content: '**Yesterday**\nAll done.\n\n**Today**\n(none)\n\n**Blockers**\nNone' },
    });

    const tasks = [makeTasks()[0]]; // only completed task
    const result = await service.generateStandup(tasks, [], '2024-03-01');

    expect(mockChat.mock.calls[0][0].messages[0].content).toContain('ACTIVE TODAY:\n(none)');
    expect(result).toBeTruthy();
  });

  it('throws InternalServerErrorException when ollama fails', async () => {
    mockChat.mockRejectedValue(new Error('Connection refused'));

    await expect(service.generateStandup(makeTasks(), [], '2024-03-01')).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});
