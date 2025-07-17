import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // A verificação de cookies no middleware é uma primeira barreira.
  // O Firebase gerencia a sessão no lado do cliente, mas essa verificação
  // previne o "flash" da página de admin antes de um redirecionamento do lado do cliente.
  // Usamos um nome de cookie genérico que o Firebase costuma usar.
  const sessionCookie = request.cookies.get('__session'); // Exemplo, o nome pode variar

  const { pathname } = request.nextUrl

  // Se tentando acessar /admin/* e não há cookie de sessão
  if (pathname.startsWith('/admin') && !sessionCookie) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Se tentando acessar /login e JÁ HÁ um cookie de sessão
  if (pathname === '/login' && sessionCookie) {
    const adminUrl = new URL('/admin', request.url)
    return NextResponse.redirect(adminUrl)
  }

  return NextResponse.next()
}

// Define as rotas que este middleware irá proteger
export const config = {
  matcher: ['/admin/:path*', '/login'],
} 