import { createContext, ReactNode, useContext, useState } from 'react';
import { Alert } from 'react-native';

type Item = { name: string; price: number; qty: number };
type CartType = {
  items: Item[]; cookId: string | null;
  add: (name: string, price: number, cook?: string) => void;
  remove: (name: string) => void;
  clear: () => void;
  count: number; total: number;
};

const CartContext = createContext<CartType>(null as any);
export const useCart = () => useContext(CartContext);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const [cookId, setCookId] = useState<string | null>(null);

  const add = (name: string, price: number, cook?: string) => {
    if (cook && cookId && cook !== cookId && items.length > 0) {
      Alert.alert('Start a new cart?', 'Your cart has items from another cook. Clear it and add this item?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear & add', onPress: () => { setCookId(cook); setItems([{ name, price, qty: 1 }]); } },
      ]);
      return;
    }
    if (cook) setCookId(cook);
    setItems((prev) =>
      prev.find((i) => i.name === name)
        ? prev.map((i) => (i.name === name ? { ...i, qty: i.qty + 1 } : i))
        : [...prev, { name, price, qty: 1 }]
    );
  };

  const remove = (name: string) =>
    setItems((prev) => prev.map((i) => (i.name === name ? { ...i, qty: i.qty - 1 } : i)).filter((i) => i.qty > 0));

  const clear = () => { setItems([]); setCookId(null); };
  const count = items.reduce((s, i) => s + i.qty, 0);
  const total = items.reduce((s, i) => s + i.qty * i.price, 0);

  return (
    <CartContext.Provider value={{ items, cookId, add, remove, clear, count, total }}>
      {children}
    </CartContext.Provider>
  );
}