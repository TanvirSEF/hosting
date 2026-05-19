'use client';

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { DashboardTranslationProvider } from '@/components/DashboardTranslationProvider';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Trash2, Plus, Star, CheckCircle2, MoreVertical } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getSavedCardsWithDefaultAction, deleteSavedCardAction, setDefaultCardAction } from '@/actions/invoice-actions';
import { useDashboardTranslation } from '@/components/DashboardTranslationProvider';
import { StripeAddCardDialog } from '@/components/stripe-add-card-dialog';
import { toast } from 'sonner';

interface SavedCard {
  id: string;
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  cardholderName?: string;
  savedFor?: string;
  isDefault?: boolean;
}

interface PaymentMethodsContentProps {
  user: {
    name: string;
    email: string;
    avatar: string;
    firstname: string;
  };
}

function PaymentMethodsContent({ user }: PaymentMethodsContentProps) {
  const { t } = useDashboardTranslation();
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [defaultCardId, setDefaultCardId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCards() {
      setLoading(true);
      const saved = await getSavedCardsWithDefaultAction();
      if (saved.success && saved.cards) {
        setCards(saved.cards as SavedCard[]);
        setDefaultCardId(saved.defaultCardId || null);
      }
      setLoading(false);
    }
    fetchCards();
  }, []);

  const refreshCards = async () => {
    const saved = await getSavedCardsWithDefaultAction();
    if (saved.success && saved.cards) {
      setCards(saved.cards as SavedCard[]);
      setDefaultCardId(saved.defaultCardId || null);
    }
  };

  const handleSetDefault = async (cardId: string) => {
    setBusyId(cardId);
    const result = await setDefaultCardAction(cardId);
    setBusyId(null);

    if (result.success) {
      setDefaultCardId(cardId);
      setCards(prev =>
        prev.map(card => ({
          ...card,
          isDefault: card.id === cardId,
        })).sort((a, b) => {
          if (a.isDefault) return -1;
          if (b.isDefault) return 1;
          return 0;
        })
      );
      toast.success('Default card updated successfully');
    } else {
      toast.error(result.error || 'Failed to set default card');
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    setBusyId(cardId);
    const res = await deleteSavedCardAction(cardId);
    setBusyId(null);
    if (res.success) {
      await refreshCards();
      toast.success('Card deleted successfully');
    } else {
      toast.error(res.error || 'Failed to delete card');
    }
  };

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" user={user} />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <h1 className="text-foreground text-3xl font-bold tracking-tight">
                  {t('paymentMethods.title')}
                </h1>
                <p className="text-muted-foreground mt-1">
                  {t('paymentMethods.subtitle')}
                </p>
              </div>

              <div className="px-4 lg:px-6">
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <Card className="overflow-hidden">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <CreditCard className="h-5 w-5" />
                              {t('paymentMethods.savedCards')}
                            </CardTitle>
                            <CardDescription>
                              Cards are saved securely by Stripe. Set a default card for one-click checkout.
                            </CardDescription>
                          </div>
                          <Button onClick={() => setAddOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            {t('paymentMethods.addCard')}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {cards.length === 0 ? (
                          <div className="text-sm text-muted-foreground py-8 text-center">
                            <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>No saved cards yet.</p>
                            <p className="text-xs mt-1">Add a card to enable one-click checkout.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {cards.map((c) => (
                              <div
                                key={c.id}
                                className={`rounded-lg border p-4 text-sm flex items-start justify-between gap-3 transition-all ${c.isDefault
                                    ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20'
                                    : 'hover:border-muted-foreground/30'
                                  }`}
                              >
                                <div className="flex items-start gap-3">
                                  {/* Card Icon */}
                                  <div className={`p-2.5 rounded-lg ${c.isDefault ? 'bg-primary/10' : 'bg-muted'}`}>
                                    <CreditCard className={`h-5 w-5 ${c.isDefault ? 'text-primary' : 'text-muted-foreground'}`} />
                                  </div>

                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-semibold">
                                        {String(c.brand || 'CARD').toUpperCase()}
                                      </span>
                                      <span className="text-muted-foreground">•••• {c.last4}</span>
                                      {c.isDefault && (
                                        <Badge variant="default" className="text-xs gap-1 font-normal">
                                          <Star className="h-3 w-3 fill-current" />
                                          {t('paymentMethods.default')}
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="text-muted-foreground text-xs mt-1.5">
                                      Expires {String(c.expiryMonth || '').padStart(2, '0')}/{String(c.expiryYear || '').slice(-2)}
                                    </div>
                                    {c.cardholderName && (
                                      <div className="text-muted-foreground text-xs mt-0.5">
                                        {c.cardholderName}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Actions Menu */}
                                <AlertDialog>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        disabled={busyId === c.id}
                                        aria-label="Card options"
                                        className="h-8 w-8"
                                      >
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      {!c.isDefault && (
                                        <DropdownMenuItem
                                          onClick={() => handleSetDefault(c.id)}
                                          disabled={busyId === c.id}
                                        >
                                          <CheckCircle2 className="mr-2 h-4 w-4" />
                                          {t('paymentMethods.setDefault')}
                                        </DropdownMenuItem>
                                      )}
                                      <AlertDialogTrigger asChild>
                                        <DropdownMenuItem
                                          className="text-destructive focus:text-destructive"
                                          onSelect={(e) => e.preventDefault()}
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          {t('paymentMethods.deleteCard')}
                                        </DropdownMenuItem>
                                      </AlertDialogTrigger>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete saved card?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will remove {String(c.brand || 'CARD').toUpperCase()} •••• {c.last4} from your account.
                                        You can add it again later by saving it during checkout.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteCard(c.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Security Notice */}
                    <Card className="bg-muted/30">
                      <CardContent className="py-4">
                        <div className="flex items-start gap-3 text-sm">
                          <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <p className="font-medium">Your cards are secure</p>
                            <p className="text-muted-foreground text-xs mt-0.5">
                              Card details are stored securely by Stripe. We never store your full card number or CVV on our servers.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>

      <StripeAddCardDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSaved={refreshCards}
      />
    </SidebarProvider>
  );
}

interface PaymentMethodsClientWrapperProps {
  user: {
    name: string;
    email: string;
    avatar: string;
    firstname: string;
  } | null;
}

export function PaymentMethodsClientWrapper(
  user: PaymentMethodsClientWrapperProps
) {
  if (!user.user) {
    return null;
  }

  return (
    <DashboardTranslationProvider>
      <PaymentMethodsContent user={user.user} />
    </DashboardTranslationProvider>
  );
}
