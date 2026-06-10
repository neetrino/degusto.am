'use client';

import Link from 'next/link';
import { Card } from '@shop/ui';
import { BodyBackground } from '../../components/BodyBackground';
import { useTranslation } from '../../lib/i18n-client';
import { CHECKOUT_CARD_FRAME, CHECKOUT_PAGE_GRID_CLASS, CHECKOUT_PAGE_SHELL_CLASS, CHECKOUT_PAGE_TITLE, CHECKOUT_PRIMARY_BUTTON, CHECKOUT_SUMMARY_COLUMN_CLASS, CHECKOUT_TEXT_INK_MUTED } from './checkout-ui';
import { CheckoutForm } from './CheckoutForm';
import { CheckoutModals } from './CheckoutModals';
import { OrderSummary } from './OrderSummary';
import { useCheckout } from './useCheckout';

export default function CheckoutPage() {
  const { t } = useTranslation();
  
  const {
    cart,
    loading,
    error,
    setError,
    currency,
    showShippingModal,
    setShowShippingModal,
    showCardModal,
    setShowCardModal,
    deliveryPrice,
    bagFee,
    deliveryUnavailable,
    loadingDeliveryPrice,
    register,
    handleSubmit,
    errors,
    isSubmitting,
    setValue,
    paymentMethod,
    shippingMethod,
    shippingCity,
    paymentMethods,
    deliveryCities,
    orderSummary,
    handlePlaceOrder,
    onSubmit,
    isLoggedIn,
    watch,
    setCheckoutCouponDiscountUsd,
    removeCartItem,
  } = useCheckout();

  if (loading) {
    return (
      <>
        <BodyBackground color="#ffffff" />
        <div className={CHECKOUT_PAGE_SHELL_CLASS}>
          <div className="animate-pulse">
            <div className="mb-8 h-9 w-48 rounded-lg bg-[#F66812]/15 md:mb-10" />
            <div className={CHECKOUT_PAGE_GRID_CLASS}>
              <div className="space-y-4 md:col-span-3 lg:col-span-2">
                <div className="h-40 rounded-2xl bg-[#F66812]/10" />
                <div className="h-36 rounded-2xl bg-[#F66812]/10" />
                <div className="h-52 rounded-2xl bg-[#F66812]/10" />
              </div>
              <div className={`h-72 rounded-t-2xl bg-[#F66812]/10 ${CHECKOUT_SUMMARY_COLUMN_CLASS}`} />
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <>
        <BodyBackground color="#ffffff" />
        <div className={CHECKOUT_PAGE_SHELL_CLASS}>
          <h1 className={`mb-6 md:mb-8 ${CHECKOUT_PAGE_TITLE}`}>{t('checkout.title')}</h1>
          <Card className={`p-6 text-center ${CHECKOUT_CARD_FRAME}`}>
            <p className={`mb-4 ${CHECKOUT_TEXT_INK_MUTED}`}>{t('checkout.errors.cartEmpty')}</p>
            <Link
              href="/shop"
              className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-base font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${CHECKOUT_PRIMARY_BUTTON}`}
            >
              {t('checkout.buttons.continueShopping')}
            </Link>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <BodyBackground color="#ffffff" />
      <div className={CHECKOUT_PAGE_SHELL_CLASS}>
        <h1 className={`mb-6 md:mb-8 ${CHECKOUT_PAGE_TITLE}`}>{t('checkout.title')}</h1>

      <form onSubmit={handlePlaceOrder}>
        <div className={CHECKOUT_PAGE_GRID_CLASS}>
          {/* Checkout Form */}
          <CheckoutForm
            cart={cart}
            register={register}
            setValue={setValue}
            errors={errors}
            isSubmitting={isSubmitting}
            shippingMethod={shippingMethod}
            paymentMethod={paymentMethod}
            paymentMethods={paymentMethods}
            currency={currency}
            cashChangeFrom={watch('cashChangeFrom')}
            deliveryCities={deliveryCities}
            onRemoveCartItem={removeCartItem}
          />

          {/* Order Summary */}
          <div className={CHECKOUT_SUMMARY_COLUMN_CLASS}>
            <OrderSummary
              cart={cart}
              orderSummary={orderSummary}
              currency={currency}
              shippingMethod={shippingMethod}
              shippingCity={shippingCity}
              loadingDeliveryPrice={loadingDeliveryPrice}
              deliveryPrice={deliveryPrice}
              bagFee={bagFee}
              deliveryUnavailable={deliveryUnavailable}
              error={error}
              isSubmitting={isSubmitting}
              onPlaceOrder={(e) => {
                if (e) {
                  handlePlaceOrder(e);
                } else {
                  handlePlaceOrder({ preventDefault: () => {} } as React.FormEvent);
                }
              }}
              onCouponDiscountUsdChange={setCheckoutCouponDiscountUsd}
            />
          </div>
        </div>
      </form>
      </div>

      <CheckoutModals
        showShippingModal={showShippingModal}
        setShowShippingModal={setShowShippingModal}
        showCardModal={showCardModal}
        setShowCardModal={setShowCardModal}
        register={register}
        setValue={setValue}
        handleSubmit={handleSubmit}
        errors={errors}
        isSubmitting={isSubmitting}
        shippingMethod={shippingMethod}
        paymentMethod={paymentMethod}
        shippingCity={shippingCity}
        deliveryCities={deliveryCities}
        cart={cart}
        orderSummary={orderSummary}
        currency={currency}
        loadingDeliveryPrice={loadingDeliveryPrice}
        deliveryPrice={deliveryPrice}
        bagFee={bagFee}
        deliveryUnavailable={deliveryUnavailable}
        isLoggedIn={isLoggedIn}
        onSubmit={onSubmit}
      />
    </>
  );
}
