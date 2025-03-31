import React from "react";
import { tableNames } from "../../../config/tableConfig";
import "./Leaderboard.scss";

export const Leaderboard = ({ scores }) => {
  // Создаем массив лидеров
  const leaderboard = Object.keys(tableNames)
    .map((table) => ({
      team: tableNames[table].team,
      score: scores[table] || 0,
    }))
    .sort((a, b) => b.score - a.score); // Сортировка по убыванию счета

  // Разделяем массив на две колонки
  const firstColumn = leaderboard.slice(0, 6); // Команды с 1 по 6 место
  const secondColumn = leaderboard.slice(6, 12); // Команды с 7 по 12 место

  return (
    <div className="leaderboard">
      <h2>Таблица лидеров</h2>
      <div className="leaderboard-grid">
        {/* Первый столбец */}
        <div className="leaderboard-column">
          {firstColumn.map((item, index) => {
            let positionClass = "";
            if (index === 0) positionClass = "gold";
            else if (index === 1) positionClass = "silver";
            else if (index === 2) positionClass = "bronze";

            return (
              <div key={index} className={`leaderboard-item ${positionClass}`}>
                <span className="position">{index + 1}</span>
                <span className="team">{item.team}</span>
                <span className="score">{item.score}</span>
              </div>
            );
          })}
        </div>

        {/* Второй столбец */}
        <div className="leaderboard-column">
          {secondColumn.map((item, index) => {
            return (
              <div key={index + 6} className="leaderboard-item">
                <span className="position">{index + 7}</span>
                <span className="team">{item.team}</span>
                <span className="score">{item.score}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
