'use client';

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AdminTranslationProvider } from '@/components/AdminTranslationProvider';
import { AdminSidebar } from '@/components/admin-sidebar';
import { AdminHeader } from '@/components/admin-header';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollText, AlertTriangle } from 'lucide-react';

interface LogEntry {
  id: number;
  date: string;
  description: string;
  user: string;
  ipaddress: string;
}

interface SystemLogsClientWrapperProps {
  admin: any;
  logs: LogEntry[];
  apiError?: string | null;
}

function SystemLogsContent({
  admin,
  logs,
  apiError,
}: SystemLogsClientWrapperProps) {
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
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          <div className="flex items-center gap-2">
            <ScrollText className="text-primary h-6 w-6" />
            <h1 className="text-3xl font-bold tracking-tight">System Logs</h1>
          </div>

          {apiError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error Loading Logs</AlertTitle>
              <AlertDescription>{apiError}</AlertDescription>
            </Alert>
          )}

          <p className="text-muted-foreground">
            View recent system activity and events from WHMCS.
          </p>

          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>Latest 50 system events.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-[150px]">User</TableHead>
                    <TableHead className="w-[150px]">IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length > 0 ? (
                    logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">
                          {log.date}
                        </TableCell>
                        <TableCell>{log.description}</TableCell>
                        <TableCell>{log.user}</TableCell>
                        <TableCell>{log.ipaddress}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="py-4 text-center">
                        No logs found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export function SystemLogsClientWrapper({
  admin,
  logs,
  apiError,
}: SystemLogsClientWrapperProps) {
  return (
    <AdminTranslationProvider>
      <SystemLogsContent admin={admin} logs={logs} apiError={apiError} />
    </AdminTranslationProvider>
  );
}
