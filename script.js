const CONFIG = {
    temp: {
        key: "temp",
        title: "Температура воздуха",
        icon: "🌡️",
        unit: "°C",
        min: 14,
        max: 30,
        normalMin: 22,
        normalMax: 26,
        measure: "1 раз / 5 мин",
        description: "Температура влияет на фотосинтез и скорость роста растений."
    },
    hum: {
        key: "hum",
        title: "Влажность воздуха",
        icon: "💧",
        unit: "%",
        min: 50,
        max: 85,
        normalMin: 60,
        normalMax: 75,
        measure: "1 раз / 5 мин",
        description: "Влажность влияет на транспирацию и усвоение питательных веществ."
    },
    light: {
        key: "light",
        title: "Освещенность",
        icon: "☀️",
        unit: "лк",
        min: 2000,
        max: 8000,
        normalMin: 4000,
        normalMax: 6000,
        measure: "1 раз / 5 мин",
        description: "Освещенность - ключевой фактор фотосинтеза."
    },
    water: {
        key: "water",
        title: "Расход воды",
        icon: "🚰",
        unit: "л",
        min: 80,
        max: 180,
        normalMin: 80,
        normalMax: 180,
        measure: "постоянно",
        description: "Автоматический контроль расхода воды помогает избегать перелива и засухи."
    }
};

const state = {
    temp: 23.3,
    hum: 73,
    light: 5081,
    water: 121.3,
    waterAvg: 118,
    waterLimit: 200,
    nextWatering: "2ч 12мин",
    soilTemp: 18.5,
    soilMoisture: 63,
    power: 124.5,
    powerCost: 498,
    co2: 320,
    co2Cost: 1280,
    salary: 45000,
    waterMonth: 3.6,
    waterCost: 180,
    totalExpenses: 45678,
    profit: 12500,
    history: {
        temp: [23.2, 23.3, 23.5, 23.7, 23.9, 24.0, 24.1, 24.0, 23.8, 23.6, 23.4, 23.2, 23.1, 23.3, 23.5, 23.7, 23.9, 24.0, 24.1, 23.9, 23.7, 23.5, 23.3, 23.2],
        hum: [70, 71, 72, 73, 74, 75, 76, 75, 74, 73, 72, 71, 70, 71, 72, 73, 74, 75, 76, 75, 74, 73, 72, 71],
        light: [5074, 5080, 5090, 5100, 5110, 5120, 5130, 5140, 5150, 5160, 5170, 5180, 5190, 5200, 5210, 5213, 5205, 5190, 5180, 5170, 5160, 5150, 5140, 5130],
        water: [112, 118, 124, 130, 125, 118, 112, 108, 115, 122, 128, 124, 118, 114, 110, 116, 122, 128, 132, 126, 120, 115, 110, 118]
    }
};

const charts = {};
let economicsPeriod = "month";

const METRIC_IDS = {
    temp: { value: "tempValueDisplay", min: "tempMinVal", max: "tempMaxVal", avg: "tempAvgVal", status: "tempStatusBadge", chart: "tempChart", decimals: 1, color: "#ff7b47" },
    hum: { value: "humValueDisplay", min: "humMinVal", max: "humMaxVal", avg: "humAvgVal", status: "humStatusBadge", chart: "humChart", decimals: 0, color: "#4f88ff" },
    light: { value: "lightValueDisplay", min: "lightMinVal", max: "lightMaxVal", avg: "lightAvgVal", status: "lightStatusBadge", chart: "lightChart", decimals: 0, color: "#f2b829" },
    water: { value: "waterValueDisplay", status: "waterStatusBadge", chart: "waterChart", decimals: 1, color: "#4f88ff" }
};

document.addEventListener("DOMContentLoaded", init);

function init() {
    const saved = localStorage.getItem("teplicaTheme");
    if (saved === "dark") {
        document.body.classList.add("dark-theme");
    }
    syncThemeIcon();
    bindModal();
    cacheCharts();
    resizeCanvases();
    renderAll();
    setInterval(tick, 5000);
    window.addEventListener("resize", resizeCanvases, { passive: true });
}

