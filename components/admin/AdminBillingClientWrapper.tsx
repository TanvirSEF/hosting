"use client"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AdminTranslationProvider } from "@/components/AdminTranslationProvider"
import { AdminSidebar } from "@/components/admin-sidebar"
import { AdminHeader } from "@/components/admin-header"
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import {
    FileText,
    CheckCircle2,
    Clock,
    DollarSign
} from 'lucide-react'
import { useAdminTranslation } from "@/components/AdminTranslationProvider"
import { InvoicesTable } from '@/app/(adminportal)/spike/billing/invoices-table'
import { useCurrency } from '@/contexts/CurrencyContext'

interface AdminBillingContentProps {
    admin: any
    invoices: any[]
    paidInvoices: number
    unpaidInvoices: number
    totalUnpaid: number
}

function AdminBillingContent({ admin, invoices, paidInvoices, unpaidInvoices, totalUnpaid }: AdminBillingContentProps) {
    const { t } = useAdminTranslation()
    const { formatPrice } = useCurrency()

    return (
        <SidebarProvider
            style={{
                "--sidebar-width": "calc(var(--spacing) * 72)",
                "--header-height": "calc(var(--spacing) * 12)",
            } as React.CSSProperties}
        >
            <AdminSidebar variant="inset" user={admin} />
            <SidebarInset>
                <AdminHeader />
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
                                        <CardDescription>{t('billing.stats.amountDue')}</CardDescription>
                                        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl flex items-center gap-2">
                                            <DollarSign className={`h-5 w-5 ${totalUnpaid > 0 ? 'text-red-500' : 'text-primary'}`} />
                                            <span className={totalUnpaid > 0 ? 'text-red-600' : ''}>
                                                {formatPrice(totalUnpaid)}
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

interface AdminBillingClientWrapperProps {
    admin: any
    invoices: any[]
    paidInvoices: number
    unpaidInvoices: number
    totalUnpaid: number
}

export function AdminBillingClientWrapper({ admin, invoices, paidInvoices, unpaidInvoices, totalUnpaid }: AdminBillingClientWrapperProps) {
    return (
        <AdminTranslationProvider>
            <AdminBillingContent
                admin={admin}
                invoices={invoices}
                paidInvoices={paidInvoices}
                unpaidInvoices={unpaidInvoices}
                totalUnpaid={totalUnpaid}
            />
        </AdminTranslationProvider>
    )
}
