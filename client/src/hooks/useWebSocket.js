import { useEffect, useRef } from "react";

export const useWebSocket = (url, handleMessage) => {
  const wsRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);

  useEffect(() => {
    const maxReconnectAttempts = 10;
    const reconnectInterval = 5000;

    let isConnected = false; // Флаг для отслеживания состояния соединения

    const connect = () => {
      if (isConnected) return; // Защита от повторного вызова
      isConnected = true;

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected");
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleMessage(data);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", event.data);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      ws.onclose = () => {
        console.log("WebSocket closed");
        isConnected = false; // Сброс флага при закрытии соединения

        if (wsRef.current === ws) {
          wsRef.current = null;

          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            reconnectAttemptsRef.current++;
            console.log(
              `Попытка переподключения (${
                reconnectAttemptsRef.current
              }/${maxReconnectAttempts}) через ${
                reconnectInterval / 1000
              } секунд...`
            );
            setTimeout(connect, reconnectInterval);
          } else {
            console.error(
              "Превышено максимальное количество попыток переподключения."
            );
          }
        }
      };
    };

    connect();

    return () => {
      if (wsRef.current) {
        console.log("Cleaning up WebSocket connection...");
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [url, handleMessage]); // Зависимости остаются неизменными

  return wsRef;
};
