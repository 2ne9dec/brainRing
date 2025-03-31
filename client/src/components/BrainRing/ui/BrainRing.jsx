import React, { useState, useEffect, useCallback, useMemo } from "react";
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
import "./BrainRing.scss";

export const BrainRing = () => {
  const wsUrl = "ws://localhost:8080";
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [currentQuestionId, setCurrentQuestionId] = useState(() => {
    const savedId = localStorage.getItem("currentQuestionId");
    return savedId ? parseInt(savedId, 10) : 1;
  });

  const tables = Array.from({ length: 12 }, (_, index) => index + 1);
  const [highlightedTables, setHighlightedTables] = useState([]);

  // Управление счетом
  const [scores, setScores] = useState(() => {
    const savedScores = localStorage.getItem("scores");
    if (savedScores) {
      return JSON.parse(savedScores);
    }
    // Инициализация из tableNames
    const initialScores = {};
    Object.keys(tableNames).forEach((table) => {
      initialScores[table] = tableNames[table].scores || 0;
    });
    return initialScores;
  });

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

  const updateScore = useCallback((table, newScore) => {
    setScores((prevScores) => ({
      ...prevScores,
      [table]: Math.max(newScore, 0),
    }));
  }, []);

  const incrementScore = useCallback((table) => updateScore(table, (scores[table] || 0) + 1), [scores, updateScore]);

  const decrementScore = useCallback((table) => updateScore(table, (scores[table] || 0) - 1), [scores, updateScore]);

  useEffect(() => {
    localStorage.setItem("scores", JSON.stringify(scores));
  }, [scores]);

  const updateTableState = useCallback(
    (table, isHighlighted) => {
      setHighlightedTables((prev) => {
        const updatedTables = isHighlighted ? [...prev, table] : prev.filter((t) => t !== table);
        return updatedTables;
      });

      if (isHighlighted && isTimerRunning) {
        addLog(`${tableNames[table].team} подсветил стол "${tableNames[table].table}"`);
        playSound(clickSoundPath);
        navigate("/");
      }
    },
    [addLog, isTimerRunning, navigate]
  );

  const handleMessage = useMemo(
    () => createMessageHandlers(isTimerRunning, addLog, updateTableState, stopTimer, setHighlightedTables),
    [isTimerRunning, addLog, updateTableState, stopTimer, setHighlightedTables]
  );

  const memoizedHandleMessage = useCallback(handleMessage, [handleMessage]);
  const wsRef = useWebSocket(wsUrl, memoizedHandleMessage);

  const resetAllTables = useCallback(() => {
    resetAllTablesLogic(wsRef, setHighlightedTables, setLogs, addLog, setScores);
  }, [wsRef, setHighlightedTables, setLogs, addLog, setScores]);

  const { handleStartButtonClick } = useMemo(
    () => createGameControls(isTimerRunning, startTimer, stopTimer, resetAllTables, addLog),
    [isTimerRunning, startTimer, stopTimer, resetAllTables, addLog]
  );

  const goToQuestionsPage = (id = currentQuestionId) => {
    setCurrentQuestionId(id);
    localStorage.setItem("currentQuestionId", id);
    navigate(`/questions/${id}`);
  };

  const goToTablesPage = () => {
    navigate("/");
  };

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
        <Routes>
          <Route
            path="/"
            element={
              <>
                <TablesGrid
                  tables={tables}
                  highlightedTables={highlightedTables}
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
