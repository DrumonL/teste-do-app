"use client";

import { useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ProductCard from "@/components/ProductCard";
import ConfirmModal from "@/components/ConfirmModal";
import { useLanguage, TranslationKey } from "@/lib/i18n";

export type ClickLogRow = {
  participant_id?: string;
  location?: string;
  session_number: number;
  session_suffix?: string;
  screen_name: string;
  event_type: string;
  element_id: string;
  element_label: string;
  option_id?: string;
  seal_id?: string;
  rank_number?: number | string;
  from_rank?: number | string;
  to_rank?: number | string;
  condition_id?: string;
  price_brl?: number | string;
  price?: number | string;
  price_currency?: string;
  price_unit?: string;
  price_increase_percent?: number | string;
  x_position: number | string;
  y_position: number | string;
  viewport_width: number | string;
  viewport_height: number | string;
  clicked_at: string;
};

export type RankingOption = {
  id: string;
  cutId?: string;
  sealId?: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  cutImageUrl?: string;
  sealImageUrl?: string;
  sealColor?: string;
  price?: number;
  priceCurrency?: string;
  priceCurrencySymbol?: string;
  priceUnit?: string;
  priceUnitLabel?: string;
  priceLocale?: string;
  priceIncreasePercent?: number;
  priceLevel?: string;
  conditionId?: string;

  screenStartedAt?: string;
  optionSelectedAt?: string;
  purchaseConfirmedAt?: string;

  timeSpentBeforeChoiceMs?: number;
  timeSpentBeforeChoiceSeconds?: number;

  timeTakenToConfirmMs?: number;
  timeTakenToConfirmSeconds?: number;

  changedPreferenceBeforeConfirming?: string;
  initialSelectedOptionId?: string;
  finalConfirmedOptionId?: string;
};

type RankingScreenProps = {
  options: RankingOption[];
  sessionNumber: number;
  sessionSuffix?: string;
  title?: string;
  description?: string;
  location?: string;
  participantId?: string;
  sealZoom?: boolean;
  showPriceInCart?: boolean;
  clickedSealIds?: Set<string>;
  initialRanking?: RankingOption[];
  initialClickLogs?: ClickLogRow[];
  onRankingComplete: (
    ranking: RankingOption[],
    clickLogs?: ClickLogRow[]
  ) => void;
  onSealClick?: (sealId?: string) => void;
};

const locationColors: Record<string, string> = {
  PUCPR: "#bb0b0b",
  UFBA: "#1a7a3a",
  NMSU: "#bb0b0b",
};

function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, movedItem);
  return nextItems;
}

