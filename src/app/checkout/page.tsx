'use client';

import { useRouter } from 'next/navigation';
import { Card, Button } from '@shop/ui';
import { BodyBackground } from '../../components/BodyBackground';
import { useTranslation } from '../../lib/i18n-client';
import { CHECKOUT_CARD_FRAME, CHECKOUT_PAGE_TITLE, CHECKOUT_PRIMARY_BUTTON, CHECKOUT_TEXT_INK_MUTED } from './checkout-ui';
import { CheckoutForm } from './CheckoutForm';
import { CheckoutModals } from './CheckoutModals';
import { OrderSummary } from './OrderSummary';
import { useCheckout } from './useCheckout';

export default function CheckoutPage() {
  const router = useRouter();
  const { t } = useTranslation();
  
  const {
    cart,
    loading,
    error,
    setError,
    currency,
    logoErrors,
    setLogoErrors,
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
    orderSummary,
    handlePlaceOrder,
    onSubmit,
    isLoggedIn,
    watch,
    setCheckoutCouponDiscountUsd,
  } = useCheckout();

  if (loading) {
    return (
      <>
        <BodyBackground color="#ffffff" />
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <div className="animate-pulse">
            <div className="mb-8 h-9 w-48 rounded-lg bg-[#F66812]/15 lg:mb-10" />
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                <div className="h-40 rounded-2xl bg-[#F66812]/10" />
                <div className="h-36 rounded-2xl bg-[#F66812]/10" />
                <div className="h-52 rounded-2xl bg-[#F66812]/10" />
              </div>
              <div className="h-72 rounded-t-2xl bg-[#F66812]/10" />
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
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <h1 className={`mb-6 lg:mb-8 ${CHECKOUT_PAGE_TITLE}`}>{t('checkout.title')}</h1>
          <Card className={`p-6 text-center ${CHECKOUT_CARD_FRAME}`}>
            <p className={`mb-4 ${CHECKOUT_TEXT_INK_MUTED}`}>{t('checkout.errors.cartEmpty')}</p>
            <Button variant="primary" className={CHECKOUT_PRIMARY_BUTTON} onClick={() => router.push('/shop')}>
              {t('checkout.buttons.continueShopping')}
            </Button>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <BodyBackground color="#ffffff" />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <h1 className={`mb-6 lg:mb-8 ${CHECKOUT_PAGE_TITLE}`}>{t('checkout.title')}</h1>

      <form onSubmit={handlePlaceOrder}>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Checkout Form */}
          <CheckoutForm
            register={register}
            setValue={setValue}
            errors={errors}
            isSubmitting={isSubmitting}
            shippingMethod={shippingMethod}
            paymentMethod={paymentMethod}
            paymentMethods={paymentMethods}
            logoErrors={logoErrors}
            setLogoErrors={setLogoErrors}
            error={error}
            setError={setError}
            currency={currency}
            cashChangeFrom={watch('cashChangeFrom')}
          />

          {/* Order Summary */}
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
        cart={cart}
        orderSummary={orderSummary}
        currency={currency}
        loadingDeliveryPrice={loadingDeliveryPrice}
        deliveryPrice={deliveryPrice}
        bagFee={bagFee}
        deliveryUnavailable={deliveryUnavailable}
        logoErrors={logoErrors}
        setLogoErrors={setLogoErrors}
        isLoggedIn={isLoggedIn}
        onSubmit={onSubmit}
      />
    </>
  );
}
