const net = require("net");
const WebSocket = require("ws");

// Конфигурация
const IEC_HOST = "192.168.1.11"; // IP-адрес устройства
const IEC_PORT = 2404; // Порт для подключения
const WS_PORT = 8080; // Порт WebSocket-сервера

// Сопоставление IOA с номерами столов (для 12 столов)
const TABLE_IOA = {};
for (let i = 1; i <= 12; i++) {
  TABLE_IOA[65536 + i] = i; // IOA = 65537 для стола 1, 65538 для стола 2 и т.д.
}

// Инициализация WebSocket-сервера
const wss = new WebSocket.Server({ port: WS_PORT });
let clients = []; // Список подключенных WebSocket-клиентов
let tableStates = {}; // Текущее состояние всех столов
for (let i = 1; i <= 12; i++) tableStates[i] = 0; // Начальное состояние - все столы выключены
let recvSeq = 0; // Последовательный номер для ACK
let lastProcessedTime = {}; // Время последнего обработанного события для каждого IOA
const DEBOUNCE_DELAY = 500; // Задержка в миллисекундах для подавления дубликатов
let isInitialized = false; // Флаг для проверки завершения инициализации
let reconnectTimeout = null; // Таймер для переподключения

// Подключение к устройству
function connectToServer() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  resetState(); // Сброс состояния перед подключением
  const client = new net.Socket();

  // Установка соединения
  client.connect(IEC_PORT, IEC_HOST, () => {
    console.log(`Подключено к ЭНКМ-3: ${IEC_HOST}:${IEC_PORT}`);
    client.write(Buffer.from([0x68, 0x04, 0x07, 0x00, 0x00, 0x00])); // STARTDT act

    client.setKeepAlive(true, 60000); // Включаем TCP keep-alive

    setTimeout(() => {
      resetAllTables();
      isInitialized = true;
      console.log("Инициализация завершена. Состояние столов сброшено.");
    }, 2000); // Задержка 2 секунды
  });

  // Обработка входящих данных
  client.on("data", (data) => {
    if (!isInitialized) {
      console.log("Игнорируем сигналы до завершения инициализации...");
      return;
    }

    if (isValidPacket(data)) {
      const ioa = data.readUIntBE(10, 3); // Чтение IOA
      const siq = data[13]; // SIQ (значение + качество)
      const value = (siq & 0x01) ^ 0x01; // Инвертируем значение
      const tableNumber = TABLE_IOA[ioa];

      if (tableNumber !== undefined && isDebounced(ioa)) {
        console.log(
          `Получен сигнал: IOA=${ioa}, Значение=${value}, Стол=${tableNumber}`
        );

        // Обновляем состояние стола
        updateTableState(tableNumber, value);
        lastProcessedTime[ioa] = Date.now(); // Обновляем время последней обработки
      }

      // Отправка ACK
      sendAck(client);
    } else {
      console.warn("Получен некорректный пакет:", data.toString("hex"));
    }
  });

  // Обработка ошибок
  client.on("error", (err) => {
    console.error(`Ошибка подключения: ${err.message}`);
    scheduleReconnect();
  });

  // Обработка закрытия соединения
  client.on("close", () => {
    console.log(`Соединение закрыто`);
    client.destroy(); // Явное освобождение ресурсов
    scheduleReconnect();
  });

  function scheduleReconnect() {
    if (!reconnectTimeout) {
      console.log("Планируется переподключение через 1 секунду...");
      reconnectTimeout = setTimeout(() => {
        console.log("Попытка переподключения...");
        connectToServer();
      }, 1000);
    }
  }
}

// WebSocket-клиенты
wss.on("connection", (ws) => {
  clients.push(ws);
  console.log(`WebSocket-клиент подключен. Всего клиентов: ${clients.length}`);

  // Отправляем текущее состояние столов новому клиенту
  ws.send(
    JSON.stringify({ type: "initialState", tables: formatTableStates() })
  );

  ws.on("message", (message) => {
    const data = JSON.parse(message);

    switch (data.type) {
      case "resetAll":
        resetAllTables();
        console.log("Сброс всех столов по команде от клиента.");
        break;
      default:
        console.warn(`Неизвестный тип сообщения: ${data.type}`);
    }
  });

  ws.on("close", () => {
    clients = clients.filter((client) => client !== ws);
    console.log(
      `WebSocket-клиент отключен. Осталось клиентов: ${clients.length}`
    );
  });
});

// Отправка данных всем WebSocket-клиентам
function broadcast(data) {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// Сброс состояния всех столов
function resetAllTables() {
  Object.keys(tableStates).forEach((table) => {
    tableStates[table] = 0;
    broadcast({ type: "reset", table: parseInt(table) });
  });
}

// Обновление состояния стола
function updateTableState(tableNumber, value) {
  if (tableStates[tableNumber] !== value) {
    tableStates[tableNumber] = value;

    // Деактивация других столов
    Object.keys(tableStates).forEach((table) => {
      if (parseInt(table) !== tableNumber && tableStates[table] !== 0) {
        tableStates[table] = 0;
        broadcast({ type: "reset", table: parseInt(table) });
      }
    });

    // Отправка нового состояния текущего стола
    const messageType = value === 1 ? "highlight" : "reset";
    broadcast({ type: messageType, table: tableNumber });
  }
}

// Форматирование состояния столов для отправки клиенту
function formatTableStates() {
  return Object.entries(tableStates).map(([table, state]) => ({
    table: parseInt(table),
    type: state === 1 ? "highlight" : "reset",
  }));
}

// Проверка на валидность пакета
function isValidPacket(data) {
  return data[0] === 0x68 && data.length >= 12 && !(data[2] & 0x01);
}

// Защита от дублирующихся событий
function isDebounced(ioa) {
  const currentTime = Date.now();
  return (
    !lastProcessedTime[ioa] ||
    currentTime - lastProcessedTime[ioa] > DEBOUNCE_DELAY
  );
}

// Функция ACK отправляет подтверждение получения пакета
function sendAck(client) {
  const ack = Buffer.from([
    0x68,
    0x04,
    0x01,
    0x00,
    recvSeq & 0xff,
    (recvSeq >> 8) & 0xff,
  ]);
  client.write(ack);
  recvSeq += 2;
}

// Сброс состояния при переподключении
function resetState() {
  tableStates = {};
  for (let i = 1; i <= 12; i++) tableStates[i] = 0;
  lastProcessedTime = {};
  recvSeq = 0;
  isInitialized = false;
}

// Инициализация первого подключения
connectToServer();
