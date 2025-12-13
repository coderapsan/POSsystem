import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";

const FALLBACK_HIGHLIGHTS = [
  {
    name: "Chicken Steamed Momos",
    category: "Signature Momos",
    priceLabel: "£8.95",
    description: "Juicy chicken dumplings served with roasted tomato sesame chutney.",
    image: "/assets/images/usedImages/f1.png",
  },
  {
    name: "Buff Chilli Fry",
    category: "Chef Specials",
    priceLabel: "£10.95",
    description: "Stir-fried Nepalese water buffalo with peppers, onion, and chilli glaze.",
    image: "/assets/images/usedImages/f2.png",
  },
  {
    name: "Tingmo Bao",
    category: "Street Snacks",
    priceLabel: "£6.50",
    description: "Soft steamed bread served with spiced sesame dip for sharing.",
    image: "/assets/images/usedImages/f3.png",
  },
  {
    name: "Garlic Chilli Noodles",
    category: "Noodles",
    priceLabel: "£9.45",
    description: "Wok-tossed noodles with garlic butter, chilli crunch, and garden greens.",
    image: "/assets/images/usedImages/f4.png",
  },
  {
    name: "Veggie Pan-Fried Momos",
    category: "Plant Favourites",
    priceLabel: "£8.50",
    description: "Crisp-edged momos stuffed with seasonal vegetables and soy chilli dip.",
    image: "/assets/images/usedImages/f5.png",
  },
  {
    name: "Masala Chai Cheesecake",
    category: "Desserts",
    priceLabel: "£5.25",
    description: "Creamy chai-spiced cheesecake topped with toasted coconut crumb.",
    image: "/assets/images/usedImages/f6.png",
  },
];

const FALLBACK_CATEGORIES = [
  {
    id: "signature-momos",
    label: "Signature Momos",
    description: "Steamed, pan-fried, and crispy dumplings folded by hand and served with house chutneys.",
    image: "/assets/images/usedImages/1.png",
    count: 8,
  },
  {
    id: "street-snacks",
    label: "Street Snacks",
    description: "Nepalese street bites, bao, and quick-fire treats ideal for sharing.",
    image: "/assets/images/usedImages/2.png",
    count: 6,
  },
  {
    id: "noodles-rice",
    label: "Noodles & Rice",
    description: "Wok-tossed noodles, fried rice, and homestyle thali sides.",
    image: "/assets/images/usedImages/33.png",
    count: 7,
  },
  {
    id: "sips-sweets",
    label: "Sips & Sweets",
    description: "Bubble teas, Himalayan coolers, and desserts to finish on a high.",
    image: "/assets/images/usedImages/4.png",
    count: 5,
  },
];

const ORDER_STEPS = [
  {
    title: "Pick your favourites",
    detail: "Browse dumplings, noodles, curries, and desserts in the online menu.",
  },
  {
    title: "Send your order",
    detail: "Tap “Order food online”, add dishes to the cart, and confirm your delivery or collection details.",
  },
  {
    title: "Card payments",
    detail: "If you choose card at checkout, we will call you back to securely collect payment over the phone.",
  },
  {
    title: "We cook to order",
    detail: "Your dishes go straight to the wok or steamer so everything arrives piping hot.",
  },
];

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const getItemImage = (item) => {
  const candidate = item?.image || item?.imageUrl || item?.photo || "";
  if (!candidate) return "";
  if (candidate.startsWith("http") || candidate.startsWith("data:")) return candidate;
  return candidate.startsWith("/") ? candidate : `/assets/images/usedImages/${candidate}`;
};

const formatPriceLabel = (item) => {
  const entries = Object.entries(item?.price || {})
    .map(([portion, value]) => ({ portion, value: Number(value) }))
    .filter((entry) => Number.isFinite(entry.value) && entry.value > 0);
  if (entries.length === 0) return "Price on request";
  const prices = entries.map((entry) => entry.value);
  const minPrice = Math.min(...prices);
  if (prices.length > 1) return `From £${minPrice.toFixed(2)}`;
  return `£${minPrice.toFixed(2)}`;
};

