import { useState } from 'react'
import { HiOutlineChevronDown } from "react-icons/hi2";

function FAQ() {
  const faqs = [
    {
      question: 'Apa tujuan utama dari platform transparansi MBG ini?',
      answer: 'Platform ini dibangun untuk memastikan setiap orang tua, guru, dan masyarakat umum dapat memantau kualitas gizi, ketepatan waktu distribusi, dan higienitas proses masak Program Makan Bergizi Gratis secara transparan.',
    },
    {
      question: 'Siapa saja yang memiliki akses ke data platform?',
      answer: 'Platform SIGIZI dapat diakses oleh masyarakat umum dan orang tua siswa secara terbuka untuk memantau menu serta gizi anak. Selain itu, akses khusus (dashboard) diberikan kepada pengelola dapur SPPG dan pihak sekolah untuk kebutuhan pelaporan dan operasional program MBG.',
    },
    {
      question: 'Dari mana sumber data menu dan dapur ini berasal?',
      answer: 'Seluruh data menu dan informasi gizi diinput langsung oleh pengelola dapur SPPG (Satuan Pelayanan Pemenuhan Gizi) secara mingguan. Selain itu, data realisasi distribusi didukung oleh laporan bukti foto dan umpan balik yang diunggah oleh pihak sekolah setiap harinya.',
    },
    {
      question: 'Bagaimana cara memberikan laporan jika ada ketidaksesuaian?',
      answer: 'Laporan ketidaksesuaian dilakukan oleh pihak sekolah melalui dashboard khusus dengan mengunggah bukti foto makanan harian dan mengisi catatan feedback. Laporan ini akan langsung diterima oleh pihak dapur (SPPG) untuk segera ditindaklanjuti sebagai bentuk evaluasi kualitas layanan.',
    }
  ];

  const [openIdx, setOpenIdx] = useState(-1);

  const toggleFaq = (idx) => {
    setOpenIdx(openIdx === idx ? -1 : idx);
  };

  return (
    <>
      <div className="bg-slate-50 text-slate-900 py-16">
        <div className="max-w-4xl mx-auto px-6">
          
          <h1 className="text-[40px] font-bold text-center mb-12 text-[#1a202c]">
            Pertanyaan Umum
          </h1>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-slate-200 rounded-2xl bg-white">
                <button 
                  onClick={() => toggleFaq(index)}
                  className="flex justify-between items-center w-full px-6 py-5 text-left focus:outline-none"
                >
                  <h3 className="text-[17px] font-semibold text-[#1a202c] pr-6">
                    {faq.question}
                  </h3>
                  
                  <HiOutlineChevronDown 
                    className={`w-6 h-6 text-slate-400 transform transition-transform duration-300 flex-shrink-0 ${openIdx === index ? 'rotate-180' : ''}`} 
                  />
                </button>

                <div className={`overflow-hidden transition-all duration-500 ease-in-out ${openIdx === index ? 'max-h-96' : 'max-h-0'}`}>
                  <div className="px-6 pb-5 text-slate-600 leading-relaxed text-[15px]">
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
        </div>
      </div>
      
      
    </>
  );
}

export default FAQ;
