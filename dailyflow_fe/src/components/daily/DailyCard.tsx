import { Link } from '@tanstack/react-router';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Daily } from '@/types/api';

interface DailyCardProps {
  daily: Daily;
}

export function DailyCard({ daily }: DailyCardProps) {
  const preview = daily.content.slice(0, 120) + (daily.content.length > 120 ? '…' : '');

  return (
    <Link to="/daily/$dailyId" params={{ dailyId: String(daily.id) }}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader>
          <CardTitle className="text-base">{daily.date}</CardTitle>
          <CardDescription className="text-sm whitespace-pre-line line-clamp-3">
            {preview}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
