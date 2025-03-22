import { useState, useCallback, useEffect } from "react";
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

  // Обработка сообщений WebSocket
  const handleHighlightMessage = useCallback(
    (data) => {
      const { table } = data;

      // Всегда логируем нажатие кнопки
      addLog(`Стол ${table} нажал кнопку`);

      // Подсветка работает только при запущенном таймере
      if (!isTimerRunning) {
        // Убрано логирование "Подсветка заблокирована"
        return;
      }

      updateTableState(table, true);
      stopTimer();
    },
    [updateTableState, stopTimer, isTimerRunning, addLog]
  );

  const handleResetMessage = useCallback(
    (data) => {
      if (!isTimerRunning) {
        // Убрано логирование "Сброс столов заблокирован"
        return;
      }

      updateTableState(data.table, false);
    },
    [updateTableState, isTimerRunning]
  );

  const handleInitialStateMessage = useCallback((data) => {
    setHighlightedTables((prev) => {
      const updatedTables = data.tables
        .filter((t) => t.type === "highlight")
        .map((t) => t.table);
      return updatedTables;
    });
  }, []);

  const handleWebSocketMessage = useCallback(
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
            handleInitialStateMessage(data);
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
      addLog,
      handleHighlightMessage,
      handleResetMessage,
      handleInitialStateMessage,
    ]
  );

  const wsUrl = "ws://localhost:8080";
  const wsRef = useWebSocket(wsUrl, handleWebSocketMessage);

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
        {/* Заголовок и кнопки */}
        <div className="header-section">
          <h1>Брейн-ринг: Телеметрия столов</h1>
          <div className="button-group">
            <ResetButton onClick={resetAllTables} />
            <StartButton
              isTimerRunning={isTimerRunning}
              remainingTime={remainingTime}
              onClick={handleStartButtonClick}
            />
          </div>
        </div>
        {/* Сетка столов */}
        <TablesGrid tables={tables} highlightedTables={highlightedTables} />
      </div>
    </div>
  );
};
