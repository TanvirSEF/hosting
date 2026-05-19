"use client"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { DashboardTranslationProvider } from "@/components/DashboardTranslationProvider"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import {
    FileText,
    CheckCircle2,
    Clock,
    Coins
} from 'lucide-react'
import { useDashboardTranslation } from "@/components/DashboardTranslationProvider"
import { InvoicesTable } from '@/app/(clientportal)/dashboard/billing/invoices-table'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/currency-utils'

interface BillingContentProps {
    user: {
        name: string
        email: string
        avatar: string
        firstname: string
    }
    invoices: any[]
    paidInvoices: number
    unpaidInvoices: number
    totalUnpaid: number
    paymentSuccess?: boolean
    paymentInvoiceId?: string
}

function BillingContent({ user, invoices, paidInvoices, unpaidInvoices, totalUnpaid, paymentSuccess, paymentInvoiceId }: BillingContentProps) {
    const { t } = useDashboardTranslation()

    useEffect(() => {
        if (paymentSuccess) {
            toast.success('Payment submitted. Your invoice will be marked as paid shortly.')
            
            // GTM DataLayer Push
            if (typeof window !== 'undefined' && (window as any).dataLayer) {
                (window as any).dataLayer.push({
                    event: 'payment_success'
                });
            }

            if (typeof window !== 'undefined') {
                window.history.replaceState({}, '', '/dashboard/billing')
            }
        }
    }, [paymentSuccess])
    const firstUnpaidInvoice = invoices.find(
        (i: any) => i.status?.toLowerCase() === 'unpaid'
    )
    const unpaidCurrencyInfo = {
        currencyprefix: firstUnpaidInvoice?.currencyprefix ?? '',
        currencysuffix: firstUnpaidInvoice?.currencysuffix ?? '',
        currencycode: firstUnpaidInvoice?.currencycode ?? '',
    }

    return (
        <SidebarProvider
            style={{
                "--sidebar-width": "calc(var(--spacing) * 72)",
                "--header-height": "calc(var(--spacing) * 12)",
            } as React.CSSProperties}
        >
            <AppSidebar variant="inset" user={user} />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                            {/* Header Section */}
                            <div className="px-4 lg:px-6">
                                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                                    {t('billing.title')}
                                </h1>
                                <p className="text-muted-foreground mt-1">
                                    {t('billing.subtitle')}
                                </p>
                            </div>

                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
                                <Card className="@container/card">
                                    <CardHeader>
                                        <CardDescription>{t('billing.stats.totalInvoices')}</CardDescription>
                                        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl flex items-center gap-2">
                                            <FileText className="h-5 w-5 text-primary" />
                                            {invoices.length}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardFooter className="flex-col items-start gap-1.5 text-sm">
                                        <div className="text-muted-foreground">
                                            {t('billing.stats.totalInvoicesDesc')}
                                        </div>
                                    </CardFooter>
                                </Card>

                                <Card className="@container/card">
                                    <CardHeader>
                                        <CardDescription>{t('billing.status.paid')}</CardDescription>
                                        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl flex items-center gap-2">
                                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                                            <span className="text-green-600">{paidInvoices}</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardFooter className="flex-col items-start gap-1.5 text-sm">
                                        <div className="text-muted-foreground">
                                            {t('billing.stats.paidInvoicesDesc')}
                                        </div>
                                    </CardFooter>
                                </Card>

                                <Card className={unpaidInvoices > 0 ? "border-destructive/50 bg-destructive/5 @container/card" : "@container/card"}>
                                    <CardHeader>
                                        <CardDescription>{t('billing.stats.unpaidInvoices')}</CardDescription>
                                        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl flex items-center gap-2">
                                            <Clock className={`h-5 w-5 ${unpaidInvoices > 0 ? 'text-orange-500' : 'text-primary'}`} />
                                            <span className={unpaidInvoices > 0 ? 'text-orange-600' : ''}>
                                                {unpaidInvoices}
                                            </span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardFooter className="flex-col items-start gap-1.5 text-sm">
                                        <div className="text-muted-foreground">
                                            {t('billing.stats.unpaidInvoicesDesc')}
                                        </div>
                                    </CardFooter>
                                </Card>

                                <Card className={totalUnpaid > 0 ? "border-destructive/50 bg-destructive/5 @container/card" : "@container/card"}>
                                    <CardHeader>
                                        <CardDescription>{t('billing.table.amount')}</CardDescription>
                                        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl flex items-center gap-2">
                                            <Coins className={`h-5 w-5 ${totalUnpaid > 0 ? 'text-red-500' : 'text-primary'}`} />
                                            <span className={totalUnpaid > 0 ? 'text-red-600' : ''}>
                                                {formatCurrency(totalUnpaid, unpaidCurrencyInfo)}
                                            </span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardFooter className="flex-col items-start gap-1.5 text-sm">
                                        <div className="text-muted-foreground">
                                            {t('billing.stats.amountDueDesc')}
                                        </div>
                                    </CardFooter>
                                </Card>
                            </div>

                            {/* Invoices Table */}
                            <div className="px-4 lg:px-6">
                                <InvoicesTable invoices={invoices} />
                            </div>
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}

interface BillingClientWrapperProps {
    user: {
        name: string
        email: string
        avatar: string
        firstname: string
    } | null
    invoices: any[]
    paidInvoices: number
    unpaidInvoices: number
    totalUnpaid: number
    paymentSuccess?: boolean
    paymentInvoiceId?: string
}

function BillingErrorMessage() {
    const { t } = useDashboardTranslation()
    return <div className="flex items-center justify-center min-h-screen">{t('billing.error.loginRequired')}</div>
}

export function BillingClientWrapper({ user, invoices, paidInvoices, unpaidInvoices, totalUnpaid, paymentSuccess, paymentInvoiceId }: BillingClientWrapperProps) {
    if (!user) {
        return (
            <DashboardTranslationProvider>
                <BillingErrorMessage />
            </DashboardTranslationProvider>
        )
    }

    return (
        <DashboardTranslationProvider>
            <BillingContent
                user={user}
                invoices={invoices}
                paidInvoices={paidInvoices}
                unpaidInvoices={unpaidInvoices}
                totalUnpaid={totalUnpaid}
                paymentSuccess={paymentSuccess}
                paymentInvoiceId={paymentInvoiceId}
            />
        </DashboardTranslationProvider>
    )
}
