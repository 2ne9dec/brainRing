import { memo } from "react";
import "./ResetButton.scss";

export const ResetButton = memo(({ onClick }) => {
  return (
    <button className="reset-button" onClick={onClick}>
      Сбросить состояние всех столов
    </button>
  );
});
