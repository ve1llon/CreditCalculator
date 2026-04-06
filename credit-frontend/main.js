// точка входа, рендеринг, обработчик отправки
import { injectStyles } from './styles.js';
import { CreditCalculator } from './creditCalculator.js';
import { generateOffers } from './offersGenerator.js';
import { loadFormFromFile } from './fileLoader.js';
import { buildFormScreen, buildResultScreen } from './uiBuilder.js';

// --- Логирование ---
const sessionId = localStorage.getItem('sessionId') || (() => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('sessionId', id);
    return id;
})();

function sendLog(level, message, details = {}) {
    const logData = { level, message, details, sessionId };
    // Отправляем асинхронно, игнорируем ошибки
    fetch('http://localhost:3000/api/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData)
    }).catch(err => console.warn('Log send failed:', err));
    // Дублируем в консоль для разработки
    console.log(`[${level}] ${message}`, details);
}

const app = document.getElementById('app');
injectStyles();

const calculator = new CreditCalculator();

let currentScreen = 'form';
let __lastResult = null;
let __lastOffers = null;

function renderScreen(screen) {
    sendLog('INFO', `Переход на экран: ${screen}`);
    app.innerHTML = '';

    if (screen === 'form') {
        const formScreen = buildFormScreen();
        app.appendChild(formScreen);

        document.getElementById('submitBtn').addEventListener('click', onSubmit);
        document.getElementById('loadBtn').addEventListener('click', loadFormFromFile);
    } else if (screen === 'result') {
        if (!__lastResult) {
            renderScreen('form');
            return;
        }
        const resultScreen = buildResultScreen(__lastResult, __lastOffers);
        app.appendChild(resultScreen);

        document.getElementById('backBtn').addEventListener('click', () => {
            renderScreen('form');
        });
    }
}

async function onSubmit() {
    sendLog('INFO', 'Начало обработки формы');
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
        sendLog('INFO', 'Вызов calculator.processApplication');
        const result = await calculator.processApplication(formData);
        sendLog('INFO', 'Расчёт завершён', { status: result.data.status, probability: result.data.probability });


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
            probability: result.data.probability,
            existingPayments
        }, calculator);

        __lastResult = resultForDisplay;
        __lastOffers = offers;

        renderScreen('result');
        sendLog('INFO', 'Экран результата отображён');
    } catch (error) {
        sendLog('ERROR', 'Ошибка при обработке заявки', { error: error.message, stack: error.stack });
        alert('Произошла ошибка при расчёте. Попробуйте позже.');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Запуск
renderScreen('form');
sendLog('INFO', 'Приложение запущено', { userAgent: navigator.userAgent });