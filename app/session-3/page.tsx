"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import RankingScreen, { ClickLogRow, RankingOption } from "@/components/RankingScreen";
import StepTransition from "@/components/StepTransition";
import { seededShuffle } from "@/lib/randomization";
import { saveWithRetry } from "@/lib/saveWithRetry";
import { useLanguage, TranslationKey } from "@/lib/i18n";
import { getLocationConfig } from "@/lib/locations";

type Step =
  | "transition"
  | "ranking"
  | "between-screens"
  | "completed";

const locationColors: Record<string, string> = {
  PUCPR: "#bb0b0b",
  UFBA: "#1a7a3a",
  NMSU: "#bb0b0b",
};

type SealDefinition = {
  sealId: string;
  sealName: string;
  sealColor: string;
  sealImageUrl: string;
  description: string;
  nameKey: TranslationKey;
  descKey: TranslationKey;
};

const PRICE_LEVELS = {
  high: {
    priceLevel: "high",
    priceIncreasePercent: 20,
  },
  medium: {
    priceLevel: "medium",
    priceIncreasePercent: 10,
  },
  low: {
    priceLevel: "low",
    priceIncreasePercent: 5,
  },
};

const priceConditions = [
  {
    conditionId: "3.1",
    prices: [
      PRICE_LEVELS.high,
      PRICE_LEVELS.medium,
      PRICE_LEVELS.low,
    ],
  },
  {
    conditionId: "3.2",
    prices: [
      PRICE_LEVELS.low,
      PRICE_LEVELS.high,
      PRICE_LEVELS.medium,
    ],
  },
  {
    conditionId: "3.3",
    prices: [
      PRICE_LEVELS.medium,
      PRICE_LEVELS.low,
      PRICE_LEVELS.high,
    ],
  },
];

function calculatePrice(basePrice: number, increasePercent: number) {
  return Number((basePrice * (1 + increasePercent / 100)).toFixed(2));
}

const SEAL_DEFINITIONS_PUCPR: SealDefinition[] = [
  {
    sealId: "red-1",
    sealName: "Angus",
    sealColor: "red",
    sealImageUrl: "/images/seals/pucpr/a.png",
    description:
      "Carne reconhecida pela maciez e sabor intensos e diferenciados característicos da raça Angus.",
    nameKey: "seal.angus.short",
    descKey: "seal.angus.desc",
  },
  {
    sealId: "red-2",
    sealName: "Bem-estar animal",
    sealColor: "red",
    sealImageUrl: "/images/seals/pucpr/bea.png",
    description:
      "Proveniente de sistemas de produção que priorizam conforto, manejo adequado e bem-estar dos animais.",
    nameKey: "seal.welfare.short",
    descKey: "seal.welfare.desc",
  },
  {
    sealId: "green-1",
    sealName: "Tradicional",
    sealColor: "red",
    sealImageUrl: "/images/seals/pucpr/cb.png",
    description:
      "Produto não possui qualquer tipo de certificação especial.",
    nameKey: "seal.traditional.short",
    descKey: "seal.traditional.desc",
  },
  {
    sealId: "green-2",
    sealName: "Cultivada",
    sealColor: "red",
    sealImageUrl: "/images/seals/pucpr/cc.png",
    description:
      "Produzida a partir do cultivo de células animais em ambiente controlado, sem a necessidade de abate.",
    nameKey: "seal.cultivated.short",
    descKey: "seal.cultivated.desc",
  },
  {
    sealId: "green-3",
    sealName: "Orgânica",
    sealColor: "red",
    sealImageUrl: "/images/seals/pucpr/o.png",
    description:
      "Produzida em sistema que preserva o meio ambiente, sem uso de hormônios sintéticos ou antibióticos.",
    nameKey: "seal.organic.short",
    descKey: "seal.organic.desc",
  },
];

