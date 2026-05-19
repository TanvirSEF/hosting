'use client';

import { logoutAction } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <Button
        type="submit"
        variant="ghost"
        className="text-destructive hover:text-destructive hover:bg-destructive/10 w-full cursor-pointer justify-start"
      >
        <LogOut size={20} className="mr-2" />
        Sign Out
      </Button>
    </form>
  );
}
