export const getFormattedTime = () => {
  const now = new Date();
  const formattedTime = new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now);

  const milliseconds = now.getMilliseconds().toString().padStart(3, "0"); // Добавляем миллисекунды
  return `${formattedTime}:${milliseconds}`;
};
