"use client";

import { useEffect, useState } from "react";
import DemographicsForm, { DemographicsData } from "@/components/DemographicsForm";
import { saveWithRetry } from "@/lib/saveWithRetry";
import { useLanguage } from "@/lib/i18n";
import { getLocationConfig } from "@/lib/locations";

const locationColors: Record<string, string> = {
  PUCPR: "#bb0b0b",
  UFBA: "#1a7a3a",
  NMSU: "#bb0b0b",
};

export default function DemographicsPage() {
  const { t, setLanguage } = useLanguage();
  const [participantId, setParticipantId] = useState("");
  const [participantLocation, setParticipantLocation] = useState("");
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem("participantId") || "DEMO-PARTICIPANT";
    const location = localStorage.getItem("participantLocation") || "UNKNOWN";

    setParticipantId(id);
    setParticipantLocation(location);
    setLanguage(getLocationConfig(location).language);
  }, []);

  async function saveDemographics(demographics: DemographicsData) {
    const id = participantId || localStorage.getItem("participantId") || "DEMO-PARTICIPANT";
    const location =
      participantLocation || localStorage.getItem("participantLocation") || "UNKNOWN";

    const fullSurveyResult = await saveWithRetry("/api/full-survey/save", {
      participantId: id,
      location,
      demographics,
    });

    localStorage.setItem("session-3-demographics", JSON.stringify(demographics));

    if (fullSurveyResult.queued) {
      alert(t("common.saveAlert"));
    }

    setCompleted(true);
  }

  return (
    <main className={`study-page location-${participantLocation.toLowerCase()}`}>
      <section className="study-shell">
        {!completed ? (
          <section className="complete-card">
            <DemographicsForm
              onSubmit={saveDemographics}
              locationColor={locationColors[participantLocation] ?? "#bb0b0b"}
            />
          </section>
        ) : (
          <section className="complete-card">
            <div
              className="badge"
              style={{ background: locationColors[participantLocation] ?? "#bb0b0b" }}
            >
              {t("common.completed")}
            </div>
            <h2 style={{ marginTop: "16px" }}>{t("s3.completedTitle")}</h2>
            <p>{t("s3.completedDesc")}</p>

            <div style={{ marginTop: "24px" }}>
              <a
                href="/"
                className="primary-link-button"
                style={{ background: locationColors[participantLocation] ?? "#bb0b0b" }}
              >
                {t("s3.finish")}
              </a>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
