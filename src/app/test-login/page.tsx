'use client';

import { useState } from 'react';

export default function SimpleLoginTest() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult('');

    console.log('🧪 TEST LOGIN başladı:', email);

    try {
      // 1. API-ya birbaşa müraciət
      console.log('📡 Sending login request...');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('📡 Response status:', response.status);
      const data = await response.json();
      console.log('📡 Response data:', data);

      if (response.ok) {
        console.log('✅ Login API success');

        // 2. Token-i localStorage-a saxla
        if (data.accessToken) {
          console.log('💾 Storing token in localStorage');
          localStorage.setItem('accessToken', data.accessToken);

          // 3. Yoxla ki, token saxlanıb
          const storedToken = localStorage.getItem('accessToken');
          console.log('🔍 Token stored check:', !!storedToken);

          setResult(`✅ Login uğurlu! Token length: ${data.accessToken.length}`);

          // 4. Dashboard-a get
          setTimeout(() => {
            console.log('🔄 Redirecting to dashboard...');
            window.location.href = '/dashboard';
          }, 1000);
        } else {
          setError('Token alınmadı');
        }
      } else {
        setError(data.message || 'Login xətası');
      }
    } catch (error: any) {
      console.error('💥 Login error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">TEST LOGIN</h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border rounded-lg"
              placeholder="Email daxil edin"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border rounded-lg"
              placeholder="Şifrə daxil edin"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Test edilir...' : 'TEST LOGIN'}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {result}
          </div>
        )}

        <div className="mt-6 text-center">
          <a href="/auth/login" className="text-blue-600 hover:underline">
            Normal login səhifəsinə qayıt
          </a>
        </div>
      </div>
    </div>
  );
}
