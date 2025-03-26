import { useCallback } from "react";
import { playSound } from "../utils/soundUtils";
import clickSoundPath from "../shared/sound/click-sound.mp3";

export const useBrainRingWebSocket = (
  wsUrl,
  isTimerRunning,
  addLog,
  updateTableState,
  stopTimer,
  setHighlightedTables // Новое: функция для установки начального состояния
) => {
  // Обработка сообщений типа "highlight"
  const handleHighlightMessage = useCallback(
    (data) => {
      const { table } = data;

      addLog(`Стол ${table} нажал кнопку`);

      if (!isTimerRunning) return;

      updateTableState(table, true);
      stopTimer();
      playSound(clickSoundPath);
    },
    [addLog, isTimerRunning, updateTableState, stopTimer]
  );

  // Обработка сообщений типа "reset"
  const handleResetMessage = useCallback(
    (data) => {
      if (!isTimerRunning) return;
      updateTableState(data.table, false);
    },
    [updateTableState, isTimerRunning]
  );

  // Обработка сообщений типа "initialState"
  const handleInitialStateMessage = useCallback(
    (data) => {
      const updatedTables = data.tables
        .filter((t) => t.type === "highlight")
        .map((t) => t.table);

      // Устанавливаем начальное состояние подсвеченных столов
      setHighlightedTables(updatedTables);
    },
    [setHighlightedTables]
  );

  // Основная функция для обработки всех типов сообщений
  const handleMessage = useCallback(
    (data) => {
      try {
        switch (data.type) {
          case "highlight":
            handleHighlightMessage(data);
            break;
          case "reset":
            handleResetMessage(data);
            break;
          case "initialState":
            handleInitialStateMessage(data); // Вызываем обработчик initialState
            break;
          default:
            addLog(`Неизвестный тип сообщения: ${data.type}`);
        }
      } catch (error) {
        console.error("Ошибка при обработке WebSocket сообщения:", error);
        addLog("Ошибка при разборе сообщения WebSocket");
      }
    },
    [
      handleHighlightMessage,
      handleResetMessage,
      handleInitialStateMessage,
      addLog,
    ]
  );

  return handleMessage;
};
