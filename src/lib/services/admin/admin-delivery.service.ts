import { db } from "@white-shop/db";
import { problemTypes } from "@/lib/http/problem-details";

const DEFAULT_DELIVERY_COUNTRY = "Հայաստան";

type DeliveryLocation = {
  id?: string;
  country: string;
  city: string;
  price: number;
};

class AdminDeliveryService {
  private normalizeCountry(country: string): string {
    return country.toLowerCase().trim();
  }

  private hasSameCountry(a: string, b: string): boolean {
    const normalizedA = this.normalizeCountry(a);
    const normalizedB = this.normalizeCountry(b);
    const armeniaAliases = new Set(["armenia", "hayastan", "հայաստան"]);
    if (armeniaAliases.has(normalizedA) && armeniaAliases.has(normalizedB)) {
      return true;
    }
    return normalizedA === normalizedB;
  }

  /**
   * Get delivery settings
   */
  async getDeliverySettings() {
    const setting = await db.settings.findUnique({
      where: { key: 'delivery-locations' },
    });

    if (!setting) {
      return {
        locations: [],
      };
    }

    const value = setting.value as { locations?: DeliveryLocation[] };
    return {
      locations: value.locations || [],
    };
  }

  async getPublicDeliveryLocations() {
    const settings = await this.getDeliverySettings();
    const uniqueCities = new Map<string, string>();

    for (const location of settings.locations) {
      const trimmedCity = location.city.trim();
      if (trimmedCity.length === 0) {
        continue;
      }
      const key = trimmedCity.toLowerCase();
      if (!uniqueCities.has(key)) {
        uniqueCities.set(key, trimmedCity);
      }
    }

    const cities = Array.from(uniqueCities.values()).sort((a, b) => a.localeCompare(b));
    return {
      cities,
    };
  }

  /**
   * Get delivery price for a specific city
   * Returns the configured price if city has shipping, otherwise returns 0
   */
  async getDeliveryPrice(city: string, country: string = DEFAULT_DELIVERY_COUNTRY) {
    const setting = await db.settings.findUnique({
      where: { key: 'delivery-locations' },
    });

    if (!setting) {
      return 0;
    }

    const value = setting.value as { locations?: DeliveryLocation[] };
    const locations = value.locations || [];

    // Find matching location (case-insensitive)
    const location = locations.find(
      (loc) => 
        loc.city.toLowerCase().trim() === city.toLowerCase().trim() &&
        this.hasSameCountry(loc.country, country)
    );

    if (location) {
      return location.price;
    }

    const cityMatch = locations.find(
      (loc) => loc.city.toLowerCase().trim() === city.toLowerCase().trim()
    );

    if (cityMatch) {
      return cityMatch.price;
    }

    return 0;
  }

  /**
   * Update delivery settings
   */
  async updateDeliverySettings(data: { locations: Array<{ id?: string; country?: string; city: string; price: number }> }) {
    if (!Array.isArray(data.locations)) {
      throw {
        status: 400,
        type: problemTypes.validationError,
        title: "Validation Error",
        detail: "Locations must be an array",
      };
    }

    // Validate each location
    for (const location of data.locations) {
      if (!location.city) {
        throw {
          status: 400,
          type: problemTypes.validationError,
          title: "Validation Error",
          detail: "Each location must have city",
        };
      }
      if (typeof location.price !== 'number' || location.price < 0) {
        throw {
          status: 400,
          type: problemTypes.validationError,
          title: "Validation Error",
          detail: "Price must be a non-negative number",
        };
      }
    }

    // Generate IDs for new locations
    const locationsWithIds = data.locations.map((location, index) => ({
      ...location,
      country: location.country?.trim() || DEFAULT_DELIVERY_COUNTRY,
      city: location.city.trim(),
      id: location.id || `location-${Date.now()}-${index}`,
    }));

    const setting = await db.settings.upsert({
      where: { key: 'delivery-locations' },
      update: {
        value: { locations: locationsWithIds },
        updatedAt: new Date(),
      },
      create: {
        key: 'delivery-locations',
        value: { locations: locationsWithIds },
        description: 'Delivery prices by country and city',
      },
    });

    return {
      locations: locationsWithIds,
    };
  }
}

export const adminDeliveryService = new AdminDeliveryService();



