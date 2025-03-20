export const playSound = (soundPath) => {
  const audio = new Audio(soundPath);
  audio.play().catch((error) => {
    console.error("Ошибка воспроизведения звука:", error);
  });
};
