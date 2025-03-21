import { useState, useCallback, useMemo, useEffect } from "react";
import { useWebSocket } from "../../../hooks/useWebSocket";
import { useTimer } from "../../Timer";
import { LogPanel } from "../../LogPanel";
import { TablesGrid } from "../../TablesGrid";
import { ResetButton } from "../../ResetButton";
import { StartButton } from "../../StartButton";
import { playSound } from "../../../utils/soundUtils";
import { getFormattedTime } from "../../../utils/timeUtils";
import clickSoundPath from "../../../shared/sound/click-sound.mp3";
import "./BrainRing.scss";

export const BrainRing = () => {
  const tables = useMemo(
    () => Array.from({ length: 12 }, (_, index) => index + 1),
    []
  );
  const [highlightedTables, setHighlightedTables] = useState([]);
  const [logs, setLogs] = useState([]);
  const { isTimerRunning, remainingTime, startTimer, stopTimer } = useTimer();

  const addLog = useCallback((message) => {
    setLogs((prevLogs) => {
      const newLogs = [`[${getFormattedTime()}] ${message}`, ...prevLogs];
      return newLogs.slice(0, 10); // Оставляем только последние 10 записей
    });
  }, []);

  const handleWebSocketMessage = useCallback((data) => {
    try {
      switch (data.type) {
        case "highlight":
          updateTableState(data.table, true);
          stopTimer();
          break;
        case "reset":
          updateTableState(data.table, false);
          break;
        case "initialState":
          setHighlightedTables((prev) => {
            const updatedTables = data.tables
              .filter((t) => t.type === "highlight")
              .map((t) => t.table);
            return updatedTables;
          });
          break;
        default:
          addLog(`Неизвестный тип сообщения: ${data.type}`);
      }
    } catch (error) {
      console.error("Ошибка при обработке WebSocket сообщения:", error);
      addLog("Ошибка при разборе сообщения WebSocket");
    }
  }, []);

  const updateTableState = useCallback(
    (table, isHighlighted) => {
      setHighlightedTables((prev) => {
        const updatedTables = isHighlighted
          ? [...prev, table]
          : prev.filter((t) => t !== table);

        if (isHighlighted) {
          addLog(`Подсвечиваем стол: ${table}`);
          playSound(clickSoundPath);
        }

        return updatedTables;
      });
    },
    [addLog, playSound]
  );

  const wsUrl = "ws://localhost:8080";
  const wsRef = useWebSocket(wsUrl, handleWebSocketMessage);

  const resetAllTables = useCallback(() => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      setHighlightedTables([]); // Очищаем локальное состояние
      setLogs([]);
      ws.send(JSON.stringify({ type: "resetAll" }));
      addLog("Сброс всех столов");
    } else {
      console.warn("WebSocket не готов к отправке сообщения.");
    }
  }, [addLog]);

  const handleStartButtonClick = useCallback(() => {
    if (isTimerRunning) {
      // Если таймер запущен, останавливаем его и сбрасываем состояние столов
      stopTimer();
      resetAllTables();
      addLog("Таймер остановлен. Столы сброшены.");
    } else {
      // Если таймер остановлен, запускаем его (без сброса столов)
      startTimer();
      resetAllTables();
      addLog("Таймер запущен.");
    }
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
        <h1>Брейн-ринг: Телеметрия столов</h1>
        <TablesGrid tables={tables} highlightedTables={highlightedTables} />
        <ResetButton onClick={resetAllTables} />
        <StartButton
          isTimerRunning={isTimerRunning}
          remainingTime={remainingTime}
          onClick={handleStartButtonClick}
        />
      </div>
    </div>
  );
};
