import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/session';

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  // A forma correta de obter o cookie no middleware é a partir do request
  const sessionCookie = req.cookies.get('session')?.value;
  const session = await decrypt(sessionCookie);

  const isLoginPage = path.startsWith('/admin/login');

  // Se o usuário estiver na página de login
  if (isLoginPage) {
    // e já tiver uma sessão válida, redireciona para o dashboard
    if (session?.isAdmin) {
      return NextResponse.redirect(new URL('/admin/dashboard', req.nextUrl));
    }
    // caso contrário, permite o acesso à página de login
    return NextResponse.next();
  }

  // Se o usuário estiver em qualquer outra página de admin
  // e não tiver uma sessão válida, redireciona para o login
  if (!session?.isAdmin) {
    return NextResponse.redirect(new URL('/admin/login', req.nextUrl));
  }

  // Se tiver uma sessão válida, permite o acesso
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
}; 