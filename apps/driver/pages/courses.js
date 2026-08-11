async function submitCourse(amount, type) {
  amount = amount || parseFloat(document.getElementById('courseAmountInput')?.value);
  type = type || 'NORMALE';
  
  if (!amount || amount <= 0) {
    alert('Veuillez entrer un montant valide en Ar');
    return;
  }

  var submitBtn = document.getElementById('btnSaveCourse');
  try {
    if (submitBtn) submitBtn.disabled = true;

    var res = await apiFetch('/finances/courses', {
      method: 'POST',
      body: { amount: amount, type: type, date: new Date().toISOString() }
    });

    if (res && !res.error) {
      alert('Course enregistrée avec succès !');
      var amountInput = document.getElementById('courseAmountInput');
      if (amountInput) amountInput.value = '';
      if (typeof refreshDailyStats === 'function') refreshDailyStats();
    } else {
      alert(res?.error || res?.message || 'Erreur lors de l\'enregistrement');
    }
  } catch (err) {
    console.error('Erreur enregistrement course:', err);
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
}

async function submitExpense(category, amount) {
  if (!amount || amount <= 0) return;

  try {
    var res = await apiFetch('/finances/expenses', {
      method: 'POST',
      body: { category: category, amount: amount }
    });

    if (res && !res.error) {
      alert('Dépense (' + category + ') enregistrée !');
      if (typeof refreshDailyStats === 'function') refreshDailyStats();
    }
  } catch (err) {
    console.error('Erreur enregistrement dépense:', err);
  }
}
