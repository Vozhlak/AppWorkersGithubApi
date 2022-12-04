const input = document.querySelector('.search-input');
const searchResult = document.querySelector('.search-result');
const list = document.querySelector('.list');

// Получение данных по API GitHub
async function getData(searchStr) {
  const data = await fetch(`https://api.github.com/search/repositories?q=${searchStr}&per_page=5`).then(
    response => response.json()
  );
  return data;
}

// функция задержка для отправки запроса
function debounce(fn, ms) {
  return function (...args) {
    let previousCall = this.lastCall;
    this.lastCall = Date.now();
    if (previousCall && this.lastCall - previousCall <= ms) {
      clearTimeout(this.lastCallTimer);
    }
    this.lastCallTimer = setTimeout(() => fn(...args), ms);
  }
}

// Функция которая при вводе текста отправляется запрос на получение данных и после выводит результат поиска.
async function handleInput(e) {
  let { value } = e.target;
  if (!value) {
    searchResult .innerHTML = '';
    searchResult.classList.remove('search-result-visible');
    return;
  };

  const data = await getData(value);
  const { items } = data;
  const result = [];
  items.forEach(el => {
    result.push({
      id: el.id,
      name: el.name,
      owner: el.owner.login,
      stars: el['stargazers_count'],
    });
  });
  searchResult.innerHTML = '';
  createResultItem(result);
  searchResult.classList.add('visible');
}

// Рендерит результат поиска
function createResultItem(arrSearhResult) {
  let fragment = new DocumentFragment();
  if (arrSearhResult.length == 0) {
    let li = document.createElement('li');
    li.classList.add('result-item', 'not-result-item');
    li.append('Поиск не дал результатов');
    fragment.append(li);
  }
  arrSearhResult.forEach(el => {
    let li = document.createElement('li');
    li.classList.add('result-item');
    li.append(el.name);
    li.addEventListener('click', () => {
      addInLocalStorage({
        id: el.id,
        name: el.name,
        owner: el.owner,
        stars: el.stars,
      })
      input.value = '';
      searchResult.innerHTML = '';
      input.focus();
    });
    fragment.append(li);
  })
  searchResult.append(fragment);
}

// Добавляет данные о выбранном репозитории в LocalStorage
function addInLocalStorage(data) {
  if (!data) return;
  let localStorage = window.localStorage;
  if (!localStorage.getItem('dataList')) {
    localStorage.setItem('dataList', JSON.stringify([]));
  }
  const arrJson = JSON.parse(localStorage.getItem('dataList'));
  const obj = {
    id: data.id,
    name: data.name,
    owner: data.owner,
    stars: data.stars,
  }
  // Проверка дубликатов в LocalStorage
  const hasDuplicates = (arr, id) => {
    return arr.filter(el => el.id === id).length !== 0;
  }
  if (!hasDuplicates(arrJson, data.id)) {
    arrJson.push(obj);
    createItemList(obj);
  }
  localStorage.setItem('dataList', JSON.stringify(arrJson));
  checkIsEmptyList();
}

// Получение данных из LocalStorage
function getDataFromLocalStorage() {
  const localStorage = window.localStorage;
  if (!localStorage.getItem('dataList')) return;
  const data = JSON.parse(localStorage.getItem('dataList'));
  return data;
}

// Отображение данных из LocalStorage и рендерит список репозиториев
const viewData = () => {
  const data = getDataFromLocalStorage();
  if (!data) return;
  data.forEach(el => createItemList({id: el.id, name: el.name, owner: el.owner, stars: el.stars}));
};

// Создаёт элемент списка
function createItemList(data) {
  if (!data) return;
  const div = `
    <div class="list-item" data-id=${data.id}>
      <div class="list-item-info">
        <span class="list-item-info__title">Name: ${data.name}</span>
        <span class="list-item-info__owner">Owner: ${data.owner}</span>
        <span class="list-item-info__stars">Stars: ${data.stars}</span>
      </div>
      <button class="btn-delete" data-action='delete'></button>
    </div>
  `
  list.insertAdjacentHTML('afterbegin', div);
}

// Удаление элемента списка
function deleteItem(event) {
  if (event.target.dataset.action === 'delete') {
    const parenNode = event.target.closest('.list-item');
    const id = parenNode.dataset.id;
    const data = getDataFromLocalStorage().filter(el => el.id !== Number(id));

    const localStorage = window.localStorage;
    localStorage.setItem('dataList', JSON.stringify(data));
    parenNode.remove();
    checkIsEmptyList();
  }
}

// Проверка явялется ли пустой список или нет.
function checkIsEmptyList() {
  const arrListRepositories = JSON.parse(window.localStorage.getItem('dataList'));
  if (arrListRepositories.length === 0) {
    const htmlEmptyListEl = `
      <div class="wrap-not-result">
        <span class="text-not-result">Список пуст</span>
      </div>
    `;
    list.insertAdjacentHTML('afterbegin', htmlEmptyListEl);
  }

  if (arrListRepositories.length >= 1) {
    const htmlEmptyListEl = document.querySelector('.wrap-not-result');
    htmlEmptyListEl ? htmlEmptyListEl.remove() : null;
  }
}

input.addEventListener('input', debounce(handleInput, 500));
list.addEventListener('click', deleteItem);
checkIsEmptyList();
viewData();