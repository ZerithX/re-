import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/Logo.png";
import iconProfile from "../../assets/icon_profile.png";
import { useAuth } from "../../hooks/useAuth";
import { getNotificationsBySchoolId } from "../../services/notificationService";
import { getSekolahById } from "../../services/sekolahService";
import { getDisplayValue } from "../../utils/display";
import { resolveImageUrl } from "../../utils/imageUrl";

import iconPengiriman    from "../../assets/icon_pengiriman.png";
import iconVerifPengiriman from "../../assets/Icon_Verifikasi.png";
import iconMenu          from "../../assets/Icon_Menu.png";
import iconVerifikasi    from "../../assets/Icon_Verif.png";

function normalizeSekolahData(raw) {
  if (!raw) return null;
  return {
    ...raw,
    id: raw?.id ?? raw?.schoolId ?? null,
    nama: raw?.nama ?? raw?.schoolName ?? "-",
    alamat: raw?.alamat ?? raw?.address ?? "-",
    kota: raw?.kota ?? raw?.city ?? "-",
    jumlahSiswa: raw?.jumlahSiswa ?? raw?.studentCount ?? null,
    foto: raw?.foto ?? raw?.photoUrl ?? null,
  };
}

function IconBell({ hasUnread }) {
  return (
    <div className="relative">
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-gray-700">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      {hasUnread && (
        <span className="absolute top-0 right-0 block h-2 w-2 rounded-full ring-2 ring-white bg-red-500" />
      )}
    </div>
  );
}

