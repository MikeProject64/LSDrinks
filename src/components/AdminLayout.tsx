
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Home, Menu, Package, Package2, Tag, List, Star, CreditCard, Settings, ScrollText } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { useEffect, useState } from 'react';
import { getSettings } from '@/actions/settings-actions';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [storeName, setStoreName] = useState('LSDrinks');

  useEffect(() => {
    getSettings().then(settings => {
        setStoreName(settings.storeName);
    });
  }, []);

  const navItems = [
    { href: '/admin/dashboard', label: 'Painel', icon: Home },
    { href: '/admin/orders', label: 'Pedidos', icon: ScrollText },
    { href: '/admin/highlights', label: 'Destaques', icon: Star },
    { href: '/admin/payment', label: 'Pagamento', icon: CreditCard },
    { href: '/admin/settings', label: 'Configurações', icon: Settings },
  ];

  const productsNav = [
      { href: '/admin/items', label: 'Itens', icon: List },
      { href: '/admin/categories', label: 'Categorias', icon: Tag },
  ];

  const isProductsRouteActive = productsNav.some(item => pathname.startsWith(item.href));
  
  const defaultValue = isProductsRouteActive ? "products" : "";

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Package2 className="h-6 w-6" />
              <span className="">{storeName}</span>
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {navItems.map((item) => (
                 <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                    pathname.startsWith(item.href) && "text-primary bg-muted"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
               <Accordion type="single" collapsible defaultValue={defaultValue} className="w-full">
                <AccordionItem value="products" className="border-b-0">
                  <AccordionTrigger className={cn(
                      "hover:no-underline px-3 py-2 text-muted-foreground hover:text-primary [&[data-state=open]]:text-primary",
                      isProductsRouteActive && "text-primary"
                  )}>
                     <div className='flex items-center gap-3'>
                        <Package className="h-4 w-4" />
                        <span>Produtos</span>
                     </div>
                  </AccordionTrigger>
                  <AccordionContent className="pl-8">
                     {productsNav.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                                pathname === item.href && "text-primary bg-muted"
                            )}
                            >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </nav>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Alternar menu de navegação</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <nav className="grid gap-2 text-lg font-medium">
                <Link
                  href="#"
                  className="flex items-center gap-2 text-lg font-semibold mb-4"
                >
                  <Package2 className="h-6 w-6" />
                  <span className="">{storeName}</span>
                </Link>
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground",
                       pathname.startsWith(item.href) && "bg-muted text-foreground"
                    )}
                  >
                     <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                ))}
                 <Accordion type="single" collapsible defaultValue={defaultValue} className="w-full">
                    <AccordionItem value="products" className="border-b-0">
                    <AccordionTrigger className={cn(
                        "hover:no-underline text-muted-foreground hover:text-foreground [&[data-state=open]]:text-foreground",
                        isProductsRouteActive && "text-foreground"
                    )}>
                        <div className='flex items-center gap-4'>
                            <Package className="h-5 w-5" />
                            <span>Produtos</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="pl-8">
                        {productsNav.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-4 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground",
                                    pathname === item.href && "text-foreground"
                                )}
                                >
                                <item.icon className="h-5 w-5" />
                                {item.label}
                            </Link>
                        ))}
                    </AccordionContent>
                    </AccordionItem>
                </Accordion>
              </nav>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1">
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
