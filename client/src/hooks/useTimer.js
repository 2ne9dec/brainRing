import { useState, useRef, useEffect, useCallback } from "react";
import startSoundPath from "../shared/sound/start-sound.mp3";
import tickSoundPath from "../shared/sound/tick-sound.mp3";

export const useTimer = () => {
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(30); // Начальное значение 30
  const timerRef = useRef(null);
  const tickSoundRef = useRef(null);
  const startSoundRef = useRef(null);

  const startTimer = () => {
    setIsTimerRunning(true);
    setRemainingTime(30); // Установлено значение 30

    if (!startSoundRef.current) {
      startSoundRef.current = new Audio(startSoundPath);
    }
    startSoundRef.current.play();

    setTimeout(() => {
      startSoundRef.current.pause();
      startSoundRef.current.currentTime = 0;
    }, 2000);

    timerRef.current = setInterval(() => {
      setRemainingTime((prevTime) => {
        if (prevTime === 1) {
          clearInterval(timerRef.current);
          setIsTimerRunning(false);

          // Останавливаем тикание часов при окончании времени
          if (tickSoundRef.current) {
            tickSoundRef.current.pause();
            tickSoundRef.current.currentTime = 0;
          }

          return 0;
        }

        if (!tickSoundRef.current) {
          tickSoundRef.current = new Audio(tickSoundPath);
        }
        tickSoundRef.current.play();
        return prevTime - 1;
      });
    }, 1000);
  };

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      setIsTimerRunning(false);
      setRemainingTime(30); // Установлено значение 30 при сбросе
    }

    if (startSoundRef.current) {
      startSoundRef.current.pause();
      startSoundRef.current.currentTime = 0;
    }
    if (tickSoundRef.current) {
      tickSoundRef.current.pause();
      tickSoundRef.current.currentTime = 0;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (tickSoundRef.current) {
        tickSoundRef.current.pause();
        tickSoundRef.current.currentTime = 0;
      }
      if (startSoundRef.current) {
        startSoundRef.current.pause();
        startSoundRef.current.currentTime = 0;
      }
    };
  }, []);

  return { isTimerRunning, remainingTime, startTimer, stopTimer };
};
