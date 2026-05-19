import { NextRequest, NextResponse } from 'next/server';
import { verifyStripeWebhookSignature, getStripeClient } from '@/lib/stripe';
import { recordInvoicePaymentFromStripe } from '@/actions/stripe-actions';

/**
 * Stripe webhook handler
 * Docs: https://stripe.com/docs/webhooks
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('stripe-signature');

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
    if (!webhookSecret) {
      console.error('Stripe webhook: missing STRIPE_WEBHOOK_SECRET');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    if (!signature) {
      console.warn('Stripe webhook: missing signature');
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 401 }
      );
    }

    // Verify webhook signature
    let event;
    try {
      event = verifyStripeWebhookSignature(rawBody, signature, webhookSecret);
    } catch (err: any) {
      console.error('Stripe webhook: invalid signature', err.message);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    console.log(`Stripe webhook received: ${event.type}`);

    // Handle events
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const invoiceId = paymentIntent.metadata?.invoiceId;

        if (!invoiceId) {
          console.warn('Stripe webhook: payment_intent.succeeded missing invoiceId');
          return new NextResponse(null, { status: 204 });
        }

        const amount = paymentIntent.amount / 100; // Convert from cents

        const result = await recordInvoicePaymentFromStripe(
          invoiceId,
          paymentIntent.id,
          amount
        );

        if (!result.success) {
          console.error('Stripe webhook: record payment failed', result.error);
          return NextResponse.json(
            { error: result.error },
            { status: 500 }
          );
        }

        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object;
        const invoiceId = session.metadata?.invoiceId;

        if (!invoiceId) {
          console.warn('Stripe webhook: checkout.session.completed missing invoiceId');
          return new NextResponse(null, { status: 204 });
        }

        // Get the payment intent from the session
        if (session.payment_intent) {
          const stripe = getStripeClient();
          const paymentIntent = await stripe.paymentIntents.retrieve(
            session.payment_intent as string
          );

          const amount = paymentIntent.amount / 100;

          const result = await recordInvoicePaymentFromStripe(
            invoiceId,
            paymentIntent.id,
            amount
          );

          if (!result.success) {
            console.error('Stripe webhook: record payment failed', result.error);
            return NextResponse.json(
              { error: result.error },
              { status: 500 }
            );
          }
        }

        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const error = paymentIntent.last_payment_error;
        console.error('Stripe payment failed:', {
          id: paymentIntent.id,
          error: error?.message,
          code: error?.code,
          decline_code: error?.decline_code,
        });
        break;
      }

      case 'invoice.payment_succeeded':
      case 'invoice.paid': {
        // Handle subscription payments if needed
        console.log('Stripe subscription payment received:', event.type);
        break;
      }

      default:
        console.log(`Stripe webhook: unhandled event type ${event.type}`);
    }

    return new NextResponse(null, { status: 200 });
  } catch (error: any) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler error' },
      { status: 500 }
    );
  }
}
