import { Link, useRouter } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Sun, Moon } from 'lucide-react';
import { toggleTheme, getTheme } from '@/lib/theme';
import { locales } from '@/lib/locales';

export function Navbar() {
  const { data: user } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const isDark = getTheme() === 'dark';

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      queryClient.clear();
      router.navigate({ to: '/' });
    } catch {
      toast.error(locales.navbar.toast.logoutError);
    }
  };

  return (
    <nav className="border-b bg-background/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="font-bold text-brand text-lg">
            {locales.navbar.brand}
          </Link>
          <Link
            to="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {locales.navbar.dashboard}
          </Link>
          <Link
            to="/dailies"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {locales.navbar.history}
          </Link>
          <Link
            to="/settings"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {locales.navbar.settings}
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { toggleTheme(); window.location.reload(); }}
            className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            aria-label={locales.navbar.toggleDarkMode}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          {user && (
            <>
              <span className="text-sm text-muted-foreground hidden sm:inline">{user.name}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                {locales.navbar.logout}
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
