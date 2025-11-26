import { useState, useCallback, useMemo } from "react";
import { useWebSocket } from "../../../hooks/useWebSocket";
import { useTimer } from "../../../hooks/useTimer";
import { LogPanel } from "../../LogPanel";
import { Leaderboard } from "../../Leaderboard";
import { playSound } from "../../../utils/soundUtils";
import { getFormattedTime } from "../../../utils/timeUtils";
import { HeaderSection } from "../../HeaderSection";
import { resetAllTablesLogic } from "../../../utils/resetAllTablesLogic";
import { createGameControls } from "../../../utils/createGameControls";
import { createMessageHandlers } from "../../../utils/createMessageHandlers";
import { tableNames } from "../../../config/tableConfig";
import { QuestionsPage } from "../../QuestionsPage";
import { Route, Routes, useNavigate } from "react-router-dom";
import { TablesGrid } from "components/TablesGrid";
import clickSoundPath from "../../../shared/sound/click-sound.mp3";
import { useScores } from "../../../hooks/useScores";
import "./BrainRing.scss";

export const BrainRing = () => {
  const wsUrl = "ws://localhost:8080";
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [currentQuestionId, setCurrentQuestionId] = useState(() => {
    const savedId = localStorage.getItem("currentQuestionId");
    return savedId ? parseInt(savedId, 10) : 1;
  });

  // 🔑 КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: храним ТОЛЬКО ID первого нажатого стола
  const [lockedTable, setLockedTable] = useState(() => {
    const saved = localStorage.getItem("lockedTable");
    return saved ? parseInt(saved, 10) : null;
  });

  const tables = Array.from({ length: 12 }, (_, index) => index + 1);

  const { scores, incrementScore, decrementScore, updateScore, resetScores } = useScores();

  const { isTimerRunning, remainingTime, startTimer, stopTimer } = useTimer();

  // Логирование событий
  const addLog = useCallback((message) => {
    setLogs((prevLogs) => {
      const isDuplicate = prevLogs.some((log) => log.includes(message));
      if (isDuplicate) return prevLogs;

      const newLogs = [`[${getFormattedTime()}] ${message}`, ...prevLogs];
      return newLogs.slice(0, 20);
    });
  }, []);

  const updateTableState = useCallback(
    (table, isHighlighted) => {
      // Если уже есть зафиксированный стол — игнорируем ВСЕ новые события
      if (lockedTable !== null) {
        return;
      }

      // Только если ещё не фиксировано — разрешаем первое нажатие
      if (isHighlighted) {
        // Фиксируем первый стол
        setLockedTable(table);
        localStorage.setItem("lockedTable", table.toString());
        addLog(`${tableNames[table].team} подсветила "${tableNames[table].table}"`);
        playSound(clickSoundPath);
        navigate("/");
      }
    },
    [lockedTable, addLog, navigate]
  );

  const handleMessage = useMemo(
    () => createMessageHandlers(isTimerRunning, addLog, updateTableState, stopTimer, () => {}),
    [isTimerRunning, addLog, updateTableState, stopTimer]
  );

  const memoizedHandleMessage = useCallback(handleMessage, [handleMessage]);
  const wsRef = useWebSocket(wsUrl, memoizedHandleMessage);

  // Функция для сброса игры — сбрасывает фиксацию
  const resetGame = useCallback(() => {
    resetAllTablesLogic(wsRef, () => {}, setLogs, addLog); // 👈 не трогаем lockedTable — он сбрасывается ниже
    localStorage.removeItem("lockedTable"); // 👈 ОБЯЗАТЕЛЬНО сбрасываем!
    setLockedTable(null); // 👈 Сбрасываем в состоянии React
  }, [wsRef, setLogs, addLog]);

  // Логика кнопки "Старт" — сбрасывает фиксацию
  const { handleStartButtonClick } = useMemo(
    () => createGameControls(isTimerRunning, startTimer, stopTimer, resetGame, addLog),
    [isTimerRunning, startTimer, stopTimer, resetGame, addLog]
  );

  // Логика кнопки "Сбросить всё"
  const handleResetAll = useCallback(() => {
    resetScores();
    resetGame();
  }, [resetScores, resetGame]);

  const goToQuestionsPage = (id = currentQuestionId) => {
    setCurrentQuestionId(id);
    localStorage.setItem("currentQuestionId", id);
    navigate(`/questions/${id}`);
  };

  const goToTablesPage = () => {
    navigate("/");
  };

  // ✅ ВАЖНО: передаём в TablesGrid **только один зафиксированный стол**, если есть
  const highlightedTables = lockedTable !== null ? [lockedTable] : [];

  return (
    <div className="brain-ring-container">
      <LogPanel logs={logs} />
      <div className="main-content">
        <HeaderSection
          onReset={handleResetAll}
          onStartButtonClick={handleStartButtonClick}
          isTimerRunning={isTimerRunning}
          remainingTime={remainingTime}
        />
        <Routes>
          <Route
            path="/"
            element={
              <>
                <TablesGrid
                  tables={tables}
                  highlightedTables={highlightedTables} // 👈 ТОЛЬКО фиксированный стол
                  scores={scores}
                  incrementScore={incrementScore}
                  decrementScore={decrementScore}
                  updateScore={updateScore}
                />
                <div className="navigation-button-container">
                  <button onClick={() => goToQuestionsPage(currentQuestionId)}>
                    Перейти к вопросу №{currentQuestionId}
                  </button>
                </div>
              </>
            }
          />
          <Route
            path="/questions/:questionId"
            element={
              <>
                <QuestionsPage
                  currentQuestionId={currentQuestionId}
                  onNextQuestion={(nextId) => {
                    setCurrentQuestionId(nextId);
                    localStorage.setItem("currentQuestionId", nextId);
                    navigate(`/questions/${nextId}`);
                  }}
                  onPreviousQuestion={(prevId) => {
                    setCurrentQuestionId(prevId);
                    localStorage.setItem("currentQuestionId", prevId);
                    navigate(`/questions/${prevId}`);
                  }}
                />
                <div className="navigation-button-container">
                  <button onClick={goToTablesPage}>Перейти к столам</button>
                </div>
              </>
            }
          />
          <Route
            path="/leaderboard"
            element={
              <>
                <Leaderboard scores={scores} />
                <div className="navigation-button-container">
                  <button onClick={goToTablesPage}>Перейти к столам</button>
                </div>
              </>
            }
          />
        </Routes>
      </div>
    </div>
  );
};
