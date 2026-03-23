(function() {
    const app = document.getElementById('app');

    // ==================== Стили (без изменений) ====================
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

    // ==================== Класс расчёта ====================
    class CreditCalculator {
        constructor() {
            this.annualRate = 0.19; // 19% годовых
        }

        calculateMonthlyPayment(amount, months) {
            if (months === 0) return 0;
            const monthlyRate = this.annualRate / 12;
            const annuityFactor = (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                                    (Math.pow(1 + monthlyRate, months) - 1);
            return amount * annuityFactor;
        }

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

        async processApplication(formData) {
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
                bkiConsent,
                existingPayments
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

            // 4. Основной расчёт с учётом действующих платежей
            const monthlyPayment = this.calculateMonthlyPayment(desiredAmount, loanTerm);
            const totalMonthlyObligations = monthlyPayment + (existingPayments || 0);
            const paymentToIncomeRatio = totalMonthlyObligations / monthlyIncome;
            const isRejected = paymentToIncomeRatio >= 0.5;
            const probability = isRejected ? 30 : 80;

            const result = {
                data: {
                    probability: probability,
                    status: isRejected ? 'warning' : 'success',
                    mainMessage: isRejected ? 'Возможен отказ' : 'Предварительное одобрение',
                    riskFactors: isRejected ? [
                        `Суммарная нагрузка (${Math.round(totalMonthlyObligations)} ₽) превышает 50% дохода (${Math.round(monthlyIncome * 0.5)} ₽)`
                    ] : [],
                    counterOffers: [],
                    recommendation: isRejected ? 'К сожалению, ваша заявка не может быть одобрена на текущих условиях.' : ''
                },
                technical: {  
                    monthlyPayment,
                    totalMonthlyObligations,
                    paymentToIncomeRatio,
                    isRejected,
                    desiredAmount,
                    loanTerm,
                    monthlyIncome,
                    existingPayments
                }
            };

            // Отправляем данные на бэкенд
            await this._sendToBackend(formData, result.technical, result.data);

            return result;
        }

        async _sendToBackend(formData, technical, resultData) {
            try {
                const payload = {
                    formData: {
                        fullName: formData.fullName,
                        birthDate: formData.birthDate,
                        passport: formData.passport,
                        phone: formData.phone,
                        education: formData.education,
                        monthlyIncome: formData.monthlyIncome,
                        bkiConsent: formData.bkiConsent,
                        pdpConsent: formData.pdpConsent,
                        desiredAmount: formData.desiredAmount,
                        loanTerm: formData.loanTerm,
                        propertyRegion: formData.propertyRegion,
                        propertyValue: formData.propertyValue,
                        existingPayments: formData.existingPayments
                    },
                    calculation: {
                        monthlyPayment: technical.monthlyPayment,
                        totalMonthlyObligations: technical.totalMonthlyObligations,
                        ratio: technical.paymentToIncomeRatio,
                        isRejected: technical.isRejected,
                        probability: resultData.probability
                    }
                };

                const response = await fetch('http://localhost:3000/api/applications', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    console.error('Ошибка при сохранении данных на сервере:', await response.text());
                } else {
                    console.log('Данные успешно сохранены в БД и файл');
                }
            } catch (err) {
                console.error('Не удалось отправить данные на бэкенд:', err.message);
            }
        }
    }

    const calculator = new CreditCalculator();

    // ==================== Генерация двух контрпредложений ====================
    function generateOffers(params) {
        const { loanAmount, loanTerm, income, propertyValue, probability, existingPayments } = params;
        const offers = [];

        // Если исходные условия уже проходят – показываем их как один из вариантов
        const monthlyPaymentOriginal = calculator.calculateMonthlyPayment(loanAmount, loanTerm);
        const totalOriginal = monthlyPaymentOriginal + existingPayments;
        if (totalOriginal <= income * 0.5) {
            offers.push({
                type: 'original',
                amount: loanAmount,
                term: loanTerm,
                description: 'Ваши исходные условия (уже подходят)'
            });
        }

        // 1. Предложение с увеличенным сроком
        let extendedTerm = loanTerm;
        let maxTerm = 360;
        while (extendedTerm <= maxTerm) {
            const payment = calculator.calculateMonthlyPayment(loanAmount, extendedTerm);
            if (payment + existingPayments <= income * 0.5) {
                offers.push({
                    type: 'extended',
                    amount: loanAmount,
                    term: extendedTerm,
                    description: `Увеличить срок до ${extendedTerm} мес. (платёж ${Math.round(payment)} ₽)`
                });
                break;
            }
            extendedTerm++;
        }

        // 2. Предложение с уменьшенной суммой
        let reducedAmount = loanAmount;
        let minAmount = 300000;
        while (reducedAmount >= minAmount) {
            const payment = calculator.calculateMonthlyPayment(reducedAmount, loanTerm);
            if (payment + existingPayments <= income * 0.5) {
                offers.push({
                    type: 'reduced',
                    amount: reducedAmount,
                    term: loanTerm,
                    description: `Уменьшить сумму до ${reducedAmount.toLocaleString()} ₽ (платёж ${Math.round(payment)} ₽)`
                });
                break;
            }
            reducedAmount -= 50000;
        }

        // Возвращаем не более двух уникальных предложений (кроме исходных)
        const uniqueOffers = [];
        for (let offer of offers) {
            if (!uniqueOffers.some(o => o.type === offer.type)) {
                uniqueOffers.push(offer);
            }
        }
        return uniqueOffers.slice(0, 2);
    }

    // ==================== Сохранение/загрузка в файл ====================
    function loadFormFromFile() {
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
                const formData = data.formData || data;

                // --- ФИО ---
                if (formData.fullName !== undefined) {
                    const parts = formData.fullName.trim().split(/\s+/);
                    document.getElementById('lastName').value = parts[0] || '';
                    document.getElementById('firstName').value = parts[1] || '';
                    document.getElementById('middleName').value = parts.slice(2).join(' ') || '';
                } else {
                    document.getElementById('lastName').value = formData.lastName || '';
                    document.getElementById('firstName').value = formData.firstName || '';
                    document.getElementById('middleName').value = formData.middleName || '';
                }

                document.getElementById('birthDate').value = formData.birthDate || '';
                document.getElementById('passport').value = formData.passport || '';
                document.getElementById('phone').value = formData.phone || '';

                let edu = formData.education;
                if (edu === 'high') edu = 'Высшее';
                else if (edu === 'secondary') edu = 'Среднее профессиональное';
                else if (edu === 'school') edu = 'Среднее общее';
                document.getElementById('education').value = edu || 'Высшее';

                const income = formData.monthlyIncome !== undefined ? formData.monthlyIncome : formData.income;
                document.getElementById('income').value = income !== undefined ? income : '';
                document.getElementById('existingPayments').value = formData.existingPayments !== undefined ? formData.existingPayments : 0;

                document.getElementById('bkiConsent').checked = !!formData.bkiConsent;
                document.getElementById('pdpConsent').checked = !!formData.pdpConsent;

                const loanAmount = formData.desiredAmount !== undefined ? formData.desiredAmount : formData.loanAmount;
                document.getElementById('loanAmount').value = loanAmount !== undefined ? loanAmount : '';
                document.getElementById('loanTerm').value = formData.loanTerm || '';

                const region = formData.propertyRegion !== undefined ? formData.propertyRegion : formData.region;
                document.getElementById('region').value = region || '';

                document.getElementById('propertyValue').value = formData.propertyValue || '';
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
                        <option value="Высшее">Высшее</option>
                        <option value="Среднее профессиональное">Среднее профессиональное</option>
                        <option value="Среднее общее">Среднее общее</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Ежемесячный доход (₽)</label>
                    <input type="number" id="income" min="0" step="10000" required>
                </div>
                <div class="form-group">
                    <label>Ежемесячные платежи по действующим кредитам (₽)</label>
                    <input type="number" id="existingPayments" min="0" step="1000" value="0">
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

    // ==================== Обработчик отправки ====================
    async function onSubmit() {
        const lastName = document.getElementById('lastName').value.trim();
        const firstName = document.getElementById('firstName').value.trim();
        const middleName = document.getElementById('middleName').value.trim();
        const birthDate = document.getElementById('birthDate').value;
        const passport = document.getElementById('passport').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const education = document.getElementById('education').value;
        const income = parseFloat(document.getElementById('income').value);
        const existingPayments = parseFloat(document.getElementById('existingPayments').value) || 0;
        const bkiConsent = document.getElementById('bkiConsent').checked;
        const pdpConsent = document.getElementById('pdpConsent').checked;
        const loanAmount = parseFloat(document.getElementById('loanAmount').value);
        const loanTerm = parseInt(document.getElementById('loanTerm').value, 10);
        const region = document.getElementById('region').value.trim();
        const propertyValue = parseFloat(document.getElementById('propertyValue').value);

        if (!lastName || !firstName || !birthDate || !passport || !phone || isNaN(income) || !bkiConsent || !pdpConsent || isNaN(loanAmount) || isNaN(loanTerm) || !region || isNaN(propertyValue)) {
            alert('Пожалуйста, заполните все обязательные поля и подтвердите согласие на обращение в БКИ и на обработку персональных данных.');
            return;
        }
        if (income <= 0 || loanAmount <= 0 || loanTerm <= 0 || propertyValue <= 0 || existingPayments < 0) {
            alert('Доход, сумма, срок, стоимость недвижимости и действующие платежи должны быть положительными числами.');
            return;
        }

        const fullName = `${lastName} ${firstName} ${middleName}`.trim();

        const formData = {
            fullName,
            birthDate,
            passport,
            phone,
            education,
            monthlyIncome: income,
            bkiConsent,
            pdpConsent,
            desiredAmount: loanAmount,
            loanTerm,
            propertyRegion: region,
            propertyValue,
            existingPayments
        };

        const submitBtn = document.getElementById('submitBtn');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Обработка...';
        submitBtn.disabled = true;

        try {
            const result = await calculator.processApplication(formData);

            const resultForDisplay = {
                probability: result.data.probability,
                verdictText: result.data.mainMessage,
                reason: ''
            };

            if (result.data.status === 'success') {
                resultForDisplay.verdictClass = 'approved';
            } else if (result.data.status === 'warning') {
                resultForDisplay.verdictClass = 'maybe';
            } else {
                resultForDisplay.verdictClass = 'denied';
            }

            let reasonParts = [];
            if (result.data.riskFactors && result.data.riskFactors.length) {
                reasonParts = reasonParts.concat(result.data.riskFactors);
            }
            if (result.data.recommendation) {
                reasonParts.push(result.data.recommendation);
            }
            resultForDisplay.reason = reasonParts.join(' ') || 'Предварительный расчёт выполнен.';

            const offers = generateOffers({
                loanAmount,
                loanTerm,
                income,
                propertyValue,
                probability: result.data.probability,
                existingPayments
            });

            window.__lastResult = resultForDisplay;
            window.__lastOffers = offers;

            renderScreen('result');
        } catch (error) {
            console.error('Ошибка при обработке заявки:', error);
            alert('Произошла ошибка при расчёте. Попробуйте позже.');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    // ==================== Запуск ====================
    renderScreen('form');
})();