import { memo } from "react";
import "./TablesGrid.scss";

export const TablesGrid = memo(({ tables, highlightedTables }) => {
  return (
    <div className="tables-grid">
      {tables.map((tableNumber) => (
        <div key={tableNumber} className="table-container">
          <div
            className={`table ${
              highlightedTables.includes(tableNumber) ? "highlighted" : ""
            }`}
          >
            <div className="table-top"></div>
            <div className="table-leg left-leg"></div>
            <div className="table-leg right-leg"></div>
            <span className="table-number">Стол {tableNumber}</span>
          </div>
        </div>
      ))}
    </div>
  );
});
