// static/script.js

const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

let currentUser = null;
let isAdmin = false;
let myCompanies = [];
let selectedCompanyId = null;
let selectedDate = null;
let selectedTimeSlot = null;

// ────────────────────────────────────────────────
// ИНИЦИАЛИЗАЦИЯ
// ────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", async () => {
  // Показываем загрузку
  document.getElementById("companies-list").innerHTML = "<p>Загрузка...</p>";

  // Проверяем, есть ли у пользователя компании
  await checkUserCompanies();

  // Настраиваем основную кнопку Telegram
  tg.MainButton.setText("Выбрать время");
  tg.MainButton.hide();

  tg.MainButton.onClick(handleBooking);
});

// ────────────────────────────────────────────────
// ПРОВЕРКА КОМПАНИЙ ПОЛЬЗОВАТЕЛЯ
// ────────────────────────────────────────────────

async function checkUserCompanies() {
  try {
    const response = await fetch("/api/my_companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData: tg.initData })
    });

    const data = await response.json();

    if (data.companies && data.companies.length > 0) {
      isAdmin = true;
      myCompanies = data.companies;
      showAdminPanel();
    } else {
      isAdmin = false;
      showClientView();
    }
  } catch (err) {
    console.error("Ошибка загрузки компаний:", err);
    document.getElementById("companies-list").innerHTML = 
      "<p style='color:red;'>Ошибка загрузки данных</p>";
  }
}

// ────────────────────────────────────────────────
// РЕЖИМ КЛИЕНТА (просмотр компаний)
// ────────────────────────────────────────────────

function showClientView() {
  let html = `
    <h2>Доступные компании</h2>
    <div id="companies-container"></div>
    
    <div style="margin-top: 24px; text-align: center;">
      <button class="admin-btn" onclick="startCreateCompany()">
        Создать свою компанию
      </button>
    </div>
  `;

  document.getElementById("companies-list").innerHTML = html;

  // Загружаем публичный список компаний (можно позже сделать отдельный эндпоинт)
  loadPublicCompanies();
}

async function loadPublicCompanies() {
  // Пока используем те же данные, что и мои компании (для теста)
  // В будущем — отдельный /api/public_companies
  const container = document.getElementById("companies-container");

  // Пример: показываем компании текущего пользователя или заглушки
  if (myCompanies.length > 0) {
    myCompanies.forEach(c => {
      const div = document.createElement("div");
      div.className = "company-card";
      div.innerHTML = `
        <h3>${c.name}</h3>
        <p>Ссылка для клиентов: <a href="/company/${c.id}" target="_blank">Открыть</a></p>
      `;
      container.appendChild(div);
    });
  } else {
    container.innerHTML = "<p>Пока нет доступных компаний</p>";
  }
}

// ────────────────────────────────────────────────
// СОЗДАНИЕ КОМПАНИИ
// ────────────────────────────────────────────────

function startCreateCompany() {
  tg.showPopup({
    title: "Создание компании",
    message: "Введите название компании",
    buttons: [{type: "ok"}, {type: "cancel"}]
  }, async (button) => {
    if (button !== "ok") return;

    let name = prompt("Название компании:");
    if (!name || name.trim() === "") return tg.showAlert("Название обязательно");

    let photo = prompt("Ссылка на фото компании (можно пропустить):") || "";
    let description = prompt("Короткое описание:");
    let address = prompt("Адрес (город, улица):");

    try {
      const res = await fetch("/api/create_company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initData: tg.initData,
          name: name.trim(),
          photo,
          description: description || "",
          address: address || ""
        })
      });

      const data = await res.json();

      if (data.success) {
        tg.showAlert(`Компания "${name}" создана!\n\nСсылка для клиентов:\n${location.origin}/company/${data.company_id}`);
        location.reload(); // перезагружаем, чтобы увидеть админ-панель
      } else {
        tg.showAlert("Ошибка: " + (data.error || "неизвестная ошибка"));
      }
    } catch (err) {
      tg.showAlert("Ошибка сети");
      console.error(err);
    }
  });
}

// ────────────────────────────────────────────────
// АДМИН-ПАНЕЛЬ (для владельцев)
// ────────────────────────────────────────────────

function showAdminPanel() {
  let html = `<h2>Мои компании (${myCompanies.length})</h2>`;

  myCompanies.forEach(company => {
    html += `
      <div class="admin-company-card">
        <h3>${company.name}</h3>
        
        <div class="company-link">
          <strong>Ссылка для клиентов:</strong><br>
          <a href="/company/${company.id}" target="_blank">
            ${location.origin}/company/${company.id}
          </a>
          <button class="copy-btn" onclick="copyLink('/company/${company.id}')">Копировать</button>
        </div>

        <div style="margin-top: 16px;">
          <button onclick="addSpecialist(${company.id})">+ Добавить специалиста</button>
          <button onclick="addService(${company.id})">+ Добавить услугу</button>
          <!-- Можно добавить кнопку "Настроить календарь" -->
        </div>
      </div>
    `;
  });

  document.getElementById("companies-list").innerHTML = html;
}

function copyLink(path) {
  const fullLink = location.origin + path;
  navigator.clipboard.writeText(fullLink).then(() => {
    tg.showAlert("Ссылка скопирована!");
  }).catch(() => {
    tg.showAlert("Не удалось скопировать");
  });
}

// ────────────────────────────────────────────────
// ДОБАВЛЕНИЕ СПЕЦИАЛИСТА
// ────────────────────────────────────────────────

function addSpecialist(companyId) {
  tg.showPopup({
    title: "Новый специалист",
    message: "Введите данные специалиста",
    buttons: [{type: "ok"}, {type: "cancel"}]
  }, async (button) => {
    if (button !== "ok") return;

    let name = prompt("Имя:");
    if (!name) return;

    let surname = prompt("Фамилия:");
    let photo = prompt("Фото специалиста (URL):") || "";

    try {
      const res = await fetch("/api/add_specialist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initData: tg.initData,
          company_id: companyId,
          name: name.trim(),
          surname: surname || "",
          photo
        })
      });

      const data = await res.json();
      if (data.success) {
        tg.showAlert("Специалист добавлен!");
        location.reload(); // обновляем список
      } else {
        tg.showAlert("Ошибка добавления");
      }
    } catch (err) {
      tg.showAlert("Ошибка сети");
    }
  });
}

// ────────────────────────────────────────────────
// ЗАГЛУШКА ДЛЯ УСЛУГ (можно развить аналогично)
// ────────────────────────────────────────────────

function addService(companyId) {
  tg.showAlert("Добавление услуг пока в разработке.\nСкоро появится!");
  // Здесь будет похожий prompt / popup + POST /api/add_service
}

// ────────────────────────────────────────────────
// ОБРАБОТКА ЗАПИСИ (пока заглушка)
// ────────────────────────────────────────────────

function handleBooking() {
  if (!selectedTimeSlot) {
    tg.showAlert("Выберите время в календаре");
    return;
  }

  tg.showConfirm(`Записаться на ${selectedTimeSlot}?`, (confirmed) => {
    if (confirmed) {
      tg.showAlert("Запись отправлена! (демо-режим)");
      // Здесь будет реальный fetch на /api/book
    }
  });
}
