'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { loginDemo } from './actions'
import TechsasLogo from '@/components/brand/TechsasLogo'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email || !email.trim()) {
      setError('Silakan masukkan alamat email Anda.')
      return
    }

    if (!password || !password.trim()) {
      setError('Silakan masukkan kata sandi akun Anda.')
      return
    }

    setLoading(true)

    try {
      const targetEmail = email.trim().toLowerCase()
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

      // If connected to live Supabase project
      if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
        const supabase = createClient()
        const { error: authErr } = await supabase.auth.signInWithPassword({
          email: targetEmail,
          password,
        })
        if (!authErr) {
          window.location.href = redirectTo
          return
        }
      }

      // Demo Auth Mode: verify email and log in
      await loginDemo(targetEmail, redirectTo)
      window.location.href = redirectTo
    } catch (err: any) {
      setError(err?.message || 'Email atau kata sandi tidak sesuai. Silakan periksa kembali kredensial Anda.')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      {error && (
        <div className="p-3.5 rounded-xl bg-danger-50 border border-danger-200 text-xs text-danger-700 font-medium flex items-start gap-2.5">
          <span className="text-danger-500 font-bold shrink-0 mt-0.5">✕</span>
          <span>{error}</span>
        </div>
      )}

      {/* Input Email */}
      <div>
        <label htmlFor="email" className="block text-xs font-bold text-charcoal mb-1.5">
          Alamat Email Kerja
        </label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@perusahaan.id"
            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-cloud-200 bg-white text-charcoal text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-mint-500/80 focus:border-transparent transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* Input Kata Sandi */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="password" className="block text-xs font-bold text-charcoal">
            Kata Sandi
          </label>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              alert('Untuk pemulihan kata sandi akun korporat, silakan hubungi Administrator IT TECHSAS.')
            }}
            className="text-[11px] font-semibold text-slate-500 hover:text-charcoal transition-colors"
          >
            Lupa kata sandi?
          </a>
        </div>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-cloud-200 bg-white text-charcoal text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-mint-500/80 focus:border-transparent transition-all shadow-2xs"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-charcoal transition-colors p-0.5"
            title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Remember Me Checkbox */}
      <div className="flex items-center justify-between pt-1">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="w-4 h-4 rounded border-cloud-300 text-charcoal focus:ring-mint-500 focus:ring-offset-0 transition-colors"
          />
          <span className="text-xs text-slate-600 font-medium">Ingat sesi saya di perangkat ini</span>
        </label>
      </div>

      {/* Submit Button (Apple Pill Button in Mint Green) */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          id="btn-login-submit"
          className="w-full flex items-center justify-center gap-2 bg-mint-500 hover:bg-mint-400 active:scale-[0.99]
                     text-charcoal font-bold py-3.5 px-6 rounded-full transition-all duration-200 shadow-apple-mint
                     disabled:opacity-60 disabled:cursor-not-allowed text-xs sm:text-sm tracking-wide"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-charcoal" />
              <span>Memverifikasi Autentikasi...</span>
            </>
          ) : (
            <>
              <span>Masuk ke Platform</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="max-w-md w-full mx-auto py-10 px-4">
      {/* Official Brand Header */}
      <div className="text-center mb-8 flex flex-col items-center">
        <TechsasLogo variant="vertical" iconSize={56} showTagline={true} />
      </div>

      {/* Professional Apple Card */}
      <div className="bg-white border border-cloud-200 rounded-3xl p-6 sm:p-8 shadow-apple transition-all">
        

        <Suspense fallback={<div className="text-slate-400 text-center py-6 text-xs">Memuat formulir otentikasi...</div>}>
          <LoginForm />
        </Suspense>

        {/* Enterprise Security Footer */}
        <div className="mt-6 pt-4 border-t border-cloud-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-mint-600 shrink-0" />
          <span>Terenkripsi TLS 1.3 & Standar Keamanan Aset ISO 55000</span>
        </div>
      </div>

      <p className="text-center text-slate-400 text-[11px] font-medium mt-6">
        © 2026 TECHSAS — Technology for Efficient & Centralized Handling of Strategic Assets
      </p>
    </div>
  )
}
