import { useState, useEffect, useCallback } from "react";
import { tableNames } from "../config/tableConfig";

export const useScores = () => {
  // Инициализация счета
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

  // Обновление счета
  const updateScore = useCallback((table, newScore) => {
    setScores((prevScores) => ({
      ...prevScores,
      [table]: Math.max(newScore, 0),
    }));
  }, []);

  const incrementScore = useCallback((table) => updateScore(table, (scores[table] || 0) + 1), [scores, updateScore]);

  const decrementScore = useCallback((table) => updateScore(table, (scores[table] || 0) - 1), [scores, updateScore]);

  // Сброс счета
  const resetScores = useCallback(() => {
    const initialScores = {};
    Object.keys(tableNames).forEach((table) => {
      initialScores[table] = 0; // Устанавливаем счет каждой команды в 0
    });
    setScores(initialScores); // Обновляем состояние
  }, []);

  // Сохранение счета в localStorage
  useEffect(() => {
    localStorage.setItem("scores", JSON.stringify(scores));
  }, [scores]);

  return { scores, incrementScore, decrementScore, updateScore, resetScores };
};
