import { redirect } from 'next/navigation';

/**
 * Shipping page — redirects to delivery (shipping info lives there).
 */
export default function ShippingPage() {
  redirect('/delivery');
}
