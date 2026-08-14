import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { login as loginService, resolveUserEntityIds } from '../../services/authService'
import { useAuth } from '../../hooks/useAuth'
import Logo from '../../assets/Logo.png'

export default function Login() {
  const [role, setRole] = useState('sppg')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const notice = location.state?.notice ?? ''

  const roleOptions = [
    { key: 'sppg', label: 'Masuk sebagai SPPG' },
    { key: 'sekolah', label: 'Masuk sebagai Sekolah' },
  ]

  const footerLinks = ['Kebijakan Privasi', 'Ketentuan Layanan', 'Pusat Dukungan']

  const dashboardPath = role === 'sppg' ? '/dashboard/sppg' : '/dashboard/sekolah'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await loginService({ identifier, password, role })
      const data = res?.data ?? {}
      const token = data?.token ?? data?.accessToken ?? data?.data?.token ?? null
      const userData = data?.user ?? data?.data?.user ?? null

      if (!userData) {
        throw new Error('Data pengguna tidak ditemukan pada response login.')
      }

      const resolvedUser = await resolveUserEntityIds({ user: userData, role })

      login({ user: resolvedUser, token })
      navigate(dashboardPath)
      setLoading(false)
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Login gagal. Periksa kembali data Anda.')
      setLoading(false)
    }
  }

  const inputBaseClass =
    'w-full rounded-lg border border-transparent bg-[#CFE6F2] py-[13px] pl-11 pr-4 text-[15px] text-[#424752] outline-none transition-colors focus:border-[#00478D]'

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#F3FAFF] px-4 py-8 sm:px-6 lg:px-8">
      {error && (
        <div className="pointer-events-none fixed inset-x-0 top-5 z-50 flex justify-center px-4">
          <div className="pointer-events-auto w-full max-w-md rounded-xl border border-red-200 bg-white/95 px-4 py-3 shadow-[0_12px_30px_rgba(239,68,68,0.20)] backdrop-blur-sm">
            <p className="m-0 text-center text-sm font-semibold text-red-600">{error}</p>
          </div>
        </div>
      )}

      <div className="flex w-full max-w-[1100px] flex-col overflow-hidden rounded-[20px] shadow-[0_8px_48px_0_rgba(0,71,141,0.10)] lg:min-h-[640px] lg:flex-row">
        <div className="relative flex flex-1 flex-col overflow-hidden bg-[#E6F6FF] p-6 sm:p-10 lg:p-12">
          <div className="pointer-events-none absolute -left-20 -top-20 h-80 w-80 rounded-full bg-[#A0F399] opacity-20 blur-[32px]" />
          <div className="pointer-events-none absolute -bottom-16 -right-16 h-80 w-80 rounded-full bg-[#D6E3FF] opacity-20 blur-[32px]" />

          <button
            type="button"
            onClick={() => navigate('/')}
            className="relative z-10 mb-8 inline-flex w-fit items-center gap-4"
          >
            <span className="flex h-[47px] w-[47px] shrink-0 items-center justify-center rounded-[15px] bg-[#F3FAFF]">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M20 12H4M4 12L10 6M4 12L10 18" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="text-lg font-bold text-black">Kembali</span>
          </button>

          <div className="relative z-10 flex flex-1 flex-col justify-between gap-8">
            <div className="flex flex-col gap-7">
              <div className="overflow-hidden rounded-xl bg-white p-3.5 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.20)]">
                <img
                  src="https://api.builder.io/api/v1/image/assets/TEMP/7a00c5a139c82a636d2af6bbbece26e25f6ba99d?width=1024"
                  alt="Dapur SPPG"
                  className="block h-60 w-full rounded-lg object-cover"
                />
              </div>

              <div className="flex flex-col gap-3">
                <h2 className="m-0 text-3xl font-bold leading-[38px] text-[#00478D] sm:text-[32px]">
                  Membangun Kepercayaan Melalui Transparansi
                </h2>
                <p className="m-0 text-base leading-[26px] text-[#424752]">
                  Platform SIGIZI membantu pengelolaan distribusi makanan sekolah yang transparan dan efisien untuk operasional harian Anda.
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2.5">
              <p className="m-0 text-xs font-semibold text-[#424752]">
                © 2026 SIGIZI - Capstone Kelompok 11 - All rights reserved.
              </p>
              <div className="flex flex-wrap gap-4">
                {footerLinks.map((label) => (
                  <a key={label} href="#" className="text-xs font-medium text-[#727783] no-underline">
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center bg-[#F3FAFF] px-5 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="flex w-full max-w-[420px] flex-col gap-7">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-3.5">
                <img src={Logo} alt="SIGIZI" className="h-[42px] w-[52px] object-contain" />
                <span className="font-['Public_Sans'] text-2xl font-bold uppercase tracking-[-0.5px] text-slate-900">
                  SIGIZI
                </span>
              </div>
              <p className="m-0 text-lg font-bold text-[#424752]">Platform Layanan Publik</p>
            </div>

            <div className="flex flex-col gap-[22px] rounded-xl bg-white p-6 shadow-sm sm:p-8">
              <h2 className="m-0 text-xl font-bold text-[#071E27]">Selamat Datang Kembali</h2>
              {notice && (
                <p className="m-0 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-[13px] text-amber-800">
                  {notice}
                </p>
              )}

              <div className="flex rounded-lg bg-[#CFE6F2] p-1">
                {roleOptions.map(({ key, label }) => {
                  const isActive = role === key

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setRole(key)
                        setError('')
                      }}
                      className={`flex-1 rounded-md py-2.5 text-sm font-semibold leading-5 transition-all ${
                        isActive
                          ? 'bg-white text-[#00478D] shadow-sm'
                          : 'bg-transparent text-[#424752]'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-[#424752]">
                    {role === 'sppg' ? 'Alamat Email / Kode SPPG' : 'Alamat Email Sekolah'}
                  </label>

                  <div className="relative">
                    <svg
                      width="18"
                      height="16"
                      viewBox="0 0 18 16"
                      fill="none"
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
                    >
                      <path d="M1.667 15.833A1.667 1.667 0 0 1 0 14.167V4.167A1.667 1.667 0 0 1 1.667 2.5H15A1.667 1.667 0 0 1 16.667 4.167v10c0 .92-.747 1.666-1.667 1.666H1.667ZM8.333 9.167 1.667 5v9.167H15V5L8.333 9.167Zm0-1.667L15 3.333H1.667L8.333 7.5Z" fill="#727783" />
                    </svg>

                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={role === 'sppg' ? 'admin@sppg.id' : 'sekolah@email.id'}
                      className={inputBaseClass}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-[#424752]">Kata Sandi</label>
                    <a href="#" className="text-xs font-semibold text-[#00478D] no-underline">
                      Lupa Kata Sandi?
                    </a>
                  </div>

                  <div className="relative">
                    <svg
                      width="14"
                      height="17"
                      viewBox="0 0 14 18"
                      fill="none"
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
                    >
                      <path d="M1.667 17.5A1.667 1.667 0 0 1 0 15.833V7.5A1.667 1.667 0 0 1 1.667 5.833H2.5V4.167a4.167 4.167 0 1 1 8.333 0v1.666h.834A1.667 1.667 0 0 1 13.333 7.5v8.333A1.667 1.667 0 0 1 11.667 17.5H1.667Zm0-1.667h10V7.5h-10v8.333ZM6.667 13.417a1.667 1.667 0 1 0 0-3.334 1.667 1.667 0 0 0 0 3.334ZM4.167 5.833h5V4.167a2.5 2.5 0 0 0-5 0v1.666Z" fill="#727783" />
                    </svg>

                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`${inputBaseClass} pr-11`}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3.5 top-1/2 flex -translate-y-1/2 items-center justify-center bg-transparent p-0"
                    >
                      {showPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M12 5C7 5 2.73 8.11 1 12.5 2.73 16.89 7 20 12 20s9.27-3.11 11-7.5C21.27 8.11 17 5 12 5Zm0 12.5a5 5 0 1 1 0-10 5 5 0 0 1 0 10Zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" fill="#727783" />
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-5 0-9.27-3.11-11-7.5a11.14 11.14 0 0 1 2.53-4.1M9.9 4.24A9.12 9.12 0 0 1 12 4c5 0 9.27 3.11 11 7.5a11.06 11.06 0 0 1-1.34 2.56M1 1l22 22M9.53 9.53A3 3 0 0 0 12 15a3 3 0 0 0 2.47-5.47" stroke="#727783" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#00478D] to-[#005EB8] py-3.5 text-base font-bold text-white shadow-[0_10px_15px_-3px_rgba(0,0,0,0.10)] transition-opacity ${
                    loading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer opacity-100'
                  }`}
                >
                  {loading ? 'Memuat...' : 'Masuk'}
                  {!loading && (
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                      <path d="M7.5 15V13.333H13.333V1.667H7.5V0H13.333C13.792 0 14.184.163 14.51.49 14.837.816 15 1.208 15 1.667v11.666c0 .459-.163.851-.49 1.177-.326.327-.718.49-1.177.49H7.5ZM5.833 11.667 4.688 10.458l2.125-2.125H0V6.667h6.813L4.687 4.542 5.833 3.333 10 7.5l-4.167 4.167Z" fill="white" />
                    </svg>
                  )}
                </button>

                <p className="m-0 text-center text-xs font-semibold text-[#191919]">
                  Belum memiliki Akun?{' '}
                  <Link to="/register" className="text-[#00478D] no-underline">
                    Daftar Disini
                  </Link>
                </p>
              </form>

              <div className="flex items-start gap-2.5 border-t border-[rgba(194,198,212,0.4)] pt-5">
                <svg width="16" height="16" viewBox="0 0 15 17" fill="none" className="mt-0.5 shrink-0">
                  <path d="M6.75 13.25H8.25V8.75H6.75v4.5ZM7.5 7.25c.213 0 .391-.072.535-.216A.728.728 0 0 0 8.25 6.5a.728.728 0 0 0-.215-.535A.728.728 0 0 0 7.5 5.75a.728.728 0 0 0-.535.215A.728.728 0 0 0 6.75 6.5c0 .213.072.39.215.534A.728.728 0 0 0 7.5 7.25ZM7.5 17a7.415 7.415 0 0 1-2.925-.59 7.594 7.594 0 0 1-2.381-1.604A7.594 7.594 0 0 1 .59 12.425 7.415 7.415 0 0 1 0 9.5c0-1.038.197-2.013.59-2.925A7.594 7.594 0 0 1 2.194 4.194 7.594 7.594 0 0 1 4.575 2.59 7.415 7.415 0 0 1 7.5 2c1.038 0 2.013.197 2.925.59a7.594 7.594 0 0 1 2.381 1.604 7.594 7.594 0 0 1 1.604 2.381A7.415 7.415 0 0 1 15 9.5c0 1.038-.197 2.013-.59 2.925a7.594 7.594 0 0 1-1.604 2.381 7.594 7.594 0 0 1-2.381 1.604A7.415 7.415 0 0 1 7.5 17Zm0-1.5a5.923 5.923 0 0 0 4.256-1.744A5.923 5.923 0 0 0 13.5 9.5a5.923 5.923 0 0 0-1.744-4.256A5.923 5.923 0 0 0 7.5 3.5a5.923 5.923 0 0 0-4.256 1.744A5.923 5.923 0 0 0 1.5 9.5c0 1.663.581 3.078 1.744 4.256A5.923 5.923 0 0 0 7.5 15.5Z" fill="#006A74" />
                </svg>
                <p className="m-0 text-[13px] font-medium leading-5 text-[#424752]">
                  Akun dibuat oleh admin. Hubungi admin jika belum memiliki akses.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
