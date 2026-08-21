// ========================================
// DRIVER - DÉPENSES
// ========================================

var driverExpenses = [];

async function init_expenses() {
  var container =
    document.getElementById('mainContent') ||
    document.getElementById('pageContainer') ||
    document.querySelector('main');

  if (!container) return;

  container.innerHTML =
    getHeaderHTML() +
    '<div style="padding:16px;max-width:500px;margin:0 auto;padding-bottom:80px;">' +

      '<h2 style="font-size:20px;font-weight:bold;margin-bottom:16px;">Dépenses</h2>' +

      // FORMULAIRE
      '<div style="background:#1E293B;border-radius:12px;padding:16px;margin-bottom:12px;">' +
        '<h3 style="color:#DAA520;margin-bottom:12px;font-size:14px;">Nouvelle dépense</h3>' +

        '<select id="expenseCategory" style="width:100%;padding:10px;background:#252525;border:1px solid #333;border-radius:8px;color:#fff;font-size:13px;margin-bottom:8px;">' +
          '<option value="carburant">Carburant</option>' +
          '<option value="entretien">Entretien</option>' +
          '<option value="pneu">Pneus</option>' +
          '<option value="autre">Autre</option>' +
        '</select>' +

        '<input type="number" id="expenseAmount" placeholder="Montant (Ar)" min="1" style="width:100%;padding:10px;background:#252525;border:1px solid #333;border-radius:8px;color:#fff;font-size:13px;margin-bottom:8px;">' +

        '<input type="text" id="expenseDescription" placeholder="Description (facultatif)" style="width:100%;padding:10px;background:#252525;border:1px solid #333;border-radius:8px;color:#fff;font-size:13px;margin-bottom:10px;">' +

        '<button onclick="saveDriverExpense()" id="btnSaveExpense" style="width:100%;padding:12px;background:#F1C40F;color:#1A1A2E;border:none;border-radius:8px;font-weight:700;cursor:pointer;">' +
          'Enregistrer la dépense' +
        '</button>' +

        '<div id="expenseMessage" style="margin-top:8px;text-align:center;font-size:11px;"></div>' +
      '</div>' +

      // LISTE
      '<div style="background:#1E293B;border-radius:12px;padding:16px;">' +
        '<h3 style="color:#DAA520;margin-bottom:12px;font-size:14px;">Dépenses récentes</h3>' +
        '<div id="driverExpensesList">' +
          '<div style="color:#94A3B8;text-align:center;padding:15px;">Chargement...</div>' +
        '</div>' +
        '<div id="driverExpensesTotal" style="margin-top:12px;text-align:right;font-weight:700;color:#EF4444;font-size:13px;"></div>' +
      '</div>' +

    '</div>';

  await loadDriverExpenses();
}


// ========================================
// CHARGER LES DÉPENSES
// ========================================

async function loadDriverExpenses() {
  var list = document.getElementById('driverExpensesList');

  try {
    var result = await window.apiFetch('/finances/expenses');

    driverExpenses = Array.isArray(result)
      ? result
      : Array.isArray(result?.expenses)
        ? result.expenses
        : [];

    renderDriverExpenses();
  } catch (err) {
    console.error('Erreur chargement dépenses:', err);

    if (list) {
      list.innerHTML =
        '<div style="color:#F87171;text-align:center;padding:15px;">' +
        'Impossible de charger les dépenses.' +
        '</div>';
    }
  }
}


// ========================================
// AFFICHER LES DÉPENSES
// ========================================