const getFallbackImage = (index) => FALLBACK_HIGHLIGHTS[index % FALLBACK_HIGHLIGHTS.length].image;

const buildMenuSections = (menu) => {
  const sections = [];
  Object.entries(menu || {}).forEach(([parent, value]) => {
    if (Array.isArray(value)) {
      sections.push({ label: parent, items: value });
      return;
    }
    if (value && typeof value === "object") {
      Object.entries(value).forEach(([child, items]) => {
        sections.push({ label: `${parent} • ${child}`, items: Array.isArray(items) ? items : [] });
      });
    }
  });

  return sections
    .map((section, index) => {
      const availableItems = (section.items || []).filter((item) => item?.isAvailable !== false);
      if (availableItems.length === 0) return null;
      const image = availableItems.map((item) => getItemImage(item)).find(Boolean) || "";
      return {
        id: `${slugify(section.label)}-${index}`,
        label: section.label,
        count: availableItems.length,
        image,
        items: availableItems,
      };
    })
    .filter(Boolean);
};

const deriveHighlights = (sections) => {
  const pool = [];
  sections.forEach((section) => {
    section.items.forEach((item) => {
      pool.push({
        name: item.name,
        category: section.label,
        priceLabel: formatPriceLabel(item),
        description: item.description?.trim() || "",
        image: getItemImage(item),
      });
    });
  });

  const seen = new Set();
  const unique = [];
  pool.forEach((entry) => {
    if (!entry.name || seen.has(entry.name)) return;
    seen.add(entry.name);
    unique.push({
      ...entry,
      image: entry.image || getFallbackImage(unique.length),
      description: entry.description || "Ask our team for today's chef notes.",
    });
  });

  return unique.slice(0, 6);
};

