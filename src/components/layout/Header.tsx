import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Menu, 
  X, 
  User, 
  LogOut, 
  Settings, 
  Shield,
  Globe,
  Check,
} from 'lucide-react';
import { User as UserType } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface HeaderProps {
  user?: UserType | null;
  onLogout?: () => void;
}

export function Header({ user, onLogout }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { language, setLanguage, t, languageNames, allLanguages } = useLanguage();

  const getRoleDashboard = (role: string) => {
    switch (role) {
      case 'pharmacy': return '/pharmacy';
      case 'hospital': return '/hospital';
      case 'bloodTestCentre': return '/blood-test-centre';
      default: return '/dashboard';
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">MediVault</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link to="/features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            {t('features')}
          </Link>
          <Link to="/about" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            {t('about')}
          </Link>
          <Link to="/contact" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            {t('contact')}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Globe className="h-4 w-4" />
                <span className="text-xs hidden sm:inline">{languageNames[language]}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {allLanguages.map((lang) => (
                <DropdownMenuItem key={lang} onClick={() => setLanguage(lang)} className="flex items-center justify-between">
                  {languageNames[lang]}
                  {language === lang && <Check className="ml-2 h-4 w-4" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden md:inline">{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(getRoleDashboard(user.role))}>
                  <User className="mr-2 h-4 w-4" />
                  {t('dashboard')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  {t('settings')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => navigate('/login')}>
                {t('login')}
              </Button>
              <Button onClick={() => navigate('/register')}>
                {t('register')}
              </Button>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-border bg-card md:hidden">
          <nav className="container flex flex-col gap-2 py-4">
            <Link to="/features" className="px-2 py-2 text-sm font-medium text-muted-foreground hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
              {t('features')}
            </Link>
            <Link to="/about" className="px-2 py-2 text-sm font-medium text-muted-foreground hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
              {t('about')}
            </Link>
            <Link to="/contact" className="px-2 py-2 text-sm font-medium text-muted-foreground hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>
              {t('contact')}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
