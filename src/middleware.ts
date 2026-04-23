import { updateSession } from '@/lib/supabase/middleware';
import { type NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  try {
    const sessionResponse = await updateSession(request);

    if (sessionResponse.headers.get('location')) {
      return sessionResponse;
    }

    const url = request.nextUrl;
    const hostname = request.headers.get('host') || '';

    const isApex = 
      hostname === 'localhost:3000' || 
      hostname === 'ligare.app' || 
      hostname === 'www.ligare.app' || 
      hostname === 'app.ligare.app';

    const isApiOrStatic = 
      url.pathname.startsWith('/api') || 
      url.pathname.startsWith('/_next') || 
      url.pathname.includes('.');

    if (!isApex && !isApiOrStatic) {
      const subdomain = hostname.split('.')[0];
      const searchParams = url.searchParams.toString();
      const path = `${url.pathname}${searchParams.length > 0 ? `?${searchParams}` : ''}`;
      // Se o usuário acessar a raiz do subdomínio, redirecionamos para o login dele
      if (url.pathname === '/') {
        const loginUrl = new URL('/login', request.url);
        return NextResponse.redirect(loginUrl);
      }

      if (url.pathname.startsWith('/register') || url.pathname.startsWith('/login')) {
        const rewriteUrl = new URL(`/${subdomain}${path}`, request.url);
        const rewrittenResponse = NextResponse.rewrite(rewriteUrl);
        
        sessionResponse.cookies.getAll().forEach((cookie) => 
          rewrittenResponse.cookies.set(cookie.name, cookie.value)
        );

        return rewrittenResponse;
      }

      return sessionResponse;
    }

    return sessionResponse;
  } catch (e: any) {
    return new NextResponse('Middleware Error: ' + e.message, { status: 500 });
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