export default function Home() {
  const [menuSections, setMenuSections] = useState([]);
  const [highlights, setHighlights] = useState(FALLBACK_HIGHLIGHTS);
  const [menuLoading, setMenuLoading] = useState(false);
  const [menuError, setMenuError] = useState("");

  useEffect(() => {
    const fetchMenu = async () => {
      setMenuLoading(true);
      setMenuError("");
      try {
        const response = await fetch("/api/menu");
        const data = await response.json();
        if (!data.success) throw new Error(data.error || "Unable to load menu");
        const sections = buildMenuSections(data.menu || {});
        if (sections.length > 0) {
          setMenuSections(sections);
          const derived = deriveHighlights(sections);
          if (derived.length > 0) {
            setHighlights(derived);
          }
        }
      } catch (error) {
        setMenuError(error.message);
      } finally {
        setMenuLoading(false);
      }
    };

    fetchMenu();
  }, []);

  const categoryTiles = menuSections.length > 0
    ? menuSections.map((section, index) => ({
        id: section.id,
        label: section.label,
        description: `${section.count} dishes ready to order.`,
        image: section.image || FALLBACK_CATEGORIES[index % FALLBACK_CATEGORIES.length].image,
        count: section.count,
      }))
    : FALLBACK_CATEGORIES;

  return (
    <>
      <Head>
        <title>The MoMos • Order Online</title>
        <meta
          name="description"
          content="Order Nepali-inspired momos, noodles, and street food from The MoMos. Freshly prepared for delivery or collection."
        />
      </Head>
      <div className="min-h-screen bg-[#050b18] text-slate-100">
        <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <img
              src="/assets/images/the-momos-mark.png"
              alt="The MoMos"
              className="h-12 w-auto drop-shadow-lg"
            />
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-[#f26b30]">Nepalese Kitchen</p>
              <h1 className="text-2xl font-semibold text-white sm:text-3xl">The MoMos</h1>
            </div>
          </div>
          <Link
            href="/customerOrder"
            className="hidden rounded-full border border-[#f26b30]/60 px-5 py-2 text-sm font-medium text-[#f26b30] transition hover:border-[#f26b30] hover:bg-[#f26b30]/10 sm:inline-flex"
          >
            Order online
          </Link>
        </header>

        <main className="mx-auto flex max-w-6xl flex-col gap-12 px-4 pb-16 sm:px-6 lg:px-8">
          <section className="relative overflow-hidden rounded-[32px] sm:rounded-[48px] border border-white/10 bg-gradient-to-br from-[#131f37] via-[#0b162a] to-[#050b18] px-6 py-12 sm:px-12 sm:py-20 text-center shadow-2xl shadow-black/60">
            <div className="pointer-events-none absolute inset-0 -z-10 opacity-70">
              <div className="absolute -left-20 top-[-40%] h-[120%] w-[60%] rounded-full bg-[#f26b30]/30 blur-3xl" />
              <div className="absolute -right-32 bottom-[-30%] h-[100%] w-[65%] rounded-full bg-cyan-500/15 blur-3xl" />
              <div className="absolute inset-0 bg-gradient-to-br from-[#050b18]/70 via-[#050b18]/60 to-[#050b18]/90" />
            </div>
            <p className="text-xs sm:text-sm uppercase tracking-[0.45em] text-[#f26b30] font-semibold">Authentic Himalayan Street Food</p>
            <h2 className="mt-4 sm:mt-6 text-3xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Craving MoMos?<br className="hidden sm:inline" /> <span className="text-[#f26b30]">Order Fresh</span>, Fast &amp; Online.
            </h2>
            <p className="mx-auto mt-4 sm:mt-6 max-w-2xl text-sm sm:text-base lg:text-lg text-slate-200 leading-relaxed">
              Explore our hand-folded momos, aromatic noodles, and wok-tossed specials. Place your order in a few taps and we'll start cooking straight away.
            </p>
            <div className="mt-8 sm:mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Link
                href="/customerOrder"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-[#f26b30] px-8 sm:px-10 py-3 sm:py-4 text-sm sm:text-base font-bold text-white shadow-xl shadow-[#f26b30]/40 transition hover:bg-[#ff7a3e] hover:scale-105 hover:shadow-2xl hover:shadow-[#f26b30]/50"
              >
                🍜 Order Food Online
              </Link>
              <span className="inline-flex items-center rounded-full border border-white/20 bg-white/5 backdrop-blur px-4 sm:px-5 py-2 sm:py-3 text-xs sm:text-sm font-medium uppercase tracking-[0.25em] text-slate-200">
                🚚 Delivery · 🥡 Collection
              </span>
            </div>
            <p className="mt-4 sm:mt-6 text-xs sm:text-sm text-[#f6ceb5] bg-black/20 backdrop-blur rounded-full inline-block px-4 py-2">
              💳 Card payment? We'll call to process securely
            </p>
          </section>

          <section className="space-y-4 sm:space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs sm:text-sm uppercase tracking-[0.35em] text-[#f26b30] font-semibold">Menu Highlights</p>
                <h3 className="text-2xl sm:text-3xl font-bold text-white">Fresh from the steamer &amp; wok</h3>
              </div>
              <Link
                href="/customerOrder"
                className="self-start rounded-full border border-white/10 px-4 sm:px-5 py-2 sm:py-2.5 text-xs font-semibold uppercase tracking-[0.3em] text-slate-200 transition hover:border-[#f26b30] hover:text-white hover:bg-[#f26b30]/10"
              >
                Browse full menu →
              </Link>
            </div>
            {menuLoading ? (
              <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, index) => (
                  <div
                    key={`skeleton-${index}`}
                    className="animate-pulse rounded-3xl border border-white/10 bg-[#0f1628] p-5"
                  >
                    <div className="h-36 sm:h-40 rounded-2xl bg-white/5" />
                    <div className="mt-4 h-4 rounded bg-white/10" />
                    <div className="mt-2 h-3 rounded bg-white/5" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {highlights.map((item, index) => (
                  <article
                    key={`${item.name}-${index}`}
                    className="group flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0f1628] shadow-lg shadow-black/40 transition-all hover:border-[#f26b30]/50 hover:shadow-2xl hover:shadow-[#f26b30]/20 hover:-translate-y-1"
                  >
                    <div className="relative h-48 sm:h-52 w-full overflow-hidden">
                      <img 
                        src={item.image} 
                        alt={item.name} 
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
                        loading="lazy" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="absolute left-3 top-3 rounded-full bg-black/70 backdrop-blur-sm px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white border border-white/20">
                        {item.category}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col gap-3 px-5 py-5">
                      <h4 className="text-lg sm:text-xl font-bold text-white group-hover:text-[#f26b30] transition-colors">{item.name}</h4>
                      <p className="flex-1 text-sm leading-relaxed text-slate-300">{item.description}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-bold text-[#f26b30] text-base sm:text-lg">{item.priceLabel}</span>
                        <span className="rounded-full bg-[#f26b30]/15 px-3 py-1.5 text-xs font-semibold text-[#f26b30] border border-[#f26b30]/30">★ House favourite</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
            {menuError && (
              <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                Live menu data is currently unavailable. Showing our signature favourites instead.
              </p>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-[#f26b30]">Browse by craving</p>
                <h3 className="text-2xl font-semibold text-white">Your menu, organised for easy browsing</h3>
              </div>
            </div>
            <div className="overflow-x-auto pb-2">
              <div className="flex min-w-full gap-3">
                {categoryTiles.map((category, index) => (
                  <div
                    key={category.id || index}
                    className="flex w-full max-w-[280px] flex-col gap-3 rounded-3xl border border-white/10 bg-[#0f1628] p-4 shadow-lg shadow-black/30"
                  >
                    <div className="relative h-32 w-full overflow-hidden rounded-2xl">
                      <img
                        src={category.image}
                        alt={category.label}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                      <span className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
                        {category.count} dishes
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{category.label}</p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-400">{category.description}</p>
                    </div>
                    <Link
                      href="/customerOrder"
                      className="mt-auto inline-flex items-center justify-center rounded-full border border-white/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-200 transition hover:border-[#f26b30] hover:text-white"
                    >
                      View dishes
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#0f1628] p-6 shadow-lg shadow-black/40">
            <p className="text-xs uppercase tracking-[0.35em] text-[#f26b30]">How ordering works</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">From our kitchen to you in four easy steps</h3>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {ORDER_STEPS.map((step, index) => (
                <div key={step.title} className="rounded-2xl border border-white/10 bg-[#101d33] px-5 py-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[#f26b30]">Step {index + 1}</span>
                  <p className="mt-2 text-lg font-semibold text-white">{step.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">{step.detail}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl border border-[#f26b30]/40 bg-[#f26b30]/10 px-4 py-3 text-sm text-[#f6ceb5]">
              If you pick card as your payment method, our team will give you a quick call to take payment securely. Card details are handled offline and never stored in the system.
            </div>
          </section>

          <section className="rounded-[32px] border border-white/10 bg-gradient-to-r from-[#f26b30]/15 via-[#2a3550] to-[#050b18] px-6 py-10 text-center shadow-xl shadow-black/40">
            <h3 className="text-2xl font-semibold text-white">Ready when you are</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm text-slate-200">
              Hit the button below to jump into the live ordering menu. Add dishes, leave notes for the kitchen, and we will confirm payment if you choose the card option.
            </p>
            <Link
              href="/customerOrder"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-[#f26b30] px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-[#f26b30]/30 transition hover:bg-[#ff7a3e]"
            >
              Explore the menu
            </Link>
          </section>
        </main>

        <footer className="mt-12 border-t border-white/5 bg-[#050b18]/80 py-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} The MoMos. Crafted in Wimbledon &amp; delivered with a smile.
        </footer>
      </div>
    </>
  );
}
