require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const port = process.env.PORT;

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
    await fs.mkdir(DATA_DIR, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `application_${timestamp}.json`;
    const filePath = path.join(DATA_DIR, filename);
    await fs.writeFile(filePath, JSON.stringify(payload, null, 2));
    console.log(`Данные сохранены в файл: ${filePath}`);
  } catch (err) {
    console.error('Ошибка при сохранении файла:', err);
  }
}

// Эндпоинт для приёма заявок
app.post('/api/applications', async (req, res) => {
  const { formData, calculation } = req.body;

  if (!formData || !calculation) {
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

    // --- Автосохранение в файл ---
    await saveToFile({ formData, calculation });

    res.json({ success: true, applId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Ошибка при сохранении в БД:', err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  } finally {
    client.release();
  }
});

app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});