// генерация контрпредложений
export function generateOffers(params, calculator) {
    const { loanAmount, loanTerm, income, probability, existingPayments } = params;
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
    const maxTerm = 360;
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
    const minAmount = 300000;
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

    // Уникальные предложения (не более двух)
    const uniqueOffers = [];
    for (let offer of offers) {
        if (!uniqueOffers.some(o => o.type === offer.type)) {
            uniqueOffers.push(offer);
        }
    }
    return uniqueOffers.slice(0, 2);
}