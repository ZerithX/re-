import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import L from "leaflet";
import { FiArrowRight, FiMapPin, FiSearch, FiUsers, FiX } from "react-icons/fi";
import { LuChefHat, LuGraduationCap, LuRoute } from "react-icons/lu";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { useMapsPage } from "../../hooks/useMapsPage";
import { resolveImageUrl } from "../../utils/imageUrl";
import defaultSppgImage from "../../assets/ProfilSPPG.png";
import defaultSchoolImage from "../../assets/defaultSekolah.png";
import sekolah1 from "../../assets/sekolah1.png";
import sekolah2 from "../../assets/sekolah2.png";
import sekolah3 from "../../assets/sekolah3.png";

const defaultCenter = [-6.225, 106.795];
const focusZoom = 16;
const filters = [
  { value: "all", label: "Semua" },
  { value: "sppg", label: "Dapur SPPG" },
  { value: "school", label: "Sekolah" },
];
const schoolFallbackImages = [defaultSchoolImage, sekolah1, sekolah2, sekolah3];
const sppgFallbackImages = [defaultSppgImage];

function hashString(value) {
  let hash = 0;
  const str = String(value ?? "");
  for (let index = 0; index < str.length; index += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getFallbackImageById(type, id) {
  const images = type === "sppg" ? sppgFallbackImages : schoolFallbackImages;
  const imageIndex = hashString(id) % images.length;
  return images[imageIndex];
}

function getMarkerIcon(item, isSelected) {
  const type = item.type;
  let statusClass = `map-dot-${type}`;
  if (type === 'sppg') {
    if (item.verificationStatus === 'flagged') statusClass = 'map-dot-sppg-flagged';
    else if (item.verificationStatus === 'partial') statusClass = 'map-dot-sppg-partial';
  }

  return L.divIcon({
    className: "",
    html: `<span class="map-dot ${statusClass} ${isSelected ? "map-dot-selected" : ""}">${
      type === "sppg"
        ? '<span class="map-dot-glyph">D</span>'
        : '<span class="map-dot-glyph">S</span>'
    }</span>`,
    iconSize: type === "sppg" ? [28, 28] : [24, 24],
    iconAnchor: type === "sppg" ? [14, 14] : [12, 12],
  });
}

const hasValidLatLng = (item) =>
  Number.isFinite(item?.lat) && Number.isFinite(item?.lng);

function getPosition(item) {
  return [item.lat, item.lng];
}

function getConnectionKey(sppgId, schoolId) {
  return `${sppgId}__${schoolId}`;
}

function MapController({ selectedItem }) {
  const map = useMap();

  useEffect(() => {
    if (!selectedItem || !hasValidLatLng(selectedItem)) return;

    const markerPoint = map.project(getPosition(selectedItem), focusZoom);
    const adjustedPoint = markerPoint.subtract([0, 200]);
    const adjustedLatLng = map.unproject(adjustedPoint, focusZoom);

    map.flyTo(adjustedLatLng, focusZoom, { duration: 0.65 });
  }, [map, selectedItem]);

  return null;
}

function MapProjection({ selectedItem, onClear, onPointChange }) {
  const map = useMap();

  const updatePoint = useCallback(() => {
    if (!selectedItem || !hasValidLatLng(selectedItem)) {
      onPointChange(null);
      return;
    }

    const point = map.latLngToContainerPoint(getPosition(selectedItem));
    onPointChange({ x: point.x, y: point.y });
  }, [map, onPointChange, selectedItem]);

  useEffect(() => {
    updatePoint();
  }, [updatePoint]);

  useMapEvents({
    click: onClear,
    move: updatePoint,
    zoom: updatePoint,
    resize: updatePoint,
  });

  return null;
}

function SearchBar({ items, onSelect }) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const normalizedQuery = query.toLowerCase();

    return items
      .filter((item) => item.name.toLowerCase().includes(normalizedQuery))
      .slice(0, 6);
  }, [items, query]);

  return (
    <div className="absolute left-4 right-4 top-16 z-[800] w-auto sm:left-5 sm:right-auto sm:w-[min(360px,calc(100vw-40px))]">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.14)]">
        <div className="flex h-12 items-center gap-3 px-4">
          <FiSearch className="h-5 w-5 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari SPPG atau Sekolah"
            className="h-full min-w-0 flex-1 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
          />
        </div>

        {results.length > 0 ? (
          <div className="border-t border-slate-100 p-2">
            {results.map((item) => (
              <button
                key={`${item.type}-${item.id}`}
                type="button"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-slate-50"
                onClick={() => {
                  onSelect(item.type, item.id);
                  setQuery(item.name);
                }}
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    item.type === "sppg" ? "bg-emerald-500" : "bg-blue-500"
                  }`}
                />
                <span>
                  <span className="block text-sm font-bold text-slate-900">
                    {item.name}
                  </span>
                  <span className="block text-xs font-medium text-slate-500">
                    {item.location}
                  </span>
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function FilterBar({ value, onChange }) {
  return (
    <div className="absolute left-4 right-4 top-[7.75rem] z-[800] flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-[0_12px_30px_rgba(15,23,42,0.14)] sm:left-[410px] sm:right-auto sm:top-16 sm:flex-nowrap sm:gap-0">
      {filters.map((filter) => (
        <button
          key={filter.value}
          type="button"
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition sm:flex-none ${
            value === filter.value
              ? "bg-[#136DEC] text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
          onClick={() => onChange(filter.value)}
        >
          {filter.value === "sppg" ? (
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          ) : null}
          {filter.value === "school" ? (
            <span className="h-2 w-2 rounded-full bg-blue-500" />
          ) : null}
          {filter.label}
        </button>
      ))}
    </div>
  );
}

function MarkerLayer({ items, selectedItem, onSelect }) {
  return (
    <>
      {items.map((item) => (
        <Marker
          key={`${item.type}-${item.id}`}
          position={getPosition(item)}
          icon={getMarkerIcon(item, selectedItem?.id === item.id)}
          eventHandlers={{
            click: (event) => {
              event.originalEvent?.stopPropagation?.();
              onSelect(item.type, item.id);
            },
          }}
        />
      ))}
    </>
  );
}

function PopupCard({ item, point, onClose }) {
  if (!item || !point) return null;

  const isSppg = item.type === "sppg";
  const profileLabel = isSppg ? "Lihat Profil SPPG" : "Lihat Profil Sekolah";
  const fallbackImage = getFallbackImageById(item.type, item.id);
  const imageUrl = resolveImageUrl(item?.photoUrl, fallbackImage);

  return (
    <article
      className="pointer-events-auto absolute z-[650] w-[min(340px,calc(100vw-32px))] -translate-x-1/2 -translate-y-[calc(100%+24px)] overflow-visible rounded-xl bg-white shadow-[0_18px_40px_rgba(15,23,42,0.22)]"
      style={{ left: point.x, top: point.y }}
    >
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="h-[128px] bg-[linear-gradient(135deg,#f8f6ef_0%,#e7dac8_50%,#c7b59c_100%)]">
          <img src={imageUrl} alt={item.name} className="h-full w-full object-cover" />
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span
                className={`inline-flex rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-wide ${
                  isSppg
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {isSppg ? "Dapur SPPG" : "Sekolah"}
              </span>
              <h2 className="mt-2 truncate text-lg font-black text-slate-950">
                {item.name}
              </h2>
            </div>
            <button
              type="button"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Tutup detail"
              onClick={onClose}
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-3 space-y-2.5 text-sm font-semibold text-slate-600">
            <div className="flex items-center gap-2">
              <FiMapPin className="h-4 w-4 shrink-0 text-slate-500" />
              <span>{item.location}</span>
            </div>
            <div className="flex items-center gap-2">
              {isSppg ? (
                <FiUsers className="h-4 w-4 shrink-0 text-slate-500" />
              ) : (
                <LuRoute className="h-4 w-4 shrink-0 text-slate-500" />
              )}
              <span>{item.info}</span>
            </div>
            <div className="flex items-center gap-2">
              {isSppg ? (
                <LuChefHat className="h-4 w-4 shrink-0 text-slate-500" />
              ) : (
                <LuGraduationCap className="h-4 w-4 shrink-0 text-slate-500" />
              )}
              <span>{item.capacity}</span>
            </div>
          </div>

          <Link
            to={isSppg ? `/profil/sppg/${item.id}` : `/profil/sekolah/${item.id}`}
            className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#136DEC] text-sm font-black text-white shadow-[0_8px_18px_rgba(19,109,236,0.28)] hover:bg-blue-700 no-underline"
          >
            {profileLabel}
            <FiArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
      <span className="absolute left-1/2 top-full h-4 w-4 -translate-x-1/2 -translate-y-2 rotate-45 border-b border-r border-slate-200 bg-white shadow-[8px_8px_16px_rgba(15,23,42,0.08)]" />
    </article>
  );
}

function Legend() {
  return (
    <div className="absolute bottom-5 left-5 z-[500] rounded-xl border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.14)]">
      <p className="mb-3 text-xs font-bold text-slate-500">Simbol Peta</p>
      <div className="space-y-2 text-sm font-semibold text-slate-700">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-emerald-500" />
          Dapur SPPG (Terverifikasi)
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-yellow-500" />
          Dapur SPPG (Parsial/Proses)
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-500" />
          Dapur SPPG (Flagged / Indikasi Fraud)
        </div>
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-blue-500" />
          Sekolah
        </div>
        <div className="flex items-center gap-2">
          <span className="h-0.5 w-8 border-t-2 border-[#136DEC]" />
          Rute Pengiriman
        </div>
      </div>
    </div>
  );
}

export default function LeafletMapView({
  mapClassName = "h-full w-full",
  showSearch = false,
  showFilter = false,
  showLegend = true,
  loadingTopClassName = "top-5",
  errorTopClassName = "top-5",
}) {
  const { sppgItems: sppgData, schoolItems: schoolData, isLoading, error } = useMapsPage();
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [popupPoint, setPopupPoint] = useState(null);

  const sppgItems = useMemo(
    () => sppgData.map((item) => ({ ...item, type: "sppg" })),
    [sppgData],
  );
  const schoolItems = useMemo(
    () => schoolData.map((item) => ({ ...item, type: "school" })),
    [schoolData],
  );
  const validSppgItems = useMemo(
    () => sppgItems.filter(hasValidLatLng),
    [sppgItems],
  );
  const validSchoolItems = useMemo(
    () => schoolItems.filter(hasValidLatLng),
    [schoolItems],
  );
  const allItems = useMemo(
    () => [...sppgItems, ...schoolItems],
    [schoolItems, sppgItems],
  );
  const hasItems = validSppgItems.length > 0 || validSchoolItems.length > 0;

  const selectedItem = useMemo(() => {
    if (!selected) return null;
    return (
      allItems.find(
        (item) => item.type === selected.type && item.id === selected.id,
      ) ?? null
    );
  }, [allItems, selected]);

  const visibleItems = useMemo(() => {
    if (!showFilter || filter === "all") return [...validSppgItems, ...validSchoolItems];
    if (filter === "sppg") return validSppgItems;
    return validSchoolItems;
  }, [filter, showFilter, validSchoolItems, validSppgItems]);

  const routeConnections = useMemo(() => {
    const connections = new Map();
    const sppgById = new Map(validSppgItems.map((item) => [String(item.id), item]));
    const schoolById = new Map(validSchoolItems.map((item) => [String(item.id), item]));

    const addConnection = (sppgItem, schoolItem) => {
      if (!sppgItem || !schoolItem) return;
      const key = getConnectionKey(sppgItem.id, schoolItem.id);

      connections.set(key, {
        key,
        sppgId: String(sppgItem.id),
        schoolId: String(schoolItem.id),
        positions: [getPosition(sppgItem), getPosition(schoolItem)],
      });
    };

    validSchoolItems.forEach((school) => {
      if (!school.sppgId) return;
      addConnection(sppgById.get(String(school.sppgId)), school);
    });

    validSppgItems.forEach((sppgItem) => {
      if (!Array.isArray(sppgItem.schools)) return;

      sppgItem.schools.forEach((schoolId) => {
        addConnection(sppgItem, schoolById.get(String(schoolId)));
      });
    });

    return Array.from(connections.values());
  }, [validSchoolItems, validSppgItems]);

  const selectedConnectionKeys = useMemo(() => {
    if (!selectedItem) return new Set();

    return new Set(
      routeConnections
        .filter((connection) =>
          selectedItem.type === "sppg"
            ? connection.sppgId === String(selectedItem.id)
            : connection.schoolId === String(selectedItem.id),
        )
        .map((connection) => connection.key),
    );
  }, [routeConnections, selectedItem]);

  const handleSelect = (type, id) => {
    setSelected({ type, id });
  };

  const clearSelection = useCallback(() => {
    setSelected(null);
    setPopupPoint(null);
  }, []);

  return (
    <>
      <MapContainer center={defaultCenter} zoom={12} zoomControl={false} className={mapClassName}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController selectedItem={selectedItem} />
        <MapProjection
          selectedItem={selectedItem}
          onClear={clearSelection}
          onPointChange={setPopupPoint}
        />

        {routeConnections.map((connection) => {
          const isHighlighted = selectedConnectionKeys.has(connection.key);

          return (
          <Polyline
            key={connection.key}
            positions={connection.positions}
            pathOptions={{
              color: isHighlighted ? "#0057D9" : "#136DEC",
              weight: isHighlighted ? 5 : 3,
              opacity: isHighlighted ? 0.95 : 0.68,
              dashArray: isHighlighted ? null : "8 8",
              lineCap: "round",
              lineJoin: "round",
            }}
          />
          );
        })}

        <MarkerLayer
          items={visibleItems}
          selectedItem={selectedItem}
          onSelect={handleSelect}
        />
      </MapContainer>

      {showSearch ? <SearchBar items={allItems} onSelect={handleSelect} /> : null}
      {showFilter ? <FilterBar value={filter} onChange={setFilter} /> : null}
      <PopupCard
        item={selectedItem}
        point={popupPoint}
        onClose={clearSelection}
      />
      {showLegend ? <Legend /> : null}

      {isLoading ? (
        <div className={`absolute right-5 ${loadingTopClassName} z-[500] rounded-xl bg-white/90 px-3 py-2 text-xs font-bold text-slate-700 shadow`}>
          Memuat data peta...
        </div>
      ) : null}
      {error ? (
        <div className={`absolute right-5 ${errorTopClassName} z-[500] rounded-xl bg-rose-100 px-3 py-2 text-xs font-bold text-rose-700 shadow`}>
          {error}
        </div>
      ) : null}
      {!isLoading && !error && !hasItems ? (
        <div className={`absolute right-5 ${errorTopClassName} z-[500] rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 shadow`}>
          Data peta belum tersedia
        </div>
      ) : null}
    </>
  );
}
