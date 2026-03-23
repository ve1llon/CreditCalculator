-- DROP TABLE IF EXISTS credit_calculations CASCADE;
-- DROP TABLE IF EXISTS applications CASCADE;
-- DROP TABLE IF EXISTS clients CASCADE;

-- Таблица клиентов
CREATE TABLE clients (
    client_id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    passport VARCHAR(20) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    education VARCHAR(100),
    monthly_income DECIMAL(10, 2),
    birth_date DATE,
    existing_monthly_payments DECIMAL(10, 2) DEFAULT 0,
    fraud_flg BOOLEAN DEFAULT FALSE,		-- подозрение в мошенничестве
    sanctions_flg BOOLEAN DEFAULT FALSE,	-- нахождение в санкционных списках
    aml_flg BOOLEAN DEFAULT FALSE			-- подозрение в отмывании денег
);

-- Таблица заявок
CREATE TABLE applications (
    appl_id BIGSERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL,
    appl_dt DATE NOT NULL,					-- дата подачи заявки
    channel_cd VARCHAR(50),					-- канал, через который подана заявка
    req_term INT,							-- запрашиваемый срок кредита
    req_limit DECIMAL(12, 2),				-- запрашиваемая сумма кредита
    property_region VARCHAR(100),
    property_value DECIMAL(12, 2),
    bki_consent BOOLEAN,
	pdp_consent BOOLEAN,
    FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE CASCADE
);

-- Таблица расчётов
CREATE TABLE credit_calculations (
    appl_id BIGINT PRIMARY KEY,
    monthly_payment DECIMAL(12, 6),			-- рассчитанный ежемесячный аннуитетный платёж
    ratio DECIMAL(10, 6),					-- отношение суммарной ежемесячной нагрузки к доходу клиента
    is_rejected BOOLEAN,					-- флаг отказа
    probability INT CHECK (probability BETWEEN 0 AND 100),
    FOREIGN KEY (appl_id) REFERENCES applications(appl_id) ON DELETE CASCADE
);