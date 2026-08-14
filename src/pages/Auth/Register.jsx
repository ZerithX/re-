import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import RegistImage from "../../assets/Regist_image.png";
import { register } from "../../services/authService";
import { getAllSPPG } from "../../services/sppgService";

const emptyForm = {
  nama: "",
  email: "",
  nomor: "",
  kode: "",
  alamat: "",
  sppg: "",
  password: "",
  konfirmasi: "",
};

export default function Register() {
  const navigate = useNavigate();
  const [role, setRole] = useState("sppg");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [form, setForm] = useState(emptyForm);
  const [sppgOptions, setSppgOptions] = useState([]);
  const [sppgLoading, setSppgLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setSppgLoading(true);

    getAllSPPG({ forceRefresh: true })
      .then((res) => {
        if (!mounted) return;
        const items = Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res?.data)
          ? res.data
          : [];
        const options = items
          .map((item) => item?.name ?? item?.sppgName ?? "")
          .filter((name) => typeof name === "string" && name.trim().length > 0);
        setSppgOptions(Array.from(new Set(options)));
      })
      .catch(() => {
        if (!mounted) return;
        setSppgOptions([]);
      })
      .finally(() => {
        if (mounted) setSppgLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const validateField = (field, value, snapshot = form, activeRole = role) => {
    const draft = { ...snapshot, [field]: value };

    if (field === "nama") {
      if (!draft.nama.trim()) return "Nama wajib diisi.";
      return "";
    }

    if (field === "email") {
      const email = draft.email.trim();
      if (!email) return "Email wajib diisi.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Format email tidak valid.";
      return "";
    }

    if (field === "nomor") {
      const picName = draft.nomor.trim();
      if (!picName) return "Nama penanggung jawab wajib diisi.";
      if (picName.length < 3) return "Nama penanggung jawab minimal 3 karakter.";
      return "";
    }

    if (field === "kode") {
      const code = draft.kode.trim();
      if (!code) return activeRole === "sppg" ? "Kode SPPG wajib diisi." : "NPSN wajib diisi.";
      if (activeRole === "sekolah" && !/^\d{8}$/.test(code)) return "NPSN harus 8 digit angka.";
      return "";
    }

    if (field === "alamat") {
      if (!draft.alamat.trim()) return "Alamat wajib diisi.";
      return "";
    }

    if (field === "sppg") {
      if (activeRole === "sekolah" && !draft.sppg.trim()) return "Pilih SPPG yang melayani.";
      return "";
    }

    if (field === "password") {
      if (!draft.password) return "Kata sandi wajib diisi.";
      if (draft.password.length < 8) return "Kata sandi minimal 8 karakter.";
      return "";
    }

    if (field === "konfirmasi") {
      if (!draft.konfirmasi) return "Konfirmasi kata sandi wajib diisi.";
      if (draft.password !== draft.konfirmasi) return "Kata sandi tidak cocok.";
      return "";
    }

    return "";
  };

  const validateForm = (snapshot = form, activeRole = role) => {
    const fields = ["nama", "email", "nomor", "kode", "alamat", "password", "konfirmasi"];
    if (activeRole === "sekolah") fields.push("sppg");

    const nextErrors = {};
    fields.forEach((field) => {
      const message = validateField(field, snapshot[field], snapshot, activeRole);
      if (message) nextErrors[field] = message;
    });

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (field) => (e) => {
    const value = e.target.value;

    setForm((prev) => {
      const next = { ...prev, [field]: value };

      setFieldErrors((prevErr) => {
        const nextErr = { ...prevErr };
        if (touched[field]) {
          const message = validateField(field, value, next, role);
          if (message) nextErr[field] = message;
          else delete nextErr[field];
        }

        if ((field === "password" || field === "konfirmasi") && touched.konfirmasi) {
          const confirmMessage = validateField("konfirmasi", next.konfirmasi, next, role);
          if (confirmMessage) nextErr.konfirmasi = confirmMessage;
          else delete nextErr.konfirmasi;
        }

        return nextErr;
      });

      return next;
    });

    setError("");
  };

  const handleBlur = (field) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const message = validateField(field, form[field], form, role);
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (message) next[field] = message;
      else delete next[field];
      return next;
    });
  };

  const inputClass = (field) =>
    `w-full rounded-lg px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 ${
      fieldErrors[field] ? "border border-red-400 bg-red-50" : "border border-slate-200 bg-slate-50"
    }`;

  const canSubmit = useMemo(() => {
    if (isLoading || !agreed) return false;
    const isValid = validateField("nama", form.nama) === "" &&
      validateField("email", form.email) === "" &&
      validateField("nomor", form.nomor) === "" &&
      validateField("kode", form.kode) === "" &&
      validateField("alamat", form.alamat) === "" &&
      validateField("password", form.password) === "" &&
      validateField("konfirmasi", form.konfirmasi) === "";

    if (!isValid) return false;
    if (role === "sekolah" && validateField("sppg", form.sppg) !== "") return false;
    return true;
  }, [isLoading, agreed, form, role]);

  const handleSubmit = async () => {
    setError("");

    const allTouched = {
      nama: true,
      email: true,
      nomor: true,
      kode: true,
      alamat: true,
      sppg: role === "sekolah",
      password: true,
      konfirmasi: true,
    };
    setTouched((prev) => ({ ...prev, ...allTouched }));

    if (!validateForm()) return;

    if (!agreed) {
      setError("Harap centang persetujuan terlebih dahulu.");
      return;
    }

    setIsLoading(true);
    try {
      await register({
        role,
        name: form.nama.trim(),
        email: form.email.trim().toLowerCase(),
        // Untuk opsi cepat, field ini dipakai sebagai person_in_charge di backend.
        phone: form.nomor.trim(),
        code: form.kode.trim(),
        address: form.alamat.trim(),
        sppg: role === "sekolah" ? form.sppg.trim() : null,
        password: form.password,
      });
      navigate("/login", {
        state: {
          notice:
            "Pendaftaran berhasil. Akun Anda sedang menunggu verifikasi admin sebelum dapat mengakses dashboard.",
        },
      });
    } catch (err) {
      setError(err?.response?.data?.message ?? "Pendaftaran gagal. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-5xl flex rounded-2xl overflow-hidden shadow-xl bg-white">
        <div className="hidden md:flex w-1/2 flex-col justify-between bg-gradient-to-b from-blue-50 to-blue-100 p-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-blue-600 transition w-fit"
          >
            {"<"} Kembali
          </button>

          <div className="rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(15,23,42,0.12)] border border-slate-200 bg-white p-3">
            <img src={RegistImage} alt="Register" className="w-full object-cover h-full" />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 leading-tight">
              Membangun Kepercayaan <br /> Melalui Transparansi
            </h2>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Daftarkan institusi Anda untuk mendapatkan akses ke dashboard pemantauan gizi dan logistik pelayanan sekolah nasional.
            </p>
          </div>

          <div className="text-xs text-slate-400 space-y-1">
            <p>(c) 2026 SIGIZI | Capstone Kelompok 11 | All rights reserved.</p>
            <div className="flex gap-3">
              <span className="hover:text-blue-500 cursor-pointer">Kebijakan Privasi</span>
              <span className="hover:text-blue-500 cursor-pointer">Ketentuan Layanan</span>
              <span className="hover:text-blue-500 cursor-pointer">Pusat Dukungan</span>
            </div>
          </div>
        </div>

        <div className="w-full md:w-7/12 flex flex-col px-8 py-8 overflow-y-auto max-h-screen bg-gradient-to-b from-white to-slate-50/70">
          <div className="mb-5 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pilih Peran Institusi</p>
            <h1 className="text-lg font-extrabold text-slate-900 leading-tight">Form Pendaftaran SIGIZI</h1>
            <p className="mt-1 text-xs text-slate-500">
              Lengkapi data institusi untuk pengajuan akun. Aktivasi dilakukan setelah verifikasi admin.
            </p>
          </div>

          <div className="flex rounded-lg border border-slate-200 p-1 mb-5 gap-1">
            <button
              type="button"
              onClick={() => {
                setRole("sppg");
                setForm((prev) => ({ ...prev, sppg: "" }));
                setFieldErrors((prev) => {
                  const next = { ...prev };
                  delete next.sppg;
                  return next;
                });
              }}
              className={`flex-1 py-2 rounded-md text-sm font-semibold transition ${
                role === "sppg" ? "bg-white shadow text-slate-800 border border-slate-200" : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              SPPG (Dapur)
            </button>
            <button
              type="button"
              onClick={() => setRole("sekolah")}
              className={`flex-1 py-2 rounded-md text-sm font-semibold transition ${
                role === "sekolah" ? "bg-white shadow text-slate-800 border border-slate-200" : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              Sekolah
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">{role === "sppg" ? "Nama SPPG" : "Nama Sekolah"}</label>
              <input
                type="text"
                value={form.nama}
                onChange={handleChange("nama")}
                onBlur={handleBlur("nama")}
                placeholder={role === "sppg" ? "Contoh: SPPG Kebayoran Baru" : "Contoh: SDN 01 Kebayoran"}
                className={inputClass("nama")}
              />
              {fieldErrors.nama ? <p className="text-xs text-red-500 mt-1">{fieldErrors.nama}</p> : null}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">{role === "sppg" ? "Email Institusi" : "Email Sekolah"}</label>
              <input
                type="email"
                value={form.email}
                onChange={handleChange("email")}
                onBlur={handleBlur("email")}
                placeholder="nama@institusi.id"
                className={inputClass("email")}
              />
              {fieldErrors.email ? <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p> : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">Nama Penanggung Jawab</label>
              <input
                type="text"
                value={form.nomor}
                onChange={handleChange("nomor")}
                onBlur={handleBlur("nomor")}
                placeholder="Contoh: Budi Santoso"
                className={inputClass("nomor")}
              />
              {fieldErrors.nomor ? <p className="text-xs text-red-500 mt-1">{fieldErrors.nomor}</p> : null}
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 mb-1 block">{role === "sppg" ? "Kode SPPG" : "NPSN Sekolah"}</label>
              <input
                type="text"
                value={form.kode}
                onChange={handleChange("kode")}
                onBlur={handleBlur("kode")}
                placeholder={role === "sppg" ? "Contoh: SPPG-JKT-01" : "8 digit NPSN"}
                className={inputClass("kode")}
              />
              {fieldErrors.kode ? <p className="text-xs text-red-500 mt-1">{fieldErrors.kode}</p> : null}
            </div>
          </div>

          <div className="mb-3">
            <label className="text-xs font-semibold text-slate-600 mb-1 block">{role === "sppg" ? "Alamat Dapur" : "Alamat Sekolah"}</label>
            <textarea
              value={form.alamat}
              onChange={handleChange("alamat")}
              onBlur={handleBlur("alamat")}
              placeholder="Masukkan alamat lengkap institusi"
              rows={2}
              className={`${inputClass("alamat")} resize-none`}
            />
            {fieldErrors.alamat ? <p className="text-xs text-red-500 mt-1">{fieldErrors.alamat}</p> : null}
          </div>

          <div className="mb-1">
            <label className="text-xs font-semibold text-slate-400 mb-1 block">SPPG yang melayani</label>
            <div className="relative">
              <select
                value={form.sppg}
                onChange={handleChange("sppg")}
                onBlur={handleBlur("sppg")}
                disabled={role === "sppg" || sppgLoading}
                className={`w-full rounded-lg px-3 py-2.5 text-sm outline-none appearance-none ${
                  fieldErrors.sppg ? "border border-red-400 bg-red-50" : "border border-slate-200 bg-slate-50"
                } ${role === "sppg" ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <option value="">{sppgLoading ? "Memuat data SPPG..." : "Pilih SPPG"}</option>
                {sppgOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">v</span>
            </div>
            {role === "sekolah" ? <p className="text-[11px] text-slate-400 mt-1">Pilih unit dapur yang menjadi mitra distribusi sekolah Anda.</p> : null}
            {role === "sekolah" && !sppgLoading && sppgOptions.length === 0 ? (
              <p className="text-[11px] text-amber-600 mt-1">Data SPPG belum tersedia.</p>
            ) : null}
            {fieldErrors.sppg ? <p className="text-xs text-red-500 mt-1">{fieldErrors.sppg}</p> : null}
          </div>

          <div className="mb-3">
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Kata Sandi</label>
            <div className={`flex items-center rounded-lg px-3 ${fieldErrors.password ? "border border-red-400 bg-red-50" : "border border-slate-200 bg-slate-50"}`}>
              <input type={showPassword ? "text" : "password"} value={form.password} onChange={handleChange("password")} onBlur={handleBlur("password")} className="flex-1 py-2.5 text-sm bg-transparent outline-none" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400 text-xs ml-2">{showPassword ? "Hide" : "Show"}</button>
            </div>
            {fieldErrors.password ? <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p> : null}
          </div>

          <div className="mb-4">
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Konfirmasi Ulang Kata Sandi</label>
            <div className={`flex items-center rounded-lg px-3 ${fieldErrors.konfirmasi ? "border border-red-400 bg-red-50" : "border border-slate-200 bg-slate-50"}`}>
              <input type={showConfirm ? "text" : "password"} value={form.konfirmasi} onChange={handleChange("konfirmasi")} onBlur={handleBlur("konfirmasi")} className="flex-1 py-2.5 text-sm bg-transparent outline-none" />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-slate-400 text-xs ml-2">{showConfirm ? "Hide" : "Show"}</button>
            </div>
            {fieldErrors.konfirmasi ? <p className="text-xs text-red-500 mt-1">{fieldErrors.konfirmasi}</p> : null}
          </div>

          <div className="flex items-start gap-2 mb-4">
            <input type="checkbox" id="agree" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 accent-blue-600" />
            <label htmlFor="agree" className="text-xs text-slate-500 leading-relaxed">
              Saya menyatakan bahwa data yang diberikan adalah benar dan bersedia mengikuti protokol operasional
              <span className="text-blue-600 font-semibold"> SIGIZI.</span>
            </label>
          </div>

          {error ? <p className="text-xs text-red-500 font-semibold mb-3">{error}</p> : null}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full py-3 rounded-lg bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? "Memuat..." : "Daftar"}
          </button>

          <p className="text-center text-xs text-slate-500 mt-3">
            Sudah punya akun? <Link to="/login" className="text-blue-600 font-semibold hover:underline">Masuk di sini</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
