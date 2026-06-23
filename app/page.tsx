"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n";
import { getLocationConfig } from "@/lib/locations";

const locations = ["PUCPR", "UFBA", "NMSU"];

const locationColors: Record<string, string> = {
  PUCPR: "#bb0b0b",
  UFBA: "#1a7a3a",
  NMSU: "#bb0b0b",
};

function createParticipantId(location: string) {
  const prefix = location.replace(/\s+/g, "").toUpperCase();
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();

  return `${prefix}-${Date.now()}-${random}`;
}

function clearPreviousParticipantData() {
  localStorage.removeItem("participantId");
  localStorage.removeItem("participantLocation");
  localStorage.removeItem("surveyMode");
  localStorage.removeItem("surveyStartedAt");
  localStorage.removeItem("selectedSessionPath");

  localStorage.removeItem("session-1-ranking");
  localStorage.removeItem("session-1-demographics");

  localStorage.removeItem("session-2-ranking");
  localStorage.removeItem("session-2-demographics");
  localStorage.removeItem("session-2-seal-readings");

  localStorage.removeItem("session-3-ranking");
  localStorage.removeItem("session-3-demographics");
}

export default function HomePage() {
  const router = useRouter();
  const { t, setLanguage } = useLanguage();
  const [location, setLocation] = useState("PUCPR");
  const [participantId, setParticipantId] = useState("");

  useEffect(() => {
    setLanguage(getLocationConfig(location).language);
  }, [location]);

  function saveParticipant(id: string) {
    localStorage.setItem("participantId", id);
    localStorage.setItem("participantLocation", location);
    localStorage.setItem("surveyMode", "full");
    localStorage.setItem("surveyStartedAt", new Date().toISOString());
    localStorage.setItem("selectedSessionPath", "/session-1");
  }

  function handleCreateUser() {
    clearPreviousParticipantData();

    const id = createParticipantId(location);
    setParticipantId(id);
    saveParticipant(id);
  }

  function handleEnter() {
    let id = participantId;

    if (!id) {
      clearPreviousParticipantData();
      id = createParticipantId(location);
      setParticipantId(id);
      saveParticipant(id);
    }

    router.push("/session-1");
  }

  const actionColor = locationColors[location] ?? "#bb0b0b";

  return (
    <main className="home-page">
      <div className="home-illustration">
        <div className="home-logos">
          <Image src="/images/logos/pucpr.png" alt="PUCPR" width={200} height={200} className="home-logo-pucpr" priority />
          <Image src="/images/logos/nmsu.png" alt="NMSU" width={200} height={200} className="home-logo-nmsu" />
          <Image src="/images/logos/ufba.png" alt="UFBA" width={200} height={200} className="home-logo-ufba" />
        </div>

        <div className="home-card">
          <h1>{t("home.welcome")}</h1>

          <label className="home-location-field">
            <span>{t("start.location")}</span>

            <select
              value={location}
              onChange={(event) => setLocation(event.target.value)}
            >
              {locations.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="home-secondary-btn"
            onClick={handleCreateUser}
          >
            {t("home.createUser")}
          </button>

          {participantId && (
            <div className="participant-id-box">
              <span>{t("start.currentId")}</span>
              <strong>{participantId}</strong>
            </div>
          )}

          <button
            type="button"
            className="home-primary-btn"
            style={{ background: actionColor }}
            onClick={handleEnter}
          >
            <span>{t("home.enter")}</span>
          </button>
        </div>
      </div>
    </main>
  );
}
