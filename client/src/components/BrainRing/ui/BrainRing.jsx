import { useState, useCallback, useEffect } from "react";
import { useWebSocket } from "../../../hooks/useWebSocket";
import { useTimer } from "../../Timer";
import { LogPanel } from "../../LogPanel";
import { TablesGrid } from "../../TablesGrid";
import { playSound } from "../../../utils/soundUtils";
import { getFormattedTime } from "../../../utils/timeUtils";
import { HeaderSection } from "../../HeaderSection";
import { useBrainRingWebSocket } from "../../../hooks/useBrainRingWebSocket";
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

  const handleMessage = useBrainRingWebSocket(
    wsUrl,
    isTimerRunning,
    addLog,
    updateTableState,
    stopTimer,
    setHighlightedTables
  );

  const wsRef = useWebSocket(wsUrl, handleMessage);

  // Сброс всех столов
  const resetAllTables = useCallback(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket не готов к отправке сообщения.");
      return;
    }

    setHighlightedTables([]);
    setLogs([]);
    ws.send(JSON.stringify({ type: "resetAll" }));
    addLog("Сброс всех столов");
  }, [addLog, wsRef]);

  // Обработка нажатия кнопки запуска/остановки таймера
  const handleStartButtonClick = useCallback(() => {
    if (isTimerRunning) {
      stopTimer();
      addLog("Таймер остановлен. Столы сброшены.");
    } else {
      startTimer();
      addLog("Таймер запущен.");
    }
    resetAllTables();
  }, [isTimerRunning, startTimer, stopTimer, resetAllTables, addLog]);

  useEffect(() => {
    console.log("BrainRing mounted");

    return () => {
      console.log("BrainRing unmounted");
    };
  }, []);

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
