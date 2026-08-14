import React, { useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import IconMap from "../../assets/Icon_map.png";
import IconBuilding from "../../assets/Icon_building.png";
import IconCalendar from "../../assets/Icon_calendar.png";
import IconEducation from "../../assets/Icon_education.png";
import IconPrint from "../../assets/Icon_print.png";
import IconNutrisi from "../../assets/Icon_nutrisi.png";
import IconCamera from "../../assets/Icon_camera.png";
import IconCeklis from "../../assets/Icon_ceklis.png";
import IconFeedback from "../../assets/Icon_feedback.png";
import IconWarning from "../../assets/Icon_warning.png";
import logo from "../../assets/Logo.png";
import IconProfile from "../../assets/icon_profile.png";
import { useAuth } from '../../hooks/useAuth';
import { getSPPGById, updateMyProfile } from '../../services/sppgService';
import { getNotificationsBySppgId } from '../../services/notificationService';
import { createSppgMealDocumentation, getSppgMealDocumentation, getSppgMenus, uploadNutritionCsv, uploadWeeklyMenuCsv, getCvAnalysis } from '../../services/sppgDashboardService';
import { uploadProfileImage } from '../../services/mediaService';
import { formatNumberValue, getDisplayValue } from '../../utils/display';
import { resolveImageUrl } from '../../utils/imageUrl';

function getImageSource(raw) {
  return (
    raw?.photoUrl ??
    raw?.photo_url ??
    raw?.imageUrl ??
    raw?.image_url ??
    raw?.logoUrl ??
    raw?.logo_url ??
    raw?.avatarUrl ??
    raw?.avatar_url ??
    raw?.profilePhotoUrl ??
    raw?.profile_photo_url ??
    raw?.image ??
    raw?.foto ??
    raw?.gambar ??
    null
  );
}

const locationPinIcon = L.divIcon({
  className: '',
  html: '<span style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:9999px;background:#136DEC;border:3px solid #fff;box-shadow:0 4px 10px rgba(19,109,236,.35)"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const parseCsvPreview = async (file) => {
  if (!file) return [];
  const text = await file.text();
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const idx = (keys) => headers.findIndex((h) => keys.includes(h));

  const dateIdx = idx(["menudate", "menu_date", "date", "tanggal"]);
  const mainIdx = idx(["rice", "hidanganutama", "hidangan_utama", "main", "main_dish"]);
  const sideIdx = idx(["sidedish", "side_dish", "menupendamping", "menu_pendamping"]);
  const fruitIdx = idx(["fruit", "buah"]);

  const toCells = (line) => {
    const values = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    values.push(current.trim());
    return values.map((v) => v.replace(/^"|"$/g, ""));
  };

  return lines.slice(1, 8).map((line) => {
    const cols = toCells(line);
    return {
      day: dateIdx >= 0 ? cols[dateIdx] : "-",
      mainDish: mainIdx >= 0 ? cols[mainIdx] : "-",
      sideDish: sideIdx >= 0 ? cols[sideIdx] : "-",
      fruit: fruitIdx >= 0 ? cols[fruitIdx] : "-",
    };
  });
};

function CVAnalysisModal({ isOpen, onClose, data, isLoading }) {
  if (!isOpen) return null;

  let parsedFoods = [];
  try {
    parsedFoods = typeof data?.detectedFoods === 'string' ? JSON.parse(data.detectedFoods) : (data?.detectedFoods || []);
  } catch (e) {
    parsedFoods = [];
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-lg">🤖</span>
            Hasil Analisis AI (CV)
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold p-2">✕</button>
        </div>
        
        <div className="p-5 flex-1 overflow-y-auto">
          {isLoading || !data ? (
            <div className="py-12 text-center flex flex-col items-center justify-center">
              <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
              <p className="text-sm font-semibold text-slate-500">Memuat hasil analisis CV...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Score card */}
              <div className={`p-4 rounded-xl border ${data.isFlagged ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'} flex items-center justify-between`}>
                <div>
                  <p className={`text-sm font-bold ${data.isFlagged ? 'text-red-700' : 'text-emerald-700'}`}>Tingkat Kecocokan Menu</p>
                  <p className={`text-xs mt-1 ${data.isFlagged ? 'text-red-600' : 'text-emerald-600'}`}>
                    {data.isFlagged ? 'Terindikasi tidak sesuai dengan menu yang dilaporkan.' : 'Sesuai dengan menu yang dilaporkan.'}
                  </p>
                </div>
                <div className={`text-3xl font-black ${data.isFlagged ? 'text-red-600' : 'text-emerald-600'}`}>
                  {Number(data.matchScore).toFixed(0)}%
                </div>
              </div>

              {data.flagReason && (
                <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm font-medium border border-red-200">
                  ⚠️ {data.flagReason}
                </div>
              )}

              {/* Detected Foods */}
              <div>
                <p className="text-sm font-bold text-slate-700 mb-3">Makanan Terdeteksi</p>
                <div className="space-y-2">
                  {parsedFoods.map((food, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div>
                        <p className="font-semibold text-slate-800 capitalize">{food.name}</p>
                        <p className="text-xs text-slate-500 font-medium">{food.portionGrams} gram</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                          {(food.confidence * 100).toFixed(0)}% Yakin
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nutrition */}
              <div>
                <p className="text-sm font-bold text-slate-700 mb-3">Estimasi Kandungan Gizi</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 text-center">
                    <p className="text-xl font-black text-orange-600">{Number(data.estimatedCalories).toFixed(0)}</p>
                    <p className="text-[10px] font-bold text-orange-800 uppercase mt-1">Kalori</p>
                  </div>
                  <div className="bg-rose-50 border border-rose-100 rounded-lg p-3 text-center">
                    <p className="text-xl font-black text-rose-600">{Number(data.estimatedProtein).toFixed(1)}g</p>
                    <p className="text-[10px] font-bold text-rose-800 uppercase mt-1">Protein</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-center">
                    <p className="text-xl font-black text-amber-600">{Number(data.estimatedFat).toFixed(1)}g</p>
                    <p className="text-[10px] font-bold text-amber-800 uppercase mt-1">Lemak</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-center">
                    <p className="text-xl font-black text-blue-600">{Number(data.estimatedCarbs).toFixed(1)}g</p>
                    <p className="text-[10px] font-bold text-blue-800 uppercase mt-1">Karbo</p>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LocationPickerMap({ value, onChange, children }) {
  const lat = Number(value?.lat);
  const lng = Number(value?.lng);
  const center = Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : [-6.2, 106.816666];

  const ClickHandler = () => {
    useMapEvents({
      click: (event) => {
        onChange({ lat: event.latlng.lat, lng: event.latlng.lng });
      },
    });
    return null;
  };

  return (
    <MapContainer center={center} zoom={12} className="h-64 w-full rounded-xl">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler />
      <Marker
        position={center}
        icon={locationPinIcon}
        draggable={true}
        eventHandlers={{
          dragend: (event) => {
            const marker = event.target;
            const next = marker.getLatLng();
            onChange({ lat: next.lat, lng: next.lng });
          },
        }}
      />
      {children}
    </MapContainer>
  );
}

function MapSearchController({ target }) {
  const map = useMap();

  useEffect(() => {
    if (!target) return;
    const lat = Number(target.lat);
    const lng = Number(target.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    map.flyTo([lat, lng], 15, { duration: 0.7 });
  }, [map, target]);

  return null;
}

const DashboardSPPG = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const sppgId = user?.sppgId || null;
  const [sppgData, setSppgData] = useState(null);
  const [servedSchools, setServedSchools] = useState([]);
  const [loading, setLoading] = useState(Boolean(sppgId));
  const [error, setError] = useState(sppgId ? '' : 'ID SPPG belum tersedia.');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [nutritionFile, setNutritionFile] = useState(null);
  const [mealPhotoFile, setMealPhotoFile] = useState(null);
  const [mealProductionDate, setMealProductionDate] = useState('');
  const [mealTargetSchoolId, setMealTargetSchoolId] = useState('');
  const [mealNotes, setMealNotes] = useState('');
  const [menuData, setMenuData] = useState([]);
  const [savedMenuData, setSavedMenuData] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [documentationItems, setDocumentationItems] = useState([]);
  const [showProfileOverlay, setShowProfileOverlay] = useState(false);
  const [showEditAccountModal, setShowEditAccountModal] = useState(false);
  const [showCompleteProfileModal, setShowCompleteProfileModal] = useState(false);
  const [hasAutoOpenedCompleteProfile, setHasAutoOpenedCompleteProfile] = useState(false);
  const [csvUploading, setCsvUploading] = useState(false);
  const [mealUploading, setMealUploading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [profilePhotoPreview, setProfilePhotoPreview] = useState('');
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const [onboardingPhotoPreview, setOnboardingPhotoPreview] = useState('');
  const [onboardingPhotoFile, setOnboardingPhotoFile] = useState(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [locationQuery, setLocationQuery] = useState('');
  const [locationSearching, setLocationSearching] = useState(false);
  const [locationSearchError, setLocationSearchError] = useState('');
  const [mapTarget, setMapTarget] = useState(null);
  
  const [cvModalOpen, setCvModalOpen] = useState(false);
  const [selectedCvData, setSelectedCvData] = useState(null);
  const [isCvLoading, setIsCvLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    address: '',
    code: '',
    personInCharge: '',
    email: '',
  });
  const [completeProfileForm, setCompleteProfileForm] = useState({
    capacityPerDay: '',
    staffCount: '',
    lat: '',
    lng: '',
  });

  const loadSavedMenuData = async () => {
    if (!sppgId) {
      setSavedMenuData([]);
      return;
    }

    try {
      const savedRes = await getSppgMenus(sppgId);
      const savedRows = Array.isArray(savedRes?.data?.data) ? savedRes.data.data : [];
      setSavedMenuData(savedRows);
    } catch {
      setSavedMenuData([]);
    }
  };

  useEffect(() => {
    if (!sppgId) {
      return;
    }
    Promise.resolve()
      .then(() => {
        setLoading(true);
        setError('');
        return Promise.all([
          getSPPGById(sppgId),
          getNotificationsBySppgId(sppgId),
          getSppgMealDocumentation(),
          loadSavedMenuData(),
        ]);
      })
      .then(([sppgRes, notificationRes, documentationRes]) => {
        const data = sppgRes?.data?.data ?? null;
        const notifData = Array.isArray(notificationRes?.data?.data)
          ? notificationRes.data.data
          : [];
        const docs = Array.isArray(documentationRes?.data?.data)
          ? documentationRes.data.data
          : [];
        setSppgData(data);
        setServedSchools(Array.isArray(data?.schools) ? data.schools : []);
        setNotifications(notifData);
        setDocumentationItems(docs);
        setMenuData([]);
      })
      .catch(() => {
        setSppgData(null);
        setServedSchools([]);
        setNotifications([]);
        setDocumentationItems([]);
        setMenuData([]);
        setError('Gagal memuat data SPPG.');
      })
      .finally(() => setLoading(false));
  }, [sppgId]);

  const sppgName = getDisplayValue(sppgData?.name);
  const sppgAddress = getDisplayValue(sppgData?.address);
  const sppgStatus = getDisplayValue(sppgData?.status);
  const sppgPhoto = resolveImageUrl(getImageSource(sppgData), IconBuilding);
  const profileAvatar = resolveImageUrl(
    getImageSource(sppgData) || user?.profilePhotoUrl || user?.avatarUrl || user?.imageUrl || user?.photoUrl,
    IconProfile
  );
  const displayName = sppgData?.name || user?.name || user?.identifier || 'Admin SPPG';
  const schoolCount = servedSchools.length > 0 ? servedSchools.length : '-';
  const getLocalDateKey = (value) => {
    if (!value) return null;

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;

    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };
  const todayKey = useMemo(() => getLocalDateKey(new Date()), []);
  const todayWeeklyMenuItems = useMemo(() => {
    if (!savedMenuData.length) {
      return [];
    }

    return [...savedMenuData]
      .filter((item) => getLocalDateKey(item?.menuDate) === todayKey)
      .map((item) => ({
        date: getDisplayValue(item?.menuDate) || '-',
        mainDish: getDisplayValue(item?.rice) || '-',
        sideDish: getDisplayValue(item?.sideDish) || '-',
        fruit: getDisplayValue(item?.fruit) || '-',
        protein: formatNumberValue(item?.protein) || '-',
        calories: formatNumberValue(item?.calories) || '-',
      }));
  }, [savedMenuData, todayKey]);
  const todayDocumentationItems = useMemo(() => {
    if (!documentationItems.length) {
      return [];
    }

    return [...documentationItems]
      .filter((item) => getLocalDateKey(item?.productionDate ?? item?.createdAt) === todayKey)
      .sort((first, second) => {
        const firstTime = new Date(first?.createdAt ?? first?.productionDate ?? 0).getTime();
        const secondTime = new Date(second?.createdAt ?? second?.productionDate ?? 0).getTime();
        return secondTime - firstTime;
      })
      .slice(0, 4)
      .map((item) => ({
        school: getDisplayValue(item?.schoolName || 'Sekolah'),
        time: item?.createdAt
          ? new Date(item.createdAt).toLocaleString('id-ID', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            })
          : getDisplayValue(item?.productionDate) || '-',
        img: resolveImageUrl(item?.photoUrl),
        note: getDisplayValue(item?.notes || 'Dokumentasi menu'),
        productionDate: getDisplayValue(item?.productionDate),
        id: item?.id,
        analysisStatus: item?.analysisStatus,
      }));
  }, [documentationItems, todayKey]);

  useEffect(() => {
    const hasPending = documentationItems.some(
      (item) => item?.analysisStatus === 'pending' || item?.analysisStatus === 'processing'
    );
    if (!hasPending) return;
    
    const interval = setInterval(async () => {
      try {
        const res = await getSppgMealDocumentation();
        const docs = Array.isArray(res?.data?.data) ? res.data.data : [];
        setDocumentationItems(docs);
      } catch (e) {
        // ignore
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [documentationItems]);

  const handleOpenCvModal = async (docId) => {
    setCvModalOpen(true);
    setIsCvLoading(true);
    setSelectedCvData(null);
    try {
      const res = await getCvAnalysis(docId);
      setSelectedCvData(res?.data?.data);
    } catch (e) {
      console.error(e);
      setSelectedCvData(null);
    } finally {
      setIsCvLoading(false);
    }
  };
  const feedbackItems =
    notifications.length > 0
      ? notifications.slice(0, 3).map((item) => ({
          title: getDisplayValue(item?.type),
          time: item?.createdAt
            ? new Date(item.createdAt).toLocaleString('id-ID', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })
            : '-',
          desc: getDisplayValue(item?.message),
          school: getDisplayValue(item?.schoolName),
          variant: item?.status === 'new' ? 'warning' : item?.status === 'reviewed' ? 'success' : 'info',
        }))
      : [];
  const nutritionCoverage = savedMenuData.length > 0 || menuData.length > 0 ? '100%' : '-';
  const nutritionBarWidth = savedMenuData.length > 0 || menuData.length > 0 ? '100%' : '0%';
  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
    [],
  );

  const isOperationalProfileIncomplete = useMemo(() => {
    if (!sppgData) return false;
    const capacity = Number(sppgData?.capacityPerDay ?? 0);
    const staff = Number(sppgData?.staffCount ?? 0);
    const hasLat = sppgData?.lat !== null && sppgData?.lat !== undefined && String(sppgData?.lat).trim() !== '';
    const hasLng = sppgData?.lng !== null && sppgData?.lng !== undefined && String(sppgData?.lng).trim() !== '';

    return capacity <= 0 || staff <= 0 || !hasLat || !hasLng;
  }, [sppgData]);

  const canSubmitCompleteProfile = useMemo(() => {
    const capacity = Number(completeProfileForm.capacityPerDay);
    const staff = Number(completeProfileForm.staffCount);
    const lat = Number(completeProfileForm.lat);
    const lng = Number(completeProfileForm.lng);
    const hasPhoto = Boolean(onboardingPhotoPreview || getImageSource(sppgData));

    return (
      hasPhoto &&
      Number.isFinite(capacity) &&
      capacity > 0 &&
      Number.isFinite(staff) &&
      staff > 0 &&
      Number.isFinite(lat) &&
      Number.isFinite(lng)
    );
  }, [completeProfileForm, onboardingPhotoPreview, sppgData]);

  const handleFileDrop = async (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files[0] || e.target.files[0];
    if (!file) return;
    setUploadedFile(file);
    try {
      const preview = await parseCsvPreview(file);
      setMenuData(preview);
    } catch {
      setMenuData([]);
      setActionMessage('File CSV tidak bisa dipratinjau. Periksa format kolom.');
    }
  };

  const handleNutritionFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setNutritionFile(file);
  };

  const handleMealPhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setMealPhotoFile(file);
  };

  const handleUploadCsv = async (file) => {
    if (!file) {
      setActionMessage('Pilih file CSV terlebih dahulu.');
      return;
    }

    setCsvUploading(true);
    setActionMessage('');
    try {
      await uploadWeeklyMenuCsv(file);
      await loadSavedMenuData();
      setActionMessage(`Berhasil unggah CSV: ${file.name}`);
    } catch (err) {
      setActionMessage(err?.response?.data?.message ?? 'Gagal unggah CSV.');
    } finally {
      setCsvUploading(false);
    }
  };

  const handleUploadNutrition = async (file) => {
    if (!file) {
      setActionMessage('Pilih file CSV nutrisi terlebih dahulu.');
      return;
    }

    setCsvUploading(true);
    setActionMessage('');
    try {
      await uploadNutritionCsv(file);
      setActionMessage(`Berhasil unggah CSV nutrisi: ${file.name}`);
      if (sppgId) {
        const sppgRes = await getSPPGById(sppgId);
        const data = sppgRes?.data?.data ?? null;
        setSppgData(data);
      }
    } catch (err) {
      setActionMessage(err?.response?.data?.message ?? 'Gagal unggah CSV nutrisi.');
    } finally {
      setCsvUploading(false);
    }
  };

  const handleSubmitMealDocumentation = async () => {
    if (!mealPhotoFile || !mealTargetSchoolId || !mealNotes.trim()) {
      setActionMessage('Lengkapi foto, sekolah tujuan, dan catatan dokumentasi.');
      return;
    }

    setMealUploading(true);
    setActionMessage('');
    try {
      await createSppgMealDocumentation({
        photo: mealPhotoFile,
        notes: mealNotes.trim(),
        productionDate: mealProductionDate || new Date().toISOString().slice(0, 10),
        targetSchoolIds: [mealTargetSchoolId],
      });
      const docsRes = await getSppgMealDocumentation();
      const docs = Array.isArray(docsRes?.data?.data) ? docsRes.data.data : [];

      setDocumentationItems((prev) => {
        const merged = [...docs, ...prev];
        const seen = new Set();

        return merged
          .filter((item) => {
            const key = item?.id ?? `${item?.photoUrl ?? 'photo'}-${item?.createdAt ?? item?.productionDate ?? ''}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          })
          .sort((first, second) => {
            const firstTime = new Date(first?.createdAt ?? first?.productionDate ?? 0).getTime();
            const secondTime = new Date(second?.createdAt ?? second?.productionDate ?? 0).getTime();
            return secondTime - firstTime;
          })
          .slice(0, 20);
      });

      setActionMessage('Dokumentasi makanan berhasil dikirim.');
      setMealPhotoFile(null);
      setMealProductionDate('');
      setMealTargetSchoolId('');
      setMealNotes('');
    } catch (err) {
      setActionMessage(err?.response?.data?.message ?? 'Gagal mengirim dokumentasi makanan.');
    } finally {
      setMealUploading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleOpenEditAccount = () => {
    setEditForm({
      name: sppgData?.name ?? '',
      address: sppgData?.address ?? '',
      code: sppgData?.sppgCode ?? '',
      personInCharge: sppgData?.personInCharge ?? '',
      email: user?.email ?? '',
    });
    setProfilePhotoPreview(getImageSource(sppgData) || user?.profilePhotoUrl || user?.avatarUrl || user?.imageUrl || user?.photoUrl || '');
    setShowEditAccountModal(true);
    setShowProfileOverlay(false);
  };

  const handleProfilePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfilePhotoFile(file);
    const objectUrl = URL.createObjectURL(file);
    setProfilePhotoPreview(objectUrl);
  };

  const handleSaveEditAccount = async () => {
    const nextName = editForm.name.trim();
    const nextAddress = editForm.address.trim();
    const nextCode = editForm.code.trim();
    const nextPic = editForm.personInCharge.trim();
    const nextEmail = editForm.email.trim().toLowerCase();
    try {
      let photoUrl = sppgData?.photoUrl || '';
      if (profilePhotoFile) {
          try {
          const uploaded = await uploadProfileImage(profilePhotoFile, { folder: 'simba/profiles' });
          photoUrl = uploaded?.url || photoUrl;
        } catch {
          setActionMessage('Upload foto profil gagal, data lain tetap disimpan.');
        }
      }

      await updateMyProfile({
        name: nextName || sppgData?.name,
        address: nextAddress || sppgData?.address,
        sppgCode: nextCode || sppgData?.sppgCode,
        personInCharge: nextPic || sppgData?.personInCharge,
        email: nextEmail || user?.email,
        photoUrl,
      });

      if (sppgId) {
        const sppgRes = await getSPPGById(sppgId);
        const data = sppgRes?.data?.data ?? null;
        setSppgData(data);
      }

      updateUser({
        email: nextEmail || user?.email,
        identifier: nextName || user?.identifier,
        name: nextName || user?.name,
        profilePhotoUrl: photoUrl || user?.profilePhotoUrl || user?.avatarUrl || user?.imageUrl || user?.photoUrl,
      });

      setActionMessage('Perubahan akun berhasil disimpan ke database.');
      setShowEditAccountModal(false);
      setProfilePhotoFile(null);
    } catch (err) {
      setActionMessage(err?.response?.data?.message ?? 'Gagal menyimpan perubahan akun.');
    }
  };

  const handleOpenCompleteProfile = () => {
    setCompleteProfileForm({
      capacityPerDay: String(sppgData?.capacityPerDay ?? ''),
      staffCount: String(sppgData?.staffCount ?? ''),
      lat: String(sppgData?.lat ?? ''),
      lng: String(sppgData?.lng ?? ''),
    });
    setOnboardingPhotoPreview(getImageSource(sppgData) || '');
    setShowCompleteProfileModal(true);
  };

  const handleCompleteProfilePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOnboardingPhotoFile(file);
    setOnboardingPhotoPreview(URL.createObjectURL(file));
  };

  const handleMapLocationChange = ({ lat, lng }) => {
    setCompleteProfileForm((prev) => ({
      ...prev,
      lat: String(Number(lat).toFixed(6)),
      lng: String(Number(lng).toFixed(6)),
    }));
  };

  const handleSearchLocation = async () => {
    const q = locationQuery.trim();
    if (!q) return;

    setLocationSearching(true);
    setLocationSearchError('');

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
        },
      });
      const data = await res.json();
      const first = Array.isArray(data) ? data[0] : null;

      if (!first) {
        setLocationSearchError('Lokasi tidak ditemukan. Coba kata kunci lain.');
        return;
      }

      const lat = Number(first.lat);
      const lng = Number(first.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        setLocationSearchError('Koordinat lokasi tidak valid.');
        return;
      }

      handleMapLocationChange({ lat, lng });
      setMapTarget({ lat, lng });
    } catch {
      setLocationSearchError('Gagal mencari lokasi. Coba lagi.');
    } finally {
      setLocationSearching(false);
    }
  };

  const handleSaveCompleteProfile = async () => {
    try {
      setShowCompleteProfileModal(false);
      let photoUrl = sppgData?.photoUrl || '';
      if (onboardingPhotoFile) {
        try {
          const uploaded = await uploadProfileImage(onboardingPhotoFile, { folder: 'simba/profiles' });
          photoUrl = uploaded?.url || photoUrl;
        } catch {
          setActionMessage('Upload foto SPPG gagal, data profil tetap disimpan.');
        }
      }

      await updateMyProfile({
        capacityPerDay: Number(completeProfileForm.capacityPerDay),
        staffCount: Number(completeProfileForm.staffCount),
        lat: completeProfileForm.lat.trim(),
        lng: completeProfileForm.lng.trim(),
        photoUrl,
      });

      if (sppgId) {
        const sppgRes = await getSPPGById(sppgId);
        const data = sppgRes?.data?.data ?? null;
        setSppgData(data);
        updateUser({
          profilePhotoUrl:
            data?.photoUrl ||
            data?.imageUrl ||
            photoUrl ||
            user?.profilePhotoUrl ||
            user?.avatarUrl ||
            user?.imageUrl ||
            user?.photoUrl,
        });
      }

      setActionMessage('Profil operasional berhasil disimpan ke database.');
      setOnboardingPhotoFile(null);
    } catch (err) {
      setShowCompleteProfileModal(true);
      setActionMessage(err?.response?.data?.message ?? 'Gagal menyimpan profil operasional.');
    }
  };

  useEffect(() => {
    if (!loading && sppgData && isOperationalProfileIncomplete && !hasAutoOpenedCompleteProfile) {
      handleOpenCompleteProfile();
      setHasAutoOpenedCompleteProfile(true);
    }
  }, [loading, sppgData, isOperationalProfileIncomplete, hasAutoOpenedCompleteProfile]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col">
      <CVAnalysisModal
        isOpen={cvModalOpen}
        onClose={() => setCvModalOpen(false)}
        data={selectedCvData}
        isLoading={isCvLoading}
      />
      
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
                    onClick={handleOpenEditAccount}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Edit Akun
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
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
      <div className="py-10 px-4 flex-1">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="mb-6 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-500">
              Memuat data SPPG...
            </div>
          ) : null}
          {error ? (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {error}
            </div>
          ) : null}
          {actionMessage ? (
            <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              {actionMessage}
            </div>
          ) : null}
          {!loading && isOperationalProfileIncomplete ? (
            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-bold text-amber-800">Profil operasional belum lengkap.</p>
              <p className="mt-1 text-xs text-amber-700">Lengkapi foto profil, kapasitas harian, jumlah staf, dan koordinat lokasi.</p>
            </div>
          ) : null}

          {/* HEADER INFO CARD */}
          <div className="bg-white p-8 rounded-xl border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-8 shadow-sm">
            <div className="flex items-center gap-8 w-full">
              <div className="w-32 h-32 bg-[#F0F7FF] rounded-xl flex items-center justify-center">
                <img src={sppgPhoto} alt={sppgName} className="w-full h-full rounded-xl object-cover" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-4">
                  <h1 className="text-3xl font-bold tracking-tight text-gray-900">{sppgName}</h1>
                  <span className="inline-flex items-center gap-1 px-4 py-1.5 bg-[#E7F8F0] text-[#059669] text-[14px] font-semibold rounded-full border border-[#D1FAE5]">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 13l3 3 7-7" />
                    </svg>
                    {sppgStatus === '-' ? 'Status -' : `Status ${sppgStatus}`}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-gray-500 text-lg mt-1.5">
                  <img src={IconMap} alt="Map Icon" className="w-4 h-4 object-contain"
                    style={{ filter: 'invert(60%) sepia(0%) saturate(0%) brightness(90%)' }} />
                  <p>{sppgAddress}</p>
                </div>
                <div className="flex gap-4 mt-3 text-sm font-bold text-gray-600 uppercase tracking-wide">
                  <span className="flex items-center gap-2">
                    <img src={IconEducation} alt="Education Icon" className="w-7 h-7 object-contain" />
                    {schoolCount} Sekolah Dilayani
                  </span>
                  <span className="flex items-center gap-2 pl-8">
                    <img src={IconCalendar} alt="Calendar Icon" className="w-6 h-6 object-contain" />
                    Hari Ini: {todayLabel}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center flex-shrink-0">
              <button
                type="button"
                disabled
                className="bg-slate-300 text-white px-6 py-2 rounded-xl font-medium flex items-center gap-2 cursor-not-allowed whitespace-nowrap"
              >
                <img src={IconPrint} alt="Print Icon" className="w-3 h-3 object-contain"
                  style={{ filter: 'brightness(0) invert(1)' }} />
                Cetak Label
              </button>
            </div>
          </div>

          {/* Section Title 1 */}
          <div className="flex items-center gap-3 mt-10 mb-4">
            <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
            <h2 className="text-xl font-bold text-gray-900">Menu Hari Ini</h2>
          </div>

          <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
            {todayWeeklyMenuItems.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {todayWeeklyMenuItems.map((item, index) => (
                  <div key={`${item.date}-${index}`} className="rounded-xl border border-gray-200 bg-slate-50 p-5">
                    <div className="flex flex-col gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">Menu Hari Ini</p>
                        <p className="mt-1 text-sm text-slate-500">{item.date}</p>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-lg bg-white p-4 border border-slate-200">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Makanan Utama</p>
                          <p className="mt-2 text-base font-semibold text-slate-800">{item.mainDish}</p>
                        </div>
                        <div className="rounded-lg bg-white p-4 border border-slate-200">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Menu Pendamping</p>
                          <p className="mt-2 text-base font-semibold text-slate-800">{item.sideDish}</p>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
                        <div className="rounded-lg bg-white p-4 border border-slate-200">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Buah</p>
                          <p className="mt-2 text-base font-semibold text-slate-800">{item.fruit}</p>
                        </div>
                        <div className="rounded-lg bg-white p-4 border border-slate-200">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Protein</p>
                          <p className="mt-2 text-base font-semibold text-slate-800">{item.protein} g</p>
                        </div>
                        <div className="rounded-lg bg-white p-4 border border-slate-200">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Kalori</p>
                          <p className="mt-2 text-base font-semibold text-slate-800">{item.calories} kcal</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                <p className="text-sm font-semibold text-slate-700">Belum ada menu hari ini</p>
                <p className="mt-1 text-xs text-slate-500">Unggah file CSV menu mingguan dan pastikan data tanggal hari ini tersedia di pratinjau.</p>
              </div>
            )}
          </div>

          {/* Section Title 2 */}
          <div className="flex items-center gap-3 mt-10 mb-4">
            <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
            <h2 className="text-xl font-bold text-gray-900">Unggah Menu Mingguan (CSV)</h2>
          </div>

          {/* UPLOAD WEEKLY MENU SECTION */}
          <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-10 flex items-center justify-center gap-3 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
              onDrop={handleFileDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => document.getElementById('csvInput').click()}
            >
              <input id="csvInput" type="file" accept=".csv" className="hidden" onChange={handleFileDrop} />
              <svg className="w-10 h-10 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <span className="text-lg font-semibold text-gray-600">
                {uploadedFile ? uploadedFile.name : 'Menu belum tersedia'}
              </span>
            </div>

            <div className="border-t border-gray-100" />

            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Pratinjau (Terakhir Diunggah)</p>
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200" style={{ backgroundColor: '#F8FAFC' }}>
                      <th className="text-left px-6 py-4 font-bold text-gray-700">Hari</th>
                      <th className="text-left px-6 py-4 font-bold text-gray-700">Hidangan Utama</th>
                      <th className="text-left px-6 py-4 font-bold text-gray-700">Menu Pendamping</th>
                      <th className="text-left px-6 py-4 font-bold text-gray-700">Buah</th>
                    </tr>
                  </thead>
                  <tbody>
                    {menuData.length > 0 ? (
                      menuData.map((row, i) => (
                        <tr key={i} className="border-b border-gray-100 last:border-0">
                          <td className="px-6 py-4 text-gray-700">{getDisplayValue(row.day)}</td>
                          <td className="px-6 py-4 text-gray-700">{getDisplayValue(row.mainDish)}</td>
                          <td className="px-6 py-4 text-gray-700">{getDisplayValue(row.sideDish)}</td>
                          <td className="px-6 py-4 text-gray-700">{getDisplayValue(row.fruit)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-8">
                          <div className="flex flex-col items-center justify-center rounded-lg bg-slate-50 border border-slate-200 py-6">
                            <p className="text-sm font-semibold text-slate-700">Belum ada menu mingguan yang ditampilkan</p>
                            <p className="mt-1 text-xs text-slate-500">
                              Unggah file CSV lalu klik <span className="font-semibold">Konfirmasi Menu</span> untuk menampilkan pratinjau.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => handleUploadCsv(uploadedFile)}
                disabled={csvUploading || !uploadedFile}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-xl font-bold transition-all active:scale-95 disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                Konfirmasi Menu
              </button>
            </div>
          </div>

          {/* Section Title 3 */}
          <div className="flex items-center gap-3 mt-10 mb-4">
            <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
            <h2 className="text-xl font-bold text-gray-900">Unggah Data Nutrisi (CSV)</h2>
          </div>

          {/* UPLOAD NUTRITION DATA SECTION */}
          <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row gap-8">
              <div
                className="border-2 border-dashed border-gray-300 rounded-xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all w-full md:w-1/2"
                onClick={() => document.getElementById('nutritionCsvInput').click()}
              >
                <input id="nutritionCsvInput" type="file" accept=".csv" className="hidden" onChange={handleNutritionFileChange} />
                <img src={IconNutrisi} alt="Nutrisi Icon" className="w-8 h-8 object-contain" />
                <p className="text-base font-bold text-gray-700">Unggah CSV Nutrisi</p>
                <button
                  type="button"
                  onClick={() => handleUploadNutrition(nutritionFile)}
                  disabled={csvUploading || !nutritionFile}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 rounded-xl font-bold transition-all active:scale-95 disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  Unggah CSV
                </button>
              </div>

              <div className="flex flex-col justify-center gap-5 w-full md:w-1/2">
                <p className="text-gray-600 text-base leading-relaxed">
                  Pastikan CSV kamu memiliki kolom:{' '}
                  <span className="text-blue-500 font-mono font-semibold bg-blue-50 px-1 rounded">Calories</span>,{' '}
                  <span className="text-blue-500 font-mono font-semibold bg-blue-50 px-1 rounded">Protein</span>,{' '}
                  <span className="text-blue-500 font-mono font-semibold bg-blue-50 px-1 rounded">Fat</span>,{' '}
                  <span className="text-blue-500 font-mono font-semibold bg-blue-50 px-1 rounded">Carbs</span>, dan{' '}
                  <span className="text-blue-500 font-mono font-semibold bg-blue-50 px-1 rounded">Fiber</span>.
                </p>
                <div className="rounded-xl p-5 space-y-3" style={{ backgroundColor: '#136DEC0D', border: '1px solid #136DEC1A' }}>
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Skor Unggahan Terakhir</p>
                    <span className="text-sm font-bold text-green-500">{nutritionCoverage === '-' ? '-' : 'VALID'}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: nutritionBarWidth }} />
                  </div>
                  <p className="text-sm text-gray-500">Cakupan Data: {nutritionCoverage}</p>
                  {nutritionCoverage === '-' ? (
                    <p className="text-xs text-slate-500">
                      Belum ada data nutrisi terbaru. Unggah CSV nutrisi untuk melihat skor validasi.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* Section Title 4 */}
          <div className="flex items-center gap-3 mt-10 mb-4">
            <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">4</div>
            <h2 className="text-xl font-bold text-gray-900">Unggah Dokumentasi Makanan</h2>
          </div>

          {/* UPLOAD MEAL DOCUMENTATION SECTION */}
          <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row gap-8">
              <div
                className="rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-all w-full md:w-1/3 min-h-[320px]"
                style={{ backgroundColor: '#F1F5F9', border: '2px dashed #CBD5E1' }}
                onClick={() => document.getElementById('mealPhotoInput').click()}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = '#EFF6FF';
                  e.currentTarget.style.border = '2px dashed #93C5FD';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = '#F1F5F9';
                  e.currentTarget.style.border = '2px dashed #CBD5E1';
                }}
              >
                <input id="mealPhotoInput" type="file" accept="image/*" className="hidden" onChange={handleMealPhotoChange} />
                <img src={IconCamera} alt="Camera Icon" className="w-10 h-10 object-contain" />
                <p className="text-sm text-gray-500 font-medium">{mealPhotoFile ? mealPhotoFile.name : 'Tambah Foto Makanan'}</p>
              </div>

              <div className="flex flex-col gap-5 w-full md:w-2/3 min-h-[320px]">
                <div className="flex gap-4">
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-sm font-semibold text-gray-700">Tanggal Persiapan</label>
                    <input
                      type="date"
                      value={mealProductionDate}
                      onChange={(e) => setMealProductionDate(e.target.value)}
                      className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-400 outline-none focus:border-blue-400" />
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-sm font-semibold text-gray-700">Sekolah Tujuan</label>
                    <select
                      value={mealTargetSchoolId}
                      onChange={(e) => setMealTargetSchoolId(e.target.value)}
                      className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-700 outline-none focus:border-blue-400 bg-white"
                    >
                      <option value="">Pilih Sekolah</option>
                      {servedSchools.map((school) => (
                        <option key={school.id} value={school.id}>
                          {getDisplayValue(school?.schoolName ?? school?.name)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-gray-700">Keterangan/Catatan</label>
                  <textarea
                    placeholder="Contoh: Porsi segar dikirim ke SDN 01"
                    rows={3}
                    value={mealNotes}
                    onChange={(e) => setMealNotes(e.target.value)}
                    className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-400 outline-none focus:border-blue-400 resize-none" />
                </div>

                <button
                  type="button"
                  onClick={handleSubmitMealDocumentation}
                  disabled={mealUploading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl font-bold transition-all active:scale-95 w-fit disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  {mealUploading ? 'Mengirim...' : 'Kirim Dokumentasi'}
                </button>
              </div>
            </div>

            <div className="border-t border-gray-100" />

            <div className="space-y-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Unggahan Hari Ini</p>
              {todayDocumentationItems.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {todayDocumentationItems.map((item, i) => (
                    <div key={i} className="rounded-xl overflow-hidden border border-gray-200">
                      <div className="aspect-square w-full overflow-hidden">
                        {item.img ? (
                          <img src={item.img} alt={item.school} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 text-sm font-semibold">Belum ada foto</div>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-semibold text-blue-500">{getDisplayValue(item.school)}</p>
                        <p className="text-xs text-gray-400 mb-2">{getDisplayValue(item.time)}</p>
                        
                        {item.analysisStatus === 'pending' || item.analysisStatus === 'processing' ? (
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold w-fit mb-2 border border-slate-200">
                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                            Analyzing CV...
                          </div>
                        ) : item.analysisStatus === 'completed' ? (
                          <button 
                            onClick={() => handleOpenCvModal(item.id)}
                            className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors rounded-md text-[10px] font-bold w-fit mb-2 cursor-pointer"
                          >
                            <span>🤖</span> Hasil AI
                          </button>
                        ) : item.analysisStatus === 'failed' ? (
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 text-red-600 rounded-md text-[10px] font-bold w-fit mb-2 border border-red-100">
                            <span>❌</span> CV Gagal
                          </div>
                        ) : null}

                        <p className="mt-1 line-clamp-2 text-xs text-slate-500">{getDisplayValue(item.note)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
                  <p className="text-sm font-semibold text-slate-700">Belum ada dokumentasi yang diunggah hari ini</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Tambahkan foto makanan dan kirim dokumentasi untuk melihat riwayat unggahan di sini.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Section Title 5 */}
          <div className="flex items-center gap-3 mt-10 mb-4">
            <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">4</div>
            <h2 className="text-xl font-bold text-gray-900">Umpan Balik & Notifikasi Sekolah</h2>
          </div>

          {/* SCHOOL FEEDBACK CARD */}
          <div className="px-16 pb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {feedbackItems.length > 0 ? feedbackItems.map((item, index) => {
                const borderColor =
                  item.variant === 'warning'
                    ? '#EF4444'
                    : item.variant === 'success'
                    ? '#10B981'
                    : '#3B82F6';
                const icon =
                  item.variant === 'warning'
                    ? IconWarning
                    : item.variant === 'success'
                    ? IconCeklis
                    : IconFeedback;

                return (
                  <div
                    key={`${item.title}-${index}`}
                    className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex gap-4"
                    style={{ borderLeft: `4px solid ${borderColor}` }}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <img src={icon} alt="Feedback" className="w-6 h-6 object-contain" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-gray-900">{getDisplayValue(item.title)}</p>
                        <span className="text-xs text-gray-400 whitespace-nowrap ml-4">{getDisplayValue(item.time)}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{getDisplayValue(item.desc)}</p>
                      <p className="text-sm font-semibold text-blue-500 mt-2">{getDisplayValue(item.school)}</p>
                    </div>
                  </div>
                );
              }) : (
                <div className="md:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                  <p className="text-sm font-semibold text-slate-700">Belum ada umpan balik baru dari sekolah</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Notifikasi keluhan, masukan, atau konfirmasi dari sekolah akan muncul di bagian ini.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() => navigate('/notification')}
                className="bg-gray-50 rounded-xl border border-gray-200 shadow-sm p-5 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-all w-full"
              >
                <p className="text-base font-bold text-gray-900">Lihat Riwayat</p>
              </button>
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
          <div className="flex gap-6 text-sm text-slate-400">
            <span className="cursor-not-allowed">Pusat Dukungan</span>
            <span className="cursor-not-allowed">Pedoman Kebijakan</span>
            <span className="cursor-not-allowed">Privasi</span>
          </div>
        </div>
      </footer>

      {showEditAccountModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Edit Akun SPPG</h3>
                <p className="mt-1 text-xs text-slate-500">Perbarui informasi profil akun dari dashboard.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditAccountModal(false)}
                className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100"
              >
                Tutup
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-[180px_1fr]">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="mx-auto h-32 w-32 overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <img src={resolveImageUrl(profilePhotoPreview, IconProfile)} alt="Preview profil" className="h-full w-full object-cover" />
                </div>
                <label className="mt-3 block cursor-pointer rounded-lg bg-blue-600 px-3 py-2 text-center text-xs font-bold text-white hover:bg-blue-700">
                  Upload Foto Profil
                  <input type="file" accept="image/*" className="hidden" onChange={handleProfilePhotoChange} />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Nama SPPG</label>
                  <input value={editForm.name} onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Email</label>
                  <input type="email" value={editForm.email} onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Kode SPPG</label>
                  <input value={editForm.code} onChange={(e) => setEditForm((prev) => ({ ...prev, code: e.target.value }))} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Penanggung Jawab</label>
                  <input value={editForm.personInCharge} onChange={(e) => setEditForm((prev) => ({ ...prev, personInCharge: e.target.value }))} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-400" />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Alamat</label>
                  <textarea value={editForm.address} onChange={(e) => setEditForm((prev) => ({ ...prev, address: e.target.value }))} rows={3} className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-400" />
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setShowEditAccountModal(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                Batal
              </button>
              <button type="button" onClick={handleSaveEditAccount} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700">
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showCompleteProfileModal ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-extrabold text-slate-900">Lengkapi Profil Operasional</h3>
            <p className="mt-1 text-xs text-slate-500">Lengkapi data ini agar dashboard menampilkan informasi SPPG dengan benar.</p>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-[180px_1fr]">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="mx-auto h-32 w-32 overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <img src={resolveImageUrl(onboardingPhotoPreview || getImageSource(sppgData), IconBuilding)} alt="Foto SPPG" className="h-full w-full object-cover" />
                </div>
                <label className="mt-3 block cursor-pointer rounded-lg bg-blue-600 px-3 py-2 text-center text-xs font-bold text-white hover:bg-blue-700">
                  Upload Foto SPPG
                  <input type="file" accept="image/*" className="hidden" onChange={handleCompleteProfilePhotoChange} />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Kapasitas Harian (porsi)</label>
                  <input type="number" min="1" value={completeProfileForm.capacityPerDay} onChange={(e) => setCompleteProfileForm((prev) => ({ ...prev, capacityPerDay: e.target.value }))} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Jumlah Staf</label>
                  <input type="number" min="1" value={completeProfileForm.staffCount} onChange={(e) => setCompleteProfileForm((prev) => ({ ...prev, staffCount: e.target.value }))} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Latitude</label>
                  <input type="text" value={completeProfileForm.lat} onChange={(e) => setCompleteProfileForm((prev) => ({ ...prev, lat: e.target.value }))} placeholder="-6.200000" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Longitude</label>
                  <input type="text" value={completeProfileForm.lng} onChange={(e) => setCompleteProfileForm((prev) => ({ ...prev, lng: e.target.value }))} placeholder="106.816666" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-400" />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={() => setShowLocationPicker((prev) => !prev)}
                    className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100"
                  >
                    {showLocationPicker ? 'Sembunyikan Peta' : 'Pilih dari Peta'}
                  </button>
                </div>
                {showLocationPicker ? (
                  <div className="sm:col-span-2 rounded-xl border border-slate-200 p-2">
                    <div className="mb-2 flex flex-col gap-2 sm:flex-row">
                      <input
                        type="text"
                        value={locationQuery}
                        onChange={(e) => setLocationQuery(e.target.value)}
                        placeholder="Cari lokasi, contoh: Monas Jakarta"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
                      />
                      <button
                        type="button"
                        onClick={handleSearchLocation}
                        disabled={locationSearching || !locationQuery.trim()}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        {locationSearching ? 'Mencari...' : 'Cari'}
                      </button>
                    </div>
                    {locationSearchError ? <p className="mb-2 text-xs text-rose-600">{locationSearchError}</p> : null}
                    <LocationPickerMap
                      value={{ lat: completeProfileForm.lat, lng: completeProfileForm.lng }}
                      onChange={handleMapLocationChange}
                    >
                      <MapSearchController target={mapTarget} />
                    </LocationPickerMap>
                    <p className="mt-2 text-xs text-slate-500">
                      Klik di peta atau geser pin untuk mengatur lokasi SPPG.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button type="button" onClick={handleSaveCompleteProfile} disabled={!canSubmitCompleteProfile} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300">
                Simpan Profil
              </button>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  );
};

export default DashboardSPPG;
