import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import IconCalendar from '../../assets/Icon_calendar.png';
import IconMap from '../../assets/Icon_map.png';
import IconMakan from '../../assets/Icon_makan.png';
import IconTruck from '../../assets/Icon_truck.png';
import IconCentang from '../../assets/Icon_centang.png';
import IconTime from '../../assets/Icon_time.png';
import logo from '../../assets/Logo.png';
import iconProfile from '../../assets/icon_profile.png';
import { useAuth } from '../../hooks/useAuth';
import { getNotificationsBySppgId, updateNotificationStatus } from '../../services/notificationService';
import { getSPPGById } from '../../services/sppgService';
import { getSekolahCatatan, getSekolahDokumentasi } from '../../services/sekolahService';
import { getDisplayValue } from '../../utils/display';
import { resolveImageUrl } from '../../utils/imageUrl';

const statusStyles = {
  new: { label: 'Baru', color: 'bg-amber-100 text-amber-700', accent: '#F59E0B' },
  received: { label: 'Diterima', color: 'bg-blue-100 text-blue-700', accent: '#2563EB' },
  reviewed: { label: 'Ditinjau', color: 'bg-emerald-100 text-emerald-700', accent: '#10B981' },
};

const typeIcons = {
  menu: IconMakan,
  pengiriman: IconTruck,
  feedback: IconMakan,
  info: IconCalendar,
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const extractNotificationMessage = (message = '') => {
  const rawMessage = getDisplayValue(message, '').trim();

  if (!rawMessage) {
    return '';
  }

  if (/(mengunggah dokumentasi menu|mengirimkan catatan pengiriman)/i.test(rawMessage)) {
    const cleanedMessage = rawMessage.split(':').slice(1).join(':').trim();
    return cleanedMessage || rawMessage;
  }

  return rawMessage;
};

const inferNotificationDetailType = (message = '') => {
  if (/mengunggah dokumentasi menu/i.test(message)) {
    return 'documentation';
  }

  if (/mengirimkan catatan pengiriman/i.test(message)) {
    return 'catatan';
  }

  return 'info';
};

const getNotificationTypeLabel = (message = '') => {
  const detailType = inferNotificationDetailType(message);

  if (detailType === 'documentation') {
    return 'Dokumentasi Menu';
  }

  if (detailType === 'catatan') {
    return 'Catatan Pengiriman';
  }

  return 'Notifikasi';
};

const NotificationSPPG = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const sppgId = user?.sppgId || user?.id || null;
  const profileId = user?.sppgId || user?.id || null;
  const hasSppgId = Boolean(sppgId);
  const [notifications, setNotifications] = useState([]);
  const [sppgProfile, setSppgProfile] = useState(null);
  const [loading, setLoading] = useState(hasSppgId);
  const [error, setError] = useState(hasSppgId ? '' : 'ID SPPG belum tersedia.');
  const [showProfileOverlay, setShowProfileOverlay] = useState(false);
  const [selectedNotificationId, setSelectedNotificationId] = useState(null);
  const [detailStateByNotificationId, setDetailStateByNotificationId] = useState({});

  const displayName = user?.name || user?.identifier || 'Admin SPPG';
  const profileAvatar = resolveImageUrl(
    sppgProfile?.photoUrl || sppgProfile?.imageUrl || user?.profilePhotoUrl || user?.avatarUrl || user?.imageUrl || user?.photoUrl,
    iconProfile,
  );

  useEffect(() => {
    if (!sppgId) {
      return;
    }
    Promise.resolve()
      .then(() => {
        setLoading(true);
        setError('');
        return Promise.all([getNotificationsBySppgId(sppgId), getSPPGById(sppgId)]);
      })
      .then(([notificationsRes, profileRes]) => {
        const data = Array.isArray(notificationsRes?.data?.data)
          ? notificationsRes.data.data
          : [];
        setNotifications(data);
        setSppgProfile(profileRes?.data?.data ?? null);
      })
      .catch(() => {
        setNotifications([]);
        setSppgProfile(null);
        setError('Gagal memuat notifikasi.');
      })
      .finally(() => setLoading(false));
  }, [sppgId]);

  const schoolNameById = useMemo(() => {
    const sourceSchools = Array.isArray(sppgProfile?.schools) ? sppgProfile.schools : [];
    return Object.fromEntries(
      sourceSchools
        .filter((school) => school?.id)
        .map((school) => [
          school.id,
          school?.schoolName ?? school?.name ?? null,
        ]),
    );
  }, [sppgProfile]);

  const getNotificationId = (item, index) =>
    item?.id ?? `${item?.type ?? 'notif'}-${item?.createdAt ?? 'unknown'}-${index}`;

  const markNotificationAsReviewed = async (notificationId) => {
    try {
      await updateNotificationStatus(notificationId, 'reviewed');
      setNotifications((prev) =>
        prev.map((item, index) => {
          if (getNotificationId(item, index) !== notificationId) {
            return item;
          }

          return {
            ...item,
            status: 'reviewed',
          };
        }),
      );
    } catch {
      setError('Gagal memperbarui status notifikasi.');
    }
  };

  const loadNotificationDetail = async (notificationId, item) => {
    const existing = detailStateByNotificationId[notificationId];
    if (existing?.data || existing?.loading) {
      return existing;
    }

    setDetailStateByNotificationId((prev) => ({
      ...prev,
      [notificationId]: {
        loading: true,
        data: null,
        error: '',
      },
    }));

    try {
      const schoolId = item?.schoolId;
      const rawMessage = getDisplayValue(item?.rawMessage || item?.message, '');
      const message = extractNotificationMessage(rawMessage);
      const detailType = inferNotificationDetailType(rawMessage);

      if (!schoolId) {
        throw new Error('ID sekolah tidak tersedia.');
      }

      if (detailType === 'documentation') {
        const response = await getSekolahDokumentasi(schoolId);
        const docs = Array.isArray(response?.data?.data) ? response.data.data : [];
        const fileNameFromMessage = rawMessage.includes(':')
          ? rawMessage.split(':').pop().trim()
          : '';

        const matchedDoc = docs.find((doc) =>
          fileNameFromMessage && doc?.caption?.toLowerCase() === fileNameFromMessage.toLowerCase()
        ) || docs.find((doc) =>
          fileNameFromMessage && doc?.caption?.toLowerCase().includes(fileNameFromMessage.toLowerCase())
        ) || docs[docs.length - 1];

        const detail = matchedDoc
          ? {
              type: 'documentation',
              caption: getDisplayValue(matchedDoc?.caption, 'Dokumentasi menu'),
              imageUrl: matchedDoc?.foto ?? matchedDoc?.fotoUrl ?? matchedDoc?.photoUrl ?? null,
              productionDate: matchedDoc?.productionDate ?? null,
            }
          : {
              type: 'documentation',
              caption: 'Dokumentasi menu',
              imageUrl: null,
              productionDate: null,
            };

        setDetailStateByNotificationId((prev) => ({
          ...prev,
          [notificationId]: {
            loading: false,
            data: detail,
            error: '',
          },
        }));

        return detail;
      }

      if (detailType === 'catatan') {
        const response = await getSekolahCatatan(schoolId);
        const notes = Array.isArray(response?.data?.data) ? response.data.data : [];
        const matchedNote = notes.find((note) => (note?.judul || '').toLowerCase().includes('catatan'))
          || notes.find((note) => (note?.judul || '').toLowerCase().includes(message.toLowerCase()))
          || notes[0];

        const detail = matchedNote
          ? {
              type: 'catatan',
              title: getDisplayValue(matchedNote?.judul, 'Catatan pengiriman'),
              note: getDisplayValue(matchedNote?.judul, 'Catatan pengiriman'),
              meta: getDisplayValue(matchedNote?.meta, ''),
            }
          : {
              type: 'catatan',
              title: 'Catatan pengiriman',
              note: message,
              meta: '',
            };

        setDetailStateByNotificationId((prev) => ({
          ...prev,
          [notificationId]: {
            loading: false,
            data: detail,
            error: '',
          },
        }));

        return detail;
      }

      setDetailStateByNotificationId((prev) => ({
        ...prev,
        [notificationId]: {
          loading: false,
          data: {
            type: 'info',
            title: 'Notifikasi',
            note: message,
            meta: '',
          },
          error: '',
        },
      }));

      return {
        type: 'info',
        title: 'Notifikasi',
        note: message,
        meta: '',
      };
    } catch (error) {
      const detailError = 'Gagal memuat detail notifikasi.';
      setDetailStateByNotificationId((prev) => ({
        ...prev,
        [notificationId]: {
          loading: false,
          data: null,
          error: detailError,
        },
      }));

      return { error: detailError };
    }
  };

  const handleOpenNotificationDetail = async (notificationId, item) => {
    setSelectedNotificationId(notificationId);
    await loadNotificationDetail(notificationId, item);
  };

  const handleCloseNotificationDetail = () => {
    setSelectedNotificationId(null);
  };

  const mappedNotifications = useMemo(
    () =>
      notifications.map((item, index) => {
        const rawMessage = getDisplayValue(item?.message, '');
        const normalizedStatusKey = item?.status === 'new' ? 'received' : item?.status ?? 'received';
        const status = statusStyles[normalizedStatusKey] ?? statusStyles.received;
        const detailType = inferNotificationDetailType(rawMessage);
        const typeKey = detailType === 'documentation' ? 'menu' : detailType === 'catatan' ? 'pengiriman' : item?.type ?? 'info';
        const icon = typeIcons[typeKey] ?? typeIcons.info;

        return {
          id: item?.id ?? `${typeKey}-${item?.createdAt ?? 'unknown'}-${index}`,
          school: getDisplayValue(
            item?.schoolName ??
              (item?.schoolId ? schoolNameById[item.schoolId] ?? `Sekolah ${item.schoolId}` : null),
          ),
          schoolId: getDisplayValue(item?.schoolId),
          statusKey: normalizedStatusKey,
          statusLabel: status.label,
          statusColor: status.color,
          accentColor: status.accent,
          typeIcon: icon,
          typeLabel: getNotificationTypeLabel(rawMessage),
          date: formatDate(item?.createdAt),
          rawMessage,
          message: extractNotificationMessage(rawMessage),
          detailType,
        };
      }),
    [notifications, schoolNameById],
  );
  const pendingCount = mappedNotifications.filter((item) => item.statusKey !== 'reviewed').length;
  const totalTodayCount = mappedNotifications.length;
  const resolvedCount = mappedNotifications.filter((item) => item.statusKey === 'reviewed').length;
  const sppgName = getDisplayValue(sppgProfile?.name, displayName);
  const sppgAddress = getDisplayValue(sppgProfile?.address);
  const operationDateLabel = useMemo(
    () =>
      new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
    [],
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans">

      <nav className="sticky top-0 z-40 bg-white shadow w-full">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-[52px]">
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="SIGIZI Logo" className="w-9 h-9" />
            <span className="font-bold text-[20px] text-[#1a2233] tracking-wide">SIGIZI</span>
          </div>
          <div className="flex items-center gap-[18px]">
            <button
              className="relative"
              onClick={() => navigate('/notification')}
              aria-label="Buka Notifikasi"
            >
              <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-gray-700 hover:text-blue-600 transition-colors">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full ring-2 ring-white bg-red-500" />
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
                      navigate('/dashboard/sppg');
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
                        navigate(`/profil/sppg/${profileId}`);
                      }
                    }}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Edit Akun
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

      {/* MAIN CONTENT */}
      <div className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex justify-between items-center mb-10">
            <div>
              <h1 className="text-2xl font-bold text-[#1A2B4C]">{sppgName}</h1>
              <p className="text-gray-400 flex items-center mt-1 text-sm">
                <img src={IconMap} className="w-4 mr-2 grayscale opacity-50" alt="map" />
                {sppgAddress}
              </p>
            </div>
            <div className="bg-[#F4F8FF] px-6 py-3 rounded-xl flex items-center border border-blue-50">
              <img src={IconCalendar} className="w-8 mr-4" alt="calendar" />
              <div>
                <p className="text-[10px] font-bold text-blue-400 uppercase">Tanggal Operasional</p>
                <p className="text-sm font-extrabold text-[#1A2B4C]">{operationDateLabel}</p>
              </div>
            </div>
          </div>

          {/* List Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#1A2B4C]">Notifikasi Umpan Balik</h2>
            <div className="flex items-center gap-3">
              <span className="bg-gray-100 text-gray-500 text-xs font-bold px-4 py-2 rounded-full">{pendingCount} TERTUNDA</span>
              <span className="bg-gray-100 text-gray-500 text-xs font-bold px-4 py-2 rounded-full">{totalTodayCount} TOTAL HARI INI</span>
            </div>
          </div>

          {/* List */}
          <div className="space-y-6">
            {loading ? (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 text-gray-500">
                Memuat notifikasi...
              </div>
            ) : error ? (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl shadow-sm p-6 text-rose-700">
                {error}
              </div>
            ) : mappedNotifications.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 text-gray-500">
                Belum ada notifikasi.
              </div>
            ) : (
              mappedNotifications.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6"
                  style={{ borderLeftColor: item.accentColor, borderLeftWidth: '6px' }}
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-[#1A2B4C]">{item.school}</h3>
                          <span className={`${item.statusColor} text-[10px] px-3 py-1 rounded-md font-bold`}>
                            {item.statusLabel}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-4">
                          <img src={item.typeIcon} className="w-4 opacity-60" alt="icon" />
                          <p className="text-sm text-gray-400">{item.date}</p>
                        </div>
                        <div className="bg-[#F8F9FA] p-4 rounded-xl text-gray-600 text-sm">
                          "{item.message}"
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 items-stretch sm:items-end min-w-[180px] mt-2">
                        {item.statusLabel !== 'Ditinjau' && (
                          <button
                            type="button"
                            onClick={() => markNotificationAsReviewed(item.id)}
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-blue-700"
                          >
                            Tandai sebagai Ditinjau
                            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenNotificationDetail(item.id, item)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition-all hover:border-blue-200 hover:text-blue-700"
                        >
                          Lihat Detail
                          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              ))
            )}
          </div>

          {/* Bottom Stats */}
          <div className="grid grid-cols-2 gap-6 mt-12 max-w-2xl">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center mb-5">
                <img src={IconTime} className="w-6" alt="time" />
              </div>
              <p className="text-gray-400 text-sm mb-1">Waktu Respon Rata - Rata</p>
              <h4 className="text-2xl font-black text-[#1A2B4C] mb-2">-</h4>
              <p className="text-[#10B981] text-sm font-medium">Belum tersedia</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-5">
                <img src={IconCentang} className="w-6" alt="done" />
              </div>
              <p className="text-gray-400 text-sm mb-1">Terselesaikan</p>
              <h4 className="text-2xl font-black text-[#1A2B4C] mb-2">{resolvedCount} / {totalTodayCount}</h4>
              <p className="text-gray-400 text-sm">{pendingCount} sekolah tertunda untuk ditinjau</p>
            </div>
          </div>

        </div>
      </div>

      {/* FOOTER */}
      <footer className="bg-white border-t mt-auto">
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

      {selectedNotificationId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-blue-500">Lihat Detail</p>
                <h3 className="mt-1 text-lg font-extrabold text-slate-900">{mappedNotifications.find((item) => item.id === selectedNotificationId)?.school || 'Detail Notifikasi'}</h3>
                <p className="mt-1 text-sm text-slate-500">{mappedNotifications.find((item) => item.id === selectedNotificationId)?.typeLabel || 'Informasi notifikasi'}</p>
              </div>
              <button
                type="button"
                onClick={handleCloseNotificationDetail}
                className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100"
              >
                Tutup
              </button>
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Jenis</p>
                  <p className="mt-1 font-medium text-slate-700">{mappedNotifications.find((item) => item.id === selectedNotificationId)?.typeLabel}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Tanggal</p>
                  <p className="mt-1 font-medium text-slate-700">{mappedNotifications.find((item) => item.id === selectedNotificationId)?.date}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Sekolah</p>
                  <p className="mt-1 font-medium text-slate-700">{mappedNotifications.find((item) => item.id === selectedNotificationId)?.school}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">ID Sekolah</p>
                  <p className="mt-1 font-medium text-slate-700">{mappedNotifications.find((item) => item.id === selectedNotificationId)?.schoolId || '-'}</p>
                </div>
              </div>

              <div className="mt-4 border-t border-slate-200 pt-4">
                {detailStateByNotificationId[selectedNotificationId]?.loading ? (
                  <p className="text-sm text-slate-500">Memuat detail notifikasi...</p>
                ) : detailStateByNotificationId[selectedNotificationId]?.error ? (
                  <p className="text-sm text-rose-600">{detailStateByNotificationId[selectedNotificationId].error}</p>
                ) : mappedNotifications.find((item) => item.id === selectedNotificationId)?.detailType === 'documentation' ? (
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
                    <div className="space-y-3">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Keterangan</p>
                        <p className="mt-1 font-medium text-slate-700">
                          {mappedNotifications.find((item) => item.id === selectedNotificationId)?.message || 'Dokumentasi menu'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Tanggal Unggah</p>
                        <p className="mt-1 font-medium text-slate-700">
                          {formatDate(detailStateByNotificationId[selectedNotificationId]?.data?.productionDate)}
                        </p>
                      </div>
                    </div>
                    <div>
                      {detailStateByNotificationId[selectedNotificationId]?.data?.imageUrl ? (
                        <img
                          src={resolveImageUrl(detailStateByNotificationId[selectedNotificationId].data.imageUrl)}
                          alt="Foto dokumentasi menu"
                          className="h-48 w-full rounded-xl object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="flex h-48 w-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white text-sm text-slate-400">
                          Belum ada gambar
                        </div>
                      )}
                    </div>
                  </div>
                ) : mappedNotifications.find((item) => item.id === selectedNotificationId)?.detailType === 'catatan' ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Keterangan</p>
                      <p className="mt-1 font-medium text-slate-700">
                        {mappedNotifications.find((item) => item.id === selectedNotificationId)?.message || detailStateByNotificationId[selectedNotificationId]?.data?.note || 'Catatan pengiriman'}
                      </p>
                    </div>
                    {detailStateByNotificationId[selectedNotificationId]?.data?.meta ? (
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Status / Tanggal</p>
                        <p className="mt-1 font-medium text-slate-700">{detailStateByNotificationId[selectedNotificationId].data.meta}</p>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Keterangan</p>
                    <p className="mt-1 font-medium text-slate-700">{mappedNotifications.find((item) => item.id === selectedNotificationId)?.message}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
};

export default NotificationSPPG;
