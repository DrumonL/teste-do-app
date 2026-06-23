"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import RankingScreen, { ClickLogRow, RankingOption } from "@/components/RankingScreen";
import StepTransition from "@/components/StepTransition";
import DemographicsForm, { DemographicsData } from "@/components/DemographicsForm";
import { seededShuffle } from "@/lib/randomization";
import { getSession2Options } from "@/lib/locations";
import { saveWithRetry } from "@/lib/saveWithRetry";
import { useLanguage, TranslationKey } from "@/lib/i18n";

type SealInfo = {
  id: string;
  name: string;
  color: string;
  imageUrl: string;
  description: string;
  nameKey: TranslationKey;
  descKey: TranslationKey;
};

type SealReadingRecord = {
  sealId: string;
  sealName: string;
  openedAt: string;
};

type Step =
  | "transition"
  | "reading"
  | "agreement"
  | "ranking"
  | "final-confirmation"
  | "demographics"
  | "completed";

const SEALS_PUCPR: SealInfo[] = [
  {
    id: "red-1",
    name: "Certificação Angus",
    color: "red",
    imageUrl: "/images/seals/pucpr/a.png",
    description:
      "Carne reconhecida pela maciez e sabor intensos e diferenciados característicos da raça Angus.",
    nameKey: "seal.angus.full",
    descKey: "seal.angus.desc",
  },
  {
    id: "red-2",
    name: "Certificação Bem-Estar Animal",
    color: "red",
    imageUrl: "/images/seals/pucpr/bea.png",
    description:
      "Proveniente de sistemas de produção que priorizam conforto, manejo adequado e bem-estar dos animais.",
    nameKey: "seal.welfare.full",
    descKey: "seal.welfare.desc",
  },
  {
    id: "green-1",
    name: "Selo de Carne Bovina",
    color: "red",
    imageUrl: "/images/seals/pucpr/cb.png",
    description:
      "Produto não possui qualquer tipo de certificação especial.",
    nameKey: "seal.traditional.full",
    descKey: "seal.traditional.desc",
  },
  {
    id: "green-2",
    name: "Certificação Carne Cultivada",
    color: "red",
    imageUrl: "/images/seals/pucpr/cc.png",
    description:
      "Produzida a partir do cultivo de células animais em ambiente controlado, sem a necessidade de abate.",
    nameKey: "seal.cultivated.full",
    descKey: "seal.cultivated.desc",
  },
  {
    id: "green-3",
    name: "Certificação Orgânica",
    color: "red",
    imageUrl: "/images/seals/pucpr/o.png",
    description:
      "Produzida em sistema que preserva o meio ambiente, sem uso de hormônios sintéticos ou antibióticos.",
    nameKey: "seal.organic.full",
    descKey: "seal.organic.desc",
  },
];

const SEALS_UFBA: SealInfo[] = [
  {
    id: "red-1",
    name: "Certificação Angus",
    color: "green",
    imageUrl: "/images/seals/ufba/a.png",
    description:
      "Carne reconhecida pela maciez e sabor intensos e diferenciados característicos da raça Angus.",
    nameKey: "seal.angus.full",
    descKey: "seal.angus.desc",
  },
  {
    id: "red-2",
    name: "Certificação Bem-Estar Animal",
    color: "green",
    imageUrl: "/images/seals/ufba/bea.png",
    description:
      "Proveniente de sistemas de produção que priorizam conforto, manejo adequado e bem-estar dos animais.",
    nameKey: "seal.welfare.full",
    descKey: "seal.welfare.desc",
  },
  {
    id: "green-1",
    name: "Selo de Carne Bovina",
    color: "green",
    imageUrl: "/images/seals/ufba/cb.png",
    description:
      "Produto não possui qualquer tipo de certificação especial.",
    nameKey: "seal.traditional.full",
    descKey: "seal.traditional.desc",
  },
  {
    id: "green-2",
    name: "Certificação Carne Cultivada",
    color: "green",
    imageUrl: "/images/seals/ufba/cc.png",
    description:
      "Produzida a partir do cultivo de células animais em ambiente controlado, sem a necessidade de abate.",
    nameKey: "seal.cultivated.full",
    descKey: "seal.cultivated.desc",
  },
  {
    id: "green-3",
    name: "Certificação Orgânica",
    color: "green",
    imageUrl: "/images/seals/ufba/o.png",
    description:
      "Produzida em sistema que preserva o meio ambiente, sem uso de hormônios sintéticos ou antibióticos.",
    nameKey: "seal.organic.full",
    descKey: "seal.organic.desc",
  },
];

