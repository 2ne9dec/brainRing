export const createGameControls = (
  isTimerRunning,
  startTimer,
  stopTimer,
  resetAllTables,
  addLog
) => {
  // Логика кнопки "Старт"
  const handleStartButtonClick = () => {
    if (isTimerRunning) {
      stopTimer();
      addLog("Таймер остановлен. Столы сброшены.");
    } else {
      startTimer();
      addLog("Таймер запущен.");
    }
    resetAllTables();
  };

  return { handleStartButtonClick };
};
