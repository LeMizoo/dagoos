async function init_courses() {
  var container = document.getElementById('mainContent') || document.querySelector('main');
  if (container) {
    container.innerHTML = getHeaderHTML() + '<div style="padding:16px;max-width:500px;margin:0 auto;padding-bottom:80px;">' +
      '<h2 style="font-size:20px;font-weight:bold;margin-bottom:16px;">📋 Mes Courses</h2>' +
      '<div id="coursesAccepteesContainer"></div>' +
      '<div style="background:#064E3B;border-radius:12px;padding:16px;margin-bottom:12px;">' +
        '<h3 style="color:#10B981;margin-bottom:12px;font-size:14px;">➕ Enregistrer une course</h3>' +
        '<input type="number" id="courseAmountInput" placeholder="Montant (Ar)" style="width:100%;padding:10px;background:#252525;border:1px solid #333;border-radius:8px;color:#fff;font-size:14px;margin-bottom:8px;">' +
        '<button onclick="submitCourse()" id="btnSaveCourse" style="width:100%;padding:12px;background:#F59E0B;color:#0A1F18;border:none;border-radius:8px;font-weight:700;cursor:pointer;">✅ Enregistrer</button>' +
      '</div>' +
    '</div>';
  }
  
  // Afficher les courses acceptées
  var acceptees = JSON.parse(localStorage.getItem('dagoo_courses_acceptees') || '[]');
  var container = document.getElementById('coursesAccepteesContainer');
  if (container && acceptees.length > 0) {
    var html = '<div style="background:#D1FAE5;border-radius:12px;padding:16px;margin-bottom:16px;">' +
      '<p style="font-weight:bold;color:#065F46;margin-bottom:8px;">✅ Courses acceptées</p>';
    acceptees.forEach(function(c, index) {
      var statutLabel = c.statut === 'ACCEPTED' ? 'Acceptée' : c.statut === 'IN_PROGRESS' ? 'En cours' : 'Terminée';
      var statutColor = c.statut === 'ACCEPTED' ? '#F59E0B' : c.statut === 'IN_PROGRESS' ? '#3B82F6' : '#10B981';
      html += '<div style="background:white;border-radius:8px;padding:10px;margin-bottom:6px;">' +
        '<p style="font-size:14px;font-weight:bold;">Course acceptée</p>' +
        '<p style="font-size:12px;color:#6B7280;">' + new Date(c.date).toLocaleString('fr-FR') + '</p>' +
        '<span style="display:inline-block;background:' + statutColor + ';color:white;padding:2px 10px;border-radius:12px;font-size:11px;margin-top:6px;">' + statutLabel + '</span>';
      if (c.statut === 'ACCEPTED') {
        html += '<button onclick="demarrerCourse(' + index + ')" style="background:#3B82F6;color:white;border:none;padding:8px 16px;border-radius:6px;font-weight:bold;margin-top:8px;width:100%;">🚀 Démarrer</button>';
      } else if (c.statut === 'IN_PROGRESS') {
        html += '<button onclick="terminerCourse(' + index + ')" style="background:#10B981;color:white;border:none;padding:8px 16px;border-radius:6px;font-weight:bold;margin-top:8px;width:100%;">✅ Terminer</button>';
      }
      html += '</div>';
    });
    html += '</div>';
    container.innerHTML = html;
  }
}

function demarrerCourse(index) {
  var acceptees = JSON.parse(localStorage.getItem('dagoo_courses_acceptees') || '[]');
  if (acceptees[index]) {
    acceptees[index].statut = 'IN_PROGRESS';
    acceptees[index].heureDebut = new Date().toISOString();
    localStorage.setItem('dagoo_courses_acceptees', JSON.stringify(acceptees));
    loadPage('courses');
  }
}

function terminerCourse(index) {
  var acceptees = JSON.parse(localStorage.getItem('dagoo_courses_acceptees') || '[]');
  if (acceptees[index]) {
    acceptees[index].statut = 'COMPLETED';
    acceptees[index].heureFin = new Date().toISOString();
    localStorage.setItem('dagoo_courses_acceptees', JSON.stringify(acceptees));
    alert('✅ Course terminée !');
    loadPage('courses');
  }
}

window.init_courses = init_courses;
window.demarrerCourse = demarrerCourse;
window.terminerCourse = terminerCourse;

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

    var res = await window.apiFetch('/finances/courses', {
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
    var res = await window.apiFetch('/finances/expenses', {
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