const SEAL_DEFINITIONS_UFBA: SealDefinition[] = [
  {
    sealId: "red-1",
    sealName: "Angus",
    sealColor: "green",
    sealImageUrl: "/images/seals/ufba/a.png",
    description:
      "Carne reconhecida pela maciez e sabor intensos e diferenciados característicos da raça Angus.",
    nameKey: "seal.angus.short",
    descKey: "seal.angus.desc",
  },
  {
    sealId: "red-2",
    sealName: "Bem-estar animal",
    sealColor: "green",
    sealImageUrl: "/images/seals/ufba/bea.png",
    description:
      "Proveniente de sistemas de produção que priorizam conforto, manejo adequado e bem-estar dos animais.",
    nameKey: "seal.welfare.short",
    descKey: "seal.welfare.desc",
  },
  {
    sealId: "green-1",
    sealName: "Tradicional",
    sealColor: "green",
    sealImageUrl: "/images/seals/ufba/cb.png",
    description:
      "Produto não possui qualquer tipo de certificação especial.",
    nameKey: "seal.traditional.short",
    descKey: "seal.traditional.desc",
  },
  {
    sealId: "green-2",
    sealName: "Cultivada",
    sealColor: "green",
    sealImageUrl: "/images/seals/ufba/cc.png",
    description:
      "Produzida a partir do cultivo de células animais em ambiente controlado, sem a necessidade de abate.",
    nameKey: "seal.cultivated.short",
    descKey: "seal.cultivated.desc",
  },
  {
    sealId: "green-3",
    sealName: "Orgânica",
    sealColor: "green",
    sealImageUrl: "/images/seals/ufba/o.png",
    description:
      "Produzida em sistema que preserva o meio ambiente, sem uso de hormônios sintéticos ou antibióticos.",
    nameKey: "seal.organic.short",
    descKey: "seal.organic.desc",
  },
];

const SEAL_DEFINITIONS_NMSU: SealDefinition[] = [
  {
    sealId: "red-1",
    sealName: "Angus",
    sealColor: "red",
    sealImageUrl: "/images/seals/nmsu/angus.png",
    description:
      "Carne reconhecida pela maciez e sabor intensos e diferenciados característicos da raça Angus.",
    nameKey: "seal.angus.short",
    descKey: "seal.angus.desc",
  },
  {
    sealId: "red-2",
    sealName: "Bem-estar animal",
    sealColor: "red",
    sealImageUrl: "/images/seals/nmsu/animal.png",
    description:
      "Proveniente de sistemas de produção que priorizam conforto, manejo adequado e bem-estar dos animais.",
    nameKey: "seal.welfare.short",
    descKey: "seal.welfare.desc",
  },
  {
    sealId: "green-1",
    sealName: "Tradicional",
    sealColor: "red",
    sealImageUrl: "/images/seals/nmsu/beef.png",
    description:
      "Produto não possui qualquer tipo de certificação especial.",
    nameKey: "seal.traditional.short",
    descKey: "seal.traditional.desc",
  },
  {
    sealId: "green-2",
    sealName: "Cultivada",
    sealColor: "red",
    sealImageUrl: "/images/seals/nmsu/cultured.png",
    description:
      "Produzida a partir do cultivo de células animais em ambiente controlado, sem a necessidade de abate.",
    nameKey: "seal.cultivated.short",
    descKey: "seal.cultivated.desc",
  },
  {
    sealId: "green-3",
    sealName: "Orgânica",
    sealColor: "red",
    sealImageUrl: "/images/seals/nmsu/organic.png",
    description:
      "Produzida em sistema que preserva o meio ambiente, sem uso de hormônios sintéticos ou antibióticos.",
    nameKey: "seal.organic.short",
    descKey: "seal.organic.desc",
  },
];

const fallbackTopSeals = ["red-1", "red-2", "green-1"];

function getPreviousRankings() {
  const sessionOneRaw = localStorage.getItem("session-1-ranking");
  const sessionTwoRaw = localStorage.getItem("session-2-ranking");

  const sessionOneRows = sessionOneRaw ? JSON.parse(sessionOneRaw) : [];
  const sessionTwoRows = sessionTwoRaw ? JSON.parse(sessionTwoRaw) : [];

  return [...sessionOneRows, ...sessionTwoRows];
}

