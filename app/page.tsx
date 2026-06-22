"use client";

import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/lib/i18n";

export default function HomePage() {
  const { t, setLanguage, language } = useLanguage();

  return (
    <main className="home-page">
      <div className="home-illustration">
        <div className="home-logos">
          <Image src="/images/logos/pucpr.png" alt="PUCPR" width={200} height={200} className="home-logo-pucpr" priority />
          <Image src="/images/logos/nmsu.png" alt="NMSU" width={200} height={200} className="home-logo-nmsu" />
          <Image src="/images/logos/ufba.png" alt="UFBA" width={200} height={200} className="home-logo-ufba" />
        </div>

        <div className="home-card">
          <Link href="/participant/start?mode=survey" className="home-primary-btn">
            <span>{t("home.enter")}</span>
          </Link>

          <div className="home-divider">
            <span>{t("home.isolated")}</span>
          </div>

          <div className="home-secondary-actions">
            <Link href="/participant/start?next=/session-1">{t("home.session1")}</Link>
            <Link href="/participant/start?next=/session-2/descriptions">{t("home.session2")}</Link>
            <Link href="/participant/start?next=/session-3">{t("home.session3")}</Link>
          </div>
        </div>

        <div className="home-flags">
          <button
            type="button"
            className={`home-flag-btn${language === "pt-BR" ? " home-flag-btn--active" : ""}`}
            onClick={() => setLanguage("pt-BR")}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://flagcdn.com/w80/br.png" alt="Brasil" className="home-flag-img" width={80} height={53} />
          </button>
          <button
            type="button"
            className={`home-flag-btn${language === "en" ? " home-flag-btn--active" : ""}`}
            onClick={() => setLanguage("en")}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://flagcdn.com/w80/us.png" alt="United States" className="home-flag-img" width={80} height={53} />
          </button>
        </div>
      </div>
    </main>
  );
}
