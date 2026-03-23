// построители экранов (форма и результат)
export function buildFormScreen() {
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

export function buildResultScreen(resultData, offers) {
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