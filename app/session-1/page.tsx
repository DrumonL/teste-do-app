"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import RankingScreen, { ClickLogRow, RankingOption } from "@/components/RankingScreen";
import StepTransition from "@/components/StepTransition";
import DemographicsForm, { DemographicsData } from "@/components/DemographicsForm";
import { seededShuffle } from "@/lib/randomization";
import { getSession1Options } from "@/lib/locations";
import { saveWithRetry } from "@/lib/saveWithRetry";
import { useLanguage, TranslationKey } from "@/lib/i18n";
type Step = "ranking" | "final-confirmation" | "demographics" | "completed";

const locationColors: Record<string, string> = {
  PUCPR: "#bb0b0b",
  UFBA: "#1a7a3a",
  NMSU: "#bb0b0b",
};

function getSealNameKey(
  location: string,
  sealId?: string
): TranslationKey {
  if (sealId === "red-1") {
    return "seal.angus.short";
  }

  if (sealId === "red-2") {
    return "seal.welfare.short";
  }

  if (sealId === "green-1") {
    return "seal.traditional.short";
  }

  if (sealId === "green-2") {
    return "seal.cultivated.short";
  }

  if (sealId === "green-3") {
    return "seal.organic.short";
  }

  return "seal.traditional.short";
}


function addRankingTimingFields(
  participantRow: Record<string, string | number>,
  ranking: RankingOption[]
) {
  ranking.forEach((option, index) => {
    const prefix = `rank_${index + 1}`;

    participantRow[`${prefix}_screen_started_at`] =
      option.screenStartedAt ?? "";
    participantRow[`${prefix}_option_selected_at`] =
      option.optionSelectedAt ?? "";
    participantRow[`${prefix}_purchase_confirmed_at`] =
      option.purchaseConfirmedAt ?? "";
    participantRow[`${prefix}_time_spent_before_choice_ms`] =
      option.timeSpentBeforeChoiceMs ?? "";
    participantRow[`${prefix}_time_spent_before_choice_seconds`] =
      option.timeSpentBeforeChoiceSeconds ?? "";
    participantRow[`${prefix}_time_taken_to_confirm_ms`] =
      option.timeTakenToConfirmMs ?? "";
    participantRow[`${prefix}_time_taken_to_confirm_seconds`] =
      option.timeTakenToConfirmSeconds ?? "";
    participantRow[`${prefix}_changed_preference_before_confirming`] =
      option.changedPreferenceBeforeConfirming ?? "";
    participantRow[`${prefix}_initial_selected_option_id`] =
      option.initialSelectedOptionId ?? "";
    participantRow[`${prefix}_final_confirmed_option_id`] =
      option.finalConfirmedOptionId ?? "";
  });
}

