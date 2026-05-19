'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { CreditCard, Loader2, XCircle, CheckCircle2, Star } from 'lucide-react';
import { toast } from 'sonner';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  useStripe,
  useElements,
  PaymentElement,
} from '@stripe/react-stripe-js';
import {
  createStripePaymentAction,
  getSavedCardsWithDefaultAction,
  payWithSavedCardAction,
  finalizeStripePaymentAction,
} from '@/actions/invoice-actions';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { trackAddPaymentInfo, trackPaymentCompleted } from '@/lib/ga4';
import type { GA4UserInfo } from '@/lib/ga4';

// Lazy initialize Stripe to avoid errors when key is missing
const getStripePromise = () => {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    console.error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set. Stripe payment will not work.');
    return null;
  }
  return loadStripe(key);
};

// Store the promise lazily
let stripePromise: ReturnType<typeof loadStripe> | null = null;
const getStripe = () => {
  if (!stripePromise) {
    stripePromise = getStripePromise();
  }
  return stripePromise;
};

interface SavedCard {
  id: string;
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  cardholderName?: string;
  isDefault?: boolean;
}

function PaymentForm({
  clientSecret,
  invoiceId,
  amount,
  currency,
  onSuccess,
  onCancel,
}: {
  clientSecret: string;
  invoiceId: string | number;
  amount: number;
  currency: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
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

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard/billing?payment=success`,
      },
      redirect: 'if_required',
    });

    if (error) {
      setErrorMessage(error.message || 'Payment failed');
      setIsLoading(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      // Record the payment in WHMCS
      const result = await finalizeStripePaymentAction({
        invoiceId,
        paymentIntentId: paymentIntent.id,
      });

      if (result.success) {
        toast.success('Payment successful! Invoice marked as paid.');
        trackPaymentCompleted({
          currency,
          value: amount,
          transaction_id: paymentIntent.id,
          invoice_id: invoiceId,
          payment_method: 'new_card',
        });
        onSuccess();
      } else {
        setErrorMessage(result.error || 'Payment recorded but failed to finalize');
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm flex items-start gap-2">
          <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="rounded-md border p-3">
        <PaymentElement options={{ layout: 'tabs' }} />
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
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Pay Now
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export function StripeCardPaymentDialog({
  open,
  onOpenChange,
  invoiceId,
  invoiceNum,
  amount,
  currency = 'USD',
  onSuccess,
  userInfo,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string | number;
  invoiceNum?: string;
  amount: number;
  currency?: string;
  onSuccess?: () => void;
  userInfo?: GA4UserInfo;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [defaultCardId, setDefaultCardId] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'saved' | 'new'>('saved');
  const [saveCard, setSaveCard] = useState(true);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setLoading(false);
      setError(null);
      setClientSecret(null);
      setPaymentIntentId(null);
      setSavedCards([]);
      setDefaultCardId(null);
      setSelectedPaymentMethod('saved');
      setSaveCard(true);
    }
  }, [open]);

  // Load saved cards and create payment intent when dialog opens
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        // Load saved cards first
        const savedResult = await getSavedCardsWithDefaultAction();
        if (!cancelled && savedResult.success && savedResult.cards) {
          setSavedCards(savedResult.cards as SavedCard[]);
          setDefaultCardId(savedResult.defaultCardId || null);
          // If there are saved cards, default to using saved card
          if (savedResult.cards.length > 0) {
            setSelectedPaymentMethod('saved');
          } else {
            setSelectedPaymentMethod('new');
          }
        }

        // Create Stripe PaymentIntent
        const result = await createStripePaymentAction(invoiceId, {
          savePaymentMethod: saveCard,
        });

        if (!result.success) {
          throw new Error(result.error || 'Failed to create payment session');
        }

        if (cancelled) return;

        if (!result.clientSecret) {
          throw new Error('Payment session created but client secret is missing');
        }

        setClientSecret(result.clientSecret);
        setPaymentIntentId(result.paymentIntentId || null);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to start payment');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, invoiceId, saveCard]);

  // GA4: Track add_payment_info when dialog is ready with user login info
  useEffect(() => {
    if (!open || loading || !clientSecret) return;
    trackAddPaymentInfo({
      currency,
      value: amount,
      payment_type: hasSavedCards && selectedPaymentMethod === 'saved' ? 'saved_card' : 'new_card',
      user: userInfo,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, loading, clientSecret]);

  const handlePayWithSavedCard = async () => {
    if (!defaultCardId) {
      setError('No default card selected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await payWithSavedCardAction({
        invoiceId,
        paymentMethodId: defaultCardId,
        returnUrl: `${window.location.origin}/dashboard/billing?payment=success`,
      });

      if (!result.success) {
        throw new Error(result.error || 'Payment failed');
      }

      // If we have a client secret, we need to confirm the payment (handles 3DS)
      if (result.clientSecret) {
        const stripe = await getStripe();
        if (!stripe) {
          throw new Error('Stripe failed to initialize');
        }

        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(result.clientSecret);

        if (confirmError) {
          throw new Error(confirmError.message || 'Verification failed');
        }

        if (paymentIntent && paymentIntent.status === 'succeeded') {
          // Record the payment in WHMCS
          const finalizeResult = await finalizeStripePaymentAction({
            invoiceId,
            paymentIntentId: paymentIntent.id,
          });

          if (finalizeResult.success) {
            toast.success('Payment successful! Invoice marked as paid.');
            trackPaymentCompleted({
              currency,
              value: amount,
              transaction_id: paymentIntent.id,
              invoice_id: invoiceId,
              payment_method: 'saved_card',
            });
            onSuccess?.();
            onOpenChange(false);
          } else {
            throw new Error(finalizeResult.error || 'Payment recorded but failed to finalize');
          }
        } else {
          throw new Error('Payment status: ' + (paymentIntent?.status || 'unknown'));
        }
        return;
      }

      // Payment was successful (no 3DS required or already handled)
      toast.success('Payment successful! Invoice marked as paid.');
      trackPaymentCompleted({
        currency,
        value: amount,
        transaction_id: String(invoiceId),
        invoice_id: invoiceId,
        payment_method: 'saved_card',
      });
      onSuccess?.();
      onOpenChange(false);
    } catch (e: any) {
      setError(e?.message || 'Payment failed');
      setLoading(false);
    }
  };

  const hasSavedCards = savedCards.length > 0;
  const defaultCard = savedCards.find((c) => c.isDefault) || savedCards[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-visible z-[9999]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Pay Invoice #{invoiceNum || invoiceId}
          </DialogTitle>
          <DialogDescription>
            Pay {amount} {String(currency).toUpperCase()} securely via Stripe.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[calc(90vh-8rem)] overflow-y-auto pr-1">
          {error && (
            <div className="space-y-3">
              <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm flex items-center gap-2">
                <XCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            </div>
          )}

          {/* Payment Method Selection */}
          {!loading && hasSavedCards && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Select payment method</Label>
              <RadioGroup
                value={selectedPaymentMethod}
                onValueChange={(v) => setSelectedPaymentMethod(v as 'saved' | 'new')}
                className="gap-3"
              >
                {/* Saved Card Option */}
                <div
                  className={`flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-all ${
                    selectedPaymentMethod === 'saved'
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'hover:border-muted-foreground/30'
                  }`}
                  onClick={() => setSelectedPaymentMethod('saved')}
                >
                  <RadioGroupItem value="saved" id="saved" />
                  <Label htmlFor="saved" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-primary/10">
                        <CreditCard className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {String(defaultCard.brand || 'CARD').toUpperCase()} •••• {defaultCard.last4}
                          </span>
                          {defaultCard.isDefault && (
                            <Badge variant="default" className="text-xs gap-1 font-normal">
                              <Star className="h-3 w-3 fill-current" />
                              Default
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Expires {String(defaultCard.expiryMonth || '').padStart(2, '0')}/
                          {String(defaultCard.expiryYear || '').slice(-2)}
                        </p>
                      </div>
                    </div>
                  </Label>
                </div>

                {/* New Card Option */}
                <div
                  className={`flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-all ${
                    selectedPaymentMethod === 'new'
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'hover:border-muted-foreground/30'
                  }`}
                  onClick={() => setSelectedPaymentMethod('new')}
                >
                  <RadioGroupItem value="new" id="new" />
                  <Label htmlFor="new" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-muted">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <span className="font-medium">Pay with new card</span>
                        <p className="text-xs text-muted-foreground">Enter new card details</p>
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Saved Card Payment */}
          {selectedPaymentMethod === 'saved' && hasSavedCards && !loading && (
            <div className="space-y-4">
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  You will be charged {amount} {String(currency).toUpperCase()} using your saved card.
                </p>
                {amount > 100 && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4 bg-amber-500 rounded-full shrink-0 mt-0.5 flex items-center justify-center">
                        <span className="text-white text-xs">!</span>
                      </div>
                      <div className="text-xs text-amber-800">
                        <p className="font-semibold mb-1">3D Secure Required</p>
                        <p>For payments over $100, please:</p>
                        <ul className="mt-1 space-y-1">
                          <li>• Keep your phone nearby</li>
                          <li>• Open banking app when notified</li>
                          <li>• Approve within 60 seconds</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  onClick={handlePayWithSavedCard}
                  disabled={loading || !defaultCardId}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay {amount} {String(currency).toUpperCase()}
                </Button>
              </div>
            </div>
          )}

          {/* New Card Form */}
          {(selectedPaymentMethod === 'new' || !hasSavedCards) && clientSecret && (
            <>
              {hasSavedCards && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={saveCard}
                    onCheckedChange={(v) => setSaveCard(Boolean(v))}
                    id="save-card-pay"
                  />
                  <Label htmlFor="save-card-pay">Save card for next time</Label>
                </div>
              )}

              {getStripe() ? (
                <Elements 
                  stripe={getStripe()} 
                  options={{ 
                    clientSecret,
                    appearance: {
                      theme: 'stripe',
                      variables: {
                        colorPrimary: '#7c3aed',
                      },
                    },
                  }}
                >
                  <PaymentForm
                    clientSecret={clientSecret}
                    invoiceId={invoiceId}
                    amount={amount}
                    currency={currency}
                    onSuccess={() => {
                      onSuccess?.();
                      onOpenChange(false);
                    }}
                    onCancel={() => onOpenChange(false)}
                  />
                </Elements>
              ) : (
                <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
                  Stripe is not configured. Please contact support.
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Your card details are handled by Stripe. We never store card numbers.
              </p>
            </>
          )}

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading payment form...
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
