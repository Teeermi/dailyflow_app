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

    const prompt = `You are an engineering standup assistant. Generate a concise, professional daily standup update for ${date}.

COMPLETED YESTERDAY:
${completedSection}

IN PROGRESS YESTERDAY (started but not finished):
${workedOnSection}

ACTIVE TODAY:
${todaySection}

Write a standup update with exactly three sections:
1. **Yesterday** — summarise what was done: mention completed tasks as finished, and in-progress tasks as worked on; if both lists are empty say "No work logged yesterday"
2. **Today** — describe what will be worked on based ONLY on the active today list; if empty say "No tasks planned"
3. **Blockers** — any blockers or impediments (write "None" if there are no obvious blockers)

Rules:
- Write in first person (I did / I will / I worked on)
- If a task has a descriptive name, refer to it by that name; if the name looks like a ticket/ID code (e.g. "DLY-1005", "PROJ-123"), use the Description field to explain what the task is about — do not just repeat the raw ID in the output
- If a task has a Comments section, use it to understand the current state: if a tester raised issues and a developer confirmed they are fixed, treat those sub-items as resolved; if issues were raised but not yet acknowledged or resolved, surface them as open items or blockers
- For in-progress tasks use phrasing like "I worked on X" or "I made progress on X", NOT "I completed X"
- Be concise and professional (1–2 sentences per section)
- Do not include task IDs, GIDs, or raw field names
- Plain text only, use the bold section headers shown above
- Do not add any preamble or closing remarks`;

    try {
      const response = await this.ollama.chat({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
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
