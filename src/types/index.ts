export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  tags?: string[]; // Opcional: selos como 'Novo', 'Mais Vendido'
  dataAiHint: string;
};

export type CartItem = Product & {
  quantity: number;
};
