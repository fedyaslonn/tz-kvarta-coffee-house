/** Public content from the fictional client's brief, independent of private leads. */
export type Interest = 'subscription' | 'order' | 'question';

export interface Coffee {
  id: string;
  origin: string;
  name: string;
  notes: string;
  roast: string;
  weight: string;
  price: number;
  color: 'clay' | 'olive' | 'gold' | 'ink';
  number: string;
}

export const coffees: readonly Coffee[] = [
  { id: 'ethiopia', origin: 'Эфиопия', name: 'Иргачеффе', notes: 'Цветы · бергамот', roast: 'Светлая обжарка', weight: '250 г', price: 32, color: 'clay', number: '01' },
  { id: 'colombia', origin: 'Колумбия', name: 'Уила', notes: 'Карамель · красное яблоко', roast: 'Для вашего утреннего ритуала', weight: '250 г', price: 29, color: 'olive', number: '02' },
  { id: 'brazil', origin: 'Бразилия', name: 'Серрадо', notes: 'Орех · шоколад', roast: 'Под эспрессо', weight: '250 г', price: 26, color: 'gold', number: '03' },
  { id: 'drips', origin: 'Дрип-пакеты', name: 'Ассорти', notes: 'Любимый кофе, где угодно', roast: 'Нужны только чашка и вода', weight: '10 штук', price: 18, color: 'ink', number: '04' },
];

export const workshop = {
  address: 'Минск, ул. Короля, 9',
  weekdays: 'Пн–пт · 8:00–20:00',
  weekend: 'Сб–вс · 10:00–18:00',
  mapUrl: 'https://yandex.by/maps/?text=' + encodeURIComponent('Минск, улица Короля, 9'),
} as const;
