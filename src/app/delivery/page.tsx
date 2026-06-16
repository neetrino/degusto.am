'use client';

import { Card } from '@shop/ui';
import { useEffect, useState } from 'react';
import { useTranslation } from '../../lib/i18n-client';
import { loadTranslation } from '../../lib/i18n';
import { SITE_CONTACT_EMAIL, SITE_CONTACT_PHONES } from '../../lib/site-contact';

export default function DeliveryPage() {
  const { t, lang } = useTranslation();
  const [methods, setMethods] = useState<Array<{
    id: string;
    enabled: boolean;
    name: string;
    price: number;
    freeAbove: number | null;
    estimatedDays: number;
    locations: Array<{ name: string; address: string; workingHours?: string }>;
  }>>([]);

  useEffect(() => {
    const loadMethods = () => {
      const deliveryData = loadTranslation(lang, 'delivery') as { methods?: typeof methods } | null;
      setMethods(deliveryData?.methods ?? []);
    };
    loadMethods();
  }, [lang]);

  const deliveryData = loadTranslation(lang, 'delivery');
  
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t('delivery.title')}</h1>
      
      <div className="space-y-6">
        {/* Delivery Information */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('delivery.deliveryInformation.title')}</h2>
          <div className="space-y-4 text-gray-700">
            {methods.map((method) => {
              if (!method.enabled) return null;
              const freeAbove = method.freeAbove ? new Intl.NumberFormat('hy-AM', {
                style: 'currency',
                currency: 'AMD',
                minimumFractionDigits: 0,
              }).format(method.freeAbove) : null;
              
              return (
                <div key={method.id}>
                  <h3 className="font-semibold text-gray-900 mb-2">{method.name}</h3>
                  <p className="text-gray-600">
                    {method.price === 0 ? (
                      t('delivery.deliveryInformation.freeDelivery')
                    ) : (
                      <>
                        {t('delivery.deliveryInformation.deliveryCost').replace('{price}', new Intl.NumberFormat('hy-AM', {
                          style: 'currency',
                          currency: 'AMD',
                          minimumFractionDigits: 0,
                        }).format(method.price))}
                        {freeAbove && ` (${t('delivery.deliveryInformation.freeForOrdersAbove').replace('{amount}', freeAbove)})`}
                      </>
                    )}
                  </p>
                  {method.estimatedDays > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      {t('delivery.deliveryInformation.estimatedDelivery')
                        .replace('{days}', method.estimatedDays.toString())
                        .replace('{daysText}', method.estimatedDays === 1 ? t('delivery.deliveryInformation.day') : t('delivery.deliveryInformation.days'))}
                    </p>
                  )}
                  {method.locations && method.locations.length > 0 && (
                    <div className="mt-2 text-sm text-gray-600">
                      <p className="font-medium mb-1">{t('delivery.deliveryInformation.pickupLocations')}</p>
                      <ul className="list-disc list-inside space-y-1">
                        {method.locations.map((location, idx) => (
                          <li key={idx}>
                            {location.name} - {location.address}
                            {location.workingHours && (
                              <span className="text-gray-500">
                                {' '}({location.workingHours})
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Return Policy */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('delivery.returnPolicy.title')}</h2>
          <div className="space-y-4 text-gray-700">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">{t('delivery.returnPolicy.thirtyDayPolicy.title')}</h3>
              <p className="text-gray-600">
                {t('delivery.returnPolicy.thirtyDayPolicy.description')}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">{t('delivery.returnPolicy.returnConditions.title')}</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                {Array.isArray(deliveryData?.returnPolicy?.returnConditions?.items)
                  ? deliveryData.returnPolicy.returnConditions.items.map((item: string, idx: number) => (
                      <li key={idx}>{item}</li>
                    ))
                  : null}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">{t('delivery.returnPolicy.howToReturn.title')}</h3>
              <ol className="list-decimal list-inside text-gray-600 space-y-1">
                {Array.isArray(deliveryData?.returnPolicy?.howToReturn?.steps)
                  ? deliveryData.returnPolicy.howToReturn.steps.map((step: string, idx: number) => (
                      <li key={idx}>{step}</li>
                    ))
                  : null}
              </ol>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">{t('delivery.returnPolicy.refundProcess.title')}</h3>
              <p className="text-gray-600">
                {t('delivery.returnPolicy.refundProcess.description')}
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">{t('delivery.returnPolicy.nonReturnableItems.title')}</h3>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                {Array.isArray(deliveryData?.returnPolicy?.nonReturnableItems?.items)
                  ? deliveryData.returnPolicy.nonReturnableItems.items.map((item: string, idx: number) => (
                      <li key={idx}>{item}</li>
                    ))
                  : null}
              </ul>
            </div>
          </div>
        </Card>

        {/* Contact Information */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('delivery.contact.title')}</h2>
          <p className="text-gray-600 mb-4">
            {t('delivery.contact.description')}
          </p>
          <div className="space-y-2 text-gray-700">
            <p>
              <span className="font-semibold">{t('delivery.contact.email')}</span>{' '}
              <a href={`mailto:${SITE_CONTACT_EMAIL}`} className="text-blue-600 hover:underline">
                {SITE_CONTACT_EMAIL}
              </a>
            </p>
            <p>
              <span className="font-semibold">{t('delivery.contact.phone')}</span>
            </p>
            <ul className="list-none space-y-1 pl-0">
              {SITE_CONTACT_PHONES.map((phone) => (
                <li key={phone.tel}>
                  <a href={`tel:${phone.tel}`} className="text-blue-600 hover:underline">
                    {phone.display}
                  </a>
                </li>
              ))}
            </ul>
            <p>
              <span className="font-semibold">{t('delivery.contact.hours')}</span> {t('delivery.contact.hoursValue')}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

