'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navigation = [
  { name: 'Home', href: '/' },
  { name: 'Ingest', href: '/ingest' },
  { name: 'Query', href: '/query' },
  { name: 'Dashboard', href: '/dashboard' },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary"></div>
              <span className="text-xl font-bold">KB Chatbot</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-2">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={pathname === item.href ? 'default' : 'ghost'}
                  className={cn(
                    'transition-colors',
                    pathname === item.href
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  )}
                >
                  {item.name}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
