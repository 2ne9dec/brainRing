import { useState, useCallback, useMemo } from "react";
import { useWebSocket } from "../../../hooks/useWebSocket";
import { useTimer } from "../../Timer";
import { LogPanel } from "../../LogPanel";
import { TablesGrid } from "../../TablesGrid";
import { playSound } from "../../../utils/soundUtils";
import { getFormattedTime } from "../../../utils/timeUtils";
import { HeaderSection } from "../../HeaderSection";
import { resetAllTablesLogic } from "../../../utils/resetAllTablesLogic";
import { createGameControls } from "../../../utils/createGameControls";
import { createMessageHandlers } from "../../../utils/createMessageHandlers";
import clickSoundPath from "../../../shared/sound/click-sound.mp3";
import "./BrainRing.scss";

export const BrainRing = () => {
  const wsUrl = "ws://localhost:8080";
  const tables = Array.from({ length: 12 }, (_, index) => index + 1);
  const [highlightedTables, setHighlightedTables] = useState([]);
  const [logs, setLogs] = useState([]);
  const { isTimerRunning, remainingTime, startTimer, stopTimer } = useTimer();

  // Логирование событий
  const addLog = useCallback((message) => {
    setLogs((prevLogs) => {
      const newLogs = [`[${getFormattedTime()}] ${message}`, ...prevLogs];
      return newLogs.slice(0, 20); // Оставляем только последние 20 записей
    });
  }, []);

  // Обновление состояния столов
  const updateTableState = useCallback(
    (table, isHighlighted) => {
      setHighlightedTables((prev) => {
        const updatedTables = isHighlighted
          ? [...prev, table]
          : prev.filter((t) => t !== table);
        return updatedTables;
      });

      if (isHighlighted && isTimerRunning) {
        addLog(`Подсвечиваем стол: ${table}`);
        playSound(clickSoundPath);
      }
    },
    [addLog, isTimerRunning]
  );

  // Мемоизация обработчика сообщений WebSocket
  const handleMessage = useMemo(
    () =>
      createMessageHandlers(
        isTimerRunning,
        addLog,
        updateTableState,
        stopTimer,
        setHighlightedTables
      ),
    [isTimerRunning, addLog, updateTableState, stopTimer, setHighlightedTables]
  );

  // Мемоизация memoizedHandleMessage
  const memoizedHandleMessage = useCallback(handleMessage, [handleMessage]);

  const wsRef = useWebSocket(wsUrl, memoizedHandleMessage);

  // Сброс всех столов
  const resetAllTables = useCallback(() => {
    resetAllTablesLogic(wsRef, setHighlightedTables, setLogs, addLog);
  }, [wsRef, setHighlightedTables, setLogs, addLog]);

  // Создание игровых элементов управления
  const { handleStartButtonClick } = createGameControls(
    isTimerRunning,
    startTimer,
    stopTimer,
    resetAllTables,
    addLog
  );

  return (
    <div className="brain-ring-container">
      <LogPanel logs={logs} />
      <div className="main-content">
        <HeaderSection
          onReset={resetAllTables}
          onStartButtonClick={handleStartButtonClick}
          isTimerRunning={isTimerRunning}
          remainingTime={remainingTime}
        />
        <TablesGrid tables={tables} highlightedTables={highlightedTables} />
      </div>
    </div>
  );
};
