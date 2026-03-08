import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Shield,
  LayoutDashboard,
  Pill,
  Package,
  ShoppingCart,
  FileSpreadsheet,
  RefreshCcw,
  TestTube,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Globe,
  User,
  Hospital,
  Store,
} from 'lucide-react';
import { User as UserType, UserRole } from '@/types';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

const getNavItems = (role: UserRole): NavItem[] => {
  switch (role) {
    case 'pharmacy':
      return [
        { label: 'Dashboard', href: '/pharmacy', icon: <LayoutDashboard className="h-4 w-4" /> },
        { label: 'Inventory', href: '/pharmacy/inventory', icon: <Package className="h-4 w-4" /> },
        { label: 'Sell Medicine', href: '/pharmacy/sell', icon: <ShoppingCart className="h-4 w-4" /> },
        { label: 'CSV Upload', href: '/pharmacy/csv', icon: <FileSpreadsheet className="h-4 w-4" /> },
        { label: 'Restock Requests', href: '/pharmacy/restock', icon: <RefreshCcw className="h-4 w-4" /> },
      ];
    case 'hospital':
      return [
        { label: 'Dashboard', href: '/hospital', icon: <LayoutDashboard className="h-4 w-4" /> },
        { label: 'Inventory', href: '/hospital/inventory', icon: <Package className="h-4 w-4" /> },
        { label: 'Patient Adherence', href: '/hospital/adherence', icon: <Pill className="h-4 w-4" /> },
      ];
    case 'bloodTestCentre':
      return [
        { label: 'Dashboard', href: '/blood-test-centre', icon: <LayoutDashboard className="h-4 w-4" /> },
        { label: 'Bookings', href: '/blood-test-centre/bookings', icon: <TestTube className="h-4 w-4" /> },
      ];
    default:
      return [
        { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
        { label: 'My Medicines', href: '/dashboard/medicines', icon: <Pill className="h-4 w-4" /> },
        { label: 'Book Blood Test', href: '/dashboard/book-test', icon: <TestTube className="h-4 w-4" /> },
        { label: 'Adherence', href: '/dashboard/adherence', icon: <RefreshCcw className="h-4 w-4" /> },
      ];
  }
};

const getRoleIcon = (role: UserRole) => {
  switch (role) {
    case 'pharmacy': return <Store className="h-4 w-4" />;
    case 'hospital': return <Hospital className="h-4 w-4" />;
    case 'bloodTestCentre': return <TestTube className="h-4 w-4" />;
    default: return <User className="h-4 w-4" />;
  }
};

const getRoleLabel = (role: UserRole) => {
  switch (role) {
    case 'pharmacy': return 'Pharmacy';
    case 'hospital': return 'Hospital';
    case 'bloodTestCentre': return 'Diagnostic Centre';
    default: return 'Patient';
  }
};

interface DashboardLayoutProps {
  children: ReactNode;
  user: UserType;
  onLogout: () => void;
}

export function DashboardLayout({ children, user, onLogout }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const navItems = getNavItems(user.role);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:hidden">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold">MediVault</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transform border-r border-border bg-card transition-transform duration-200 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          {/* Sidebar Header */}
          <div className="hidden h-16 items-center gap-2 border-b border-border px-6 lg:flex">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">MediVault</span>
            </Link>
          </div>

          {/* User Info */}
          <div className="border-b border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {getRoleIcon(user.role)}
                  <span>{getRoleLabel(user.role)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  location.pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="border-t border-border p-4">
            <div className="flex flex-col gap-1">
              <Button variant="ghost" className="justify-start gap-3" onClick={() => navigate('/settings')}>
                <Settings className="h-4 w-4" />
                Settings
              </Button>
              <Button variant="ghost" className="justify-start gap-3 text-destructive hover:text-destructive" onClick={onLogout}>
                <LogOut className="h-4 w-4" />
                Log out
              </Button>
            </div>
          </div>
        </aside>

        {/* Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-30 bg-foreground/20 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1">
          {/* Desktop Header */}
          <header className="sticky top-0 z-20 hidden h-16 items-center justify-between border-b border-border bg-card/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-card/60 lg:flex">
            <div />
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Globe className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>English</DropdownMenuItem>
                  <DropdownMenuItem>हिंदी</DropdownMenuItem>
                  <DropdownMenuItem>Español</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onLogout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Page Content */}
          <div className="p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
