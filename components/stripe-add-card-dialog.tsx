'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CreditCard, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  useStripe,
  useElements,
  PaymentElement,
} from '@stripe/react-stripe-js';
import { createStripeAddCardSetupAction } from '@/actions/invoice-actions';

// Lazy initialize Stripe to avoid errors when key is missing
const getStripePromise = () => {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    console.error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set. Stripe will not work.');
    return null;
  }
  return loadStripe(key);
};

let stripePromise: ReturnType<typeof loadStripe> | null = null;
const getStripe = () => {
  if (!stripePromise) {
    stripePromise = getStripePromise();
  }
  return stripePromise;
};


function AddCardForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const { error, setupIntent } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard/billing/payment-methods?card_added=success`,
      },
      redirect: 'if_required',
    });

    if (error) {
      setErrorMessage(error.message || 'An error occurred');
      setIsLoading(false);
    } else if (setupIntent && setupIntent.status === 'succeeded') {
      toast.success('Card saved successfully!');
      onSuccess();
    } else {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="rounded-md border p-3">
        <PaymentElement />
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={isLoading || !stripe}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Save Card
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export function StripeAddCardDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create setup intent when dialog opens
  useEffect(() => {
    if (!open) {
      // Reset state when dialog closes
      setClientSecret(null);
      setError(null);
      return;
    }

    let cancelled = false;

    const createSetupIntent = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await createStripeAddCardSetupAction();

        if (cancelled) return;

        if (!result.success) {
          throw new Error(result.error || 'Failed to start add card flow');
        }

        setClientSecret(result.clientSecret || null);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || 'Failed to start add card flow');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    createSetupIntent();

    return () => {
      cancelled = true;
    };
  }, [open]);

  const handleSuccess = () => {
    onSaved?.();
    onOpenChange(false);
    setClientSecret(null);
  };

  const handleCancel = () => {
    onOpenChange(false);
    setClientSecret(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Add a Card
          </DialogTitle>
          <DialogDescription>
            Add a card for quick and secure payments.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Preparing secure card entry...
              </div>
            </div>
          )}

          {clientSecret && !loading && (
            getStripe() ? (
              <Elements
                stripe={getStripe()}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#8B5CF6',
                      colorBackground: '#ffffff',
                      colorText: '#1f2937',
                      colorDanger: '#ef4444',
                      fontFamily: 'system-ui, sans-serif',
                      borderRadius: '8px',
                    },
                  },
                }}
              >
                <AddCardForm onSuccess={handleSuccess} onCancel={handleCancel} />
              </Elements>
            ) : (
              <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
                Stripe is not configured. Please contact support.
              </div>
            )
          )}

          {/* Info about the process */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium">What happens:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Your card details are handled securely by Stripe</li>
              <li>• Card is saved for future payments</li>
              <li>• We never store your full card number or CVV</li>
            </ul>
          </div>

          {/* Security notice */}
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-green-50 dark:bg-green-950/30 p-3 rounded-md">
            <span>🔒</span>
            <span>
              Your card details are encrypted and handled directly by Stripe.
              We never store your full card number or CVV.
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
