import { useEffect, useState } from "react";
import { getPublicMapData } from "../services/sppgService";

export function useMapsPage() {
  const [sppgItems, setSppgItems] = useState([]);
  const [schoolItems, setSchoolItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadMapData = async () => {
      try {
        const response = await getPublicMapData();
        const sppgData = Array.isArray(response?.data?.data?.sppg) ? response.data.data.sppg : [];
        const schoolData = Array.isArray(response?.data?.data?.schools) ? response.data.data.schools : [];

        // Direct mapping since the backend already formats most fields
        const mappedSppg = sppgData.map(item => ({
          ...item,
          name: item.name,
          lat: Number(item.lat),
          lng: Number(item.lng),
          verificationStatus: item.verificationStatus,
          location: item.address || 'Alamat tidak tersedia',
          capacity: `${item.capacityPerDay || 0} porsi / hari`,
          info: `${item.staffCount || 0} staf`,
        }));

        const mappedSchool = schoolData.map(item => ({
          ...item,
          name: item.name,
          lat: Number(item.lat),
          lng: Number(item.lng),
          location: item.address || 'Alamat tidak tersedia',
          capacity: `${item.studentCount || 0} siswa`,
          info: 'Sekolah Penerima',
        }));

        setSppgItems(mappedSppg);
        setSchoolItems(mappedSchool);
        setError(null);
      } catch (error) {
        console.error("Gagal mengambil data peta:", error);
        setSppgItems([]);
        setSchoolItems([]);
        setError("Gagal mengambil data peta.");
      } finally {
        setIsLoading(false);
      }
    };

    loadMapData();
  }, []);

  return {
    sppgItems,
    schoolItems,
    isLoading,
    error,
  };
}