function renderDriverExpenses() {
  var list = document.getElementById('driverExpensesList');
  var totalEl = document.getElementById('driverExpensesTotal');

  if (!list) return;

  if (!driverExpenses.length) {
    list.innerHTML =
      '<div style="color:#94A3B8;text-align:center;padding:15px;">' +
      'Aucune dépense enregistrée.' +
      '</div>';

    if (totalEl) totalEl.textContent = '';
    return;
  }

  var total = 0;

  var labels = {
    carburant: 'Carburant',
    entretien: 'Entretien',
    pneu: 'Pneus',
    autre: 'Autre'
  };

  var icons = {
    carburant: 'Carburant',
    entretien: 'Entretien',
    pneu: 'Pneus',
    autre: 'Autre'
  };

  var html = '';

  driverExpenses
    .slice()
    .reverse()
    .slice(0, 20)
    .forEach(function(expense) {
      var amount = Number(
        expense.amount ||
        expense.price ||
        0
      );

      total += amount;

      var category = expense.category || 'autre';

      var date = expense.date || expense.createdAt;

      var dateLabel = date
        ? new Date(date).toLocaleString('fr-FR')
        : '';

      html +=
        '<div style="background:#252525;border-radius:8px;padding:10px;margin-bottom:7px;">' +

          '<div style="display:flex;justify-content:space-between;gap:8px;">' +

            '<div>' +
              '<div style="color:#fff;font-weight:600;font-size:12px;">' +
                (icons[category] || labels[category] || category) +
              '</div>' +

              '<div style="color:#94A3B8;font-size:10px;margin-top:3px;">' +
                (expense.description || expense.desc || '') +
              '</div>' +

              (dateLabel
                ? '<div style="color:#64748B;font-size:9px;margin-top:3px;">' +
                    dateLabel +
                  '</div>'
                : '') +

            '</div>' +

            '<div style="color:#F87171;font-weight:700;font-size:12px;white-space:nowrap;">' +
              amount.toLocaleString() +
              ' Ar' +
            '</div>' +

          '</div>' +

        '</div>';
    });

  list.innerHTML = html;

  if (totalEl) {
    totalEl.textContent =
      'Total : ' +
      total.toLocaleString() +
      ' Ar';
  }
}


// ========================================
// ENREGISTRER UNE DÉPENSE
// ========================================

async function saveDriverExpense() {
  var category =
    document.getElementById('expenseCategory')?.value || 'autre';

  var amount =
    parseFloat(document.getElementById('expenseAmount')?.value) || 0;

  var description =
    document.getElementById('expenseDescription')?.value?.trim() || '';

  var button =
    document.getElementById('btnSaveExpense');

  var message =
    document.getElementById('expenseMessage');

  if (amount <= 0) {
    if (message) {
      message.innerHTML =
        '<span style="color:#F87171;">Montant invalide.</span>';
    }
    return;
  }

  try {
    if (button) {
      button.disabled = true;
      button.style.opacity = '0.6';
    }

    var result = await window.apiFetch('/finances/expenses', {
      method: 'POST',
      body: {
        category: category,
        amount: amount,
        description: description
      }
    });

    if (result && !result.error) {
      if (message) {
        message.innerHTML =
          '<span style="color:#22C55E;">Dépense enregistrée.</span>';
      }

      var amountInput =
        document.getElementById('expenseAmount');

      var descriptionInput =
        document.getElementById('expenseDescription');

      if (amountInput) amountInput.value = '';
      if (descriptionInput) descriptionInput.value = '';

      await loadDriverExpenses();

      if (typeof refreshDailyStats === 'function') {
        refreshDailyStats();
      }
    } else {
      throw new Error(
        result?.error ||
        result?.message ||
        'Erreur lors de l’enregistrement'
      );
    }

  } catch (err) {
    console.error('Erreur enregistrement dépense:', err);

    if (message) {
      message.innerHTML =
        '<span style="color:#F87171;">' +
        (err.message || 'Erreur lors de l’enregistrement') +
        '</span>';
    }

  } finally {
    if (button) {
      button.disabled = false;
      button.style.opacity = '1';
    }
  }
}


// ========================================
// EXPORTS
// ========================================

window.init_expenses = init_expenses;
window.loadDriverExpenses = loadDriverExpenses;
window.saveDriverExpense = saveDriverExpense;