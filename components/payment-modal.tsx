'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CreditCard, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrencyWithSymbol } from '@/lib/currency-utils';
import { StripeCardPaymentDialog } from '@/components/stripe-card-payment-dialog';
import type { GA4UserInfo } from '@/lib/ga4';

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string | number;
  invoiceNum?: string;
  amount: number;
  currency?: string;
  currencyprefix?: string;
  currencysuffix?: string;
  onSuccess?: () => void;
  userInfo?: GA4UserInfo;
}

export function PaymentModal({
  open,
  onOpenChange,
  invoiceId,
  invoiceNum,
  amount,
  currency,
  currencyprefix,
  currencysuffix,
  onSuccess,
  userInfo,
}: PaymentModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [cardDialogOpen, setCardDialogOpen] = useState(false);

  const currencyUpper = String(currency || '').toUpperCase();

  // Use invoice's own billing currency — currencycode is now stamped from currencyid in page.tsx
  const formattedAmount = formatCurrencyWithSymbol(amount, currencyUpper || 'USD')

  // Reset transient state when both dialogs are closed.
  useEffect(() => {
    if (!open && !cardDialogOpen) {
      setError(null);
    }
  }, [open, cardDialogOpen]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Pay Invoice #{invoiceNum || invoiceId}
          </DialogTitle>
          <DialogDescription>
            Click “Pay with card” to open a secure payment dialog. After payment,
            your invoice will be marked as paid automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-muted p-4 rounded-md">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Amount</span>
              <span className="text-lg font-bold">
                {formattedAmount}
              </span>
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm flex items-center gap-2">
              <XCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={() => {
                setError(null);
                // Close the parent picker first to avoid layered modal interference
                onOpenChange(false);
                // Small delay to ensure parent dialog is fully closed
                setTimeout(() => {
                  setCardDialogOpen(true);
                }, 100);
              }}
              className="flex-1"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Pay with card
            </Button>
          </div>
        </div>
        </DialogContent>
      </Dialog>

      <StripeCardPaymentDialog
        open={cardDialogOpen}
        onOpenChange={setCardDialogOpen}
        invoiceId={invoiceId}
        invoiceNum={invoiceNum}
        amount={amount}
        currency={currency}
        userInfo={userInfo}
        onSuccess={() => {
          toast.success('Payment submitted. Your invoice will be marked as paid shortly.');
          onSuccess?.();
        }}
      />
    </>
  );
}
