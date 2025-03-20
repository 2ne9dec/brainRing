import "./StartButton.css";

export const StartButton = ({ isTimerRunning, remainingTime, onClick }) => {
  return (
    <button className="start-button" onClick={onClick}>
      {isTimerRunning ? `Осталось: ${remainingTime} сек` : "Старт"}
    </button>
  );
};