function IconTypeMap({ type }) {
  const configs = {
    pengiriman:      { bg: "bg-blue-50",   img: iconPengiriman },
    verif_pengiriman:{ bg: "bg-blue-50",   img: iconVerifPengiriman },
    menu:            { bg: "bg-yellow-50", img: iconMenu },
    verifikasi:      { bg: "bg-green-50",  img: iconVerifikasi },
    info:            { bg: "bg-slate-50",  img: iconVerifikasi },
  };
  const cfg = configs[type] || configs.info;
  return (
    <div className={`w-11 h-11 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
      <img src={cfg.img} alt={type} className="w-6 h-6 object-contain" />
    </div>
  );
}

function NotifCard({ notif }) {
  return (
    <div
      className={`relative flex items-start gap-4 p-5 rounded-2xl border transition-all cursor-pointer
        ${notif.isRead
          ? "bg-white border-slate-100 hover:border-slate-200"
          : "bg-white border-slate-100 hover:border-blue-200"
        }`}
    >
      {!notif.isRead && (
        <div className="absolute left-0 top-3 bottom-3 w-1 bg-blue-500 rounded-r-full" />
      )}

      <IconTypeMap type={notif.type} />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[16px] font-bold text-slate-900 leading-snug">
            {getDisplayValue(notif.judul)}
          </p>
          <span className="text-[12px] text-slate-400 whitespace-nowrap flex-shrink-0 mt-0.5">
            {getDisplayValue(notif.waktu)}
          </span>
        </div>
        <p className="text-[14px] text-slate-500 mt-1 leading-relaxed">{getDisplayValue(notif.deskripsi)}</p>
        {notif.actionLabel && (
          <button type="button" disabled className="mt-3 inline-flex items-center gap-1.5 bg-slate-300 text-white text-xs font-semibold px-4 py-2 rounded-lg cursor-not-allowed">
            {notif.actionLabel}
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

function RightSidebar({ sekolah, totalNotifications, reviewedNotifications }) {
  const sekolahPhoto = resolveImageUrl(sekolah?.foto);
  const reviewedRatio =
    totalNotifications > 0
      ? `${Math.round((reviewedNotifications / totalNotifications) * 100)}%`
      : "-";
  const reviewedLabel =
    totalNotifications > 0
      ? `${reviewedNotifications}/${totalNotifications} ditinjau`
      : "Belum tersedia";

  return (
    <div className="space-y-4">

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-4">
          Statistik Operasional
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center">
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-1">Pengiriman</p>
            <p className="text-[24px] font-bold text-blue-600">{totalNotifications}</p>
            <p className="text-[10px] text-[#059669] font-semibold mt-0.5">Notifikasi</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-1">Akurasi</p>
            <p className="text-[24px] font-bold text-blue-600">{reviewedRatio}</p>
            <p className="text-[10px] text-[#059669] font-semibold mt-0.5">{reviewedLabel}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="h-32 bg-gradient-to-br from-slate-400 to-slate-600 relative overflow-hidden">
          {sekolahPhoto ? (
            <div className="relative w-full h-full">
              <img src={sekolahPhoto} alt="Gedung Sekolah" className="w-full h-full object-cover" />
              <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 bg-gradient-to-t from-black/60 to-transparent pt-8">
                <p className="text-white font-bold text-[14px] leading-tight">
                  {getDisplayValue(sekolah?.nama)}
                </p>
                <p className="text-white/70 text-[10px] mt-0.5">
                  {sekolah?.id ? `ID: ${sekolah.id}` : "ID: -"}
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-400 via-slate-500 to-slate-700 flex items-end">
              <div className="w-full px-4 pb-3 bg-gradient-to-t from-black/50 to-transparent pt-8">
                <p className="text-white font-bold text-[14px] leading-tight">
                  {getDisplayValue(sekolah?.nama)}
                </p>
                <p className="text-white/70 text-[10px] mt-0.5">
                  {sekolah?.id ? `ID: ${sekolah.id}` : "ID: -"}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-start gap-2 text-[12px] text-slate-500">
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="mt-0.5 flex-shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <span className="leading-5">{getDisplayValue(sekolah?.alamat)}</span>
          </div>
          <div className="flex items-center gap-2 text-[12px] text-slate-500">
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            {sekolah?.jumlahSiswa ? `${sekolah.jumlahSiswa} Siswa Terdaftar` : "-"}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-3">
          Pengaturan Cepat
        </p>
        <div className="divide-y divide-slate-50">
          <button type="button" disabled className="w-full flex items-center justify-between py-2.5 text-[14px] text-slate-400 cursor-not-allowed">
            <span>Sunting Preferensi</span>
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-slate-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </button>
        </div>
      </div>

    </div>
  );
}

export default function NotificationSekolah() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const sekolahId = user?.sekolahId || user?.id || null;
  const profileId = sekolahId;
  const hasSekolahId = Boolean(sekolahId);
  const [notifs, setNotifs] = useState([]);
  const sekolah = normalizeSekolahData(user?.school ?? user?.sekolah ?? null);
  const [schoolProfile, setSchoolProfile] = useState(null);
  const [loading, setLoading] = useState(hasSekolahId);
  const [error, setError] = useState(hasSekolahId ? '' : 'ID sekolah belum tersedia.');
  const [showProfileOverlay, setShowProfileOverlay] = useState(false);

  const displayName = user?.name || user?.identifier || "Pengguna Sekolah";
  const profileAvatar = resolveImageUrl(
    schoolProfile?.foto || sekolah?.foto || user?.profilePhotoUrl || user?.avatarUrl || user?.imageUrl || user?.photoUrl,
    iconProfile,
  );

  useEffect(() => {
    if (!sekolahId) {
      return;
    }

    let cancelled = false;

    Promise.resolve()
      .then(() => {
        setLoading(true);
        setError('');
        return Promise.all([
          getNotificationsBySchoolId(sekolahId),
          getSekolahById(sekolahId),
        ]);
      })
      .then(([notifRes, sekolahRes]) => {
        if (cancelled) return;

        const data = Array.isArray(notifRes?.data?.data) ? notifRes.data.data : [];
        const schoolData = normalizeSekolahData(sekolahRes?.data?.data ?? sekolahRes?.data ?? null);

        setNotifs(data);
        setSchoolProfile(schoolData);
      })
      .catch(() => {
        if (cancelled) return;
        setNotifs([]);
        setSchoolProfile(null);
        setError('Gagal memuat notifikasi.');
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [sekolahId]);

  const formatTime = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  const normalizedNotifs = notifs.map((item, index) => {
    const parsedDate = item?.createdAt ? new Date(item.createdAt) : null;
    const isValidDate = parsedDate && !Number.isNaN(parsedDate.getTime());

    return {
      id: item?.id ?? `${item?.type ?? 'notif'}-${item?.createdAt ?? 'unknown'}-${index}`,
      parsedDate: isValidDate ? parsedDate : null,
      type: item?.type ?? 'info',
      judul: item?.title ?? item?.judul ?? '-',
      deskripsi: item?.message ?? item?.deskripsi ?? '-',
      waktu: isValidDate ? formatTime(item.createdAt) : '-',
      isRead: item?.status && item.status !== 'new',
      actionLabel: null,
    };
  });

  const totalNotifications = normalizedNotifs.length;
  const reviewedNotifications = normalizedNotifs.filter((n) => n.isRead).length;
  const hasUnread = normalizedNotifs.some(n => !n.isRead);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const todayNotifs = normalizedNotifs.filter((n) => {
    if (!n.parsedDate) return false;
    const cmp = new Date(n.parsedDate);
    cmp.setHours(0, 0, 0, 0);
    return cmp.getTime() === today.getTime();
  });
  const yesterdayNotifs = normalizedNotifs.filter((n) => {
    if (!n.parsedDate) return false;
    const cmp = new Date(n.parsedDate);
    cmp.setHours(0, 0, 0, 0);
    return cmp.getTime() === yesterday.getTime();
  });
  const olderNotifs = normalizedNotifs.filter((n) => {
    if (!n.parsedDate) return true;
    const cmp = new Date(n.parsedDate);
    cmp.setHours(0, 0, 0, 0);
    return cmp.getTime() < yesterday.getTime();
  });

  return (
    <div className="bg-[#F3F4F6] min-h-screen flex flex-col">

      <nav className="sticky top-0 z-40 bg-white shadow w-full">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-[52px]">
          <button
            onClick={() => navigate("/dashboard/sekolah")}
            className="flex items-center gap-2.5"
          >
            <img src={logo} alt="SIGIZI Logo" className="w-9 h-9" />
            <span className="font-bold text-[20px] text-[#1a2233] tracking-wide">SIGIZI</span>
          </button>
          <div className="flex items-center gap-[18px]">
            <button
              onClick={() => navigate("/notification/sekolah")}
              className="relative"
              aria-label="Buka Notifikasi"
            >
              <IconBell hasUnread={hasUnread} />
            </button>
            <span className="font-medium text-[14px] text-gray-700">{displayName}</span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowProfileOverlay((prev) => !prev)}
                className="w-8 h-8 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center cursor-pointer overflow-hidden"
                aria-label="Buka Menu Profil"
              >
                <img src={profileAvatar} alt="Foto profil" className="w-full h-full object-cover" />
              </button>
              {showProfileOverlay ? (
                <div className="absolute right-0 top-full mt-2 w-44 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileOverlay(false);
                      navigate('/dashboard/sekolah');
                    }}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Kembali ke Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileOverlay(false);
                      if (profileId) {
                        navigate(`/profil/sekolah/${profileId}`);
                      }
                    }}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Edit Profil
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileOverlay(false);
                      logout();
                      navigate('/login');
                    }}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50"
                  >
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 w-full">
        <div className="max-w-6xl mx-auto py-8 px-6">

          <div className="flex flex-col lg:flex-row gap-6 items-start">

            <div className="flex-1 min-w-0 space-y-6">

              <div>
                <h1 className="font-bold text-[32px] md:text-[30px]">Pusat Notifikasi</h1>
                <p className="text-[16px] text-slate-500 mt-1">
                  Pembaruan operasional dan informasi pengiriman untuk{" "}
                  <span className="font-medium text-slate-700">
                    {getDisplayValue(sekolah?.nama)}
                  </span>
                </p>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 animate-pulse">
                      <div className="flex gap-4">
                        <div className="w-11 h-11 rounded-xl bg-slate-100 flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-slate-100 rounded w-3/4" />
                          <div className="h-3 bg-slate-100 rounded w-full" />
                          <div className="h-3 bg-slate-100 rounded w-2/3" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center text-rose-600">
                  {error}
                </div>
              ) : normalizedNotifs.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
                  <svg className="mx-auto mb-4 text-slate-200" width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
                  </svg>
                  <p className="font-semibold text-slate-400">Tidak ada notifikasi</p>
                </div>
              ) : (
                <>
                  {todayNotifs.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-3 px-1">
                        Hari Ini
                      </p>
                      <div className="space-y-3">
                        {todayNotifs.map(n => (
                          <NotifCard key={n.id} notif={n} />
                        ))}
                      </div>
                    </div>
                  )}

                  {yesterdayNotifs.length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase mb-3 px-1">
                        Kemarin
                      </p>
                      <div className="space-y-3">
                        {yesterdayNotifs.map(n => (
                          <NotifCard key={n.id} notif={n} />
                        ))}
                      </div>
                    </div>
                  )}

                  {olderNotifs.length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase mb-3 px-1">
                        Lebih Lama
                      </p>
                      <div className="space-y-3">
                        {olderNotifs.map(n => (
                          <NotifCard key={n.id} notif={n} />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="lg:w-72 xl:w-80 flex-shrink-0">
              <RightSidebar
                sekolah={schoolProfile ?? sekolah}
                totalNotifications={totalNotifications}
                reviewedNotifications={reviewedNotifications}
              />
            </div>

          </div>
        </div>
      </div>

      <footer className="bg-white border-t mt-8">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between py-5">
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="SIGIZI Logo" className="w-9 h-9" />
            <span className="font-bold text-[20px] text-[#1a2233] tracking-wide">SIGIZI</span>
          </div>
          <div className="flex gap-6 text-sm text-slate-500">
            <a href="#" className="hover:underline">Pusat Dukungan</a>
            <a href="#" className="hover:underline">Pedoman Kebijakan</a>
            <a href="#" className="hover:underline">Privasi</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
