import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';


// GET /api/user/profile - Get user profile
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Giriş tələb olunur' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = await verifyJWT(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Etibarsız token' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        tier: true,
        loginMethod: true,
        linkedinUsername: true,
        createdAt: true,
        lastLogin: true,
        _count: {
          select: {
            cvs: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'İstifadəçi tapılmadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        cvCount: user._count.cvs
      }
    });

  } catch (error) {
    console.error('Profile get error:', error);
    return NextResponse.json(
      { error: 'Profil məlumatları yüklənərkən xəta baş verdi' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT /api/user/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Giriş tələb olunur' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = await verifyJWT(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Etibarsız token' },
        { status: 401 }
      );
    }

    const { name, email, currentPassword, newPassword } = await request.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Ad və email tələb olunur' },
        { status: 400 }
      );
    }

    // Validate name with Azerbaijani characters
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      return NextResponse.json(
        { error: 'Ad Soyad ən azı 2 simvoldan ibarət olmalıdır' },
        { status: 400 }
      );
    }

    if (trimmedName.length > 100) {
      return NextResponse.json(
        { error: 'Ad Soyad çox uzundur' },
        { status: 400 }
      );
    }

    // Check for dash/hyphen
    if (trimmedName.includes('-')) {
      return NextResponse.json(
        { error: 'Ad Soyadda tire (-) istifadə edilə bilməz' },
        { status: 400 }
      );
    }

    // Check for numbers
    if (/\d/.test(trimmedName)) {
      return NextResponse.json(
        { error: 'Ad Soyadda rəqəm istifadə edilə bilməz' },
        { status: 400 }
      );
    }

    // Check for multiple consecutive spaces
    if (trimmedName.includes('  ')) {
      return NextResponse.json(
        { error: 'Ad Soyadda ardıcıl boşluqlar ola bilməz' },
        { status: 400 }
      );
    }

    // Check if starts or ends with space (should be handled by trim, but double check)
    if (name.startsWith(' ') || name.endsWith(' ')) {
      return NextResponse.json(
        { error: 'Ad Soyad boşluqla başlaya və ya bitə bilməz' },
        { status: 400 }
      );
    }

    // Check for Azerbaijani alphabet including ə, Ə, ğ, Ğ, etc.
    const nameRegex = /^[a-zA-Z\u0259\u018F\u011F\u011E\u00FC\u00DC\u015F\u015E\u00F6\u00D6\u00E7\u00C7\u0131\u0130\s'.]+$/;
    if (!nameRegex.test(trimmedName)) {
      return NextResponse.json(
        { error: 'Ad Soyadda yalnız hərflər istifadə edilə bilər' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Düzgün email formatı daxil edin' },
        { status: 400 }
      );
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'İstifadəçi tapılmadı' },
        { status: 404 }
      );
    }

    // Check if email is already taken by another user
    if (email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser && existingUser.id !== user.id) {
        return NextResponse.json(
          { error: 'Bu email artıq istifadə olunur' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      name,
      email
    };

    // Handle password change for email users
    if (currentPassword && newPassword) {
      if (user.loginMethod === 'linkedin') {
        return NextResponse.json(
          { error: 'LinkedIn hesabları üçün şifrə dəyişikliyi mümkün deyil' },
          { status: 400 }
        );
      }

      if (!user.password) {
        return NextResponse.json(
          { error: 'Hazırki şifrə tapılmadı' },
          { status: 400 }
        );
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return NextResponse.json(
          { error: 'Hazırki şifrə səhvdir' },
          { status: 400 }
        );
      }

      // Validate new password
      if (newPassword.length < 8) {
        return NextResponse.json(
          { error: 'Yeni şifrə ən azı 8 simvoldan ibarət olmalıdır' },
          { status: 400 }
        );
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);
      updateData.password = hashedNewPassword;
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        tier: true,
        loginMethod: true,
        linkedinUsername: true,
        createdAt: true,
        lastLogin: true,
        _count: {
          select: {
            cvs: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Profil uğurla yeniləndi',
      user: {
        ...updatedUser,
        cvCount: updatedUser._count.cvs
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Profil yenilənərkən xəta baş verdi' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
