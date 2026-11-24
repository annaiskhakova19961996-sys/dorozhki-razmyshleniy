const storageKey = 'dorozhki.v1';
const main = document.querySelector('#main');
const modal = document.querySelector('#modal');
const modalContent = document.querySelector('#modal-content');
let categoryId = 'logic';
let currentView = 'tasks';
let quiz = null;
let toastTimer;
let storageAvailable = true;
let state = { results: {}, activity: {}, journal: [] };
const escapeText = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const dayKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

try {
  const saved = JSON.parse(localStorage.getItem(storageKey));
  if (saved && typeof saved === 'object') {
    for (const lesson of lessons) {
      const result = saved.results?.[lesson.id];
      if (Number.isInteger(result) && result >= 0 && result <= lesson.questions.length) state.results[lesson.id] = result;
    }
    for (const [date, ids] of Object.entries(saved.activity || {})) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(date) && Array.isArray(ids)) state.activity[date] = [...new Set(ids.filter(id => lessons.some(lesson => lesson.id === id)))];
    }
    if (Array.isArray(saved.journal)) state.journal = saved.journal.filter(entry => typeof entry.text === 'string' && typeof entry.id === 'string' && Number.isFinite(Date.parse(entry.date))).slice(0, 100).map(entry => ({ id: entry.id, text: entry.text.slice(0, 1000), date: entry.date }));
  }
} catch { storageAvailable = false; }