export default function SessionOnePage() {
  const { t, language } = useLanguage();
  const [participantId, setParticipantId] = useState("");
  const [participantLocation, setParticipantLocation] = useState("");
  const [completedRanking, setCompletedRanking] = useState<RankingOption[]>([]);
  const [rankingClickLogs, setRankingClickLogs] = useState<ClickLogRow[]>([]);
  const [step, setStep] = useState<Step>("ranking");
  const [isSavingFinal, setIsSavingFinal] = useState(false);
  const [zoomedSealId, setZoomedSealId] = useState<string | null>(null);
  const savingFinalRef = useRef(false);

  useEffect(() => {
    setParticipantId(localStorage.getItem("participantId") || "DEMO-PARTICIPANT");
    setParticipantLocation(localStorage.getItem("participantLocation") || "UNKNOWN");
  }, []);

  useEffect(() => {
    if (!zoomedSealId) return;

    function handlePointerDown(event: PointerEvent) {
      if ((event.target as HTMLElement).closest(".final-seal-zoom-btn")) {
        return;
      }

      setZoomedSealId(null);
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [zoomedSealId]);

  const randomizationSeed = useMemo(() => {
    return participantId ? `${participantId}-session-1` : "demo-session-1";
  }, [participantId]);

  const randomizedOptions = useMemo(() => {
    const baseOptions = getSession1Options(participantLocation);
    return seededShuffle(baseOptions, randomizationSeed);
  }, [randomizationSeed, participantLocation]);


  const translatedOptions = useMemo(() => {
    const translatedCutTitle =
      participantLocation === "NMSU"
        ? t("s3.cutTitleNmsu")
        : t("s3.cutTitle");

    return randomizedOptions.map((option) => ({
      ...option,
      title: translatedCutTitle,
      subtitle: t(
        getSealNameKey(participantLocation, option.sealId)
      ),
    }));
  }, [
    randomizedOptions,
    participantLocation,
    language,
    t,
  ]);

  

  function handleRankingComplete(
    ranking: RankingOption[],
    clickLogs: ClickLogRow[] = []
  ) {
    setCompletedRanking(ranking);
    setRankingClickLogs(clickLogs);
    setStep("final-confirmation");
  }

  async function handleFinalConfirmationYes() {
    if (savingFinalRef.current) return;

    const surveyMode = localStorage.getItem("surveyMode");

    if (surveyMode === "full") {
      savingFinalRef.current = true;
      setIsSavingFinal(true);

      try {
        await saveSessionOneWithoutQuestionnaire();
      } finally {
        savingFinalRef.current = false;
        setIsSavingFinal(false);
      }
      return;
    }

    setStep("demographics");
  }

  function handleFinalConfirmationNo() {
    setStep("ranking");
  }

  async function saveSessionOneWithoutQuestionnaire() {
    const timestamp = new Date().toISOString();

    const longRows = completedRanking.map((option, index) => ({
      participant_id: participantId,
      location: participantLocation,
      session_number: 1,
      method: "Choice experiment / Best-Worst Scaling ranking",
      randomization_seed: randomizationSeed,
      selected_rank: index + 1,
      option_id: option.id,
      cut_id: option.cutId || "",
      seal_id: option.sealId || "",
      title: option.title,
      subtitle: option.subtitle || "",
      cut_image_url: option.cutImageUrl || "",
      seal_image_url: option.sealImageUrl || "",
      seal_color: option.sealColor || "",
      screen_started_at: option.screenStartedAt ?? "",
      option_selected_at: option.optionSelectedAt ?? "",
      purchase_confirmed_at: option.purchaseConfirmedAt ?? "",
      time_spent_before_choice_ms: option.timeSpentBeforeChoiceMs ?? "",
      time_spent_before_choice_seconds:
        option.timeSpentBeforeChoiceSeconds ?? "",
      time_taken_to_confirm_ms: option.timeTakenToConfirmMs ?? "",
      time_taken_to_confirm_seconds:
        option.timeTakenToConfirmSeconds ?? "",
      changed_preference_before_confirming:
        option.changedPreferenceBeforeConfirming ?? "",
      initial_selected_option_id: option.initialSelectedOptionId ?? "",
      final_confirmed_option_id: option.finalConfirmedOptionId ?? "",
      gender: "Collected in Session 3",
      age_group: "Collected in Session 3",
      education_level: "Collected in Session 3",
      income_group: "Collected in Session 3",
      timestamp,
    }));

    const participantRow: Record<string, string | number> = {
      participant_id: participantId,
      location: participantLocation,
      session_number: 1,
      method: "Choice experiment / Best-Worst Scaling ranking",
      randomization_seed: randomizationSeed,

      gender: "Collected in Session 3",
      age_group: "Collected in Session 3",
      education_level: "Collected in Session 3",
      income_group: "Collected in Session 3",

      rank_1_option_id: completedRanking[0]?.id || "",
      rank_1_cut_id: completedRanking[0]?.cutId || "",
      rank_1_seal_id: completedRanking[0]?.sealId || "",
      rank_1_title: completedRanking[0]?.title || "",

      rank_2_option_id: completedRanking[1]?.id || "",
      rank_2_cut_id: completedRanking[1]?.cutId || "",
      rank_2_seal_id: completedRanking[1]?.sealId || "",
      rank_2_title: completedRanking[1]?.title || "",

      rank_3_option_id: completedRanking[2]?.id || "",
      rank_3_cut_id: completedRanking[2]?.cutId || "",
      rank_3_seal_id: completedRanking[2]?.sealId || "",
      rank_3_title: completedRanking[2]?.title || "",

      rank_4_option_id: completedRanking[3]?.id || "",
      rank_4_cut_id: completedRanking[3]?.cutId || "",
      rank_4_seal_id: completedRanking[3]?.sealId || "",
      rank_4_title: completedRanking[3]?.title || "",

      rank_5_option_id: completedRanking[4]?.id || "",
      rank_5_cut_id: completedRanking[4]?.cutId || "",
      rank_5_seal_id: completedRanking[4]?.sealId || "",
      rank_5_title: completedRanking[4]?.title || "",

      timestamp,
    };

    addRankingTimingFields(participantRow, completedRanking);

  const clickRows = rankingClickLogs.map((row) => ({
      ...row,
      participant_id: participantId,
      location: participantLocation,
      session_number: 1,
      timestamp,
    }));

    const result = await saveWithRetry("/api/session-1/save", {
      participantRow,
      longRows,
    });

    if (clickRows.length > 0) {
      await saveWithRetry("/api/click-logs/save", {
        clickRows,
      });
    }

    localStorage.setItem("session-1-ranking", JSON.stringify(longRows));

    if (result.queued) {
      alert(t("common.saveAlert"));
    }

    setStep("completed");
  }

  async function exportExcel(demographics: DemographicsData) {
  const timestamp = new Date().toISOString();

  const longRows = completedRanking.map((option, index) => ({
    participant_id: participantId,
    location: participantLocation,
    session_number: 1,
    method: "Choice experiment / Best-Worst Scaling ranking",
    randomization_seed: randomizationSeed,
    selected_rank: index + 1,
    option_id: option.id,
    cut_id: option.cutId || "",
    seal_id: option.sealId || "",
    title: option.title,
    subtitle: option.subtitle || "",
    cut_image_url: option.cutImageUrl || "",
    seal_image_url: option.sealImageUrl || "",
    seal_color: option.sealColor || "",
    gender: demographics.gender,
    age_group: demographics.ageGroup,
    education_level: demographics.educationLevel,
    income_group: demographics.incomeGroup,
    timestamp,
  }));

  const participantRow: Record<string, string | number> = {
    participant_id: participantId,
    location: participantLocation,
    session_number: 1,
    method: "Choice experiment / Best-Worst Scaling ranking",
    randomization_seed: randomizationSeed,

    gender: demographics.gender,
    age_group: demographics.ageGroup,
    education_level: demographics.educationLevel,
    income_group: demographics.incomeGroup,

    rank_1_option_id: completedRanking[0]?.id || "",
    rank_1_cut_id: completedRanking[0]?.cutId || "",
    rank_1_seal_id: completedRanking[0]?.sealId || "",
    rank_1_title: completedRanking[0]?.title || "",

    rank_2_option_id: completedRanking[1]?.id || "",
    rank_2_cut_id: completedRanking[1]?.cutId || "",
    rank_2_seal_id: completedRanking[1]?.sealId || "",
    rank_2_title: completedRanking[1]?.title || "",

    rank_3_option_id: completedRanking[2]?.id || "",
    rank_3_cut_id: completedRanking[2]?.cutId || "",
    rank_3_seal_id: completedRanking[2]?.sealId || "",
    rank_3_title: completedRanking[2]?.title || "",

    rank_4_option_id: completedRanking[3]?.id || "",
    rank_4_cut_id: completedRanking[3]?.cutId || "",
    rank_4_seal_id: completedRanking[3]?.sealId || "",
    rank_4_title: completedRanking[3]?.title || "",

    rank_5_option_id: completedRanking[4]?.id || "",
    rank_5_cut_id: completedRanking[4]?.cutId || "",
    rank_5_seal_id: completedRanking[4]?.sealId || "",
    rank_5_title: completedRanking[4]?.title || "",

    timestamp,
  };

  addRankingTimingFields(participantRow, completedRanking);

  const clickRows = rankingClickLogs.map((row) => ({
    ...row,
    participant_id: participantId,
    location: participantLocation,
    session_number: 1,
    timestamp,
  }));

  const result = await saveWithRetry("/api/session-1/save", {
    participantRow,
    longRows,
  });

  if (clickRows.length > 0) {
    await saveWithRetry("/api/click-logs/save", {
      clickRows,
    });
  }

  localStorage.setItem("session-1-ranking", JSON.stringify(longRows));
  localStorage.setItem("session-1-demographics", JSON.stringify(demographics));

  if (result.queued) {
    alert(t("common.saveAlert"));
  }

  setStep("completed");
}

  return (
    <main className={`study-page location-${participantLocation.toLowerCase()}`}>


      <section className="study-shell">
        <StepTransition stepKey={step}>

        {step === "ranking" && (
          <RankingScreen
            key={`${participantLocation}-${randomizationSeed}`}
            options={translatedOptions}
            sessionNumber={1}
            title={t("s1.rankingTitle")}
            description={t("s1.rankingDesc")}
            location={participantLocation}
            participantId={participantId}
            sealZoom={true}
            initialRanking={completedRanking}
            initialClickLogs={rankingClickLogs}
            onRankingComplete={handleRankingComplete}
          />
        )}

        {step === "final-confirmation" && (
          <section className="complete-card final-confirmation-card">
            <div className="badge" style={{ background: locationColors[participantLocation] ?? "#bb0b0b" }}>{t("s1.badge")}</div>
            <h2>{t("s1.confirmTitle")}</h2>
            <p>
              {t("s1.confirmDesc")}
            </p>

            <ol className="final-ranking-list">
              {completedRanking.map((option, index) => (
                <li key={option.id}>
                  <strong style={{ background: locationColors[participantLocation] ?? "#bb0b0b" }}>#{index + 1}</strong>
                  <div className="final-ranking-images">
                    {option.cutImageUrl && (
                      <img src={option.cutImageUrl} alt={option.title} className="final-cut-img" />
                    )}
                    {option.sealImageUrl && (
                      <button
                        type="button"
                        className="final-seal-zoom-btn"
                        onClick={() => setZoomedSealId(zoomedSealId === option.id ? null : option.id)}
                      >
                        <img
                          src={option.sealImageUrl}
                          alt=""
                          className={zoomedSealId === option.id ? "final-seal-img final-seal-zoomed" : "final-seal-img"}
                        />
                      </button>
                    )}
                  </div>
                  <div className="final-ranking-text">
                    <span>{option.title}</span>
                    <small>{option.subtitle}</small>
                  </div>
                </li>
              ))}
            </ol>

            <div className="final-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={handleFinalConfirmationNo}
              >
                {t("s1.no")}
              </button>

              <button
                type="button"
                className="primary-button"
                style={{ background: locationColors[participantLocation] ?? "#bb0b0b" }}
                onClick={handleFinalConfirmationYes}
                disabled={isSavingFinal}
              >
                {isSavingFinal ? t("s1.saving") : t("s1.yes")}
              </button>
            </div>
          </section>
        )}

        {step === "demographics" && (
          <section className="complete-card demographics-card">
            <DemographicsForm onSubmit={exportExcel} locationColor={locationColors[participantLocation] ?? "#bb0b0b"} />
          </section>
        )}

        {step === "completed" && (
          <section className="complete-card completed-step-card">
            <div className="badge" style={{ background: locationColors[participantLocation] ?? "#bb0b0b" }}>{t("common.completed")}</div>
            <h2>{t("s1.completedTitle")}</h2>
            <p>{t("common.clickContinue1")} <strong>{t("common.continue")}</strong> {t("common.clickContinue2")}</p>

            <div className="final-actions" style={{ gridTemplateColumns: "1fr" }}>
              <a href="/session-2/descriptions" className="primary-link-button" style={{ background: locationColors[participantLocation] ?? "#bb0b0b" }}>
                {t("common.continue")}
              </a>
            </div>
          </section>
        )}
        </StepTransition>
      </section>
    </main>
  );
}
