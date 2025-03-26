import { ResetButton } from "../../ResetButton";
import { StartButton } from "../../StartButton";
import "./HeaderSection.scss";

export const HeaderSection = ({
  onReset,
  onStartButtonClick,
  isTimerRunning,
  remainingTime,
}) => {
  return (
    <div className="header-section">
      <h1>Брейн-ринг</h1>
      <div className="button-group">
        <ResetButton onClick={onReset} />
        <StartButton
          isTimerRunning={isTimerRunning}
          remainingTime={remainingTime}
          onClick={onStartButtonClick}
        />
      </div>
    </div>
  );
};
