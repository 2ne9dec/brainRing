import { useEffect, useRef } from "react";

export const useWebSocket = (url, handleMessage) => {
  const wsRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);

  useEffect(() => {
    const maxReconnectAttempts = 10;
    const reconnectInterval = 5000;

    const connect = () => {
      if (wsRef.current) return;

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected");
        reconnectAttemptsRef.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (typeof data === "object") {
            handleMessage(data);
          }
        } catch (error) {
          console.error("Failed to parse WebSocket message:", event.data);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      ws.onclose = () => {
        console.log("WebSocket closed");

        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          setTimeout(connect, reconnectInterval * reconnectAttemptsRef.current); // Экспоненциальная пауза
        } else {
          console.error("Max reconnection attempts reached.");
        }
      };
    };

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [url, handleMessage]);

  return wsRef;
};
