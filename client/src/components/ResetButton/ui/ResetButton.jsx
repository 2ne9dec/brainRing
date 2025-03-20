import "./ResetButton.css";

export const ResetButton = ({ onClick }) => {
  return (
    <button className="reset-button" onClick={onClick}>
      Сбросить состояние всех столов
    </button>
  );
};
