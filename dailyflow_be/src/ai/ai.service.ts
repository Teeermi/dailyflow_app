import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ollama } from 'ollama';
import { AsanaTask } from '../asana/asana.service';

@Injectable()
export class AiService {
  private readonly ollama: Ollama;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    const baseUrl = configService.get<string>('OLLAMA_BASE_URL', 'http://localhost:11434');
    this.model = configService.get<string>('OLLAMA_MODEL', 'llama3.1:8b');
    this.ollama = new Ollama({ host: baseUrl });
  }

  async generateStandup(
    selectedTasks: AsanaTask[],
    workedOnYesterdayTasks: AsanaTask[],
    date: string,
  ): Promise<string> {
    const completedTasks = selectedTasks.filter((t) => t.completed);
    const todayTasks = selectedTasks.filter((t) => !t.completed);

    const formatTask = (t: AsanaTask) => {
      const name = t.name || 'Untitled task';
      const notes = t.notes ? `\n  Description: ${t.notes.slice(0, 300)}` : '';
      const comments =
        t.comments && t.comments.length > 0
          ? '\n  Comments:\n' +
            t.comments.map((c) => `    [${c.author}]: ${c.text}`).join('\n')
          : '';
      return `- ${name}${notes}${comments}`;
    };

    const completedSection =
      completedTasks.length > 0
        ? completedTasks.map(formatTask).join('\n')
        : '(none)';

    const workedOnSection =
      workedOnYesterdayTasks.length > 0
        ? workedOnYesterdayTasks.map(formatTask).join('\n')
        : '(none)';

    const todaySection =
      todayTasks.length > 0
        ? todayTasks.map(formatTask).join('\n')
        : '(none)';

    const systemPrompt = `You are an engineering standup assistant. Your sole job is to write a short daily standup update.

Output ONLY the standup update — three sections, nothing else before or after:
**Yesterday** — summarise completed tasks as finished; in-progress tasks as worked on; if both lists are empty write "No work logged yesterday"
**Today** — what will be worked on based on the active today list; if empty write "No tasks planned"
**Blockers** — any impediments, or "None"

Rules:
- First person (I did / I will / I worked on)
- For in-progress tasks use "I worked on X" or "I made progress on X", never "I completed X"
- If a task name looks like a ticket ID (e.g. DLY-123), use its description instead
- Use comments to judge status: unresolved issues → blockers; confirmed-fixed issues → resolved
- 1–2 sentences per section, concise and professional
- No task IDs, GIDs, or raw field names
- No preamble, no closing remarks, no repetition of the input data`;

    const userPrompt = `Generate a standup for ${date}.

COMPLETED YESTERDAY:
${completedSection}

IN PROGRESS YESTERDAY:
${workedOnSection}

ACTIVE TODAY:
${todaySection}`;

    try {
      const response = await this.ollama.chat({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        stream: false,
      });
      return response.message.content;
    } catch (err) {
      throw new InternalServerErrorException(
        `Ollama generation failed: ${err.message}`,
      );
    }
  }
}
