"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n";

const locations = ["PUCPR", "UFBA", "NMSU"];

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

function ParticipantStartContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLanguage();

  const mode = searchParams.get("mode");
  const nextPage = searchParams.get("next") || "/session-1";
  const isFullSurvey = mode === "survey";

  const [location, setLocation] = useState("PUCPR");
  const [participantId, setParticipantId] = useState("");
  const [existingParticipantId, setExistingParticipantId] = useState("");
  const [useExistingId, setUseExistingId] = useState(false);

  function getDestination() {
    return isFullSurvey ? "/session-1" : nextPage;
  }

  function saveParticipant(id: string) {
    localStorage.setItem("participantId", id);
    localStorage.setItem("participantLocation", location);
    localStorage.setItem("surveyMode", isFullSurvey ? "full" : "single");
    localStorage.setItem("surveyStartedAt", new Date().toISOString());
    localStorage.setItem("selectedSessionPath", getDestination());
  }

  function handleGenerateId() {
    clearPreviousParticipantData();

    const id = createParticipantId(location);

    setUseExistingId(false);
    setExistingParticipantId("");
    setParticipantId(id);

    saveParticipant(id);
  }

  function handleUseExistingId() {
    const cleanId = existingParticipantId.trim();

    if (!cleanId) {
      alert(t("start.alertNoId"));
      return;
    }

    clearPreviousParticipantData();

    setUseExistingId(true);
    setParticipantId(cleanId);
    saveParticipant(cleanId);
  }

  function handleContinue() {
    let id = participantId;

    if (useExistingId) {
      id = existingParticipantId.trim();

      if (!id) {
        alert(t("start.alertNoId"));
        return;
      }

      saveParticipant(id);
      router.push(getDestination());
      return;
    }

    if (!id) {
      clearPreviousParticipantData();

      id = createParticipantId(location);
      setParticipantId(id);
      saveParticipant(id);
    }

    router.push(getDestination());
  }

  return (
    <main className="start-page">
      <section className="start-card">
        <a href="/" className="back-link">
          {t("start.back")}
        </a>

        <label className="form-group">
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

        <div className="start-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={handleGenerateId}
          >
            {t("start.createId")}
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={handleContinue}
          >
            {t("start.continue")}
          </button>
        </div>

        {participantId && (
          <div className="participant-id-box">
            <span>{t("start.currentId")}</span>
            <strong>{participantId}</strong>
          </div>
        )}

        <div className="existing-id-box">
          <h2>{t("start.existingTitle")}</h2>
          <p>{t("start.existingDesc")}</p>

          <input
            type="text"
            value={existingParticipantId}
            onChange={(event) => setExistingParticipantId(event.target.value)}
            placeholder={t("start.idPlaceholder")}
          />

          <button
            type="button"
            className="secondary-button"
            onClick={handleUseExistingId}
          >
            {t("start.useId")}
          </button>
        </div>
      </section>
    </main>
  );
}

export default function ParticipantStartPage() {
  return (
    <Suspense
      fallback={
        <main className="start-page">
          <section className="start-card">
            <p>Loading...</p>
          </section>
        </main>
      }
    >
      <ParticipantStartContent />
    </Suspense>
  );
}