function bindModal() {
    const modal = document.getElementById("modal");
    modal.addEventListener("click", (e) => {
        if (e.target === modal || e.target.closest("[data-close]")) {
            closeModal();
        }
        const periodBtn = e.target.closest(".period-btn[data-period]");
        if (periodBtn) {
            economicsPeriod = periodBtn.dataset.period;
            openEconomicsModal();
        }
    });
    window.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal.style.display === "flex") closeModal();
    });
}

function cacheCharts() {
    Object.values(METRIC_IDS).forEach((meta) => {
        const canvas = document.getElementById(meta.chart);
        if (canvas) charts[meta.chart] = canvas;
    });
}

function resizeCanvases() {
    Object.values(charts).forEach((canvas) => {
        canvas.width = Math.max(240, Math.floor(canvas.clientWidth));
        canvas.height = Math.max(44, Math.floor(canvas.clientHeight));
    });
    drawMainSparklines();
}

function renderAll() {
    renderMetricCard("temp");
    renderMetricCard("hum");
    renderMetricCard("light");
    renderWaterCard();
    renderEconomicsSection();
    drawMainSparklines();
}

function renderMetricCard(key) {
    const meta = METRIC_IDS[key];
    const cfg = CONFIG[key];
    const val = state[key];
    const stats = getStats(state.history[key], meta.decimals);
    const status = getStatus(val, cfg);

    document.getElementById(meta.value).textContent = `${formatNumber(val, meta.decimals)} ${cfg.unit}`;
    document.getElementById(meta.min).textContent = stats.min;
    document.getElementById(meta.max).textContent = stats.max;
    document.getElementById(meta.avg).textContent = stats.avg;
    paintStatus(document.getElementById(meta.status), status);
}

function renderWaterCard() {
    const status = getStatus(state.water, CONFIG.water);
    document.getElementById("waterValueDisplay").textContent = `${formatNumber(state.water, 1)} л`;
    document.getElementById("waterAvg").textContent = formatNumber(state.waterAvg, 0);
    document.getElementById("waterLimit").textContent = formatNumber(state.waterLimit, 0);
    document.getElementById("waterLeft").textContent = formatNumber(state.waterLimit - state.water, 1);
    paintStatus(document.getElementById("waterStatusBadge"), status);
}

function renderEconomicsSection() {
    const root = document.getElementById("economicsContent");
    root.innerHTML = `
        <div class="economics-soil-grid">
            <div class="soil-item">
                <div class="soil-head">
                    <span class="soil-icon">🌡️🌱</span>
                    <span class="soil-label">Температура почвы</span>
                </div>
                <div class="soil-value">${formatNumber(state.soilTemp, 1)} °C</div>
            </div>
            <div class="soil-item">
                <div class="soil-head">
                    <span class="soil-icon">💧🌱</span>
                    <span class="soil-label">Влажность почвы</span>
                </div>
                <div class="soil-value">${formatNumber(state.soilMoisture, 0)} %</div>
            </div>
        </div>
        <div class="economics-grid">
            <div class="economics-item"><div class="economics-label">Электроэнергия</div><div class="economics-value">${formatNumber(state.power, 1)} кВт·ч</div><div class="economics-subvalue">${formatMoney(state.powerCost)} сом</div></div>
            <div class="economics-item"><div class="economics-label">CO₂</div><div class="economics-value">${formatNumber(state.co2, 0)} кг</div><div class="economics-subvalue">${formatMoney(state.co2Cost)} сом</div></div>
            <div class="economics-item"><div class="economics-label">Зарплата</div><div class="economics-value">${formatMoney(state.salary)} сом</div><div class="economics-subvalue">фиксировано в месяц</div></div>
            <div class="economics-item"><div class="economics-label">Вода (мес)</div><div class="economics-value">${formatNumber(state.waterMonth, 1)} м³</div><div class="economics-subvalue">${formatMoney(state.waterCost)} сом</div></div>
        </div>
        <div class="economics-total-row"><span class="total-label">Общие расходы</span><span class="total-value">${formatMoney(state.totalExpenses)} сом</span></div>
        <div class="profit-row"><span class="profit-label">Прибыль</span><span class="profit-value">+${formatMoney(state.profit)} сом</span></div>
    `;
}

