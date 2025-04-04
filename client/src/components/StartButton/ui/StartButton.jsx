import { memo } from "react";

export const StartButton = memo(({ isTimerRunning, remainingTime, onClick }) => {
  return (
    <button className="start-button" onClick={onClick}>
      {isTimerRunning ? `Осталось: ${remainingTime} сек` : "Старт"}
    </button>
  );
});
