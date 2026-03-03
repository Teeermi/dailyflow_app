import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Daily } from './entities/daily.entity';
import { AiService } from '../ai/ai.service';
import { AsanaService } from '../asana/asana.service';
import { CreateDailyDto } from './dto/create-daily.dto';
import { UpdateDailyDto } from './dto/update-daily.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class DailyService {
  constructor(
    @InjectRepository(Daily)
    private readonly dailyRepo: Repository<Daily>,
    private readonly aiService: AiService,
    private readonly asanaService: AsanaService,
  ) {}

  async generate(user: User, dto: CreateDailyDto): Promise<Daily> {
    const [enrichedSelected, enrichedWorkedOn] = await Promise.all([
      this.asanaService.enrichTasksWithComments(user, dto.selectedTasks),
      this.asanaService.enrichTasksWithComments(user, dto.workedOnYesterdayTasks),
    ]);

    const content = await this.aiService.generateStandup(
      enrichedSelected,
      enrichedWorkedOn,
      dto.date,
    );

    const daily = this.dailyRepo.create({
      userId: user.id,
      date: dto.date,
      content,
      selectedTasksSnapshot: dto.selectedTasks,
    });

    return this.dailyRepo.save(daily);
  }

  async findAll(user: User): Promise<Daily[]> {
    return this.dailyRepo.find({
      where: { userId: user.id },
      order: { date: 'DESC', createdAt: 'DESC' },
    });
  }

  async findOne(user: User, id: number): Promise<Daily> {
    const daily = await this.dailyRepo.findOne({ where: { id } });
    if (!daily) throw new NotFoundException(`Daily #${id} not found`);
    if (daily.userId !== user.id) throw new ForbiddenException();
    return daily;
  }

  async update(user: User, id: number, dto: UpdateDailyDto): Promise<Daily> {
    const daily = await this.findOne(user, id);
    daily.content = dto.content;
    return this.dailyRepo.save(daily);
  }

  async postToSlack(user: User, id: number): Promise<{ ok: boolean }> {
    if (!user.slackWebhookUrl) {
      throw new BadRequestException('Slack webhook URL not configured. Set it in Settings.');
    }

    const daily = await this.findOne(user, id);

    const text = `*DailyFlow Standup — ${daily.date}*\n\n${daily.content}`;

    const res = await fetch(user.slackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) {
      throw new InternalServerErrorException('Failed to post to Slack. Check your webhook URL.');
    }

    return { ok: true };
  }
}
