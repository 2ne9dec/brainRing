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
  const firstColumn = leaderboard.slice(0, Math.ceil(leaderboard.length / 2)); // Первая половина
  const secondColumn = leaderboard.slice(Math.ceil(leaderboard.length / 2)); // Вторая половина

  return (
    <div className="leaderboard">
      <h2>Таблица лидеров</h2>
      <div className="leaderboard-grid">
        <div className="leaderboard-column">
          {firstColumn.map((item, index) => {
            let positionClass = "";
            if (index === 0) positionClass = "gold";
            else if (index === 1) positionClass = "silver";
            else if (index === 2) positionClass = "bronze";

            return (
              <div
                key={index}
                className={`leaderboard-item ${positionClass}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <span className="position">{index + 1}</span>
                <span className="team">{item.team}</span>
                <span className="score">{item.score}</span>
              </div>
            );
          })}
        </div>
        <div className="leaderboard-column">
          {secondColumn.map((item, index) => {
            const globalIndex = firstColumn.length + index; // Глобальный индекс для определения позиции
            let positionClass = "";
            if (globalIndex === 0) positionClass = "gold";
            else if (globalIndex === 1) positionClass = "silver";
            else if (globalIndex === 2) positionClass = "bronze";

            return (
              <div
                key={index + firstColumn.length}
                className={`leaderboard-item ${positionClass}`}
                style={{ animationDelay: `${globalIndex * 100}ms` }}
              >
                <span className="position">{globalIndex + 1}</span>
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
