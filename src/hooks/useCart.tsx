import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const { data } = await api.get<Stock>(`/stock/${productId}`);

      const productExists = cart.find(p => p.id === productId);

      if (productExists) {

        const amount = productExists.amount + 1;
        if (amount > data.amount) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }

        setCart(
          cart.map(p =>
            p.id === productId ? { ...p, amount: p.amount + 1 } : p
          )
        );
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
        toast.info(`${productExists.title} adicionado ao carrinho!`);
      }

      if (!productExists) {

        const { data: product } = await api.get<Product>(`/products/${productId}`);

        localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, { ...product, amount: 1 }]));

        setCart([...cart, { ...product, amount: 1 }]);
        toast.info(`${product.title} adicionado ao carrinho!`);

      }



    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCart = cart.filter(p => p.id !== productId);
      setCart(newCart);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
      toast.info('Produto removido do carrinho');


    } catch {
      toast.error('Erro na remoção do produto');

    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const { data } = await api.get<Stock>(`/stock/${productId}`);

      if (amount > data.amount) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const newCart = cart.map(p =>
        p.id === productId ? { ...p, amount: amount } : p
      );

      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
    } catch {
      toast.error('Erro na atualização do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
