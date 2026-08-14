import { Fragment, useEffect, useState } from "react";
import { FiArrowRight, FiCalendar, FiCheckCircle, FiUser } from "react-icons/fi";
import { Link, useParams } from "react-router-dom";
import { getAllArtikel, getArtikelById } from "../../services/artikelService";
import { getDisplayValue } from "../../utils/display";
import { resolveImageUrl } from "../../utils/imageUrl";

function getResponseArray(payload) {
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

function getResponseObject(payload) {
  if (payload?.data && payload?.data?.data && !Array.isArray(payload.data.data)) return payload.data.data;
  return payload?.data && !Array.isArray(payload.data) ? payload.data : payload;
}

function formatPublishedDate(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function ArticleImage({ src, alt, className }) {
  const imageUrl = resolveImageUrl(src);
  if (!imageUrl) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 text-sm font-bold text-slate-400 ${className}`}>
        SIGIZI
      </div>
    );
  }

  return <img src={imageUrl} alt={alt} className={className} loading="lazy" />;
}

function ArticleContent({ content }) {
  const normalizedContent = String(content ?? "").trim();

  if (!normalizedContent) {
    return (
      <p className="text-lg leading-8 text-slate-600">
        Konten artikel belum tersedia.
      </p>
    );
  }

  const blocks = normalizedContent.split(/\n{2,}/).filter(Boolean);

  return (
    <div className="space-y-8">
      {blocks.map((block, index) => {
        const trimmedBlock = block.trim();
        const heading = trimmedBlock.match(/^(#{1,3})\s+(.+)$/);

        if (heading) {
          return (
            <h2 key={index} className="text-2xl font-extrabold text-slate-950">
              {heading[2]}
            </h2>
          );
        }

        const lines = trimmedBlock.split("\n").map((line) => line.trim()).filter(Boolean);
        const isList = lines.length > 0 && lines.every((line) => line.startsWith("- "));

        if (isList) {
          return (
            <ul key={index} className="space-y-4">
              {lines.map((line) => (
                <li key={line} className="flex gap-3 text-lg leading-8 text-slate-600">
                  <FiCheckCircle className="mt-1.5 h-5 w-5 shrink-0 text-[#18743d]" />
                  <span>{line.replace(/^- /, "")}</span>
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={index} className="text-lg leading-8 text-slate-600">
            {lines.map((line, lineIndex) => (
              <Fragment key={`${line}-${lineIndex}`}>
                {lineIndex > 0 ? <br /> : null}
                {line}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function RelatedCard({ article }) {
  const articleId = article?.id ?? article?._id;
  if (!articleId) return null;

  return (
    <Link
      to={`/artikel/${articleId}`}
      className="group overflow-hidden rounded-xl bg-white shadow-[0_12px_30px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(15,23,42,0.13)]"
    >
      <ArticleImage
        src={article.coverImageUrl}
        alt={article.title}
        className="h-48 w-full object-cover"
      />
      <div className="p-6">
        <h3 className="line-clamp-2 text-xl font-extrabold leading-snug text-slate-950 group-hover:text-[#136DEC]">
          {getDisplayValue(article.title)}
        </h3>
        <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
          {getDisplayValue(article.summary)}
        </p>
        <span className="mt-6 inline-flex items-center gap-2 text-sm font-extrabold text-[#0058a8]">
          Baca Selengkapnya
          <FiArrowRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}

export default function ArtikelDetail() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadArticle = async () => {
      try {
        setLoading(true);
        setError(null);

        const [articleResponse, articlesResponse] = await Promise.all([
          getArtikelById(id),
          getAllArtikel(),
        ]);

        const currentArticle = getResponseObject(articleResponse.data);
        const articles = getResponseArray(articlesResponse.data);
        const currentId = currentArticle?.id ?? currentArticle?._id;

        if (isMounted) {
          setArticle(currentArticle);
          setRelatedArticles(
            articles.filter((item) => (item?.id ?? item?._id) !== currentId).slice(0, 3),
          );
        }
      } catch (articleError) {
        if (isMounted) {
          setError(articleError);
          setArticle(null);
          setRelatedArticles([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadArticle();
    window.scrollTo({ top: 0, behavior: "smooth" });

    return () => {
      isMounted = false;
    };
  }, [id]);

  return (
    <>
      <main className="min-h-screen bg-[#f8fafc] text-slate-950">
        <div className="mx-auto max-w-[1080px] px-5 py-12 sm:px-8 lg:py-16">
          {loading ? (
            <div className="rounded-xl bg-white p-8 text-sm font-semibold text-slate-500 shadow-sm">
              Memuat artikel...
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl bg-red-50 p-8 text-sm font-semibold text-red-700 shadow-sm">
              Gagal memuat detail artikel. Silakan coba lagi nanti.
            </div>
          ) : null}

          {!loading && !error && article ? (
            <>
              <header>
                <h1 className="max-w-[980px] text-4xl font-black leading-[1.05] tracking-tight text-slate-950 md:text-6xl">
                  {getDisplayValue(article.title)}
                </h1>

                <div className="mt-7 flex flex-wrap items-center gap-7 text-base font-medium text-slate-500">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-[#136DEC]">
                      <FiUser className="h-5 w-5" />
                    </span>
                    <span>{getDisplayValue(article.author || "Tim SIGIZI")}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <FiCalendar className="h-5 w-5 text-slate-500" />
                    <span>{formatPublishedDate(article.publishedAt)}</span>
                  </div>
                </div>
              </header>

              <ArticleImage
                src={article.coverImageUrl}
                alt={getDisplayValue(article.title)}
                className="mt-14 h-[320px] w-full rounded-lg object-cover shadow-[0_24px_60px_rgba(15,23,42,0.08)] md:h-[560px]"
              />

              <article className="mx-auto mt-14 max-w-[980px]">
                <ArticleContent content={article.content} />
              </article>

              <section className="mt-16 bg-[#f1f7fd] px-6 py-16 sm:px-8">
                <h2 className="text-3xl font-black text-slate-950">
                  Artikel Terkait
                </h2>

                {relatedArticles.length > 0 ? (
                  <div className="mt-10 grid gap-8 md:grid-cols-3">
                    {relatedArticles.map((relatedArticle) => (
                      <RelatedCard key={relatedArticle?.id ?? relatedArticle?._id ?? relatedArticle?.title} article={relatedArticle} />
                    ))}
                  </div>
                ) : (
                  <p className="mt-8 text-sm font-semibold text-slate-500">
                    Belum ada artikel terkait.
                  </p>
                )}
              </section>
            </>
          ) : null}
        </div>
      </main>
    </>
  );
}
