import { memo } from "react";

export const ResetButton = memo(({ onClick }) => {
  return (
    <button className="reset-button" onClick={onClick}>
      Сбросить состояние столов
    </button>
  );
});
