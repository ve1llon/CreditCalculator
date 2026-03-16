
(function() {
    const app = document.getElementById('app');

    // ==================== Стили ====================
    const style = document.createElement('style');
    style.textContent = `
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f0f2f5;
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        .container {
            max-width: 600px;
            width: 100%;
            background: white;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            padding: 24px;
        }
        h2 {
            margin-top: 0;
            color: #1e3a5f;
            font-weight: 500;
        }
        .description {
            background: #e3f2fd;
            padding: 16px;
            border-radius: 12px;
            margin-bottom: 24px;
            font-size: 1rem;
            color: #0d3b66;
        }
        .form-group {
            margin-bottom: 16px;
        }
        label {
            display: block;
            font-weight: 500;
            margin-bottom: 6px;
            color: #333;
        }
        input, select {
            width: 100%;
            padding: 12px;
            border: 1px solid #ccc;
            border-radius: 8px;
            font-size: 1rem;
            box-sizing: border-box;
            transition: border 0.2s;
        }
        input:focus, select:focus {
            border-color: #1e3a5f;
            outline: none;
        }
        .checkbox-group {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .checkbox-group input {
            width: auto;
            margin-right: 8px;
        }
        .button-group {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-top: 24px;
            flex-wrap: wrap;
        }
        button {
            background: #1e3a5f;
            color: white;
            border: none;
            padding: 14px 32px;
            border-radius: 40px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
        }
        button:hover {
            background: #15324b;
        }
        .hint {
            color: #666;
            font-style: italic;
        }
        .result-card {
            background: #f9f9f9;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 24px;
        }
        .probability {
            font-size: 2rem;
            font-weight: 700;
            color: #1e3a5f;
        }
        .verdict {
            font-size: 1.2rem;
            font-weight: 600;
            padding: 6px 12px;
            border-radius: 20px;
            display: inline-block;
            margin: 8px 0;
        }
        .verdict.approved { background: #c8e6c9; color: #1e5f2e; }
        .verdict.maybe { background: #fff3cd; color: #856404; }
        .verdict.denied { background: #f8d7da; color: #721c24; }
        .reason {
            margin: 12px 0;
            padding: 10px;
            background: #fff3e0;
            border-radius: 8px;
        }
        .offers {
            margin-top: 24px;
        }
        .offer-item {
            background: white;
            border: 1px solid #ddd;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 12px;
            box-shadow: 0 2px 6px rgba(0,0,0,0.05);
        }
        .back-button {
            background: transparent;
            color: #1e3a5f;
            border: 1px solid #1e3a5f;
            margin-top: 16px;
        }
        .back-button:hover {
            background: #e3f2fd;
        }
        .hidden {
            display: none;
        }
        .form-screen {
            max-width: 600px;
            width: 100%;
        }    
    `;
    document.head.appendChild(style);

    // ==================== Новая модель данных (Table, Database, CreditCalculator) ====================
    // Адаптировано для браузера: убраны методы работы с файлами, данные хранятся в памяти.

    class Table {
        constructor(name, schema = []) {
            this.name = name;
            this.schema = schema;
            this.records = [];
        }

        insert(record) {
            this.records.push(record);
            return record;
        }

        find(query) {
            if (typeof query === 'function') {
                return this.records.filter(query);
            }
            return this.records.filter(record =>
                Object.entries(query).every(([key, value]) => record[key] === value)
            );
        }

        update(query, updates) {
            const recordsToUpdate = this.find(query);
            recordsToUpdate.forEach(record => Object.assign(record, updates));
            return recordsToUpdate.length;
        }

        delete(query) {
            const initialLength = this.records.length;
            this.records = this.records.filter(record => {
                if (typeof query === 'function') {
                    return !query(record);
                }
                return !Object.entries(query).every(([key, value]) => record[key] === value);
            });
            return initialLength - this.records.length;
        }

        all() {
            return this.records;
        }
    }

    class Database {
        constructor() {
            this.tables = new Map();
        }

        createTable(name, schema = []) {
            if (this.tables.has(name)) {
                throw new Error(`Таблица ${name} уже существует`);
            }
            const table = new Table(name, schema);
            this.tables.set(name, table);
            return table;
        }

        getTable(name) {
            if (!this.tables.has(name)) {
                throw new Error(`Таблица ${name} не существует`);
            }
            return this.tables.get(name);
        }

        dropTable(name) {
            this.tables.delete(name);
        }

        listTables() {
            return Array.from(this.tables.keys());
        }
    }

    class CreditCalculator {
        constructor(database) {
            this.db = database;
            this.annualRate = 0.19; // 19% годовых
        }

        calculateMonthlyPayment(amount, months) {
            if (months === 0) return 0;
            const monthlyRate = this.annualRate / 12;
            // Аннуитетный коэффициент
            const annuityFactor = (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                                    (Math.pow(1 + monthlyRate, months) - 1);
            return amount * annuityFactor;
        }

        // Проверка возраста
        _calculateAge(birthDate) {
            const today = new Date();
            const birth = new Date(birthDate);
            let age = today.getFullYear() - birth.getFullYear();
            const m = today.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
            return age;
        }

        processApplication(formData) {
            const { 
                monthlyIncome, 
                desiredAmount, 
                loanTerm,
                fullName,
                passport,
                phone,
                education,
                birthDate,
                propertyRegion,
                propertyValue,
                bkiConsent
            } = formData;

            // 1. Обязательное согласие на БКИ
            if (!bkiConsent) {
                return {
                    data: {
                        probability: 0,
                        status: 'denied',
                        mainMessage: 'Отказ',
                        riskFactors: ['Для оценки необходимо согласие на обращение в БКИ'],
                        recommendation: 'Подтвердите согласие и повторите попытку.'
                    }
                };
            }

            // 2. Возрастные ограничения
            const age = this._calculateAge(birthDate);
            if (age < 21) {
                return {
                    data: {
                        probability: 10,
                        status: 'denied',
                        mainMessage: 'Отказ',
                        riskFactors: ['Возраст младше 21 года'],
                        recommendation: 'К сожалению, кредиты не выдаются лицам младше 21 года.'
                    }
                };
            }
            if (age > 65) {
                return {
                    data: {
                        probability: 15,
                        status: 'denied',
                        mainMessage: 'Отказ',
                        riskFactors: ['Возраст старше 65 лет'],
                        recommendation: 'Рекомендуем рассмотреть программы для пенсионеров или сократить срок кредита.'
                    }
                };
            }

            // 3. Сумма кредита не должна превышать стоимость недвижимости
            if (desiredAmount > propertyValue) {
                return {
                    data: {
                        probability: 5,
                        status: 'denied',
                        mainMessage: 'Отказ',
                        riskFactors: ['Сумма кредита превышает стоимость недвижимости'],
                        recommendation: 'Ипотека обычно покрывает не более 80-90% стоимости. Уменьшите сумму или увеличьте первоначальный взнос.'
                    }
                };
            }

            // 4. Основной расчёт: платёж и его соотношение с доходом
            const monthlyPayment = this.calculateMonthlyPayment(desiredAmount, loanTerm);
            const paymentToIncomeRatio = monthlyPayment / monthlyIncome;
            const isRejected = paymentToIncomeRatio >= 0.5;
            const probability = isRejected ? 30 : 80;

            // Формируем результат
            const result = {
                data: {
                    probability: probability,
                    status: isRejected ? 'warning' : 'success',
                    mainMessage: isRejected ? 'Возможен отказ' : 'Предварительное одобрение',
                    riskFactors: isRejected ? [
                        `Ежемесячный платёж (${Math.round(monthlyPayment)} ₽) превышает 50% дохода (${Math.round(monthlyIncome * 0.5)} ₽)`
                    ] : [],
                    counterOffers: [], // можно заполнить позже
                    recommendation: isRejected ? 'К сожалению, ваша заявка не может быть одобрена на текущих условиях.' : ''
                },
                technical: {  
                    monthlyPayment,
                    paymentToIncomeRatio,
                    isRejected,
                    desiredAmount,
                    loanTerm,
                    monthlyIncome
                }
            };

            // Сохраняем в базу данных (только в память, без файлов)
            this._saveToDatabase(formData, result.technical);

            return result;
        }

        _saveToDatabase(formData, technical) {
            try {
                // Таблица клиентов
                const clientTable = this.db.getTable('client');
                let client = clientTable.find({ passport: formData.passport })[0];
                const clientId = client ? client.client_id : Date.now() + Math.floor(Math.random() * 1000);

                if (!client) {
                    client = {
                        client_id: clientId,
                        full_name: formData.fullName,
                        passport: formData.passport,
                        phone: formData.phone,
                        education: formData.education,
                        monthly_income: formData.monthlyIncome,
                        birth_date: formData.birthDate,
                        fraud_flg: 0,
                        sanctions_flg: 0,
                        aml_flg: 0
                    };
                    clientTable.insert(client);
                } else {
                    clientTable.update({ passport: formData.passport }, {
                        monthly_income: formData.monthlyIncome,
                        phone: formData.phone
                    });
                }

                // Таблица заявок
                const appTable = this.db.getTable('application');
                const application = {
                    appl_id: Date.now() + Math.floor(Math.random() * 10000),
                    client_id: clientId,
                    appl_dt: new Date().toISOString().split('T')[0],
                    channel_cd: 'web_form',
                    req_term: formData.loanTerm,
                    req_limit: formData.desiredAmount,
                    property_region: formData.propertyRegion,
                    property_value: formData.propertyValue,
                    bki_consent: formData.bkiConsent || false
                };
                appTable.insert(application);

                // Таблица результатов скоринга
                let resultTable;
                try {
                    resultTable = this.db.getTable('scoring_result');
                } catch (e) {
                    resultTable = this.db.createTable('scoring_result', [
                        'appl_id', 'monthly_payment', 'ratio', 'is_rejected', 'probability'
                    ]);
                }
                resultTable.insert({
                    appl_id: application.appl_id,
                    monthly_payment: technical.monthlyPayment,
                    ratio: technical.paymentToIncomeRatio,
                    is_rejected: technical.isRejected,
                    probability: technical.isRejected ? 30 : 80
                });

                console.log('Данные заявки сохранены в памяти');
            } catch (err) {
                console.error('Ошибка при сохранении в БД:', err.message);
            }
        }
    }

    // Инициализация базы данных и таблиц (один раз)
    const db = new Database();
    db.createTable('client', [
        'client_id', 'full_name', 'passport', 'phone', 'education', 
        'monthly_income', 'birth_date', 'fraud_flg', 'sanctions_flg', 'aml_flg'
    ]);
    db.createTable('application', [
        'appl_id', 'client_id', 'appl_dt', 'channel_cd', 
        'req_term', 'req_limit', 'property_region', 'property_value', 'bki_consent'
    ]);
    // scoring_result создаётся при необходимости

    const calculator = new CreditCalculator(db);

    // ==================== Старые вспомогательные функции (generateOffers оставлена) ====================
    function generateOffers(params) {
        const { loanAmount, loanTerm, income, propertyValue, probability } = params;
        const offers = [];

        if (probability >= 60) {
            offers.push({
                type: 'original',
                amount: loanAmount,
                term: loanTerm,
                description: 'Ваши исходные условия'
            });
        }

        const reducedAmount = Math.round(loanAmount * 0.8);
        if (reducedAmount >= 300000) {
            offers.push({
                type: 'reduced',
                amount: reducedAmount,
                term: loanTerm,
                description: `Уменьшить сумму до ${reducedAmount.toLocaleString()} ₽`
            });
        }

        const extendedTerm = Math.min(360, Math.round(loanTerm * 1.5));
        if (extendedTerm > loanTerm) {
            offers.push({
                type: 'extended',
                amount: loanAmount,
                term: extendedTerm,
                description: `Увеличить срок до ${extendedTerm} мес.`
            });
        }

        if (probability < 30) {
            const combinedAmount = Math.round(loanAmount * 0.7);
            const combinedTerm = Math.min(360, Math.round(loanTerm * 1.8));
            if (combinedAmount >= 300000) {
                offers.push({
                    type: 'combined',
                    amount: combinedAmount,
                    term: combinedTerm,
                    description: `Уменьшить сумму до ${combinedAmount.toLocaleString()} ₽ и увеличить срок до ${combinedTerm} мес.`
                });
            }
        }

        return offers.slice(0, 3);
    }

    // ==================== Функции сохранения/загрузки ====================
    function saveFormToFile() {
        // Собираем значения всех полей формы
        const formData = {
            lastName: document.getElementById('lastName').value,
            firstName: document.getElementById('firstName').value,
            middleName: document.getElementById('middleName').value,
            birthDate: document.getElementById('birthDate').value,
            passport: document.getElementById('passport').value,
            phone: document.getElementById('phone').value,
            education: document.getElementById('education').value,
            income: document.getElementById('income').value,
            bkiConsent: document.getElementById('bkiConsent').checked,
            pdpConsent: document.getElementById('pdpConsent').checked,
            loanAmount: document.getElementById('loanAmount').value,
            loanTerm: document.getElementById('loanTerm').value,
            region: document.getElementById('region').value,
            propertyValue: document.getElementById('propertyValue').value
        };

        // Преобразуем в JSON
        const json = JSON.stringify(formData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        // Создаём ссылку для скачивания
        const a = document.createElement('a');
        a.href = url;
        a.download = `credit_data_${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function loadFormFromFile() {
        // Создаём скрытый input type="file"
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';

        input.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);

                    // Заполняем поля формы
                    document.getElementById('lastName').value = data.lastName || '';
                    document.getElementById('firstName').value = data.firstName || '';
                    document.getElementById('middleName').value = data.middleName || '';
                    document.getElementById('birthDate').value = data.birthDate || '';
                    document.getElementById('passport').value = data.passport || '';
                    document.getElementById('phone').value = data.phone || '';
                    document.getElementById('education').value = data.education || 'high';
                    document.getElementById('income').value = data.income || '';
                    document.getElementById('bkiConsent').checked = !!data.bkiConsent;
                    document.getElementById('pdpConsent').checked = !!data.pdpConsent;
                    document.getElementById('loanAmount').value = data.loanAmount || '';
                    document.getElementById('loanTerm').value = data.loanTerm || '';
                    document.getElementById('region').value = data.region || '';
                    document.getElementById('propertyValue').value = data.propertyValue || '';

                } catch (error) {
                    alert('Ошибка при загрузке файла: неверный формат JSON');
                }
            };
            reader.readAsText(file);
        });

        input.click();
    }

    // ==================== Построители экранов ====================
    function buildFormScreen() {
        const screen = document.createElement('div');
        screen.className = 'form-screen';

        const description = document.createElement('div');
        description.className = 'description';
        description.innerHTML = `
            <strong>Кредитный Калькулятор</strong> — оцените свои шансы на ипотеку за минуту. Мы подберём условия, которые банк точно одобрит.
        `;

        const formContainer = document.createElement('div');
        formContainer.className = 'container';
        formContainer.id = 'screen1';
        formContainer.innerHTML = `
            <form id="creditForm">
                <div class="form-group">
                    <label>Фамилия</label>
                    <input type="text" id="lastName" required>
                </div>
                <div class="form-group">
                    <label>Имя</label>
                    <input type="text" id="firstName" required>
                </div>
                <div class="form-group">
                    <label>Отчество</label>
                    <input type="text" id="middleName">
                </div>
                <div class="form-group">
                    <label>Дата рождения</label>
                    <input type="date" id="birthDate" required>
                </div>
                <div class="form-group">
                    <label>Паспорт (серия и номер)</label>
                    <input type="text" id="passport" placeholder="1234 567890" required>
                </div>
                <div class="form-group">
                    <label>Номер телефона</label>
                    <input type="tel" id="phone" placeholder="+7 (___) ___-__-__" required>
                </div>
                <div class="form-group">
                    <label>Образование</label>
                    <select id="education">
                        <option value="high">Высшее</option>
                        <option value="unfinished_high">Неоконченное высшее</option>
                        <option value="secondary">Среднее профессиональное</option>
                        <option value="school">Среднее общее</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Ежемесячный доход (₽)</label>
                    <input type="number" id="income" min="0" step="10000" required>
                </div>
                <div class="form-group checkbox-group">
                    <input type="checkbox" id="bkiConsent" required>
                    <label for="bkiConsent">Согласен на обращение в БКИ</label>
                </div>
                <div class="form-group checkbox-group">
                    <input type="checkbox" id="pdpConsent" required>
                    <label for="pdpConsent">Согласен на обработку персональных данных</label>
                </div>
                <div class="form-group">
                    <label>Желаемая сумма кредита (₽)</label>
                    <input type="number" id="loanAmount" min="0" step="50000" required>
                </div>
                <div class="form-group">
                    <label>Срок кредита (мес.)</label>
                    <input type="number" id="loanTerm" min="1" max="360" required>
                </div>
                <div class="form-group">
                    <label>Регион недвижимости</label>
                    <input type="text" id="region" required>
                </div>
                <div class="form-group">
                    <label>Полная стоимость недвижимости (₽)</label>
                    <input type="number" id="propertyValue" min="0" step="100000" required>
                </div>

                <div class="button-group">
                    <button type="button" id="submitBtn">Отправить</button>
                    <button type="button" id="saveBtn">Сохранить в файл</button>
                    <button type="button" id="loadBtn">Загрузить из файла</button>
                    <span class="hint">Рассчитать вероятность одобрения</span>
                </div>
            </form>
        `;

        screen.appendChild(description);
        screen.appendChild(formContainer);
        return screen;
    }

    function buildResultScreen(resultData, offers) {
        const container = document.createElement('div');
        container.className = 'container';
        container.id = 'screen2';

        const probability = resultData.probability;
        const verdictText = resultData.verdictText;
        const verdictClass = resultData.verdictClass;
        const reason = resultData.reason;

        let offersHtml = '';
        if (offers.length === 0) {
            offersHtml = '<p>Нет альтернативных предложений.</p>';
        } else {
            offersHtml = offers.map(offer => `
                <div class="offer-item">
                    <strong>${offer.description}</strong><br>
                    Сумма: ${offer.amount.toLocaleString()} ₽, срок: ${offer.term} мес.
                </div>
            `).join('');
        }

        container.innerHTML = `
            <h2>Результат оценки</h2>
            <div class="result-card">
                <div>Вероятность одобрения</div>
                <div class="probability">${probability}%</div>
                <div><span class="verdict ${verdictClass}">${verdictText}</span></div>
                <div class="reason">${reason}</div>
            </div>

            <div class="offers">
                <h3>Контрпредложения, которые могут одобрить</h3>
                <div id="offersList">${offersHtml}</div>
            </div>

            <button class="back-button" id="backBtn">← Вернуться к форме</button>
        `;

        return container;
    }

    // ==================== Состояние и рендеринг ====================
    let currentScreen = 'form';

    function renderScreen(screen) {
        app.innerHTML = '';

        if (screen === 'form') {
            const formScreen = buildFormScreen();
            app.appendChild(formScreen);

            document.getElementById('submitBtn').addEventListener('click', onSubmit);
            document.getElementById('saveBtn').addEventListener('click', saveFormToFile);
            document.getElementById('loadBtn').addEventListener('click', loadFormFromFile);
        } else if (screen === 'result') {
            if (!window.__lastResult) {
                renderScreen('form');
                return;
            }
            const resultScreen = buildResultScreen(window.__lastResult, window.__lastOffers);
            app.appendChild(resultScreen);

            document.getElementById('backBtn').addEventListener('click', () => {
                renderScreen('form');
            });
        }
    }

    // ==================== Обработчик отправки (с использованием новой логики) ====================
    function onSubmit() {
        const lastName = document.getElementById('lastName').value.trim();
        const firstName = document.getElementById('firstName').value.trim();
        const middleName = document.getElementById('middleName').value.trim();
        const birthDate = document.getElementById('birthDate').value;
        const passport = document.getElementById('passport').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const education = document.getElementById('education').value;
        const income = parseFloat(document.getElementById('income').value);
        const bkiConsent = document.getElementById('bkiConsent').checked;
        const pdpConsent = document.getElementById('pdpConsent').checked;
        const loanAmount = parseFloat(document.getElementById('loanAmount').value);
        const loanTerm = parseInt(document.getElementById('loanTerm').value, 10);
        const region = document.getElementById('region').value.trim();
        const propertyValue = parseFloat(document.getElementById('propertyValue').value);

        // Проверка заполнения и согласий
        if (!lastName || !firstName || !birthDate || !passport || !phone || isNaN(income) || !bkiConsent || !pdpConsent || isNaN(loanAmount) || isNaN(loanTerm) || !region || isNaN(propertyValue)) {
            alert('Пожалуйста, заполните все обязательные поля и подтвердите согласие на обращение в БКИ и на обработку персональных данных.');
            return;
        }
        if (income <= 0 || loanAmount <= 0 || loanTerm <= 0 || propertyValue <= 0) {
            alert('Доход, сумма, срок и стоимость недвижимости должны быть положительными числами.');
            return;
        }

        // Формируем fullName
        const fullName = `${lastName} ${firstName} ${middleName}`.trim();

        // Подготавливаем данные для калькулятора
        const formData = {
            fullName,
            birthDate,
            passport,
            phone,
            education,
            monthlyIncome: income,
            bkiConsent,
            desiredAmount: loanAmount,
            loanTerm,
            propertyRegion: region,
            propertyValue
        };

        // Вызываем новую логику расчёта
        const result = calculator.processApplication(formData);

        // Преобразуем результат в формат, ожидаемый buildResultScreen
        const resultForDisplay = {
            probability: result.data.probability,
            verdictText: result.data.mainMessage,
            reason: ''
        };

        // Определяем класс вердикта
        if (result.data.status === 'success') {
            resultForDisplay.verdictClass = 'approved';
        } else if (result.data.status === 'warning') {
            resultForDisplay.verdictClass = 'maybe';
        } else {
            resultForDisplay.verdictClass = 'denied';
        }

        // Формируем причину из riskFactors и рекомендации
        let reasonParts = [];
        if (result.data.riskFactors && result.data.riskFactors.length) {
            reasonParts = reasonParts.concat(result.data.riskFactors);
        }
        if (result.data.recommendation) {
            reasonParts.push(result.data.recommendation);
        }
        resultForDisplay.reason = reasonParts.join(' ') || 'Предварительный расчёт выполнен.';

        // Генерируем контрпредложения (старая функция, используем probability из результата)
        const offers = generateOffers({
            loanAmount,
            loanTerm,
            income,
            propertyValue,
            probability: result.data.probability
        });

        // Сохраняем для отображения
        window.__lastResult = resultForDisplay;
        window.__lastOffers = offers;

        renderScreen('result');
    }

    // ==================== Запуск ====================
    renderScreen('form');
})();