function drawMainSparklines() {
    drawSpark("tempChart", state.history.temp, METRIC_IDS.temp.color);
    drawSpark("humChart", state.history.hum, METRIC_IDS.hum.color);
    drawSpark("lightChart", state.history.light, METRIC_IDS.light.color);
    drawSpark("waterChart", state.history.water, METRIC_IDS.water.color);
}

function drawSpark(id, values, color) {
    const canvas = charts[id];
    if (!canvas || values.length < 2) return;
    drawSparkCanvas(canvas, values, color);
}

function drawSparkCanvas(canvas, values, color) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const pad = 6;
    const step = (w - pad * 2) / (values.length - 1);

    const points = values.map((v, i) => ({
        x: pad + i * step,
        y: h - pad - ((v - min) / range) * (h - pad * 2)
    }));

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, color + "44");
    grad.addColorStop(1, color + "08");

    ctx.beginPath();
    ctx.moveTo(points[0].x, h - pad);
    points.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, h - pad);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    points.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
}

function tick() {
    state.temp = clamp(round(state.temp + rand(-0.25, 0.25), 1), 21.6, 25.6);
    state.hum = clamp(Math.round(state.hum + rand(-2, 2)), 66, 79);
    state.light = clamp(Math.round(state.light + rand(-95, 95)), 4950, 5350);
    state.water = clamp(round(state.water + rand(-1.2, 1.2), 1), 98, 148);

    state.soilTemp = clamp(round(state.soilTemp + rand(-0.2, 0.2), 1), 17.0, 20.2);
    state.soilMoisture = clamp(Math.round(state.soilMoisture + rand(-1, 1)), 58, 72);
    state.power = round(118 + rand(0, 14), 1);
    state.powerCost = Math.round(state.power * 4);
    state.co2 = Math.round(300 + rand(0, 45));
    state.co2Cost = Math.round(state.co2 * 4);
    state.waterMonth = round((state.water * 30) / 1000, 1);
    state.waterCost = Math.round(state.waterMonth * 50);
    state.totalExpenses = state.powerCost + state.co2Cost + state.salary + state.waterCost + 3200 + 1500 + 800;
    state.profit = Math.round(12000 + rand(-1300, 1300));

    pushHistory("temp", state.temp);
    pushHistory("hum", state.hum);
    pushHistory("light", state.light);
    pushHistory("water", state.water);

    renderAll();
}

function openModal(key) {
    openMetricModal(key);
}

function openMetricModal(key) {
    const cfg = CONFIG[key];
    const val = state[key];
    const history = state.history[key];
    const stats = getStats(history, METRIC_IDS[key].decimals);
    const status = getStatus(val, cfg);

    setModalHTML(`
        <div class="modal-header">
            <span class="modal-icon">${cfg.icon}</span>
            <h2>${cfg.title}</h2>
            <span class="modal-status ${status.cls}">${status.text}</span>
            <button class="modal-close" type="button" data-close aria-label="Закрыть">×</button>
        </div>
        <div class="modal-body">
            <div class="modal-current-value">${formatNumber(val, METRIC_IDS[key].decimals)} ${cfg.unit}</div>
            <div class="modal-stats">
                <div class="modal-stat-item"><div class="modal-stat-label">Минимум</div><div class="modal-stat-value">${stats.min} ${cfg.unit}</div></div>
                <div class="modal-stat-item"><div class="modal-stat-label">Максимум</div><div class="modal-stat-value">${stats.max} ${cfg.unit}</div></div>
                <div class="modal-stat-item"><div class="modal-stat-label">Среднее</div><div class="modal-stat-value">${stats.avg} ${cfg.unit}</div></div>
            </div>
            <div class="modal-ranges">
                <div class="range-item"><div class="range-label">Рекомендуемый диапазон</div><div class="range-value">${cfg.normalMin}-${cfg.normalMax} ${cfg.unit}</div></div>
                <div class="range-item"><div class="range-label">Критические значения</div><div class="range-value">ниже ${cfg.min} ${cfg.unit}<br>выше ${cfg.max} ${cfg.unit}</div></div>
            </div>
            <div class="modal-description">${cfg.description}<div class="modal-note">Частота измерений: ${cfg.measure}</div></div>
            <div class="modal-chart-container"><canvas id="modalChart" width="640" height="92"></canvas></div>
        </div>
    `);

    const c = document.getElementById("modalChart");
    c.width = Math.max(280, Math.floor(c.clientWidth));
    c.height = Math.max(70, Math.floor(c.clientHeight));
    drawSparkCanvas(c, history, METRIC_IDS[key].color);
}

