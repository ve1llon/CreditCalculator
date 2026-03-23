// класс расчёта и отправка на сервер
export class CreditCalculator {
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