const SEALS_NMSU: SealInfo[] = [
  {
    id: "red-1",
    name: "Certificação Angus",
    color: "red",
    imageUrl: "/images/seals/nmsu/angus.png",
    description:
      "Carne reconhecida pela maciez e sabor intensos e diferenciados característicos da raça Angus.",
    nameKey: "seal.angus.full",
    descKey: "seal.angus.desc",
  },
  {
    id: "red-2",
    name: "Certificação Bem-Estar Animal",
    color: "red",
    imageUrl: "/images/seals/nmsu/animal.png",
    description:
      "Proveniente de sistemas de produção que priorizam conforto, manejo adequado e bem-estar dos animais.",
    nameKey: "seal.welfare.full",
    descKey: "seal.welfare.desc",
  },
  {
    id: "green-1",
    name: "Selo de Carne Bovina",
    color: "red",
    imageUrl: "/images/seals/nmsu/beef.png",
    description:
      "Produto não possui qualquer tipo de certificação especial.",
    nameKey: "seal.traditional.full",
    descKey: "seal.traditional.desc",
  },
  {
    id: "green-2",
    name: "Certificação Carne Cultivada",
    color: "red",
    imageUrl: "/images/seals/nmsu/cultured.png",
    description:
      "Produzida a partir do cultivo de células animais em ambiente controlado, sem a necessidade de abate.",
    nameKey: "seal.cultivated.full",
    descKey: "seal.cultivated.desc",
  },
  {
    id: "green-3",
    name: "Certificação Orgânica",
    color: "red",
    imageUrl: "/images/seals/nmsu/organic.png",
    description:
      "Produzida em sistema que preserva o meio ambiente, sem uso de hormônios sintéticos ou antibióticos.",
    nameKey: "seal.organic.full",
    descKey: "seal.organic.desc",
  },
];

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

export default function SessionTwoDescriptionsPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [participantId, setParticipantId] = useState("");
  const [participantLocation, setParticipantLocation] = useState("");
  const [step, setStep] = useState<Step>("transition");
  const [readSealIds, setReadSealIds] = useState<string[]>([]);
  const [sealReadingRecords, setSealReadingRecords] = useState<SealReadingRecord[]>([]);
  const [activeSeal, setActiveSeal] = useState<SealInfo | null>(null);
  const [completedRanking, setCompletedRanking] = useState<RankingOption[]>([]);
  const [rankingClickLogs, setRankingClickLogs] = useState<ClickLogRow[]>([]);
  const [agreedToDescriptions, setAgreedToDescriptions] = useState("");
  const [isSavingFinal, setIsSavingFinal] = useState(false);
  const [zoomedSealId, setZoomedSealId] = useState<string | null>(null);
  const [rankingSealClicks, setRankingSealClicks] = useState<Record<string, number>>({});
  const [rankingSealClickRecords, setRankingSealClickRecords] = useState<{ sealId: string; sealName: string; clickedAt: string }[]>([]);
  const savingFinalRef = useRef(false);

  useEffect(() => {
    setParticipantId(localStorage.getItem("participantId") || "DEMO-PARTICIPANT");
    setParticipantLocation(localStorage.getItem("participantLocation") || "UNKNOWN");
  }, []);

  const seals = participantLocation === "UFBA" ? SEALS_UFBA : participantLocation === "NMSU" ? SEALS_NMSU : SEALS_PUCPR;

  const randomizationSeed = useMemo(() => {
    return participantId ? `${participantId}-session-2` : "demo-session-2";
  }, [participantId]);

  const randomizedOptions = useMemo(() => {
    const baseOptions = getSession2Options(participantLocation);
    return seededShuffle(baseOptions, randomizationSeed);
  }, [randomizationSeed, participantLocation]);

  const randomizedReadingSeals = useMemo(() => {
    return seededShuffle(
      seals,
      `${participantId || "demo"}-${participantLocation || "unknown"}-session-2-seal-reading`
    );
  }, [seals, participantId, participantLocation]);


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

  const allSealsRead = readSealIds.length === seals.length;

  function openSealDescription(seal: SealInfo) {
    setActiveSeal(seal);

    if (!readSealIds.includes(seal.id)) {
      setReadSealIds((current) => [...current, seal.id]);

      setSealReadingRecords((current) => [
        ...current,
        {
          sealId: seal.id,
          sealName: t(seal.nameKey),
          openedAt: new Date().toISOString(),
        },
      ]);
    }
  }

  function closeSealDescription() {
    setActiveSeal(null);
  }

  function handleAgreementYes() {
    setAgreedToDescriptions("Yes");
    setStep("ranking");
  }

  function handleAgreementNo() {
    setAgreedToDescriptions("No");
    setStep("reading");
  }

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
        await saveSessionTwoWithoutQuestionnaire();
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

  function getSealById(sealId?: string) {
    return seals.find((seal) => seal.id === sealId) || null;
  }

  async function saveSessionTwoWithoutQuestionnaire() {
    const timestamp = new Date().toISOString();

    const longRows = completedRanking.map((option, index) => ({
      participant_id: participantId,
      location: participantLocation,
      session_number: 2,
      method: "Seal descriptions + Choice experiment / Best-Worst Scaling ranking",
      randomization_seed: randomizationSeed,
      agreed_to_descriptions: agreedToDescriptions,
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
      session_number: 2,
      method: "Seal descriptions + Choice experiment / Best-Worst Scaling ranking",
      randomization_seed: randomizationSeed,
      agreed_to_descriptions: agreedToDescriptions,

      gender: "Collected in Session 3",
      age_group: "Collected in Session 3",
      education_level: "Collected in Session 3",
      income_group: "Collected in Session 3",

      seals_read_count: readSealIds.length,
      all_seals_read: allSealsRead ? "Yes" : "No",

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

    const sealReadingRows = sealReadingRecords.map((record) => ({
      participant_id: participantId,
      location: participantLocation,
      session_number: 2,
      seal_id: record.sealId,
      seal_name: record.sealName,
      opened_description: "Yes",
      opened_at: record.openedAt,
      agreed_to_descriptions: agreedToDescriptions,
      timestamp,
    }));

    const rankingSealClickRows = rankingSealClickRecords.map((record) => ({
      participant_id: participantId,
      location: participantLocation,
      session_number: 2,
      phase: "ranking",
      seal_id: record.sealId,
      seal_name: record.sealName,
      clicked_at: record.clickedAt,
      total_clicks_this_seal: rankingSealClicks[record.sealId] || 1,
      timestamp,
    }));

    addRankingTimingFields(participantRow, completedRanking);

  const clickRows = rankingClickLogs.map((row) => ({
      ...row,
      participant_id: participantId,
      location: participantLocation,
      session_number: 2,
      timestamp,
    }));

    const result = await saveWithRetry("/api/session-2/save", {
      participantRow,
      longRows,
      sealReadingRows,
      rankingSealClickRows,
    });

    if (clickRows.length > 0) {
      await saveWithRetry("/api/click-logs/save", {
        clickRows,
      });
    }

    localStorage.setItem("session-2-ranking", JSON.stringify(longRows));
    localStorage.setItem("session-2-seal-readings", JSON.stringify(sealReadingRows));

    if (result.queued) {
      alert(t("common.saveAlert"));
    }

    router.push("/session-3");
  }

  async function saveSessionTwo(demographics: DemographicsData) {
    const timestamp = new Date().toISOString();

    const longRows = completedRanking.map((option, index) => ({
      participant_id: participantId,
      location: participantLocation,
      session_number: 2,
      method: "Seal descriptions + Choice experiment / Best-Worst Scaling ranking",
      randomization_seed: randomizationSeed,
      agreed_to_descriptions: agreedToDescriptions,
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
      gender: demographics.gender,
      age_group: demographics.ageGroup,
      education_level: demographics.educationLevel,
      income_group: demographics.incomeGroup,
      timestamp,
    }));

    const participantRow: Record<string, string | number> = {
      participant_id: participantId,
      location: participantLocation,
      session_number: 2,
      method: "Seal descriptions + Choice experiment / Best-Worst Scaling ranking",
      randomization_seed: randomizationSeed,
      agreed_to_descriptions: agreedToDescriptions,

      gender: demographics.gender,
      age_group: demographics.ageGroup,
      education_level: demographics.educationLevel,
      income_group: demographics.incomeGroup,

      seals_read_count: readSealIds.length,
      all_seals_read: allSealsRead ? "Yes" : "No",

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

    const sealReadingRows = sealReadingRecords.map((record) => ({
      participant_id: participantId,
      location: participantLocation,
      session_number: 2,
      seal_id: record.sealId,
      seal_name: record.sealName,
      opened_description: "Yes",
      opened_at: record.openedAt,
      agreed_to_descriptions: agreedToDescriptions,
      timestamp,
    }));

    const rankingSealClickRows = rankingSealClickRecords.map((record) => ({
      participant_id: participantId,
      location: participantLocation,
      session_number: 2,
      phase: "ranking",
      seal_id: record.sealId,
      seal_name: record.sealName,
      clicked_at: record.clickedAt,
      total_clicks_this_seal: rankingSealClicks[record.sealId] || 1,
      timestamp,
    }));

    addRankingTimingFields(participantRow, completedRanking);

  const clickRows = rankingClickLogs.map((row) => ({
      ...row,
      participant_id: participantId,
      location: participantLocation,
      session_number: 2,
      timestamp,
    }));

    const result = await saveWithRetry("/api/session-2/save", {
      participantRow,
      longRows,
      sealReadingRows,
      rankingSealClickRows,
    });

    if (clickRows.length > 0) {
      await saveWithRetry("/api/click-logs/save", {
        clickRows,
      });
    }

    localStorage.setItem("session-2-ranking", JSON.stringify(longRows));
    localStorage.setItem("session-2-demographics", JSON.stringify(demographics));
    localStorage.setItem("session-2-seal-readings", JSON.stringify(sealReadingRows));

    if (result.queued) {
      alert(t("common.saveAlert"));
    }

    setStep("completed");
  }

  return (
    <main className={`study-page location-${participantLocation.toLowerCase()}`}>
      <section className="study-shell">
        <StepTransition stepKey={step}>
        {step === "transition" && (
          <section className="complete-card session-transition-card">
            <div className="badge" style={{ background: locationColors[participantLocation] ?? "#bb0b0b" }}>{t("s2.introBadge")}</div>
            <h2>{t("s2.introTitle")}</h2>
            <p>
              {t("s2.introDesc")}
            </p>
            <button
              type="button"
              className="primary-button full-width-button"
              style={{ background: locationColors[participantLocation] ?? "#bb0b0b" }}
              onClick={() => setStep("reading")}
            >
              {t("common.continue")}
            </button>
          </section>
        )}

        {step === "reading" && (
          <section className="session-two-card">
            <div className="session-two-heading">
              <div>
                <h2>{t("s2.readTitle")}</h2>
                <p>
                  {t("s2.readDesc")}
                </p>
              </div>

              <div className="read-counter" style={{ background: locationColors[participantLocation] ?? "#bb0b0b" }}>
                {readSealIds.length}/{seals.length} {t("s2.readCount")}
              </div>
            </div>

            <div className="seal-description-grid">
              {randomizedReadingSeals.map((seal) => {
                const wasRead = readSealIds.includes(seal.id);

                return (
                  <button
                    key={seal.id}
                    type="button"
                    className="seal-description-card"
                    onClick={() => openSealDescription(seal)}
                  >
                    <div className="seal-image-holder">
                      <img src={seal.imageUrl} alt={t(seal.nameKey)} />
                    </div>

                    <div className={wasRead ? "read-check" : "read-check read-check--empty"}>✓</div>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              className={allSealsRead ? "purchase-button" : "purchase-button disabled"}
              style={allSealsRead ? { background: locationColors[participantLocation] ?? "#bb0b0b" } : undefined}
              onClick={() => {
                if (allSealsRead) {
                  setStep("agreement");
                }
              }}
            >
              {allSealsRead
                ? t("s2.continueReady")
                : t("s2.continueBlocked")}
            </button>
          </section>
        )}

        {step === "agreement" && (
          <section className="complete-card">
            <div className="badge" style={{ background: locationColors[participantLocation] ?? "#bb0b0b" }}>{t("s2.confirmBadge")}</div>
            <h2>{t("s2.confirmTitle")}</h2>
            <p>
              {t("s2.confirmDesc")}
            </p>

            <div className="final-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={handleAgreementNo}
              >
                {t("s2.no")}
              </button>

              <button
                type="button"
                className="primary-button"
                style={{ background: locationColors[participantLocation] ?? "#bb0b0b" }}
                onClick={handleAgreementYes}
              >
                {t("s2.yes")}
              </button>
            </div>
          </section>
        )}

        {step === "ranking" && (
          <section className="session-two-ranking-note">
            <RankingScreen
              key={`${participantLocation}-${randomizationSeed}`}
              options={translatedOptions}
              sessionNumber={2}
              title={t("s2.rankingTitle")}
              description={t("s2.rankingDesc")}
              location={participantLocation}
              participantId={participantId}
              initialRanking={completedRanking}
              initialClickLogs={rankingClickLogs}
              onRankingComplete={handleRankingComplete}
              onSealClick={(sealId) => {
                const seal = getSealById(sealId);
                if (seal) {
                  openSealDescription(seal);
                  setRankingSealClicks((prev) => ({ ...prev, [seal.id]: (prev[seal.id] || 0) + 1 }));
                  setRankingSealClickRecords((prev) => [...prev, { sealId: seal.id, sealName: t(seal.nameKey), clickedAt: new Date().toISOString() }]);
                }
              }}
              clickedSealIds={new Set(Object.keys(rankingSealClicks))}
            />
          </section>
        )}

        {step === "final-confirmation" && (
          <section className="complete-card">
            <div className="badge" style={{ background: locationColors[participantLocation] ?? "#bb0b0b" }}>{t("s2.finalBadge")}</div>
            <h2>{t("s2.finalTitle")}</h2>
            <p>
              {t("s2.finalDesc")}
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
                {t("s2.finalNo")}
              </button>

              <button
                type="button"
                className="primary-button"
                style={{ background: locationColors[participantLocation] ?? "#bb0b0b" }}
                onClick={handleFinalConfirmationYes}
                disabled={isSavingFinal}
              >
                {isSavingFinal ? t("s2.saving") : t("s2.finalYes")}
              </button>
            </div>
          </section>
        )}

        {step === "demographics" && (
          <section className="complete-card">
            <DemographicsForm onSubmit={saveSessionTwo} locationColor={locationColors[participantLocation] ?? "#bb0b0b"} />
          </section>
        )}

        {step === "completed" && (
          <section className="complete-card">
            <div className="badge" style={{ background: locationColors[participantLocation] ?? "#bb0b0b" }}>{t("common.completed")}</div>
            <h2>{t("s2.completedTitle")}</h2>
            <p>{t("common.clickContinue1")} <strong>{t("common.continue")}</strong> {t("common.clickContinue2")}</p>

            <div className="final-actions" style={{ gridTemplateColumns: "1fr" }}>
              <a href="/session-3" className="primary-link-button" style={{ background: locationColors[participantLocation] ?? "#bb0b0b" }}>
                {t("common.continue")}
              </a>
            </div>
          </section>
        )}
        </StepTransition>
      </section>

      {activeSeal && (
        <div className="modal-backdrop">
          <section className="modal-card seal-modal-card">
            <div className="modal-seal-check">✓</div>
            <img src={activeSeal.imageUrl} alt={t(activeSeal.nameKey)} />

            <h2>{t(activeSeal.nameKey)}</h2>
            <p>{t(activeSeal.descKey)}</p>

            <button
              type="button"
              className="primary-button"
              style={{ background: locationColors[participantLocation] ?? "#bb0b0b" }}
              onClick={closeSealDescription}
            >
              {t("s2.readBtn")}
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
