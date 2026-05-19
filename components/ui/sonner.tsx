'use client';

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-white group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
      }}
      icons={{
        success: <CircleCheckIcon className="text-primary size-4" />,
        info: <InfoIcon className="text-primary size-4" />,
        warning: <TriangleAlertIcon className="text-primary size-4" />,
        error: <OctagonXIcon className="text-destructive size-4" />,
        loading: <Loader2Icon className="text-primary size-4 animate-spin" />,
      }}
      style={
        {
          '--normal-bg': 'hsl(0 0% 100%)',
          '--normal-text': 'hsl(263 87% 3%)',
          '--normal-border': 'hsl(214.3 31.8% 91.4%)',
          '--border-radius': '0.65rem',
          '--success-bg': 'hsl(0 0% 100%)',
          '--success-text': 'hsl(263 87% 3%)',
          '--success-border': 'hsl(214.3 31.8% 91.4%)',
          '--error-bg': 'hsl(0 0% 100%)',
          '--error-text': 'hsl(263 87% 3%)',
          '--error-border': 'hsl(214.3 31.8% 91.4%)',
          '--warning-bg': 'hsl(0 0% 100%)',
          '--warning-text': 'hsl(263 87% 3%)',
          '--warning-border': 'hsl(214.3 31.8% 91.4%)',
          '--info-bg': 'hsl(0 0% 100%)',
          '--info-text': 'hsl(263 87% 3%)',
          '--info-border': 'hsl(214.3 31.8% 91.4%)',
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
