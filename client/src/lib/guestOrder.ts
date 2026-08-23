export type GuestOrderItem = {
  id: number;
  name: string;
  price: number;
  imageUrl?: string | null;
  quantity: number;
};

export type OrderableDish = Omit<GuestOrderItem, "quantity">;

export const guestOrderStorageKey = (slug: string) => `qrserve:guest-order:${slug}`;

export function addToGuestOrder(order: GuestOrderItem[], dish: OrderableDish): GuestOrderItem[] {
  const existing = order.find(item => item.id === dish.id);
  if (!existing) return [...order, { ...dish, quantity: 1 }];
  return order.map(item => item.id === dish.id ? { ...item, quantity: item.quantity + 1 } : item);
}

export function setGuestOrderQuantity(order: GuestOrderItem[], dishId: number, quantity: number): GuestOrderItem[] {
  if (quantity <= 0) return order.filter(item => item.id !== dishId);
  return order.map(item => item.id === dishId ? { ...item, quantity } : item);
}

export function guestOrderItemCount(order: GuestOrderItem[]) {
  return order.reduce((total, item) => total + item.quantity, 0);
}

export function guestOrderTotal(order: GuestOrderItem[]) {
  return order.reduce((total, item) => total + item.price * item.quantity, 0);
}
