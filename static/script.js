const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

let selectedCompany = null;
let selectedDate = null;
let selectedEvent = null;

document.addEventListener("DOMContentLoaded", () => {
  loadCompanies();

  tg.MainButton.setText("Выберите время");
  tg.MainButton.hide();

  tg.MainButton.onClick(() => {
    if (selectedEvent) {
      const bookingData = {
        initData: tg.initData,
        booking: {
          companyId: selectedCompany,
          date: selectedDate,
          time: selectedEvent.start.toISOString(),
          title: selectedEvent.title || "Запись"
        }
      };

      fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData)
      })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          tg.showAlert("Запись успешно создана!");
          tg.close();
        } else {
          tg.showAlert("Ошибка: " + (data.error || "неизвестно"));
        }
      })
      .catch(err => tg.showAlert("Ошибка сети"));
    }
  });
});

function loadCompanies() {
  fetch("/api/companies")
    .then(r => r.json())
    .then(data => {
      const list = document.getElementById("companies-list");
      list.innerHTML = "";
      data.companies.forEach(comp => {
        const btn = document.createElement("button");
        btn.textContent = `${comp.name} ★ ${comp.rating}`;
        btn.onclick = () => openCompany(comp.id);
        list.appendChild(btn);
      });
    });
}

function openCompany(id) {
  selectedCompany = id;
  document.getElementById("companies-list").style.display = "none";
  document.getElementById("calendar-container").style.display = "block";

  const calendarEl = document.getElementById("calendar");
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "timeGridWeek",
    locale: "ru",
    headerToolbar: { left: "prev,next today", center: "title", right: "dayGridMonth,timeGridWeek" },
    events: [
      // TODO: fetch реальных слотов из /api/slots?company=...
      { title: "Свободно", start: "2026-03-25T10:00:00", end: "2026-03-25T11:00:00" },
      { title: "Свободно", start: "2026-03-25T14:00:00", end: "2026-03-25T15:30:00" },
    ],
    eventClick: function(info) {
      selectedEvent = info.event;
      selectedDate = info.event.start;
      tg.MainButton.setText(`Записаться на ${info.event.start.toLocaleString("ru-RU")}`);
      tg.MainButton.show();
    }
  });

  calendar.render();
}
