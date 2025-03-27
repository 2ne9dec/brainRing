export const resetAllTablesLogic = (wsRef, setHighlightedTables, setLogs, addLog) => {
  const ws = wsRef.current;
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    console.warn("WebSocket не готов к отправке сообщения.");
    return;
  }

  setHighlightedTables([]);
  setLogs([]);
  ws.send(JSON.stringify({ type: "resetAll" }));
  addLog("Сброс всех столов");
};
