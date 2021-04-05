import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
// import { toast } from 'react-toastify';
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
      const currentCart = [...cart]; // cart state
      const productIfExist = currentCart.find(prod => prod.id === productId);

      const getStock = await api.get(`/stock/${productId}`);

      const stock = getStock.data.amount;
      const currentStock = productIfExist ? productIfExist.amount : 0;
      const amount = currentStock + 1;

      if (amount > stock) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      if (productIfExist) {
        productIfExist.amount = amount;
      } else {
        const product = await api.get(`/products/${productId}`);

        const newProduct = {
          ...product.data,
          amount: 1,
        }
        currentCart.push(newProduct);
      }
      
      setCart(currentCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(currentCart));

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const currentCart = [...cart];
      //   setCart(filterCart);
      //   localStorage.setItem('@RocketShoes:cart', JSON.stringify(filterCart));

      const productIndex = cart.findIndex(prod => prod.id === productId)

      if(productIndex >= 0) {
        currentCart.splice(productIndex, 1);   
        setCart(currentCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(currentCart));
      } else {
        throw Error();
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) return

      const currentCart = [...cart];
      const getStock = await api.get(`/stock/${productId}`);

      const stock = getStock.data.amount;

      if (amount > stock) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }      

      const findProdcut = cart.find(prod => prod.id === productId);
      
      if (findProdcut) {
        findProdcut.amount = amount;
        setCart(currentCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(currentCart));
      } else {
        throw Error();
      }

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
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
