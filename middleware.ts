import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Vérifie si l'utilisateur est connecté
  const { data: { user } } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  
  // 👇 CORRECTION 1 : On autorise aussi la page de réinitialisation de mot de passe
  const isPublicPage = path.startsWith('/login') || path.startsWith('/reset-password');

  // Si non connecté et essaie d'accéder à une page privée (ex: /accueil, /admin...)
  if (!user && !isPublicPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Si connecté et essaie d'accéder à la page de login, on l'envoie à l'accueil
  if (user && path.startsWith('/login')) {
    const url = request.nextUrl.clone();
    url.pathname = '/accueil';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match toutes les routes sauf :
     * - _next/static (fichiers statiques)
     * - _next/image (images optimisées)
     * - favicon.ico
     * - fichiers images (svg, png, etc.)
     * - 👇 CORRECTION 2 : manifest.webmanifest et sw.js (pour la PWA Android)
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};