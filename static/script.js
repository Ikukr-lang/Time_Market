const tg = window.Telegram.WebApp;
tg.ready(); tg.expand();

let currentCompany = null;
let currentStep = 1;
let specialists = [];
let services = [];

// Главный экран
function showMainMenu() {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('main-menu').classList.add('active');
}

async function checkCompanies() {
  const res = await fetch("/api/my_companies", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({initData: tg.initData})
  });
  const data = await res.json();
  if (data.companies && data.companies.length > 0) {
    currentCompany = data.companies[0];
    showAdminPanel();
  } else {
    showMainMenu();
  }
}

// Поддержка
function showSupport() {
  tg.showPopup({
    title: "Поддержка",
    message: "Напишите ваш вопрос:",
    buttons: [{type: "ok"}, {type: "cancel"}]
  }, (btn) => {
    if (btn === "ok") {
      let question = prompt("Ваш вопрос:");
      if (question) tg.showAlert("✅ Сообщение отправлено администратору!");
    }
  });
}

// Создание компании
function startCreateCompany() {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('create-screen').classList.add('active');
  currentStep = 1;
  specialists = [];
  services = [];
  renderCreateStep();
}

function renderCreateStep() {
  const content = document.getElementById('step-content');
  if (currentStep === 1) {
    content.innerHTML = `
      <div class="card">
        <input type="text" id="name" placeholder="Название компании" style="width:100%;padding:12px;margin-bottom:12px;">
        <input type="text" id="photo" placeholder="Ссылка на фото компании">
        <button onclick="nextStep()" style="width:100%;padding:14px;background:#0088cc;color:white;border:none;border-radius:8px;">Далее</button>
      </div>
    `;
  } else if (currentStep === 2) {
    content.innerHTML = `
      <div class="card">
        <input type="text" id="description" placeholder="Описание">
        <input type="text" id="address" placeholder="Адрес">
        <button onclick="nextStep()" style="width:100%;padding:14px;background:#0088cc;color:white;border:none;border-radius:8px;">Далее → Специалисты</button>
      </div>
    `;
  } else if (currentStep === 3) {
    content.innerHTML = `
      <h3>Специалисты</h3>
      <div id="spec-list"></div>
      <button onclick="addSpecialistPrompt()" style="width:100%;padding:14px;">+ Добавить специалиста</button>
      <button onclick="nextStep()" style="width:100%;padding:14px;background:#0088cc;color:white;border:none;border-radius:8px;margin-top:12px;">Далее → Услуги</button>
    `;
    renderSpecialists();
  } else if (currentStep === 4) {
    content.innerHTML = `
      <h3>Услуги</h3>
      <div id="service-list"></div>
      <button onclick="addServicePrompt()" style="width:100%;padding:14px;">+ Добавить услугу</button>
      <button onclick="finishCreation()" style="width:100%;padding:14px;background:#00cc66;color:white;border:none;border-radius:8px;margin-top:12px;">Завершить создание</button>
    `;
    renderServices();
  }
}

function nextStep() {
  if (currentStep === 1) {
    const name = document.getElementById('name').value.trim();
    const photo = document.getElementById('photo').value;
    if (!name) return tg.showAlert("Название обязательно!");
    currentCompany = {name, photo};
  } else if (currentStep === 2) {
    currentCompany.description = document.getElementById('description').value;
    currentCompany.address = document.getElementById('address').value;
  }
  currentStep++;
  renderCreateStep();
}

function addSpecialistPrompt() {
  const name = prompt("Имя специалиста:");
  const surname = prompt("Фамилия:");
  const photo = prompt("Ссылка на фото (круглое):") || "https://via.placeholder.com/60";
  if (name) {
    specialists.push({name, surname, photo});
    renderSpecialists();
  }
}

function renderSpecialists() {
  const list = document.getElementById('spec-list');
  list.innerHTML = specialists.map((s,i) => `
    <div class="card" style="display:flex;align-items:center;">
      <img src="${s.photo}" class="photo" style="margin-right:12px;">
      <div><b>${s.surname} ${s.name}</b></div>
    </div>
  `).join('');
}

function addServicePrompt() {
  const name = prompt("Название услуги:");
  const price = prompt("Стоимость (₽):");
  const duration = prompt("Длительность (мин):");
  if (name && price) {
    services.push({name, price, duration});
    renderServices();
  }
}

function renderServices() {
  const list = document.getElementById('service-list');
  list.innerHTML = services.map(s => `
    <div class="card">${s.name} — ${s.price}₽ (${s.duration} мин)</div>
  `).join('');
}

async function finishCreation() {
  const payload = {
    initData: tg.initData,
    name: currentCompany.name,
    photo: currentCompany.photo,
    description: currentCompany.description || "",
    address: currentCompany.address || ""
  };

  const res = await fetch("/api/create_company", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(payload)
  });
  const data = await res.json();

  if (data.success) {
    // Добавляем специалистов и услуги
    for (let s of specialists) {
      await fetch("/api/add_specialist", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({initData: tg.initData, company_id: data.company_id, ...s})});
    }
    for (let srv of services) {
      await fetch("/api/add_service", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({initData: tg.initData, company_id: data.company_id, ...srv})});
    }

    tg.showAlert(`Компания создана!\nСсылка для клиентов:\n${location.origin}/company/${data.company_id}`);
    location.reload();
  }
}

// Админ-панель
async function showAdminPanel() {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('admin-screen').classList.add('active');

  const html = `
    <div class="card">
      <h3>${currentCompany.name}</h3>
      <p>Ссылка для записи:</p>
      <a href="/company/${currentCompany.id}" target="_blank" style="color:#0088cc;">${location.origin}/company/${currentCompany.id}</a>
      <button onclick="copyLink()" style="width:100%;margin-top:12px;">Копировать ссылку</button>
    </div>
    <h3>Специалисты</h3>
    <div id="admin-specs"></div>
    <button onclick="addSpecialistPromptAdmin()">+ Добавить специалиста</button>
  `;
  document.getElementById('admin-content').innerHTML = html;
  renderAdminSpecialists();
}

function copyLink() {
  navigator.clipboard.writeText(`${location.origin}/company/${currentCompany.id}`);
  tg.showAlert("Ссылка скопирована!");
}

// Запуск
checkCompanies();
