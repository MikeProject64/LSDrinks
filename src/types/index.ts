export type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  categoryId: string;
  categoryName?: string; // Opcional, vindo da junção nas actions
  tags?: string[];
};

export type CartItem = Product & {
  quantity: number;
};
