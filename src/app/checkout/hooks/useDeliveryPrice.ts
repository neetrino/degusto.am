import { useState, useEffect } from 'react';
import { apiClient } from '../../../lib/api-client';

export function useDeliveryPrice(
  shippingMethod: 'pickup' | 'delivery',
  shippingCity: string | undefined
) {
  const [deliveryPrice, setDeliveryPrice] = useState<number | null>(null);
  const [bagFee, setBagFee] = useState<number>(0);
  const [deliveryUnavailable, setDeliveryUnavailable] = useState(false);
  const [loadingDeliveryPrice, setLoadingDeliveryPrice] = useState(false);

  useEffect(() => {
    const fetchDeliveryPrice = async () => {
      if (shippingMethod === 'delivery' && shippingCity && shippingCity.trim().length > 0) {
        setLoadingDeliveryPrice(true);
        try {
          const response = await apiClient.get<{ price: number; bagFee?: number }>('/api/v1/delivery/price', {
            params: {
              city: shippingCity.trim(),
              country: 'Armenia',
            },
          });
          setDeliveryPrice(response.price);
          setBagFee(typeof response.bagFee === 'number' ? response.bagFee : 0);
          setDeliveryUnavailable(false);
        } catch {
          setDeliveryPrice(0);
          setBagFee(0);
          setDeliveryUnavailable(true);
        } finally {
          setLoadingDeliveryPrice(false);
        }
      } else {
        setDeliveryPrice(null);
        setBagFee(0);
        setDeliveryUnavailable(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchDeliveryPrice();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [shippingCity, shippingMethod]);

  return { deliveryPrice, bagFee, deliveryUnavailable, loadingDeliveryPrice };
}




