import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Daily } from '../../daily/entities/daily.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  asanaId: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ type: 'text' })
  accessToken: string;

  @Column({ type: 'text', nullable: true })
  refreshToken: string;

  @Column({ type: 'datetime', nullable: true })
  tokenExpiresAt: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  slackWebhookUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Daily, (daily) => daily.user)
  dailies: Daily[];
}