function getTopThreeSealsFromPreviousChoices() {
  try {
    const sessionOneRaw = localStorage.getItem("session-1-ranking");
    const sessionTwoRaw = localStorage.getItem("session-2-ranking");

    const sessionOneRows = sessionOneRaw
      ? JSON.parse(sessionOneRaw)
      : [];

    const sessionTwoRows = sessionTwoRaw
      ? JSON.parse(sessionTwoRaw)
      : [];

    if (
      !Array.isArray(sessionOneRows) ||
      !Array.isArray(sessionTwoRows) ||
      (sessionOneRows.length === 0 && sessionTwoRows.length === 0)
    ) {
      return fallbackTopSeals;
    }

    const SESSION_1_WEIGHT = 0.33;
    const SESSION_2_WEIGHT = 0.67;

    const weightedScores = new Map<string, number>();
    const sessionTwoScores = new Map<string, number>();

    function addWeightedScores(
      rows: Array<{
        seal_id?: string;
        selected_rank?: number | string;
      }>,
      weight: number,
      trackSessionTwo = false
    ) {
      for (const row of rows) {
        const sealId = row.seal_id;

        if (!sealId) continue;

        const selectedRank = Number(row.selected_rank ?? 99);

        // Rank 1 = 5 points, rank 2 = 4, ... rank 5 = 1.
        const rankScore = Math.max(0, 6 - selectedRank);
        const weightedScore = rankScore * weight;

        weightedScores.set(
          sealId,
          (weightedScores.get(sealId) ?? 0) + weightedScore
        );

        if (trackSessionTwo) {
          sessionTwoScores.set(
            sealId,
            (sessionTwoScores.get(sealId) ?? 0) + rankScore
          );
        }
      }
    }

    addWeightedScores(sessionOneRows, SESSION_1_WEIGHT);
    addWeightedScores(sessionTwoRows, SESSION_2_WEIGHT, true);

    const topSealIds = Array.from(weightedScores.entries())
      .sort((a, b) => {
        const weightedDifference = b[1] - a[1];

        if (weightedDifference !== 0) {
          return weightedDifference;
        }

        const sessionTwoDifference =
          (sessionTwoScores.get(b[0]) ?? 0) -
          (sessionTwoScores.get(a[0]) ?? 0);

        if (sessionTwoDifference !== 0) {
          return sessionTwoDifference;
        }

        return a[0].localeCompare(b[0]);
      })
      .map(([sealId]) => sealId)
      .slice(0, 3);

    const missingFallbacks = fallbackTopSeals.filter(
      (sealId) => !topSealIds.includes(sealId)
    );

    return [...topSealIds, ...missingFallbacks].slice(0, 3);
  } catch (error) {
    console.error("Could not calculate weighted top seals:", error);
    return fallbackTopSeals;
  }
}

