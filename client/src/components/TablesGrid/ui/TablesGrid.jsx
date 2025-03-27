import { memo } from "react";
import { tableNames } from "../../../config/tableConfig";
import "./TablesGrid.scss";

export const TablesGrid = memo(({ tables, highlightedTables, scores, incrementScore, decrementScore, updateScore }) => {
  return (
    <div className="tables-grid">
      {tables.map((tableNumber) => (
        <div key={tableNumber} className="table-container">
          {/* Стол */}
          <div className={`table ${highlightedTables.includes(tableNumber) ? "highlighted" : ""}`}>
            <div className="table-top"></div>
            <div className="table-leg left-leg"></div>
            <div className="table-leg right-leg"></div>
            <span className="table-number">{tableNames[tableNumber]}</span> {/* Используем название из конфига */}
          </div>

          {/* Управление счётом */}
          <div className="table-controls">
            <button onClick={() => decrementScore(tableNumber)}>-</button>
            <input
              type="number"
              value={scores[tableNumber]}
              onChange={(e) => updateScore(tableNumber, e.target.value)}
            />
            <button onClick={() => incrementScore(tableNumber)}>+</button>
          </div>
        </div>
      ))}
    </div>
  );
});
