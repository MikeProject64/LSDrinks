export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  dataAiHint: string;
};

export type CartItem = Product & {
  quantity: number;
};