export default function SessionThreePage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [participantId, setParticipantId] = useState("");
  const [participantLocation, setParticipantLocation] = useState("");
  const [step, setStep] = useState<Step>("transition");
  const [activeSeal, setActiveSeal] = useState<SealDefinition | null>(null);
  const [topThreeSealIds, setTopThreeSealIds] = useState<string[]>(fallbackTopSeals);
  const [currentScreenIndex, setCurrentScreenIndex] = useState(0);
  const [screenRankings, setScreenRankings] = useState<RankingOption[][]>([]);
  const [screenClickLogs, setScreenClickLogs] = useState<ClickLogRow[][]>([]);
  const [isAdvancing, setIsAdvancing] = useState(false);
  const advancingRef = useRef(false);
  const savingSessionRef = useRef(false);

  useEffect(() => {
    async function loadParticipantAndTopSeals() {
      const id = localStorage.getItem("participantId") || "DEMO-PARTICIPANT";
      const location = localStorage.getItem("participantLocation") || "UNKNOWN";

      setParticipantId(id);
      setParticipantLocation(location);

      try {
        const response = await fetch(
          `/api/session-3/top-seals?participantId=${encodeURIComponent(id)}`
        );

        if (!response.ok) {
          setTopThreeSealIds(getTopThreeSealsFromPreviousChoices());
          return;
        }

        const data = await response.json();

        if (Array.isArray(data.topSealIds) && data.topSealIds.length >= 3) {
          setTopThreeSealIds(data.topSealIds.slice(0, 3));
        } else {
          setTopThreeSealIds(getTopThreeSealsFromPreviousChoices());
        }
      } catch {
        setTopThreeSealIds(getTopThreeSealsFromPreviousChoices());
      }
    }

    loadParticipantAndTopSeals();
  }, []);

  const sealDefinitions = useMemo(
    () => participantLocation === "UFBA"
      ? SEAL_DEFINITIONS_UFBA
      : participantLocation === "NMSU"
      ? SEAL_DEFINITIONS_NMSU
      : SEAL_DEFINITIONS_PUCPR,
    [participantLocation]
  );

  const cutImageUrl = participantLocation === "UFBA"
    ? "/images/cuts/12.png"
    : participantLocation === "NMSU"
    ? "/images/cuts/14.png"
    : "/images/cuts/13.png";

  const cutTitle = participantLocation === "NMSU" ? t("s3.cutTitleNmsu") : t("s3.cutTitle");

  const priceConfig = useMemo(
    () => getLocationConfig(participantLocation),
    [participantLocation]
  );

  const randomizationSeed = useMemo(() => {
    return participantId ? `${participantId}-session-3` : "demo-session-3";
  }, [participantId]);

  const allScreensOptions = useMemo(() => {
    const selectedSeals = topThreeSealIds
      .map((sealId) =>
        sealDefinitions.find((seal) => seal.sealId === sealId)
      )
      .filter(Boolean) as SealDefinition[];

    if (selectedSeals.length < 3) {
      return [];
    }

    const conditionScreens = priceConditions.map((condition) => {
      const conditionOptions: RankingOption[] = selectedSeals.map(
        (seal, sealIndex) => {
          const priceLevel = condition.prices[sealIndex];
          const price = calculatePrice(
            priceConfig.basePrice,
            priceLevel.priceIncreasePercent
          );

          return {
            id: `session-3-condition-${condition.conditionId}-${seal.sealId}-${priceLevel.priceIncreasePercent}`,
            cutId: `price-cut-${sealIndex + 1}`,
            sealId: seal.sealId,
            title: cutTitle,
            subtitle: t(seal.nameKey),
            cutImageUrl,
            sealImageUrl: seal.sealImageUrl,
            sealColor: seal.sealColor,
            price,
            priceCurrency: priceConfig.currencyCode,
            priceCurrencySymbol: priceConfig.currencySymbol,
            priceUnit: priceConfig.unit,
            priceUnitLabel: priceConfig.priceUnit,
            priceLocale: priceConfig.locale,
            priceIncreasePercent:
              priceLevel.priceIncreasePercent,
            priceLevel: priceLevel.priceLevel,
            conditionId: condition.conditionId,
          };
        }
      );

      return {
        conditionId: condition.conditionId,
        options: seededShuffle(
          conditionOptions,
          `${randomizationSeed}-condition-${condition.conditionId}`
        ),
      };
    });

    return seededShuffle(
      conditionScreens,
      `${randomizationSeed}-condition-order`
    );
  }, [
    topThreeSealIds,
    randomizationSeed,
    sealDefinitions,
    cutImageUrl,
    cutTitle,
    priceConfig,
    t,
  ]);

  function getSealById(sealId?: string) {
    return sealDefinitions.find((seal) => seal.sealId === sealId) || null;
  }

  async function handleRankingComplete(
    ranking: RankingOption[],
    clickLogs: ClickLogRow[] = []
  ) {
    const newRankings = [...screenRankings, ranking];
    const newClickLogs = [...screenClickLogs, clickLogs];

    setScreenRankings(newRankings);
    setScreenClickLogs(newClickLogs);

    advancingRef.current = false;
    setIsAdvancing(false);

    if (newRankings.length < 3) {
      setStep("between-screens");
    } else {
      await saveSessionThreeWithoutQuestionnaire(newRankings, newClickLogs);
    }
  }

  function handleContinueToNextScreen() {
    if (advancingRef.current) return;
    advancingRef.current = true;
    setIsAdvancing(true);
    setCurrentScreenIndex((prev) => prev + 1);
    setStep("ranking");
  }

  async function saveSessionThreeWithoutQuestionnaire(
    rankings = screenRankings,
    clickLogsByScreen = screenClickLogs
  ) {
    if (savingSessionRef.current) return;
    savingSessionRef.current = true;

    const timestamp = new Date().toISOString();

    const longRows = rankings.flatMap((ranking, screenIdx) =>
      ranking.map((option, rankIdx) => ({
        participant_id: participantId,
        location: participantLocation,
        session_number: 3,
        method: "3 cuts x 3 prices price experiment with 3 screens",
        base_price: priceConfig.basePrice,
        base_price_brl:
          priceConfig.currencyCode === "BRL" ? priceConfig.basePrice : "",
        base_price_currency: priceConfig.currencyCode,
        base_price_unit: priceConfig.unit,
        session_1_weight: 0.33,
        session_2_weight: 0.67,
        randomization_seed: randomizationSeed,
        presentation_screen_number: screenIdx + 1,
        condition_id:
          allScreensOptions[screenIdx]?.conditionId || "",
        selected_rank: rankIdx + 1,
        option_id: option.id,
        cut_id: option.cutId || "",
        seal_id: option.sealId || "",
        title: option.title,
        subtitle: option.subtitle || "",
        cut_image_url: option.cutImageUrl || "",
        seal_image_url: option.sealImageUrl || "",
        seal_color: option.sealColor || "",
        price: option.price || "",
        price_brl:
          option.priceCurrency === "BRL" ? option.price || "" : "",
        price_currency: option.priceCurrency || "",
        price_unit: option.priceUnit || "",
        price_increase_percent: option.priceIncreasePercent || "",
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
        top_three_seals_used: topThreeSealIds.join(", "),
        gender: "Collected separately",
        age_group: "Collected separately",
        education_level: "Collected separately",
        income_group: "Collected separately",
        timestamp,
      }))
    );

    const participantRow: Record<string, string | number> = {
      participant_id: participantId,
      location: participantLocation,
      session_number: 3,
      method: "3 cuts x 3 prices price experiment with 3 screens",
      base_price: priceConfig.basePrice,
      base_price_brl:
        priceConfig.currencyCode === "BRL" ? priceConfig.basePrice : "",
      base_price_currency: priceConfig.currencyCode,
      base_price_unit: priceConfig.unit,
      session_1_weight: 0.33,
      session_2_weight: 0.67,
      randomization_seed: randomizationSeed,

      top_seal_1: topThreeSealIds[0] || "",
      top_seal_2: topThreeSealIds[1] || "",
      top_seal_3: topThreeSealIds[2] || "",

      gender: "Collected separately",
      age_group: "Collected separately",
      education_level: "Collected separately",
      income_group: "Collected separately",

      timestamp,
    };

    rankings.forEach((ranking, screenIdx) => {
      const screenNum = screenIdx + 1;

      participantRow[`screen_${screenNum}_condition_id`] =
        allScreensOptions[screenIdx]?.conditionId || "";

      ranking.forEach((option, rankIdx) => {
        const rankNum = rankIdx + 1;
        const prefix = `screen_${screenNum}_rank_${rankNum}`;
        participantRow[`${prefix}_option_id`] = option.id;
        participantRow[`${prefix}_seal_id`] = option.sealId || "";
        participantRow[`${prefix}_title`] = option.title;
        participantRow[`${prefix}_subtitle`] = option.subtitle || "";
        participantRow[`${prefix}_price_brl`] =
          option.priceCurrency === "BRL" ? option.price ?? "" : "";
        participantRow[`${prefix}_price`] = option.price ?? "";
        participantRow[`${prefix}_price_currency`] =
          option.priceCurrency ?? "";
        participantRow[`${prefix}_price_unit`] = option.priceUnit ?? "";
        participantRow[`${prefix}_price_increase_percent`] =
          option.priceIncreasePercent ?? "";

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
    });

    const clickRows = clickLogsByScreen.flatMap((screenRows, screenIdx) =>
      screenRows.map((row) => ({
        ...row,
        participant_id: participantId,
        location: participantLocation,
        session_number: 3,
        presentation_screen_number: screenIdx + 1,
        condition_id:
          allScreensOptions[screenIdx]?.conditionId ||
          row.condition_id ||
          "",
        timestamp,
      }))
    );

    const sessionResult = await saveWithRetry("/api/session-3/save", {
      participantRow,
      longRows,
    });

    if (clickRows.length > 0) {
      await saveWithRetry("/api/click-logs/save", {
        clickRows,
      });
    }

    localStorage.setItem("session-3-ranking", JSON.stringify(longRows));

    if (sessionResult.queued) {
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
            <div className="badge" style={{ background: locationColors[participantLocation] ?? "#bb0b0b" }}>{t("s3.introBadge")}</div>
            <h2>{t("s3.introTitle")}</h2>
            <p>
              {t("s3.introDesc")}
            </p>
            <button
              type="button"
              className="primary-button full-width-button"
              style={{ background: locationColors[participantLocation] ?? "#bb0b0b" }}
              onClick={() => setStep("ranking")}
            >
              {t("common.continue")}
            </button>
          </section>
        )}

        {step === "ranking" &&
          allScreensOptions[currentScreenIndex]?.options && (
          <section className="session-three-ranking">
            <RankingScreen
              key={`${participantLocation}-screen-${currentScreenIndex}`}
              options={allScreensOptions[currentScreenIndex].options}
              sessionNumber={3}
              sessionSuffix={`${t("s3.choiceSuffix")} ${currentScreenIndex + 1} ${t("s3.choiceOf")} 3`}
              title={t("s3.rankingTitle")}
              description={t("s3.rankingDesc")}
              location={participantLocation}
              participantId={participantId}
              showPriceInCart
              onRankingComplete={handleRankingComplete}
              onSealClick={(sealId) => {
                const seal = getSealById(sealId);
                if (seal) setActiveSeal(seal);
              }}
            />
          </section>
        )}

        {step === "between-screens" && (
          <section className="complete-card">
            <div className="badge" style={{ background: locationColors[participantLocation] ?? "#bb0b0b" }}>{t("s3.choiceSuffix")} {screenRankings.length} {t("s3.choiceOf")} 3 {t("s3.betweenBadge")}</div>
            <h2>{t("s3.betweenTitle")}</h2>
            <p>
              {t("s3.betweenDesc1")} {screenRankings.length}. {t("s3.betweenDesc2")}
            </p>

            <button
              type="button"
              className="primary-button full-width-button"
              style={{ background: locationColors[participantLocation] ?? "#bb0b0b" }}
              onClick={handleContinueToNextScreen}
              disabled={isAdvancing}
            >
              {isAdvancing
                ? t("s3.loading")
                : `${t("s3.goToChoice")} ${screenRankings.length + 1}`}
            </button>
          </section>
        )}

        {step === "completed" && (
          <section className="complete-card session-transition-card">
            <div className="badge" style={{ background: locationColors[participantLocation] ?? "#bb0b0b" }}>{t("s3.preDemoBadge")}</div>
            <h2>{t("s3.preDemoTitle")}</h2>
            <p>
              {t("s3.preDemoDesc")}
            </p>

            <button
              type="button"
              className="primary-button full-width-button"
              style={{ background: locationColors[participantLocation] ?? "#bb0b0b" }}
              onClick={() => router.push("/demographics")}
            >
              {t("common.continue")}
            </button>
          </section>
        )}
        </StepTransition>
      </section>

      {activeSeal && (
        <div className="modal-backdrop">
          <section className="modal-card seal-modal-card">
            <div className="modal-seal-check">✓</div>
            <img src={activeSeal.sealImageUrl} alt={t(activeSeal.nameKey)} />

            <h2>{t(activeSeal.nameKey)}</h2>
            <p>{t(activeSeal.descKey)}</p>

            <button
              type="button"
              className="primary-button"
              style={{ background: locationColors[participantLocation] ?? "#bb0b0b" }}
              onClick={() => setActiveSeal(null)}
            >
              {t("s3.readBtn")}
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