function openWaterModal() {
    const status = getStatus(state.water, CONFIG.water);

    setModalHTML(`
        <div class="modal-header">
            <span class="modal-icon">🚰</span>
            <h2>Расход воды</h2>
            <span class="modal-status ${status.cls}">${status.text}</span>
            <button class="modal-close" type="button" data-close aria-label="Закрыть">×</button>
        </div>
        <div class="modal-body">
            <div class="modal-current-value">${formatNumber(state.water, 1)} л</div>
            <div class="modal-stats">
                <div class="modal-stat-item"><div class="modal-stat-label">Средний</div><div class="modal-stat-value">${formatNumber(state.waterAvg, 0)} л/день</div></div>
                <div class="modal-stat-item"><div class="modal-stat-label">Лимит</div><div class="modal-stat-value">${formatNumber(state.waterLimit, 0)} л/день</div></div>
                <div class="modal-stat-item"><div class="modal-stat-label">Остаток</div><div class="modal-stat-value">${formatNumber(state.waterLimit - state.water, 1)} л</div></div>
            </div>
            <div class="modal-water-next">⏳ Следующий полив через ${state.nextWatering}</div>
            <div class="modal-ranges">
                <div class="range-item"><div class="range-label">Рекомендуемый диапазон</div><div class="range-value">80-180 л/день</div></div>
                <div class="range-item"><div class="range-label">Критические значения</div><div class="range-value">ниже 80 л<br>выше 180 л</div></div>
            </div>
            <div class="modal-description"><p>${CONFIG.water.description}</p></div>
            <div class="modal-chart-container"><canvas id="modalWaterChart" width="640" height="92"></canvas></div>
        </div>
    `);

    document.querySelector("#modal .modal-content").classList.add("water-modal");

    const c = document.getElementById("modalWaterChart");
    c.width = Math.max(280, Math.floor(c.clientWidth));
    c.height = Math.max(70, Math.floor(c.clientHeight));
    drawSparkCanvas(c, state.history.water.slice(-20), METRIC_IDS.water.color);
}

