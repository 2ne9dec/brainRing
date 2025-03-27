import { playSound } from "./soundUtils";
import clickSoundPath from "../shared/sound/click-sound.mp3";

export const createMessageHandlers = (isTimerRunning, addLog, updateTableState, stopTimer, setHighlightedTables) => {
  // Основная функция для обработки всех типов сообщений
  const handleMessage = (data) => {
    try {
      switch (data.type) {
        case "highlight":
          // Обработка сообщений типа "highlight"
          const { table } = data;
          addLog(`Стол ${table} нажал кнопку`);

          if (!isTimerRunning) return;

          updateTableState(table, true);
          stopTimer();
          playSound(clickSoundPath);
          break;

        case "reset":
          // Обработка сообщений типа "reset"
          if (!isTimerRunning) return;
          updateTableState(data.table, false);
          break;

        case "initialState":
          // Обработка сообщений типа "initialState"
          const updatedTables = data.tables.filter((t) => t.type === "highlight").map((t) => t.table);

          setHighlightedTables(updatedTables);
          break;

        default:
          addLog(`Неизвестный тип сообщения: ${data.type}`);
      }
    } catch (error) {
      console.error("Ошибка при обработке WebSocket сообщения:", error);
      addLog("Ошибка при разборе сообщения WebSocket");
    }
  };

  return handleMessage;
};
