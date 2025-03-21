import "./LogPanel.scss";

export const LogPanel = ({ logs }) => {
  return (
    <div className="log-panel">
      <h2>Логи</h2>
      <div className="log-list">
        {logs.map((log, index) => (
          <div key={index} className="log-item">
            {log}
          </div>
        ))}
      </div>
    </div>
  );
};
