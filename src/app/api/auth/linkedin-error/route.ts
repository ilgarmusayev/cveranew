import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const error = searchParams.get('error');
    const details = searchParams.get('details');
    const debug = searchParams.get('debug');

    // Map LinkedIn OAuth errors to user-friendly messages in Azerbaijani
    const errorMessages: Record<string, { title: string; message: string; suggestion: string }> = {
      'linkedin_oauth_ugursuz': {
        title: 'LinkedIn Girişi Uğursuz Oldu',
        message: 'LinkedIn hesabınızla əlaqə qurarkən problem yaşandı. Zəhmət olmasa yenidən cəhd edin.',
        suggestion: 'LinkedIn profilinizə giriş icazəsi verildiyindən əmin olun.'
      },
      'avtorizasiya_kodu_alinmadi': {
        title: 'Avtorizasiya Problemi',
        message: 'LinkedIn-dən avtorizasiya kodu alınmadı.',
        suggestion: 'Zəhmət olmasa LinkedIn giriş prosesini yenidən başladın.'
      },
      'token_deyisimi_ugursuz': {
        title: 'Autentifikasiya Xətası',
        message: 'LinkedIn autentifikasiyası tamamlana bilmədi.',
        suggestion: 'Bu müvəqqəti problem ola bilər. Bir neçə dəqiqədən sonra yenidən cəhd edin.'
      },
      'profile_fetch_failed': {
        title: 'Profil Giriş Xətası',
        message: 'LinkedIn profil məlumatlarınıza daxil ola bilmədik.',
        suggestion: 'LinkedIn profilinizin açıq olduğundan əmin olun və ya yenidən cəhd edin.'
      },
      'no_email_provided': {
        title: 'E-poçt Tələb Olunur',
        message: 'Hesabınızı yaratmaq üçün e-poçt ünvanınıza ehtiyacımız var.',
        suggestion: 'LinkedIn e-poçt ünvanınızın əlçatan olduğundan əmin olun və yenidən cəhd edin.'
      },
      'authentication_failed': {
        title: 'Giriş Uğursuz Oldu',
        message: 'Giriş zamanı gözlənilməz xəta baş verdi.',
        suggestion: 'Zəhmət olmasa yenidən cəhd edin və ya problem davam edərsə dəstək ilə əlaqə saxlayın.'
      }
    };

    const errorInfo = (error && errorMessages[error]) || {
      title: 'Giriş Problemi',
      message: 'LinkedIn girişi zamanı bilinməyən xəta baş verdi.',
      suggestion: 'Zəhmət olmasa yenidən cəhd edin və ya e-poçt ilə giriş edin.'
    };

    // Log the error for debugging
    console.error('LinkedIn login error page accessed:', {
      error,
      details,
      debug,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    });

    // Return HTML error page instead of JSON for better UX
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${errorInfo.title} - CVera</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px 20px; background: #f5f5f5; }
        .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); text-align: center; }
        .error-icon { font-size: 48px; margin-bottom: 20px; }
        h1 { color: #d32f2f; margin-bottom: 16px; font-size: 24px; }
        p { color: #666; line-height: 1.6; margin-bottom: 24px; }
        .suggestion { background: #f0f7ff; padding: 16px; border-radius: 8px; margin-bottom: 24px; border-left: 4px solid #2196f3; }
        .buttons { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
        .btn { padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; transition: all 0.2s; }
        .btn-primary { background: #0066cc; color: white; }
        .btn-primary:hover { background: #0052a3; }
        .btn-secondary { background: #f5f5f5; color: #333; }
        .btn-secondary:hover { background: #e0e0e0; }
        .details { margin-top: 24px; padding-top: 24px; border-top: 1px solid #eee; font-size: 14px; color: #999; }
    </style>
</head>
<body>
    <div class="container">
        <div class="error-icon">⚠️</div>
        <h1>${errorInfo.title}</h1>
        <p>${errorInfo.message}</p>
        <div class="suggestion">
            <strong>💡 Təklif:</strong> ${errorInfo.suggestion}
        </div>
        <div class="buttons">
            <a href="/api/auth/linkedin" class="btn btn-primary">Yenidən LinkedIn ilə Cəhd Et</a>
            <a href="/auth/login" class="btn btn-secondary">E-poçt ilə Giriş Et</a>
        </div>
        ${debug ? `<div class="details">Xəta Təfərrüatları: ${debug}</div>` : ''}
    </div>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });

  } catch (err) {
    console.error('Error page generation failed:', err);
    return NextResponse.redirect('https://cvera.net/auth/login?fallback=true');
  }
}
