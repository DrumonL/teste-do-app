export const BASE_PICANHA_PRICE = 80;

export const PRICE_INCREASE_LEVELS = [5, 10, 20] as const;

export function calculatePrice(basePrice: number, increasePercent: number) {
  return Number((basePrice * (1 + increasePercent / 100)).toFixed(2));
}

export function formatBrazilianCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function createPriceLevels(basePrice = BASE_PICANHA_PRICE) {
  return PRICE_INCREASE_LEVELS.map((increasePercent) => ({
    increasePercent,
    price: calculatePrice(basePrice, increasePercent),
  }));
}
