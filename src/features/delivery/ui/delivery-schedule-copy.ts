import type { DeliveryWeekday } from "@/features/delivery/domain/delivery-schedule";
import type { Locale } from "@/lib/i18n/config";

export type DeliveryScheduleCopy = {
  title: string;
  intervalLabel: string;
  bookingDaysLabel: string;
  dayColumn: string;
  openColumn: string;
  startColumn: string;
  endColumn: string;
  closedDaysTitle: string;
  closedDaysPlaceholder: string;
  closeDayButton: string;
  noClosedDays: string;
  removeClosedDay: string;
  saved: string;
  saveError: string;
  weekdays: Record<DeliveryWeekday, string>;
};

const COPY: Record<Locale, DeliveryScheduleCopy> = {
  hy: {
    title: "Առաքման ժամանակացույց",
    intervalLabel: "Ժամային միջակայքի տևողություն (րոպե)",
    bookingDaysLabel: "Ամրագրման հասանելի օրեր",
    dayColumn: "Օր",
    openColumn: "Բաց",
    startColumn: "Սկսած",
    endColumn: "Մինչև",
    closedDaysTitle: "Փակ օրեր",
    closedDaysPlaceholder: "Ընտրեք օրը",
    closeDayButton: "Փակել այս օրը",
    noClosedDays:
      "Փակ օրեր չկան։ Ավելացրեք տոներ կամ օրեր, երբ չեք առաքում։",
    removeClosedDay: "Հեռացնել",
    saved: "Ժամանակացույցը պահպանվեց։",
    saveError: "Չհաջողվեց պահպանել ժամանակացույցը։",
    weekdays: {
      monday: "Երկուշաբթի",
      tuesday: "Երեքշաբթի",
      wednesday: "Չորեքշաբթի",
      thursday: "Հինգշաբթի",
      friday: "Ուրբաթ",
      saturday: "Շաբաթ",
      sunday: "Կիրակի",
    },
  },
  en: {
    title: "Delivery schedule",
    intervalLabel: "Slot duration (minutes)",
    bookingDaysLabel: "Bookable days ahead",
    dayColumn: "Day",
    openColumn: "Open",
    startColumn: "From",
    endColumn: "Until",
    closedDaysTitle: "Closed days",
    closedDaysPlaceholder: "Select a date",
    closeDayButton: "Close this day",
    noClosedDays:
      "No closed days. Add holidays or dates when you do not deliver.",
    removeClosedDay: "Remove",
    saved: "Schedule saved.",
    saveError: "Could not save the schedule.",
    weekdays: {
      monday: "Monday",
      tuesday: "Tuesday",
      wednesday: "Wednesday",
      thursday: "Thursday",
      friday: "Friday",
      saturday: "Saturday",
      sunday: "Sunday",
    },
  },
  ru: {
    title: "График доставки",
    intervalLabel: "Длительность интервала (минуты)",
    bookingDaysLabel: "Доступные дни для бронирования",
    dayColumn: "День",
    openColumn: "Открыто",
    startColumn: "С",
    endColumn: "До",
    closedDaysTitle: "Закрытые дни",
    closedDaysPlaceholder: "Выберите день",
    closeDayButton: "Закрыть этот день",
    noClosedDays:
      "Закрытых дней нет. Добавьте праздники или дни без доставки.",
    removeClosedDay: "Удалить",
    saved: "График сохранён.",
    saveError: "Не удалось сохранить график.",
    weekdays: {
      monday: "Понедельник",
      tuesday: "Вторник",
      wednesday: "Среда",
      thursday: "Четверг",
      friday: "Пятница",
      saturday: "Суббота",
      sunday: "Воскресенье",
    },
  },
};

export function getDeliveryScheduleCopy(locale: string): DeliveryScheduleCopy {
  if (locale in COPY) {
    return COPY[locale as Locale];
  }
  return COPY.en;
}
