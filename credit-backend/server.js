require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const fsAsync = require('fs').promises;
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT;

// --- Логирование ---
const LOG_DIR = path.join(__dirname, 'logs');
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

const logFileName = `app_${new Date().toISOString().replace(/[:.]/g, '-')}.log`;
const logFilePath = path.join(LOG_DIR, logFileName);

function writeLog(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logLine = JSON.stringify({
        timestamp,
        level,
        message,
        ...meta
    }) + '\n';
    fs.appendFileSync(logFilePath, logLine); 
    console.log(`[${level}] ${message}`, meta);
}

// Middleware для логирования всех запросов
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        writeLog('INFO', `HTTP ${req.method} ${req.url}`, {
            status: res.statusCode,
            duration_ms: duration,
            ip: req.ip
        });
    });
    next();
});

// Эндпоинт для клиентского логирования
app.post('/api/log', (req, res) => {
    const { level, message, details, sessionId } = req.body;
    writeLog(level || 'CLIENT', message, { sessionId, ...details });
    res.json({ ok: true });
});

// Настройка подключения к PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

app.use(cors());
app.use(express.json());

// Папка для сохранения JSON-файлов
const DATA_DIR = path.resolve('D:/mipt/DBMS/Проект_Кредитный Калькулятор/input_data_examples');

// Функция сохранения данных в файл
async function saveToFile(payload) {
  try {
    await fsAsync.mkdir(DATA_DIR, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `application_${timestamp}.json`;
    const filePath = path.join(DATA_DIR, filename);
    await fsAsync.writeFile(filePath, JSON.stringify(payload, null, 2));
    writeLog('INFO', `Данные сохранены в файл`, { filePath });
  } catch (err) {
    writeLog('ERROR', `Ошибка сохранения файла`, { error: err.message });
    console.error('Ошибка при сохранении файла:', err);
  }
}

// Эндпоинт для приёма заявок
app.post('/api/applications', async (req, res) => {
  const { formData, calculation } = req.body;
  const sessionId = req.headers['x-session-id'] || 'unknown';
  writeLog('INFO', `Получена заявка`, { sessionId, passport: formData?.passport });

  if (!formData || !calculation) {
    writeLog('WARN', `Неполные данные в заявке`, { sessionId });
    return res.status(400).json({ error: 'Неполные данные' });
  }

  const {
    fullName,
    birthDate,
    passport,
    phone,
    education,
    monthlyIncome,
    bkiConsent,
    pdpConsent,
    desiredAmount,
    loanTerm,
    propertyRegion,
    propertyValue,
    existingPayments = 0
  } = formData;

  const { monthlyPayment, ratio, isRejected, probability } = calculation;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    writeLog('INFO', `Начало транзакции БД`, { sessionId });

    // 1. Ищем или создаём клиента по паспорту
    let clientId;
    const existingClient = await client.query(
      'SELECT client_id FROM clients WHERE passport = $1',
      [passport]
    );

    if (existingClient.rows.length > 0) {
      clientId = existingClient.rows[0].client_id;
      await client.query(
        `UPDATE clients SET
          full_name = $1,
          phone = $2,
          education = $3,
          monthly_income = $4,
          birth_date = $5,
          existing_monthly_payments = $6
        WHERE client_id = $7`,
        [fullName, phone, education, monthlyIncome, birthDate, existingPayments, clientId]
      );
    } else {
      const insertClient = await client.query(
        `INSERT INTO clients
         (full_name, passport, phone, education, monthly_income, birth_date, existing_monthly_payments)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING client_id`,
        [fullName, passport, phone, education, monthlyIncome, birthDate, existingPayments]
      );
      clientId = insertClient.rows[0].client_id;
    }

    // 2. Создаём заявку
    const applDate = new Date().toISOString().split('T')[0];
    const insertAppl = await client.query(
      `INSERT INTO applications
       (client_id, appl_dt, channel_cd, req_term, req_limit, property_region, property_value, bki_consent, pdp_consent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING appl_id`,
      [clientId, applDate, 'web_form', loanTerm, desiredAmount, propertyRegion, propertyValue, bkiConsent, pdpConsent]
    );
    const applId = insertAppl.rows[0].appl_id;

    // 3. Вставляем расчёт
    await client.query(
      `INSERT INTO credit_calculations
       (appl_id, monthly_payment, ratio, is_rejected, probability)
       VALUES ($1, $2, $3, $4, $5)`,
      [applId, monthlyPayment, ratio, isRejected, probability]
    );

    await client.query('COMMIT');
    writeLog('INFO', `Заявка успешно сохранена`, { sessionId, applId });

    // --- Автосохранение в файл ---
    await saveToFile({ formData, calculation });

    res.json({ success: true, applId });
  } catch (err) {
    await client.query('ROLLBACK');
    writeLog('ERROR', `Ошибка при сохранении в БД`, { sessionId, error: err.message, stack: err.stack });
    console.error('Ошибка при сохранении в БД:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  } finally {
    client.release();
    writeLog('INFO', `Соединение с БД закрыто`, { sessionId });
  }
});

app.listen(port, () => {
  writeLog('INFO', `Сервер запущен`, { port, logFile: logFilePath });
  console.log(`Сервер запущен на http://localhost:${port}`);
});