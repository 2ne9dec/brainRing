import { useState, useEffect } from "react";

export const useTableScores = (numberOfTables) => {
  // Загрузка сохранённых данных из localStorage
  const loadScoresFromLocalStorage = () => {
    const savedScores = localStorage.getItem("tableScores");
    if (savedScores) {
      return JSON.parse(savedScores);
    }
    // Если данных нет, инициализируем нулевыми значениями
    return Array.from({ length: numberOfTables }, (_, index) => index + 1).reduce((acc, table) => {
      acc[table] = 0;
      return acc;
    }, {});
  };

  // Инициализация состояния счёта
  const [scores, setScores] = useState(loadScoresFromLocalStorage);

  // Сохранение данных в localStorage при изменении счёта
  useEffect(() => {
    localStorage.setItem("tableScores", JSON.stringify(scores));
  }, [scores]);

  // Увеличение счёта
  const incrementScore = (table) => {
    setScores((prevScores) => ({
      ...prevScores,
      [table]: prevScores[table] + 1,
    }));
  };

  // Уменьшение счёта
  const decrementScore = (table) => {
    setScores((prevScores) => ({
      ...prevScores,
      [table]: Math.max(prevScores[table] - 1, 0), // Не позволяем счёт быть меньше 0
    }));
  };

  // Изменение счёта через поле ввода
  const updateScore = (table, value) => {
    const parsedValue = parseInt(value, 10);
    if (!isNaN(parsedValue)) {
      setScores((prevScores) => ({
        ...prevScores,
        [table]: Math.max(parsedValue, 0), // Не позволяем вводить отрицательные значения
      }));
    }
  };

  const resetScores = () => {
    const initialScores = Array.from({ length: numberOfTables }, (_, index) => index + 1).reduce((acc, table) => {
      acc[table] = 0;
      return acc;
    }, {});
    setScores(initialScores);
    localStorage.removeItem("tableScores"); // Удаляем данные из localStorage
  };

  return { scores, incrementScore, decrementScore, updateScore, resetScores };
};
