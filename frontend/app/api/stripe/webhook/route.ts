import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Disable body parsing, need raw body for webhook signature verification
export const runtime = 'nodejs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Stripe webhooks are optional for Scope B. Avoid crashing build if Supabase is not configured.
const supabaseAdmin = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : (null as any);


async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const subscriptionId = subscription.id;
  const priceId = subscription.items.data[0]?.price.id;
  const status = subscription.status;

  // Get user_id from customer metadata
  const customer = await stripe.customers.retrieve(customerId);
  const userId = (customer as Stripe.Customer).metadata.supabase_user_id;

  if (!userId) {
    console.error('No user_id found in customer metadata');
    return;
  }

  // Determine plan type from price ID
  let planType: 'free' | 'pro' | 'team' = 'free';
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
    planType = 'pro';
  } else if (priceId === process.env.STRIPE_TEAM_PRICE_ID) {
    planType = 'team';
  }

  // Update subscription in database
  const s: any = subscription as any;

  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      stripe_price_id: priceId,
      plan_type: status === 'active' || status === 'trialing' ? planType : 'free',
      status: status,
      current_period_start: s.current_period_start ? new Date(s.current_period_start * 1000).toISOString() : null,
      current_period_end: s.current_period_end ? new Date(s.current_period_end * 1000).toISOString() : null,
      cancel_at_period_end: Boolean(s.cancel_at_period_end),
    })
    .eq('user_id', userId);

  if (error) {
    console.error('Error updating subscription:', error);
  }
}

export async function POST(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(deletedSubscription.customer as string);
        const userId = (customer as Stripe.Customer).metadata.supabase_user_id;

        if (userId) {
          await supabaseAdmin
            .from('subscriptions')
            .update({
              plan_type: 'free',
              status: 'canceled',
              stripe_subscription_id: null,
            })
            .eq('user_id', userId);
        }
        break;

      case 'invoice.payment_failed':
        // Stripe type defs can vary; treat invoice as any to read subscription id
        const invoiceAny: any = event.data.object as any;
        if (invoiceAny.subscription) {
          const subscription = await stripe.subscriptions.retrieve(invoiceAny.subscription as string);
          const failedCustomer = await stripe.customers.retrieve(subscription.customer as string);
          const failedUserId = (failedCustomer as Stripe.Customer).metadata.supabase_user_id;

          if (failedUserId) {
            await supabaseAdmin
              .from('subscriptions')
              .update({ status: 'past_due' })
              .eq('user_id', failedUserId);
          }
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