function notify(message) {
  const toast = document.querySelector('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}

function saveState() {
  try { localStorage.setItem(storageKey, JSON.stringify(state)); storageAvailable = true; }
  catch { storageAvailable = false; notify('Браузер не смог сохранить данные. Они останутся до закрытия страницы.'); }
  updateStats();
}

function illustration(lesson) {
  const palette = {yellow:['#ffef8b','#e6c74d','#fff7b9'],mint:['#adf0e6','#59c3b1','#d4fff4'],blue:['#b6e5ff','#7bbce8','#def5ff'],lavender:['#ded2ff','#ac91e4','#f0eaff'],peach:['#ffd5b8','#edaa83','#ffe9d9']}[lesson.color];
  const decoration = `<rect width="240" height="180" fill="${palette[0]}"/><circle cx="215" cy="30" r="48" fill="${palette[2]}" opacity=".55"/><circle cx="22" cy="166" r="52" fill="${palette[1]}" opacity=".15"/><path d="m202 135 4 9 10 3-10 3-4 9-3-9-10-3 10-3Z" fill="white" opacity=".8"/><circle cx="27" cy="42" r="4" fill="white" opacity=".7"/>`;
  let drawing;
  if (['paths','turns','riddle'].includes(lesson.id)) drawing = '<path d="M33 154V119Q33 106 47 106H96Q112 106 112 91V62Q112 47 128 47H185Q201 47 201 31" stroke="#d4b447" stroke-width="30" fill="none" stroke-linecap="round" opacity=".35"/><path d="M33 146V114Q33 101 47 101H96Q112 101 112 86V57Q112 42 128 42H185Q201 42 201 26" stroke="#fffdf0" stroke-width="24" fill="none" stroke-linecap="round"/><path d="M33 146V114Q33 101 47 101H96Q112 101 112 86V57Q112 42 128 42H185Q201 42 201 26" stroke="#c4a841" stroke-width="2" fill="none" stroke-dasharray="5 7"/><circle cx="33" cy="146" r="12" fill="#61b987" stroke="white" stroke-width="4"/><path d="m195 17 7-15 7 15 16 2-12 11 3 16-14-8-14 8 3-16-12-11Z" fill="#f7b849" stroke="white" stroke-width="3"/><rect x="143" y="104" width="40" height="40" rx="10" fill="#f5c162" transform="rotate(15 163 124)"/><path d="m155 124 7 7 10-15" fill="none" stroke="white" stroke-width="4" stroke-linecap="round"/>';
  else if (['shapes','build','different','mirror'].includes(lesson.id)) drawing = '<path d="m47 98 32-63 35 63Z" fill="#8c91e2" stroke="#a5a6ed" stroke-width="3"/><path d="m48 98 31-63v63Z" fill="#a6acef"/><rect x="129" y="87" width="61" height="61" rx="11" fill="#f4bf60" transform="rotate(14 159 118)"/><rect x="137" y="91" width="43" height="43" rx="5" fill="#ffdc8b" transform="rotate(14 159 118)"/><circle cx="76" cy="137" r="25" fill="#fffef3"/><circle cx="76" cy="137" r="15" fill="#ffb9aa"/><path d="m164 26 26 26-26 26-26-26Z" fill="#ffffff" opacity=".9"/><path d="m164 36 16 16-16 16-16-16Z" fill="#67c6c1"/>';
  else if (['words','opposites','meaning','code'].includes(lesson.id)) drawing = '<g transform="translate(40 44) rotate(-12 36 36)"><rect y="7" width="69" height="69" rx="13" fill="#c7a4db"/><rect width="69" height="69" rx="13" fill="#fffaf5"/><text x="35" y="49" font-size="47" font-family="Arial,sans-serif" font-weight="bold" text-anchor="middle" fill="#a98adb">А</text></g><g transform="translate(119 73) rotate(13 36 36)"><rect y="7" width="69" height="69" rx="13" fill="#7cc1ae"/><rect width="69" height="69" rx="13" fill="#effff7"/><text x="35" y="49" font-size="47" font-family="Arial,sans-serif" font-weight="bold" text-anchor="middle" fill="#63b49b">Б</text></g><path d="m170 28 4 10 11 3-11 3-4 11-3-11-11-3 11-3Z" fill="#fffbec"/>';
  else drawing = '<g transform="translate(24 51) rotate(-11 32 32)"><rect y="7" width="58" height="65" rx="12" fill="#8ba8db"/><rect width="58" height="65" rx="12" fill="#fffaf3"/><text x="29" y="47" fill="#8a8fd7" font-size="45" font-weight="bold" font-family="Arial,sans-serif" text-anchor="middle">2</text></g><g transform="translate(91 34) rotate(9 32 32)"><rect y="7" width="58" height="65" rx="12" fill="#e0b25b"/><rect width="58" height="65" rx="12" fill="#ffe09a"/><text x="29" y="47" fill="#c58c37" font-size="45" font-weight="bold" font-family="Arial,sans-serif" text-anchor="middle">4</text></g><g transform="translate(151 91) rotate(14 32 32)"><rect y="7" width="58" height="65" rx="12" fill="#ac98d9"/><rect width="58" height="65" rx="12" fill="#c5b1ef"/><text x="29" y="47" fill="white" font-size="45" font-weight="bold" font-family="Arial,sans-serif" text-anchor="middle">?</text></g><circle cx="98" cy="143" r="14" fill="#ffe27f" stroke="#fff4bc" stroke-width="5"/>';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${decoration}${drawing}</svg>`;
}

function renderCategories() {
  document.querySelector('#categories').innerHTML = categories.map(category => `<button class="category ${category.id === categoryId && currentView === 'tasks' ? 'active' : ''}" data-category="${category.id}" aria-pressed="${category.id === categoryId && currentView === 'tasks'}"><span class="category-icon" aria-hidden="true">${category.icon}</span><span>${category.title}</span></button>`).join('');
}

function getBadges() {
  const completed = Object.keys(state.results).length;
  const stars = Object.values(state.results).reduce((sum, score) => sum + score, 0);
  return [
    {name:'Первый шаг',symbol:'◇',hint:'Пройди одно задание',unlocked:completed >= 1},
    {name:'Искра мысли',symbol:'✦',hint:'Реши задание без ошибок',unlocked:Object.values(state.results).includes(3)},
    {name:'Новая высота',symbol:'△',hint:'Пройди 5 заданий',unlocked:completed >= 5},
    {name:'Созвездие',symbol:'✧',hint:'Собери 15 звёзд',unlocked:stars >= 15},
    {name:'Исследование',symbol:'▧',hint:'Попробуй все 6 дорожек',unlocked:categories.every(category => lessons.some(lesson => lesson.category === category.id && Object.hasOwn(state.results, lesson.id)))},
    {name:'Большой путь',symbol:'◈',hint:'Пройди все 18 заданий',unlocked:completed === lessons.length}
  ];
}

function updateStats() {
  const stars = Object.values(state.results).reduce((sum, score) => sum + score, 0);
  const completed = Object.keys(state.results).length;
  document.querySelector('#header-stars').textContent = stars;
  document.querySelector('#completed-label').textContent = `${completed} из ${lessons.length} заданий пройдено`;
  document.querySelector('#rank-title').textContent = stars >= 30 ? 'Новая вершина' : stars >= 10 ? 'Любознательность' : 'Первый шаг';
  document.querySelector('#rank-subtitle').textContent = `Звёзд на твоём пути: ${stars}`;
  document.querySelector('#rank-meter').setAttribute('aria-valuenow', Math.min(stars, 30));
  document.querySelector('#rank-meter i').style.width = `${Math.min(stars / 30 * 100, 100)}%`;
  const badges = getBadges().filter(badge => badge.unlocked).length;
  document.querySelector('#collection-count').textContent = badges;
  document.querySelector('#collection-meter i').style.width = `${badges / 6 * 100}%`;
  const todayCount = state.activity[dayKey()]?.length || 0;
  document.querySelector('#daily-label').textContent = todayCount >= 3 ? 'Цель достигнута!' : `${todayCount} из 3 заданий`;
  const monday = new Date();
  monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
  document.querySelector('#week').innerHTML = ['П','В','С','Ч','П','С','В'].map((label, index) => {
    const date = new Date(monday);
    date.setDate(date.getDate() + index);
    const key = dayKey(date);
    const achieved = (state.activity[key]?.length || 0) >= 3;
    return `<span class="${key === dayKey() ? 'today' : ''} ${achieved ? 'achieved' : ''}" title="${key}: ${state.activity[key]?.length || 0} заданий">${label}<i>${achieved ? '✓' : '·'}</i></span>`;
  }).join('');
  document.querySelector('#storage-status').textContent = storageAvailable ? 'Можно продолжить позже' : 'Сохранение недоступно';
}

function heading(title, subtitle, eyebrow = 'УЧИМСЯ ДУМАТЬ · ШАГ ЗА ШАГОМ') {
  return `<div class="eyebrow">${eyebrow}</div><div class="heading-row"><div><h1>${title}</h1><p class="subtitle">${subtitle}</p></div><span class="age-chip">6–10 лет</span></div>`;
}

function renderTasks() {
  const category = categories.find(item => item.id === categoryId);
  const selected = lessons.filter(lesson => lesson.category === categoryId);
  main.innerHTML = heading(category.title, category.subtitle) + `<div class="cards">${selected.map((lesson, index) => {
    const completed = Object.hasOwn(state.results, lesson.id);
    return `<button class="lesson" data-lesson="${lesson.id}" aria-label="${lesson.title}, 3 вопроса${completed ? ', пройдено' : ''}"><span class="lesson-tag">${index === 0 ? 'НАЧНИ ЗДЕСЬ' : lesson.label.toUpperCase()}</span><div class="art">${illustration(lesson)}</div><div class="lesson-body"><span class="lesson-title">${lesson.title}</span><span class="lesson-meta"><span class="star" aria-hidden="true">★</span> ${completed ? `${state.results[lesson.id]} / 3` : '3 звезды'}<span class="dot"></span><span class="${completed ? 'done' : ''}">${completed ? 'Пройдено' : '3 вопроса'}</span></span></div></button>`;
  }).join('')}</div><div class="intro-strip"><span class="spark" aria-hidden="true">✧</span><div><h2>Не спеши. Подумай. Попробуй!</h2><p>Ошибки — тоже часть пути. Каждое задание можно пройти ещё раз.</p></div></div><div class="section-head"><h2>Маленькое открытие</h2><span>Твой личный дневник</span></div><section class="journey"><span class="journey-icon" aria-hidden="true">▤</span><div><h3>Что интересного ты заметил?</h3><p>Сохрани мысль, вопрос или новое открытие.</p></div><button data-view="journal">Записать</button></section>`;
}

function renderProgress() {
  const stars = Object.values(state.results).reduce((sum, score) => sum + score, 0);
  main.innerHTML = heading('Твои успехи', 'Каждый шаг имеет значение. Продолжай в своём темпе.', 'ТВОЯ ЛИЧНАЯ ДОРОЖКА') + `<div class="stats-grid"><div class="stat"><strong>${stars}</strong><span>звёзд собрано</span></div><div class="stat"><strong>${Object.keys(state.results).length}</strong><span>заданий пройдено</span></div><div class="stat"><strong>${Object.keys(state.activity).length}</strong><span>дней с открытиями</span></div></div><section class="detail-panel"><h2>Дорожки знаний</h2>${categories.map(category => `<div class="progress-row"><span>${category.title}</span><span>${lessons.filter(lesson => lesson.category === category.id && Object.hasOwn(state.results, lesson.id)).length} / 3</span></div>`).join('')}</section><section class="detail-panel"><h2>Сравнивай себя с собой</h2><p>Здесь нет чужих рейтингов. Звёзды начисляются за лучшие результаты: повторение помогает улучшить ответ, но не удваивает награду.</p><p>Сейчас прогресс хранится только в этом браузере. Очистка данных браузера удалит его.</p></section>`;
}

function renderCollection() {
  main.innerHTML = heading('Коллекция открытий', 'Геометрия твоих успехов. Каждый значок — маленькая история.', 'ШАГИ, КОТОРЫМИ МОЖНО ГОРДИТЬСЯ') + `<div class="badge-grid">${getBadges().map(badge => `<section class="collectible ${badge.unlocked ? 'unlocked' : ''}"><span class="gem" aria-hidden="true">${badge.symbol}</span><h3>${badge.name}</h3><p>${badge.unlocked ? 'Получено · ' : ''}${badge.hint}</p></section>`).join('')}</div>`;
}

function renderJournal() {
  main.innerHTML = heading('Дорожки размышлений', 'Место для вопросов, идей и маленьких открытий.', 'ТВОЙ ДНЕВНИК') + `<section class="detail-panel"><form id="journal-form"><label class="journal-label" for="reflection">Что нового я сегодня понял?</label><textarea id="reflection" maxlength="1000" required placeholder="Сегодня я заметил…"></textarea><div class="journal-actions"><small>Только на этом устройстве.<br>Не записывай пароли и личные данные.</small><button class="primary" type="submit">Сохранить мысль</button></div></form></section><section class="detail-panel"><h2>Мои заметки</h2>${state.journal.length ? state.journal.map(entry => `<article class="entry"><button data-delete-entry="${escapeText(entry.id)}" aria-label="Удалить заметку">Удалить</button><time>${new Date(entry.date).toLocaleDateString('ru-RU', {day:'numeric',month:'long'})}</time><p>${escapeText(entry.text)}</p></article>`).join('') : '<p class="empty">Пока здесь чистый лист. С чего начнётся твоя история?</p>'}</section>`;
}

function render() {
  renderCategories();
  document.querySelectorAll('.topnav [data-view]').forEach(button => {
    button.classList.toggle('active', button.dataset.view === currentView);
    if (button.dataset.view === currentView) button.setAttribute('aria-current', 'page'); else button.removeAttribute('aria-current');
  });
  ({tasks:renderTasks,progress:renderProgress,collection:renderCollection,journal:renderJournal})[currentView]();
  updateStats();
}

function openQuiz(id) {
  const lesson = lessons.find(item => item.id === id);
  if (!lesson) return;
  quiz = {lesson, index:0, score:0, selected:null, checked:false, finished:false};
  renderQuestion();
  modal.showModal();
}

function renderQuestion() {
  const question = quiz.lesson.questions[quiz.index];
  modalContent.innerHTML = `<div class="dialog-kicker">${quiz.lesson.title} · ${quiz.index + 1} из 3</div><h2 id="dialog-title">${question[0]}</h2>${question[1] ? `<div class="question-art">${escapeText(question[1])}</div>` : ''}<div class="answers" role="group" aria-label="Варианты ответа">${question[2].map((answer, index) => `<button class="answer" data-answer="${index}" aria-pressed="false">${escapeText(answer)}</button>`).join('')}</div><div class="feedback" aria-live="polite" id="feedback">Выбери один ответ.</div><div class="quiz-footer"><span>Можно думать сколько угодно</span><button class="primary" id="check-answer" data-action="check" disabled>Проверить</button></div>`;
}

function checkAnswer() {
  if (!quiz || quiz.selected === null || quiz.checked) return;
  quiz.checked = true;
  const question = quiz.lesson.questions[quiz.index];
  const correct = quiz.selected === question[3];
  if (correct) quiz.score += 1;
  modal.querySelectorAll('[data-answer]').forEach(button => {
    button.disabled = true;
    const index = Number(button.dataset.answer);
    button.classList.toggle('correct', index === question[3]);
    button.classList.toggle('wrong', index === quiz.selected && !correct);
  });
  document.querySelector('#feedback').textContent = `${correct ? 'Верно! ' : 'Попробуем разобраться. '}${question[4]}`;
  const next = document.querySelector('#check-answer');
  next.textContent = quiz.index === 2 ? 'Мой результат' : 'Следующий вопрос';
  next.dataset.action = 'next';
}

function finishQuiz() {
  if (quiz.finished) return;
  quiz.finished = true;
  const previous = state.results[quiz.lesson.id] || 0;
  state.results[quiz.lesson.id] = Math.max(previous, quiz.score);
  const today = dayKey();
  state.activity[today] = [...new Set([...(state.activity[today] || []), quiz.lesson.id])];
  saveState();
  render();
  modalContent.innerHTML = `<div class="result"><div class="dialog-kicker">ЕЩЁ ОДИН ШАГ ВПЕРЁД</div><div class="result-stars" aria-label="${quiz.score} из 3 звёзд">${'★'.repeat(quiz.score)}${'☆'.repeat(3 - quiz.score)}</div><h2 id="dialog-title">${quiz.score === 3 ? 'Отличное открытие!' : 'Дорожка пройдена!'}</h2><p>Правильных ответов: ${quiz.score} из 3.<br>${quiz.score === 3 ? 'Ты справился со всеми вопросами.' : 'Теперь ты знаешь больше. Можно попробовать ещё раз.'}<br>${storageAvailable ? 'Твой лучший результат сохранён на этом устройстве.' : 'Сохранение недоступно в этом браузере.'}</p><button class="primary" data-action="close">К заданиям</button><button class="secondary" data-action="retry">Попробовать ещё раз</button></div>`;
}

document.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button || button.disabled) return;
  if (button.dataset.category) { categoryId = button.dataset.category; currentView = 'tasks'; render(); }
  else if (button.dataset.view) { currentView = button.dataset.view; render(); window.scrollTo({top:0, behavior:'instant'}); }
  else if (button.dataset.lesson) openQuiz(button.dataset.lesson);
  else if (button.dataset.answer !== undefined && quiz && !quiz.checked) {
    quiz.selected = Number(button.dataset.answer);
    modal.querySelectorAll('[data-answer]').forEach(answer => { const selected = Number(answer.dataset.answer) === quiz.selected; answer.classList.toggle('selected',selected); answer.setAttribute('aria-pressed',String(selected)); });
    document.querySelector('#check-answer').disabled = false;
  } else if (button.dataset.deleteEntry) {
    state.journal = state.journal.filter(entry => entry.id !== button.dataset.deleteEntry);
    saveState(); renderJournal(); notify('Заметка удалена');
  } else {
    const action = button.dataset.action;
    if (action === 'close') modal.close();
    if (action === 'check') checkAnswer();
    if (action === 'next' && quiz?.checked) { if (quiz.index === 2) finishQuiz(); else { quiz.index += 1; quiz.selected = null; quiz.checked = false; renderQuestion(); } }
    if (action === 'retry' && quiz) { const id = quiz.lesson.id; modal.close(); openQuiz(id); }
    if (action === 'daily') { const today = state.activity[dayKey()] || []; openQuiz((lessons.find(lesson => !today.includes(lesson.id)) || lessons[0]).id); }
    if (action === 'account') {
      modalContent.innerHTML = '<div class="account-emblem" aria-hidden="true">⌑</div><div class="dialog-kicker">ЛИЧНОЕ ПРОСТРАНСТВО</div><h2 id="dialog-title">Твоя дорожка — с тобой</h2><p>Сейчас можно играть без регистрации. Задания и заметки сохраняются в этом браузере.</p><p>Вход по почте пока не подключён. После его настройки можно будет подтвердить свою почту и продолжить с другого устройства.</p><p>Сейчас мы не собираем почту и пароли. На общем устройстве твои локальные заметки могут видеть другие пользователи браузера.</p><button class="primary" data-action="close">Продолжить без входа</button>';
      modal.showModal();
    }
  }
});

document.addEventListener('submit', event => {
  if (event.target.id !== 'journal-form') return;
  event.preventDefault();
  const field = document.querySelector('#reflection');
  const text = field.value.trim();
  if (!text) { field.setCustomValidity('Напиши хотя бы одну мысль.'); field.reportValidity(); return; }
  state.journal.unshift({id:crypto.randomUUID(),text:text.slice(0,1000),date:new Date().toISOString()});
  state.journal = state.journal.slice(0,100);
  saveState(); renderJournal();
  if (storageAvailable) notify('Мысль сохранена');
});
document.addEventListener('input', event => { if (event.target.id === 'reflection') event.target.setCustomValidity(''); });
modal.addEventListener('click', event => { if (event.target === modal) { const rect = modal.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) modal.close(); } });
document.addEventListener('visibilitychange', () => { if (!document.hidden) updateStats(); });
render();