function formatOptionPrice(option: RankingOption) {
  if (typeof option.price !== "number") {
    return "";
  }

  const value = option.price.toLocaleString(option.priceLocale || "pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${option.priceCurrencySymbol || option.priceCurrency || "R$"} ${value} ${option.priceUnitLabel || option.priceUnit || "/ kg"}`;
}

export default function RankingScreen({
  options,
  sessionNumber,
  sessionSuffix,
  title,
  description,
  location,
  participantId,
  sealZoom,
  showPriceInCart,
  clickedSealIds,
  initialRanking = [],
  initialClickLogs = [],
  onRankingComplete,
  onSealClick,
}: RankingScreenProps) {
  const { t } = useLanguage();

  const [availableOptions, setAvailableOptions] = useState(() => {
    const selectedIds = new Set(initialRanking.map((option) => option.id));
    return options.filter((option) => !selectedIds.has(option.id));
  });
  const [selectedRanking, setSelectedRanking] = useState<RankingOption[]>(initialRanking);
  const [pendingOption, setPendingOption] = useState<RankingOption | null>(null);
  const [clickLogs, setClickLogs] = useState<ClickLogRow[]>(initialClickLogs);
  const [draggedCartOptionId, setDraggedCartOptionId] = useState<string | null>(null);
  const [dragDirection, setDragDirection] = useState<"up" | "down" | null>(null);
  const draggedCartOptionIdRef = useRef<string | null>(null);

  const [screenStartedAt, setScreenStartedAt] = useState(() => new Date());
  const [optionSelectedAt, setOptionSelectedAt] = useState<Date | null>(null);

  const [initialSelectedOptionId, setInitialSelectedOptionId] = useState("");
  const [preferenceChanged, setPreferenceChanged] = useState(false);

  const currentRank = selectedRanking.length + 1;
  const isReorderEnabled = location === "PUCPR" || location === "UFBA";

  const stepKeys: TranslationKey[] = [
    "ranking.step1",
    "ranking.step2",
    "ranking.step3",
    "ranking.step4",
    "ranking.step5",
  ];

  const ordKeys: TranslationKey[] = [
    "ranking.ord1",
    "ranking.ord2",
    "ranking.ord3",
    "ranking.ord4",
    "ranking.ord5",
    "ranking.ord6",
    "ranking.ord7",
    "ranking.ord8",
    "ranking.ord9",
    "ranking.ord10",
  ];

  function makeClickLog(
    event: MouseEvent<HTMLElement> | undefined,
    details: {
      eventType: string;
      elementId: string;
      elementLabel: string;
      option?: RankingOption | null;
      rankNumber?: number | string;
    }
  ): ClickLogRow {
    return {
      participant_id: participantId || "",
      location: location || "",
      session_number: sessionNumber,
      session_suffix: sessionSuffix || "",
      screen_name: `session-${sessionNumber}-ranking`,
      event_type: details.eventType,
      element_id: details.elementId,
      element_label: details.elementLabel,
      option_id: details.option?.id || "",
      seal_id: details.option?.sealId || "",
      rank_number: details.rankNumber ?? currentRank,
      condition_id: details.option?.conditionId || "",
      price_brl:
        details.option?.priceCurrency === "BRL"
          ? details.option?.price ?? ""
          : "",
      price: details.option?.price ?? "",
      price_currency: details.option?.priceCurrency ?? "",
      price_unit: details.option?.priceUnit ?? "",
      price_increase_percent: details.option?.priceIncreasePercent ?? "",
      x_position: event?.clientX ?? "",
      y_position: event?.clientY ?? "",
      viewport_width:
        typeof window !== "undefined" ? window.innerWidth : "",
      viewport_height:
        typeof window !== "undefined" ? window.innerHeight : "",
      clicked_at: new Date().toISOString(),
    };
  }

  function addClickLog(
    event: MouseEvent<HTMLElement> | undefined,
    details: {
      eventType: string;
      elementId: string;
      elementLabel: string;
      option?: RankingOption | null;
      rankNumber?: number | string;
    }
  ) {
    const row = makeClickLog(event, details);
    setClickLogs((current) => [...current, row]);
    return row;
  }

  function makeCartReorderLog(
    option: RankingOption,
    fromRank: number,
    toRank: number,
    clientX: number,
    clientY: number
  ): ClickLogRow {
    return {
      participant_id: participantId || "",
      location: location || "",
      session_number: sessionNumber,
      session_suffix: sessionSuffix || "",
      screen_name: `session-${sessionNumber}-ranking`,
      event_type: "selected_ranking_reorder_drag",
      element_id: option.id,
      element_label: `${option.title}${option.subtitle ? ` - ${option.subtitle}` : ""}`,
      option_id: option.id,
      seal_id: option.sealId || "",
      rank_number: toRank,
      from_rank: fromRank,
      to_rank: toRank,
      condition_id: option.conditionId || "",
      price_brl:
        option.priceCurrency === "BRL"
          ? option.price ?? ""
          : "",
      price: option.price ?? "",
      price_currency: option.priceCurrency ?? "",
      price_unit: option.priceUnit ?? "",
      price_increase_percent: option.priceIncreasePercent ?? "",
      x_position: clientX,
      y_position: clientY,
      viewport_width:
        typeof window !== "undefined" ? window.innerWidth : "",
      viewport_height:
        typeof window !== "undefined" ? window.innerHeight : "",
      clicked_at: new Date().toISOString(),
    };
  }

  function resetChoiceTracking() {
    setScreenStartedAt(new Date());
    setOptionSelectedAt(null);
    setInitialSelectedOptionId("");
    setPreferenceChanged(false);
  }

  function handleSelect(
    option: RankingOption,
    event?: MouseEvent<HTMLElement>
  ) {
    addClickLog(event, {
      eventType: "product_card_click",
      elementId: option.id,
      elementLabel: `${option.title}${option.subtitle ? ` - ${option.subtitle}` : ""}`,
      option,
      rankNumber: currentRank,
    });

    const selectedAt = new Date();

    if (!initialSelectedOptionId) {
      setInitialSelectedOptionId(option.id);
    } else if (option.id !== initialSelectedOptionId) {
      setPreferenceChanged(true);
    }

    setOptionSelectedAt(selectedAt);
    setPendingOption(option);
  }

  function handleConfirmChoice(event?: MouseEvent<HTMLButtonElement>) {
    if (!pendingOption) return;

    const confirmClick = makeClickLog(event, {
      eventType: "confirm_modal_yes_click",
      elementId: "confirm-choice-yes",
      elementLabel: "Confirm purchase intention",
      option: pendingOption,
      rankNumber: currentRank,
    });

    const confirmedAt = new Date();
    const selectedAt = optionSelectedAt ?? confirmedAt;

    const timeSpentBeforeChoiceMs = Math.max(
      0,
      selectedAt.getTime() - screenStartedAt.getTime()
    );

    const timeTakenToConfirmMs = Math.max(
      0,
      confirmedAt.getTime() - selectedAt.getTime()
    );

    const trackedOption: RankingOption = {
      ...pendingOption,

      screenStartedAt: screenStartedAt.toISOString(),
      optionSelectedAt: selectedAt.toISOString(),
      purchaseConfirmedAt: confirmedAt.toISOString(),

      timeSpentBeforeChoiceMs,
      timeSpentBeforeChoiceSeconds: Number(
        (timeSpentBeforeChoiceMs / 1000).toFixed(3)
      ),

      timeTakenToConfirmMs,
      timeTakenToConfirmSeconds: Number(
        (timeTakenToConfirmMs / 1000).toFixed(3)
      ),

      changedPreferenceBeforeConfirming: preferenceChanged ? "Yes" : "No",
      initialSelectedOptionId: initialSelectedOptionId || pendingOption.id,
      finalConfirmedOptionId: pendingOption.id,
    };

    const nextRanking = [...selectedRanking, trackedOption];

    const nextAvailableOptions = availableOptions.filter(
      (option) => option.id !== pendingOption.id
    );

    setClickLogs((current) => [...current, confirmClick]);
    setSelectedRanking(nextRanking);
    setAvailableOptions(nextAvailableOptions);
    setPendingOption(null);
    resetChoiceTracking();
  }

  function handleCancelChoice(event?: MouseEvent<HTMLButtonElement>) {
    addClickLog(event, {
      eventType: "confirm_modal_no_click",
      elementId: "confirm-choice-no",
      elementLabel: "Go back before confirming purchase intention",
      option: pendingOption,
      rankNumber: currentRank,
    });

    setPendingOption(null);
    setOptionSelectedAt(null);
  }

  function handleClearSelections(event?: MouseEvent<HTMLButtonElement>) {
    addClickLog(event, {
      eventType: "clear_selections_click",
      elementId: "clear-selections",
      elementLabel: "Clear selections",
      rankNumber: currentRank,
    });

    setAvailableOptions(options);
    setSelectedRanking([]);
    setPendingOption(null);
    resetChoiceTracking();
  }

  function removeFromCart(
    optionId: string,
    event?: MouseEvent<HTMLButtonElement>
  ) {
    const removedOption = selectedRanking.find(
      (option) => option.id === optionId
    );

    if (!removedOption) return;

    addClickLog(event, {
      eventType: "remove_from_cart_click",
      elementId: `remove-${optionId}`,
      elementLabel: `Remove ${removedOption.title}`,
      option: removedOption,
      rankNumber:
        selectedRanking.findIndex((option) => option.id === optionId) + 1,
    });

    const remainingRanking = selectedRanking.filter(
      (option) => option.id !== optionId
    );

    const restoredOption: RankingOption = {
      ...removedOption,
      screenStartedAt: undefined,
      optionSelectedAt: undefined,
      purchaseConfirmedAt: undefined,
      timeSpentBeforeChoiceMs: undefined,
      timeSpentBeforeChoiceSeconds: undefined,
      timeTakenToConfirmMs: undefined,
      timeTakenToConfirmSeconds: undefined,
      changedPreferenceBeforeConfirming: undefined,
      initialSelectedOptionId: undefined,
      finalConfirmedOptionId: undefined,
    };

    setSelectedRanking(remainingRanking);
    setAvailableOptions((current) => [...current, restoredOption]);
    setPendingOption(null);
    resetChoiceTracking();
  }

  function reorderSelectedRankingOverTarget(
    targetId: string,
    clientX: number,
    clientY: number
  ) {
    const currentId = draggedCartOptionIdRef.current;

    if (!isReorderEnabled || !currentId || currentId === targetId) return;

    setSelectedRanking((currentRanking) => {
      const fromIndex = currentRanking.findIndex((option) => option.id === currentId);
      const toIndex = currentRanking.findIndex((option) => option.id === targetId);

      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
        return currentRanking;
      }

      const movedOption = currentRanking[fromIndex];
      setDragDirection(toIndex > fromIndex ? "down" : "up");

      setClickLogs((currentLogs) => [
        ...currentLogs,
        makeCartReorderLog(
          movedOption,
          fromIndex + 1,
          toIndex + 1,
          clientX,
          clientY
        ),
      ]);

      return moveItem(currentRanking, fromIndex, toIndex);
    });
  }

  function handleCartPointerDown(
    event: PointerEvent<HTMLLIElement>,
    optionId: string
  ) {
    if (!isReorderEnabled) return;
    if ((event.target as HTMLElement).closest("button")) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    draggedCartOptionIdRef.current = optionId;
    setDraggedCartOptionId(optionId);
    setDragDirection(null);
  }

  function handleCartPointerMove(event: PointerEvent<HTMLLIElement>) {
    if (!isReorderEnabled || !draggedCartOptionIdRef.current) return;

    const target = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>("[data-cart-option-id]");

    const targetId = target?.dataset.cartOptionId;

    if (targetId) {
      reorderSelectedRankingOverTarget(targetId, event.clientX, event.clientY);
    }
  }

  function handleCartPointerEnd(event: PointerEvent<HTMLLIElement>) {
    if (!isReorderEnabled) return;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    draggedCartOptionIdRef.current = null;
    setDraggedCartOptionId(null);
    setDragDirection(null);
  }

  function handleRankingCompleteClick(event?: MouseEvent<HTMLButtonElement>) {
    const completeClick = makeClickLog(event, {
      eventType: "ranking_complete_click",
      elementId: "ranking-complete",
      elementLabel: "Confirm full ranking",
      rankNumber: "complete",
    });

    const finalClickLogs = [...clickLogs, completeClick];

    setClickLogs(finalClickLogs);
    onRankingComplete(selectedRanking, finalClickLogs);
  }

  return (
    <div className="ranking-area">
      <header
        className={
          selectedRanking.length === options.length
            ? "ranking-toolbar ranking-toolbar--complete"
            : "ranking-toolbar"
        }
      >
        <div>
          <p>
            {t("common.session")} {sessionNumber}
            {sessionSuffix ? ` - ${sessionSuffix}` : ""}
          </p>

          <h2>
            {title ??
              (stepKeys[currentRank - 1]
                ? t(stepKeys[currentRank - 1])
                : `${t("ranking.stepN")} #${currentRank}`)}
          </h2>

          <span>{description ?? t("ranking.instruction")}</span>
        </div>

        {location !== "PUCPR" && (
          <button
            type="button"
            className="clear-selections-button"
            onClick={handleClearSelections}
          >
            {t("ranking.clear")}
          </button>
        )}
      </header>

      <div className="ranking-layout">
        <section className="product-grid">
          <AnimatePresence mode="popLayout">
            {availableOptions.map((option, index) => (
              <motion.div
                key={option.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{
                  opacity: 0,
                  scale: 0.9,
                  transition: { duration: 0.18 },
                }}
                transition={{ duration: 0.28, ease: "easeInOut" }}
              >
                <div
                  onClickCapture={(event) => {
                    const target = event.target as HTMLElement;

                    if (
                      target.closest("button") ||
                      target.closest("a")
                    ) {
                      return;
                    }

                    handleSelect(option, event);
                  }}
                >
                  <ProductCard
                    option={option}
                    displayedPosition={index + 1}
                    location={location}
                    sealZoom={sealZoom}
                    onSelect={() => handleSelect(option)}
                    onSealClick={
                      onSealClick
                        ? () => {
                            addClickLog(undefined, {
                              eventType: "seal_image_click",
                              elementId: `seal-${option.sealId || ""}`,
                              elementLabel: option.subtitle || option.title,
                              option,
                              rankNumber: currentRank,
                            });
                            onSealClick(option.sealId);
                          }
                        : undefined
                    }
                  />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </section>

        <aside
          className={`selection-cart${
            selectedRanking.length === options.length
              ? " selection-cart--complete"
              : ""
          }`}
        >
          <div className="cart-header">
            <div>
              {t("ranking.cartTitle") && <p>{t("ranking.cartTitle")}</p>}
              <h3>{t("ranking.cartSubtitle")}</h3>
            </div>

            <span>
              {selectedRanking.length}/{options.length}
            </span>
          </div>

          {selectedRanking.length === 0 ? (
            <div className="empty-cart">
              <strong>{t("ranking.cartEmpty")}</strong>
              <p>{t("ranking.cartEmptyDesc")}</p>
            </div>
          ) : (
            <>
            {isReorderEnabled && (
              <p className="cart-reorder-instruction">
                {t("final.dragInstruction")}
              </p>
            )}
            <ol
              className={
                isReorderEnabled
                  ? "cart-list cart-list--reorderable"
                  : "cart-list"
              }
            >
              {selectedRanking.map((option, index) => {
                const isDragging =
                  isReorderEnabled && draggedCartOptionId === option.id;

                return (
                <motion.li
                  key={option.id}
                  layout
                  transition={{
                    layout: {
                      type: "spring",
                      stiffness: 420,
                      damping: 34,
                      mass: 0.8,
                    },
                  }}
                  animate={
                    isDragging
                      ? { scale: 1.025, y: -4 }
                      : { scale: 1, y: 0 }
                  }
                  data-cart-option-id={option.id}
                  className={
                    isDragging
                      ? "cart-item cart-item--draggable cart-item--dragging"
                      : isReorderEnabled
                        ? "cart-item cart-item--draggable"
                        : "cart-item"
                  }
                  onPointerDown={(event) => handleCartPointerDown(event, option.id)}
                  onPointerMove={handleCartPointerMove}
                  onPointerUp={handleCartPointerEnd}
                  onPointerCancel={handleCartPointerEnd}
                >
                  <div className="cart-rank">
                    <span>#{index + 1}</span>
                    {isDragging && dragDirection && (
                      <span
                        className={`cart-rank-arrow cart-rank-arrow--${dragDirection}`}
                        aria-hidden="true"
                      >
                        {dragDirection === "up" ? "▲" : "▼"}
                      </span>
                    )}
                  </div>

                  <div className="cart-item-info">
                    <strong>{option.title}</strong>
                    <span>{option.subtitle}</span>

                    {showPriceInCart &&
                      typeof option.price === "number" && (
                        <span className="cart-item-price">
                          {formatOptionPrice(option)}
                        </span>
                      )}
                  </div>

                  <button
                    type="button"
                    onClick={(event) => removeFromCart(option.id, event)}
                    aria-label={`${t("ranking.removeAria")} ${option.title}`}
                  >
                    x
                  </button>
                </motion.li>
                );
              })}
            </ol>
            </>
          )}

          {selectedRanking.length === options.length && (
            <button
              type="button"
              className="cart-complete-button"
              style={{
                background:
                  locationColors[location ?? ""] ?? "#bb0b0b",
              }}
              onClick={handleRankingCompleteClick}
            >
              {t("ranking.confirm")}
            </button>
          )}
        </aside>
      </div>

      <ConfirmModal
        open={Boolean(pendingOption)}
        title={t("ranking.modalTitle")}
        message={
          pendingOption
            ? `${t("ranking.modalQ.pre")} "${pendingOption.title}${
                pendingOption.subtitle
                  ? ` - ${pendingOption.subtitle}`
                  : ""
              }" ${t("ranking.modalQ.mid")} ${
                ordKeys[currentRank - 1]
                  ? t(ordKeys[currentRank - 1])
                  : currentRank
              } ${t("ranking.modalQ.suf")}`
            : ""
        }
        confirmColor={
          locationColors[location ?? ""] ?? "#bb0b0b"
        }
        onConfirm={handleConfirmChoice}
        onCancel={handleCancelChoice}
      />
    </div>
  );
}

