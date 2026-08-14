import { useEffect, useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import { Link, useNavigate } from "react-router-dom";
import { getAllArtikel } from "../../services/artikelService";
import { getDisplayValue } from "../../utils/display";
import { resolveImageUrl } from "../../utils/imageUrl";

function getResponseArray(payload) {
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

function formatPublishedDate(value) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function ArticleImage({ src, alt, className }) {
  const imageUrl = resolveImageUrl(src);

  if (!imageUrl) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 text-xs font-bold text-slate-400 ${className}`}>
        SIGIZI
      </div>
    );
  }

  return <img src={imageUrl} alt={alt} className={className} loading="lazy" />;
}

function ArticleCard({ article }) {
  const articleId = article?.id ?? article?._id;
  if (!articleId) return null;

  return (
    <Link
      to={`/artikel/${articleId}`}
      className="group block border-l-4 border-[#136DEC] bg-white shadow-[0_1px_8px_rgba(15,23,42,0.12)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(15,23,42,0.14)]"
    >
      <article className="flex gap-5 p-5">
        <ArticleImage
          src={article.coverImageUrl}
          alt={getDisplayValue(article.title)}
          className="h-28 w-28 shrink-0 rounded-md object-cover"
        />

        <div className="min-w-0 flex-1 py-1">
          <h2 className="text-base font-extrabold leading-snug text-slate-950 group-hover:text-[#136DEC]">
            {getDisplayValue(article.title)}
          </h2>
          <p className="mt-2 text-xs font-medium text-slate-600">
            {formatPublishedDate(article.publishedAt)}
          </p>
          <p className="mt-4 rounded-md bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-600">
            {getDisplayValue(article.summary)}
          </p>
        </div>
      </article>
    </Link>
  );
}

export default function ArtikelList() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadArticles = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getAllArtikel();
        if (isMounted) {
          setArticles(getResponseArray(response.data));
        }
      } catch (articleError) {
        if (isMounted) {
          setError(articleError);
          setArticles([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadArticles();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <main className="min-h-screen bg-[#f7f9fc] px-4 py-8 text-slate-950 sm:px-8">
        <div className="mx-auto max-w-[1100px]">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-3 rounded-full px-1 py-2 text-base font-bold text-slate-950 transition hover:text-[#136DEC]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-900 shadow-sm">
              <FiArrowLeft className="h-5 w-5" />
            </span>
            Kembali
          </button>

          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-950">
            Artikel Terkini
          </h1>

          <div className="mt-6 space-y-6">
            {loading ? (
              <div className="bg-white p-8 text-sm font-semibold text-slate-500 shadow-sm">
                Memuat artikel...
              </div>
            ) : null}

            {error ? (
              <div className="bg-red-50 p-8 text-sm font-semibold text-red-700 shadow-sm">
                Gagal memuat artikel. Silakan coba lagi nanti.
              </div>
            ) : null}

            {!loading && !error && articles.length === 0 ? (
              <div className="bg-white p-8 text-sm font-semibold text-slate-500 shadow-sm">
                Belum ada artikel yang tersedia.
              </div>
            ) : null}

            {!loading && !error
              ? articles.map((article) => (
                  <ArticleCard key={article?.id ?? article?._id ?? article?.title} article={article} />
                ))
              : null}
          </div>
        </div>
      </main>
    </>
  );
}