function openEconomicsModal() {
    const multiplier = economicsPeriod === "day" ? 1 / 30 : economicsPeriod === "year" ? 12 : 1;
    const periodText = economicsPeriod === "day" ? "день" : economicsPeriod === "year" ? "год" : "месяц";
    const salaryNote = economicsPeriod === "month" ? "фиксировано в месяц" : "приведено к периоду";

    setModalHTML(`
        <div class="modal-header">
            <span class="modal-icon">📊</span>
            <h2>Экономические показатели</h2>
            <span class="modal-status modal-status-normal">${periodText}</span>
            <button class="modal-close" type="button" data-close aria-label="Закрыть">×</button>
        </div>
        <div class="period-selector">
            <button class="period-btn ${economicsPeriod === "day" ? "active" : ""}" type="button" data-period="day">День</button>
            <button class="period-btn ${economicsPeriod === "month" ? "active" : ""}" type="button" data-period="month">Месяц</button>
            <button class="period-btn ${economicsPeriod === "year" ? "active" : ""}" type="button" data-period="year">Год</button>
        </div>
        <div class="modal-body">
            <div class="economics-detailed-grid">
                <div class="economics-detailed-item"><div class="economics-detailed-label">Температура почвы</div><div class="economics-detailed-value">${formatNumber(state.soilTemp, 1)} °C</div></div>
                <div class="economics-detailed-item"><div class="economics-detailed-label">Влажность почвы</div><div class="economics-detailed-value">${formatNumber(state.soilMoisture, 0)} %</div></div>
                <div class="economics-detailed-item"><div class="economics-detailed-label">Электроэнергия</div><div class="economics-detailed-value">${formatNumber(state.power * multiplier, 1)} кВт·ч</div><div class="economics-detailed-subvalue">${formatMoney(state.powerCost * multiplier)} сом</div></div>
                <div class="economics-detailed-item"><div class="economics-detailed-label">CO₂</div><div class="economics-detailed-value">${formatNumber(state.co2 * multiplier, 0)} кг</div><div class="economics-detailed-subvalue">${formatMoney(state.co2Cost * multiplier)} сом</div></div>
                <div class="economics-detailed-item"><div class="economics-detailed-label">Зарплата</div><div class="economics-detailed-value">${formatMoney(state.salary * multiplier)} сом</div><div class="economics-detailed-subvalue">${salaryNote}</div></div>
                <div class="economics-detailed-item"><div class="economics-detailed-label">Вода</div><div class="economics-detailed-value">${formatNumber(state.waterMonth * multiplier, 1)} м³</div><div class="economics-detailed-subvalue">${formatMoney(state.waterCost * multiplier)} сом</div></div>
            </div>
            <div class="economics-total"><span class="economics-total-label">Общие расходы</span><span class="economics-total-value">${formatMoney(state.totalExpenses * multiplier)} сом</span></div>
            <div class="economics-total economics-total-profit"><span class="economics-total-label">Прибыль</span><span class="economics-total-value economics-profit-value">+${formatMoney(state.profit * multiplier)} сом</span></div>
            <div class="modal-description modal-description-compact">Рентабельность: 24%. Данные обновляются в реальном времени.</div>
        </div>
    `);
}

function setModalHTML(html) {
    const content = document.querySelector("#modal .modal-content");
    content.classList.remove("water-modal");
    content.innerHTML = html;
    const modal = document.getElementById("modal");
    modal.style.display = "flex";
}

function closeModal() {
    const modal = document.getElementById("modal");
    modal.style.display = "none";
}

function toggleTheme() {
    document.body.classList.toggle("dark-theme");
    localStorage.setItem("teplicaTheme", document.body.classList.contains("dark-theme") ? "dark" : "light");
    syncThemeIcon();
}

function syncThemeIcon() {
    const icon = document.querySelector(".theme-icon");
    if (icon) {
        icon.textContent = document.body.classList.contains("dark-theme") ? "☀️" : "🌙";
    }
}

function getStats(arr, decimals) {
    const min = Math.min(...arr);
    const max = Math.max(...arr);
    const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
    return {
        min: formatNumber(min, decimals),
        max: formatNumber(max, decimals),
        avg: formatNumber(avg, decimals)
    };
}

function getStatus(value, cfg) {
    if (value <= cfg.min || value >= cfg.max) return { text: "Критично", cls: "modal-status-critical" };
    const band = (cfg.max - cfg.min) * 0.12;
    if (value <= cfg.min + band || value >= cfg.max - band) return { text: "Риск", cls: "modal-status-critical" };
    return { text: "Норма", cls: "modal-status-normal" };
}

function paintStatus(el, status) {
    el.textContent = status.text;
    el.classList.remove("modal-status-normal", "modal-status-critical");
    el.classList.add(status.cls);
}

function pushHistory(key, value) {
    state.history[key].push(value);
    state.history[key].shift();
}

function rand(min, max) {
    return Math.random() * (max - min) + min;
}

function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

function round(v, decimals) {
    const p = 10 ** decimals;
    return Math.round(v * p) / p;
}

function formatNumber(v, decimals) {
    return Number(v).toLocaleString("ru-RU", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

function formatMoney(v) {
    return Math.round(v).toLocaleString("ru-RU");
}
