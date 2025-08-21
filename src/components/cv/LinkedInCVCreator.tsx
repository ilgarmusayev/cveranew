'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface LinkedInUser {
  name: string;
  linkedinUsername: string;
  loginMethod: string;
}

export default function LinkedInCVCreator() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [linkedinUser, setLinkedinUser] = useState<LinkedInUser | null>(null)

  useEffect(() => {
    // Check if user is logged in with LinkedIn
    if (user) {
      if (user.loginMethod === 'linkedin' && user.linkedinId) {
        setLinkedinUser({
          name: user.name,
          linkedinUsername: user.linkedinId, // Use linkedinId as fallback
          loginMethod: user.loginMethod
        })
      }
    }
  }, [user])

  const handleLinkedInCVCreation = async () => {
    if (!user || !linkedinUser) return

    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('accessToken')

      const response = await fetch('/api/cv/create-from-linkedin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'CV yaratmaq uğursuz oldu')
      }

      // Redirect to CV editor with the created CV
      router.push(`/cv/${data.cv.id}`)
    } catch (error: any) {
      console.error('LinkedIn CV creation error:', error)
      setError(error.message || 'CV yaratmaq zamanı xəta baş verdi')
    } finally {
      setLoading(false)
      setShowConfirmation(false)
    }
  }

  const handleLinkedInLogin = () => {
    window.location.href = '/api/auth/linkedin'
  }

  // If user is not logged in or not with LinkedIn
  if (!user || !linkedinUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">LinkedIn ilə CV Yarat</h2>
            <p className="text-gray-600 mb-6">
              LinkedIn profilinizin məlumatlarını avtomatik olaraq idxal edib professional CV yaratmaq üçün LinkedIn hesabınızla daxil olun.
            </p>
            <button
              onClick={handleLinkedInLogin}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              LinkedIn ilə Daxil ol
            </button>
            <Link
              href="/dashboard"
              className="block mt-4 text-sm text-gray-500 hover:text-gray-700"
            >
              ← Dashboard-a qayıt
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Confirmation dialog
  if (showConfirmation) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">CV Yaratmağı Təsdiq Et</h3>
            <p className="text-gray-600 mb-6">
              LinkedIn profilinizin məlumatları ilə yeni CV yaratmaq istədiyinizə əminsiniz?
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmation(false)}
                disabled={loading}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                İmtina Et
              </button>
              <button
                onClick={handleLinkedInCVCreation}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    CV Yaradılır...
                  </div>
                ) : (
                  'Bəli, CV Yarat'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Main LinkedIn CV creation interface
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">LinkedIn ilə CV Yarat</h1>
          <p className="text-lg text-gray-600">
            LinkedIn profilinizin məlumatları ilə avtomatik CV yaradın
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                <div className="text-left">
                  <p className="text-sm text-gray-500">Daxil olmuş istifadəçi</p>
                  <p className="font-medium text-gray-900">{linkedinUser.name}</p>
                  <p className="text-sm text-blue-600">@{linkedinUser.linkedinUsername}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              LinkedIn Profil Məlumatları Hazırdır
            </h2>
            <p className="text-gray-600 mb-8">
              LinkedIn profilinizin məlumatları avtomatik olaraq çəkiləcək və professional CV yaradılacaq.
              Bu proses bir neçə saniyə çəkə bilər.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                </svg>
                <div className="text-left">
                  <h3 className="text-sm font-medium text-blue-900">Əlavə ediləcək məlumatlar:</h3>
                  <ul className="mt-2 text-sm text-blue-800 space-y-1">
                    <li>• Şəxsi məlumatlar və əlaqə detalları</li>
                    <li>• İş təcrübəsi və vəzifələr</li>
                    <li>• Təhsil məlumatları</li>
                    <li>• Bacarıqlar və tövsiyələr</li>
                    <li>• Professional xülasə</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowConfirmation(true)}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors text-lg font-medium"
            >
              LinkedIn CV Yarat
            </button>

            <div className="mt-6">
              <Link
                href="/dashboard"
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Dashboard-a qayıt
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
