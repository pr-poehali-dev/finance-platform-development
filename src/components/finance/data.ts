export type Period = 'month' | 'quarter' | 'year';

export const periodLabels: Record<Period, string> = {
  month: 'Месяц',
  quarter: 'Квартал',
  year: 'Год',
};

export interface PnLPoint {
  label: string;
  income: number;
  expense: number;
}

export const pnlData: Record<Period, PnLPoint[]> = {
  month: [
    { label: '1 нед', income: 820, expense: 540 },
    { label: '2 нед', income: 940, expense: 610 },
    { label: '3 нед', income: 1120, expense: 700 },
    { label: '4 нед', income: 1310, expense: 820 },
  ],
  quarter: [
    { label: 'Янв', income: 3200, expense: 2100 },
    { label: 'Фев', income: 3600, expense: 2300 },
    { label: 'Мар', income: 4190, expense: 2670 },
  ],
  year: [
    { label: 'Q1', income: 10990, expense: 7070 },
    { label: 'Q2', income: 12400, expense: 8100 },
    { label: 'Q3', income: 13850, expense: 8600 },
    { label: 'Q4', income: 15200, expense: 9200 },
  ],
};

export interface Transaction {
  id: number;
  date: string;
  name: string;
  category: string;
  type: 'income' | 'expense';
  amount: number;
}

export const transactions: Transaction[] = [
  { id: 1, date: '02 июл', name: 'Оплата от ООО «Ветер»', category: 'Продажи', type: 'income', amount: 480000 },
  { id: 2, date: '01 июл', name: 'Аренда офиса', category: 'Помещение', type: 'expense', amount: 120000 },
  { id: 3, date: '30 июн', name: 'Подписка Битрикс24', category: 'Софт', type: 'expense', amount: 24000 },
  { id: 4, date: '28 июн', name: 'Оплата от ИП Смирнов', category: 'Услуги', type: 'income', amount: 215000 },
  { id: 5, date: '27 июн', name: 'Зарплата команды', category: 'ФОТ', type: 'expense', amount: 680000 },
  { id: 6, date: '25 июн', name: 'Рекламный бюджет', category: 'Маркетинг', type: 'expense', amount: 95000 },
  { id: 7, date: '24 июн', name: 'Оплата от ООО «Каскад»', category: 'Продажи', type: 'income', amount: 360000 },
];

export const forecast = [
  { label: 'Авг', value: 4300, projected: true },
  { label: 'Сен', value: 4650, projected: true },
  { label: 'Окт', value: 5020, projected: true },
];

export function formatMoney(n: number): string {
  return n.toLocaleString('ru-RU');
}
