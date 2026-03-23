// загрузка данных из файла в форму
export function loadFormFromFile() {
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