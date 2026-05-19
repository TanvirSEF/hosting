'use client';

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AdminTranslationProvider } from '@/components/AdminTranslationProvider';
import { AdminSidebar } from '@/components/admin-sidebar';
import { AdminHeader } from '@/components/admin-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Activity,
  Server as ServerIcon,
  Wifi,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ServerStatus {
  id: number;
  name: string;
  hostname: string;
  ipaddress: string;
  active: boolean;
  activeServices: number;
  maxServices: number;
  percentUsed: number;
  status?: {
    http: boolean;
    load: string;
    uptime: string;
  };
}

interface SystemHealth {
  status: string;
  msg?: string;
  checks?: Array<{
    check: string;
    status: string;
    note?: string;
  }>;
}

interface ServerStatusClientWrapperProps {
  admin: any;
  servers: ServerStatus[];
  health: SystemHealth | null;
  apiError?: string | null;
}

function ServerStatusContent({
  admin,
  servers,
  health,
  apiError,
}: ServerStatusClientWrapperProps) {
  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AdminSidebar variant="inset" user={admin} />
      <SidebarInset>
        <AdminHeader />
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
          <div className="flex items-center gap-2">
            <Activity className="text-primary h-6 w-6" />
            <h1 className="text-3xl font-bold tracking-tight">Server Status</h1>
          </div>

          {apiError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Configuration Error</AlertTitle>
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          )}

          {/* System Health Section */}
          {health && (
            <Alert
              variant={health.status === 'success' ? 'default' : 'destructive'}
              className="bg-card"
            >
              <AlertTitle className="flex items-center gap-2">
                {health.status === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                System Health:{' '}
                {health.status === 'success'
                  ? 'Operational'
                  : 'Issues Detected'}
              </AlertTitle>
              <AlertDescription>
                {health.msg || 'All system checks passed successfully.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Servers Grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {servers.map((server) => (
              <Card key={server.id} className="overflow-hidden">
                <CardHeader className="bg-muted/40 pb-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <ServerIcon className="text-muted-foreground h-4 w-4" />
                        {server.name}
                      </CardTitle>
                      <CardDescription>
                        {server.hostname || server.ipaddress}
                      </CardDescription>
                    </div>
                    <Badge variant={server.active ? 'default' : 'secondary'}>
                      {server.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground">IP Address</span>
                      <span className="font-mono font-medium">
                        {server.ipaddress}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground">
                        Active Services
                      </span>
                      <span className="font-medium">
                        {server.activeServices} / {server.maxServices}
                      </span>
                    </div>
                  </div>

                  {/* Usage Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        Capacity Usage
                      </span>
                      <span
                        className={
                          server.percentUsed > 80
                            ? 'text-destructive font-medium'
                            : 'text-primary font-medium'
                        }
                      >
                        {server.percentUsed}%
                      </span>
                    </div>
                    <div className="bg-secondary h-2 w-full overflow-hidden rounded-full">
                      <div
                        className={`h-full ${server.percentUsed > 80 ? 'bg-destructive' : 'bg-primary'} transition-all`}
                        style={{
                          width: `${Math.min(server.percentUsed, 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Connection Status (simulated or real if available) */}
                  <div className="mt-4 flex items-center gap-2 border-t pt-2 text-sm">
                    {server.status ? (
                      <>
                        <div
                          className={`h-2 w-2 rounded-full ${server.status.http ? 'bg-green-500' : 'bg-red-500'}`}
                        />
                        <span className="text-muted-foreground">
                          Load: {server.status.load || 'N/A'}
                        </span>
                      </>
                    ) : (
                      <>
                        <Wifi className="h-3 w-3 text-green-500" />
                        <span className="text-muted-foreground">Connected</span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {servers.length === 0 && (
            <div className="text-muted-foreground py-10 text-center">
              No servers configured.
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export function ServerStatusClientWrapper({
  admin,
  servers,
  health,
  apiError,
}: ServerStatusClientWrapperProps) {
  return (
    <AdminTranslationProvider>
      <ServerStatusContent
        admin={admin}
        servers={servers}
        health={health}
        apiError={apiError}
      />
    </AdminTranslationProvider>
  );
}
