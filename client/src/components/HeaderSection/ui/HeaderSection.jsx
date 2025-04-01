import { useNavigate } from "react-router-dom";
import { ResetButton } from "../../ResetButton";
import { StartButton } from "../../StartButton";
import "./HeaderSection.scss";

export const HeaderSection = ({ onReset, onStartButtonClick, isTimerRunning, remainingTime }) => {
  const navigate = useNavigate();
  const goToLeaderboardPage = () => {
    navigate("/leaderboard");
  };

  const goToTablesPage = () => {
    navigate("/");
  };

  return (
    <div className="header-section">
      <h1 onClick={goToTablesPage}>Брейн-ринг</h1>
      <div className="button-group">
        <button className="goToLeaderBoard" onClick={goToLeaderboardPage}>
          Таблица лидеров
        </button>
        <ResetButton onClick={onReset} />
        <StartButton isTimerRunning={isTimerRunning} remainingTime={remainingTime} onClick={onStartButtonClick} />
      </div>
    </div>
  );
};
