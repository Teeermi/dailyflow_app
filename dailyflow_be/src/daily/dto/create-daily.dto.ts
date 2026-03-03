import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class AsanaTaskDto {
  @ApiProperty({ example: '1234567890' })
  @IsString()
  gid: string;

  @ApiProperty({ example: 'Fix login bug' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Investigated the root cause' })
  @IsString()
  notes: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  completed: boolean;

  @ApiProperty({ example: '2024-03-01T10:00:00.000Z', nullable: true })
  @IsString()
  @IsOptional()
  completed_at: string | null;

  @ApiProperty({ example: '2024-03-01T10:00:00.000Z', nullable: true })
  @IsString()
  @IsOptional()
  modified_at: string | null;

  @ApiProperty({ example: '2024-03-02', nullable: true })
  @IsString()
  @IsOptional()
  due_on: string | null;

  @ApiProperty({ example: [{ name: 'Backend' }], type: 'array' })
  @IsArray()
  projects: { name: string }[];
}

export class CreateDailyDto {
  @ApiProperty({ type: [AsanaTaskDto], description: 'Tasks completed yesterday or active today' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AsanaTaskDto)
  selectedTasks: AsanaTaskDto[];

  @ApiProperty({ type: [AsanaTaskDto], description: 'Incomplete tasks worked on yesterday' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AsanaTaskDto)
  workedOnYesterdayTasks: AsanaTaskDto[];

  @ApiProperty({ example: '2024-03-01', description: 'Standup date (ISO 8601)' })
  @IsDateString()
  @IsNotEmpty()
  date: string;
}
