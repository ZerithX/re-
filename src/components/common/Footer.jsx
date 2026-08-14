import logo from "../../assets/Logo.png";
import iconGlobe from "../../assets/Icon_globe.png"; 
import iconEmail from "../../assets/Icon_@.png";     
import iconCall from "../../assets/Icon_call.png";   
import iconMap from "../../assets/Icon_map.png";
import iconMail from "../../assets/Icon_mail.png";
import iconBluecall from "../../assets/Icon_bluecall.png";

function Footer() {
  return (
    <footer className="bg-[#0a2551] text-white py-16 px-10">
      <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-12">
        
        {/* Kolom 1: SIGIZI Logo & Deskripsi */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo SIGIZI" className="w-16 h-auto object-contain" />
            <h2 className="text-xl font-bold">SIGIZI</h2>
          </div>
          <p className="text-sm text-slate-300 mt-3 leading-relaxed pr-4">
            Mengawal kualitas nutrisi generasi masa depan melalui keterbukaan informasi dan pengawasan publik berbasis teknologi digital.
          </p>
          
          {/* IKON SOSMED */}
          <div className="flex gap-4 pt-2 text-slate-300 items-center">
            <a href="#" className="group transition-colors">
              <img src={iconGlobe} alt="Ikon Web" className="w-5 h-5 transition-all duration-300 group-hover:brightness-200" />
            </a>
            <a href="#" className="group transition-colors">
              <img src={iconEmail} alt="Ikon Email" className="w-5 h-5 transition-all duration-300 group-hover:brightness-200" />
            </a>
            <a href="#" className="group transition-colors">
              <img src={iconCall} alt="Ikon Telepon" className="w-5 h-5 transition-all duration-300 group-hover:brightness-200" />
            </a>
          </div>
        </div>

        {/* Kolom 2: Peta Situs */}
        <div className="space-y-4 pt-1">
          <h4 className="font-bold text-lg mb-6">Peta Situs</h4>
          <ul className="space-y-4 text-slate-300">
            <li><a href="/" className="hover:text-white hover:underline">Dashboard Utama</a></li>
            <li><a href="/maps" className="hover:text-white hover:underline">Peta Interaktif</a></li>
            <li><a href="/artikel" className="hover:text-white hover:underline">Artikel & Edukasi</a></li>
          </ul>
        </div>

        {/* Kolom 3: Layanan Publik */}
        <div className="space-y-4 pt-1">
          <h4 className="font-bold text-lg mb-6">Layanan Publik</h4>
          <ul className="space-y-4 text-slate-300">
            <li><a href="#" className="hover:text-white hover:underline">Pusat Bantuan</a></li>
            <li><a href="#" className="hover:text-white hover:underline">Form Pelaporan</a></li>
            <li><a href="#" className="hover:text-white hover:underline">Standar Gizi Nasional</a></li>
            <li><a href="#" className="hover:text-white hover:underline">FAQ Program</a></li>
          </ul>
        </div>

        {/* Kolom 4: Kontak & Lokasi */}
        <div className="space-y-4 pt-1 md:justify-self-end">
          <h4 className="font-bold text-lg mb-6">Kontak & Lokasi</h4>
          <div className="space-y-5 text-slate-300 text-[15px]">
            
            <div className="flex items-start gap-3">
              <img src={iconMap} alt="Ikon Lokasi" className="w-3.5 h-3.5 pt-0.5 flex-shrink-0 object-contain" />
              <span>Jl. Merdeka Barat No. 1, Jakarta Pusat</span>
            </div>
            
            <div className="flex items-start gap-3">
              <img src={iconMail} alt="Ikon Email" className="w-3.5 h-3.5 pt-0.5 flex-shrink-0 object-contain" />
              <a href="mailto:info@mbg.go.id" className="hover:text-white hover:underline">info@mbg.go.id</a>
            </div>
            
            <div className="flex items-start gap-3">
              <img src={iconBluecall} alt="Ikon Telepon" className="w-3.5 h-3.5 pt-0.5 flex-shrink-0 object-contain" />
              <span>1500-XXX (Layanan Bebas Pulsa)</span>
            </div>
            
          </div>
        </div>

      </div>

      {/* BAGIAN BAWAH FOOTER */}
      <div className="w-full border-t border-slate-700 mt-16 pt-8 flex justify-between items-center text-sm text-slate-400">
        <p>© 2024 Badan Gizi Nasional - Pemerintah Republik Indonesia.</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-white hover:underline">Kebijakan Privasi</a>
          <a href="#" className="hover:text-white hover:underline">Syarat & Ketentuan</a>
          <a href="#" className="hover:text-white hover:underline">Aksesibilitas</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
