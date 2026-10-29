export const PEOPLE = ["Богдана", "Назар", "Марян", "Тіна"] as const;
export const CATEGORIES = ["Їжа", "Транспорт", "Житло", "Розваги", "Покупки", "Інше"] as const;
export const CURRENCIES = ["UAH", "USD", "PLN"] as const;

export type Person = (typeof PEOPLE)[number];
export type Category = (typeof CATEGORIES)[number];
export type Currency = (typeof CURRENCIES)[number];
/** Скільки гривень за 1 одиницю валюти. */
export type Rates = { USD: number; PLN: number };

export type Expense = {
  id: string;
  who: Person;
  amount: number;
  currency: Currency;
  amountUah: number;
  note: string;
  category: Category;
  at: number;
};

export type Payment = {
  id: string;
  from: Person;
  to: Person;
  amount: number;
  currency: Currency;
  amountUah: number;
  at: number;
};

export type ExpensesData = { items: Expense[]; payments: Payment[]; rates: Rates };

export function toUah(amount: number, currency: Currency, rates: Rates) {
  return currency === "UAH" ? amount : amount * rates[currency];
}

export function fromUah(uah: number, currency: Currency, rates: Rates) {
  return currency === "UAH" ? uah : uah / rates[currency];
}
