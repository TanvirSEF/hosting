'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Server, Globe, CreditCard, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardStats {
  serviceCount: number;
  domainCount: number;
  unpaidInvoices: number;
}

export function DashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/dashboard/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="@container/card">
            <CardHeader>
              <CardDescription>
                <Skeleton className="h-4 w-24" />
              </CardDescription>
              <CardTitle className="text-2xl font-semibold">
                <Skeleton className="h-8 w-16" />
              </CardTitle>
            </CardHeader>
            <CardFooter>
              <Skeleton className="h-4 w-32" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active Services</CardDescription>
          <CardTitle className="flex items-center gap-2 text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            <Server className="text-primary h-5 w-5" />
            {stats.serviceCount}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">Hosting & VPS services</div>
        </CardFooter>
      </Card>

      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Domains</CardDescription>
          <CardTitle className="flex items-center gap-2 text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            <Globe className="text-primary h-5 w-5" />
            {stats.domainCount}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">Registered domains</div>
        </CardFooter>
      </Card>

      <Card
        className={
          stats.unpaidInvoices > 0
            ? 'border-destructive/50 bg-destructive/5 @container/card'
            : '@container/card'
        }
      >
        <CardHeader>
          <CardDescription>Unpaid Invoices</CardDescription>
          <CardTitle className="flex items-center gap-2 text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            <CreditCard
              className={`h-5 w-5 ${stats.unpaidInvoices > 0 ? 'text-destructive' : 'text-primary'}`}
            />
            <span
              className={stats.unpaidInvoices > 0 ? 'text-destructive' : ''}
            >
              {stats.unpaidInvoices}
            </span>
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          {stats.unpaidInvoices > 0 ? (
            <Badge
              variant="outline"
              className="border-destructive/50 text-destructive"
            >
              <TrendingDown className="mr-1 h-3 w-3" />
              Action required
            </Badge>
          ) : (
            <div className="text-muted-foreground">All invoices paid</div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
