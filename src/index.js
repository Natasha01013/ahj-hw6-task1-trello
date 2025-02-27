import './style.css'; 

// Функционал по перетаскиванию карточек
let draggedCard = null; //хранит ссылку на HTML-элемент карточки, которую пользователь перетаскивает
let initialMouseX = 0;
let initialMouseY = 0;
let initialCardX = 0;
let initialCardY = 0;
let initialColumn = null; // Переменная для сохранения колонки, из которой перемещается карточка
let placeholder = null; // Фантомный элемент

//функция включает возможность перетаскивания для каждой карточки
function enableCardDragging(card, column) {
    card.addEventListener('mousedown', (e) => { // Слушаем событие mousedown
        e.preventDefault();
        if (e.target.classList.contains('delete-card')) return;

        // Запоминаем начальные координаты мыши и карточки
        draggedCard = card;
        initialMouseX = e.clientX; //координата X (горизонтальная) курсора мыши относительно левого края видимой области браузера 
        initialMouseY = e.clientY; //координата Y (вертикальная) курсора мыши относительно верхнего края видимой области браузера
        initialCardX = card.offsetLeft; //расстояние от левого края карточки до левого края ее ближайшего позиционированного родительского элемента
        initialCardY = card.offsetTop; //расстояние от верхнего края карточки до верхнего края ее ближайшего позиционированного родительского элемента
        initialColumn = column; // Запоминаем колонку, из которой карточка перетаскивается

        // Делаем карточку полупрозрачной и задаём абсолютное позиционирование
        draggedCard.style.position = 'absolute';
        draggedCard.style.zIndex = '1000';
        draggedCard.style.opacity = '0.8';

        // Начинаем отслеживать перемещение мыши
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    });
}

// Функция отслеживает движение мыши и обновляет позицию карточки
function handleMouseMove(e) {
    if (!draggedCard) return;

    // Вычисляем разницу между текущими координатами мыши и начальными координатами мыши
    const deltaX = e.clientX - initialMouseX;
    const deltaY = e.clientY - initialMouseY;

    // Обновляем позицию карточки
    draggedCard.style.left = initialCardX + deltaX + 'px';
    draggedCard.style.top = initialCardY + deltaY + 'px';

    // Перемещение фантома, основываясь на текущем положении курсора мыши
    movePlaceholder(e.clientX, e.clientY);
}

//Функция перемещения фантомного элемента во время перетаскивания карточки
function movePlaceholder(x, y) {
    const targetColumn = getColumnUnderCursor(x, y);
    if (!targetColumn) return;

    const cardsContainer = targetColumn.querySelector('.cards'); //Получим контейнер, в котором находятся все карточки внутри нужной колонки
    const cards = Array.from(cardsContainer.children); //Преобразуем коллекцию дочерних элементов в массив

    if (!placeholder) { //если фантомный элемент еще не был создан
        placeholder = document.createElement('div');
        placeholder.classList.add('card', 'placeholder');
        placeholder.style.height = `${draggedCard.offsetHeight}px`;
    }

    if (cards.length === 0) { //Если в колонке нет карточек
        cardsContainer.appendChild(placeholder); //Добавим фантомный элемент в начало пустой колонки
        return;
    }

    let inserted = false; //Переменная для отслеживания, был ли фантомный элемент уже вставлен в колонку. false - не был
    for (let card of cards) {
        if (card === draggedCard || card === placeholder) continue; // Является ли текущая карточка (card) перетаскиваемой карточкой или фантомным элементом

        const rect = card.getBoundingClientRect(); //Возвращает объект, содержащий размеры и положение текущей карточки
        if (y < rect.top + rect.height / 2) { //Находится ли курсор мыши (y) выше середины текущей карточки 
            cardsContainer.insertBefore(placeholder, card); //Строка вставляет фантомный элемент перед текущей карточкой в контейнере карточек (cardsContainer)
            inserted = true;
            break;
        }
    }

    if (!inserted) { //Если фантомный элемент не был вставлен внутри цикла for...of
        cardsContainer.appendChild(placeholder); //Добавим фантомный элемент в конец контейнера карточек
    }
}

//Функция завершает процесс перетаскивания, убирает обработчики событий и восстанавливает нормальное состояние карточки
function handleMouseUp(e) {
    if (!draggedCard) return; //Если мы не перетаскиваем карточку

    // Убираем обработчики событий
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
 
    // Возвращаем карточке нормальную непрозрачность и позицию
    draggedCard.style.opacity = '1';
    draggedCard.style.zIndex = '1';

    // Вставка карточки на место фантома
    if (placeholder) { //Если фантомный элемент есть
        placeholder.parentNode.insertBefore(draggedCard, placeholder); //Вставим перетаскиваемую карточку на место фантомного элемента 
        placeholder.remove();
        placeholder = null;
    }

    const targetColumn = getColumnUnderCursor(e.clientX, e.clientY); // Проверяем, в какую колонку перетащили карточку

    if (targetColumn && targetColumn !== initialColumn) {
        moveCardToNewColumn(targetColumn); // Перемещаем карточку в новую колонку
    }

    draggedCard = null; // Очистим переменную 
    initialColumn = null; // Очистим переменную 

    updateBoardState();
}

// Функция для определения колонки, на которую наведен курсор
function getColumnUnderCursor(x, y) {
    const columns = document.querySelectorAll('.column');
    for (let column of columns) {
      const rect = column.getBoundingClientRect(); //Возвращает объект, содержащий размеры и положение текущей колонки
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) { // Проверим, находится ли курсор мыши внутри текущей колонки
        return column;
      }
    }
    return null;
}
  
// Функция для перемещения карточки в новую колонку
function moveCardToNewColumn(targetColumn) {
    if (!initialColumn || !targetColumn || !draggedCard) return; //Если какая-либо из этих переменных не была установлена, завершим код

    const initialCardsContainer = initialColumn.querySelector('.cards');
    const targetCardsContainer = targetColumn.querySelector('.cards');

    // Проверка, является ли draggedCard дочерним элементом initialCardsContainer
    if (!initialCardsContainer.contains(draggedCard)) {
        return; // Если нет, то прерываем функцию
    }

    if (initialColumn === targetColumn) { // Если initialColumn и targetColumn одинаковы, то перемещение внутри одной и той же колонки
        return; // Карточка уже перемещена фантомом, ничего делать не нужно
    }

    initialCardsContainer.removeChild(draggedCard);

    targetCardsContainer.insertBefore(draggedCard, placeholder); //Вставляем карточку перед фантомом
    
    const cardText = draggedCard.textContent;

    initialColumn.querySelector('.cards').removeChild(draggedCard); // Удаляем карточку из старой колонки

    // Добавляем карточку в новую колонку
    const newCard = document.createElement('div');
    newCard.classList.add('card');
    newCard.textContent = cardText;

    const deleteIcon = document.createElement('span'); 
    deleteIcon.classList.add('delete-card', 'fas', 'fa-times'); // Добавим крестик для удаления
    newCard.appendChild(deleteIcon);

    // Включаем перетаскивание для новой карточки
    enableCardDragging(newCard, targetColumn);
    targetCardsContainer.appendChild(newCard);

    updateBoardState(); // Обновляем состояние доски
}

//Функция обновляет состояние доски в LocalStorage
function updateBoardState() {
  const boardState = { column1: [], column2: [], column3: [] };
  const columns = document.querySelectorAll('.column');

  Array.from(columns).forEach((column, index) => {
    const columnName = `column${index + 1}`; //Имя колонки в формате "column1", "column2", "column3"
    const cards = column.querySelectorAll('.card');

    cards.forEach(card => {
      boardState[columnName].push(card.textContent); //Добавим текст текущей карточки в массив, соответствующий текущей колонке
    });
  });

  localStorage.setItem('boardState', JSON.stringify(boardState)); // Добавим данные в localStorage

  renderBoard();
}

//Функционал по добавлению карточек
// Функция для обновления DOM с состоянием из LocalStorage
function renderBoard() {
    const board = document.getElementById('board');
    const columns = board.getElementsByClassName('column');
    // Получаем состояние доски из LocalStorage
    const boardState = JSON.parse(localStorage.getItem('boardState')) || { column1: [], column2: [], column3: [] };
  
    Array.from(columns).forEach((column, index) => {
        const cardsContainer = column.querySelector('.cards');
        cardsContainer.innerHTML = ''; // Очистка контейнера перед обновлением
    
        const columnName = `column${index + 1}`;

        boardState[columnName].forEach(cardText => {
            const card = document.createElement('div');
            card.classList.add('card');
            card.textContent = cardText;

            const deleteIcon = document.createElement('span');
            // deleteIcon.textContent = '\uE951'; //этот крестик не срабатывает
            deleteIcon.classList.add('delete-card', 'fas', 'fa-times'); // Символ крестика
            card.appendChild(deleteIcon);
            
            enableCardDragging(card, column); // Включаем возможность перетаскивания для каждой карточки

            // Добавляем обработчики событий для показа и скрытия крестика
            card.addEventListener('mouseenter', () => {
                deleteIcon.style.display = 'block';
            });

            card.addEventListener('mouseleave', () => {
                deleteIcon.style.display = 'none';
            });

            cardsContainer.appendChild(card);
        });
  
      // Добавление обработчика для кнопки "Add another card"
      const addButton = column.querySelector('.add-card');
      addButton.addEventListener('click', () => openAddCardForm(column));
    });
  }
  
// Открытие формы добавления карточки в нужной колонке
function openAddCardForm(column) {
    // Проверяем, не существует ли уже форма для ввода задачи в колонке
    const existingForm = column.querySelector('.add-card-form');
    if (existingForm) return;
  
    // Создаём новую форму для ввода
    const formHtml = `
      <div class="add-card-form">
        <input type="text" id="card-text" placeholder="Enter task description">
        <button id="add-card-btn">Add Card</button>
      </div>
    `;
    
    // Вставляем форму в колонку
    column.querySelector('.cards').insertAdjacentHTML('beforeend', formHtml);
  
    const addCardButton = column.querySelector('#add-card-btn');
    const cardTextInput = column.querySelector('#card-text');
  
    // Добавляем обработчик нажатия на кнопку "Add Card"
    addCardButton.addEventListener('click', () => {
      const cardText = cardTextInput.value.trim();
      if (cardText) { //Если ввели текст в карточку
        //Получим состояние доски из localStorage, чтобы восстановить его после перезагрузки страницы
        const boardState = JSON.parse(localStorage.getItem('boardState')) || { column1: [], column2: [], column3: [] }; 
        // Определим имя колонки на основе ее идентификатора
        const columnName = column.id === 'column-1' ? 'column1' : column.id === 'column-2' ? 'column2' : 'column3';
        boardState[columnName].push(cardText); //Добавим текст новой карточки в массив, соответствующий текущей колонке
        localStorage.setItem('boardState', JSON.stringify(boardState)); //Сохраним обновление в localStorage
        renderBoard(); // Перерисовываем доску
      }
    });
}
  
// Удаление карточки
function deleteCard(e) {
    if (e.target.classList.contains('delete-card')) {
      const card = e.target.closest('.card');
      const column = card.closest('.column');
      const columnId = column.id;
      const columnName = columnId === 'column-1' ? 'column1' : columnId === 'column-2' ? 'column2' : 'column3';
  
      // Удаляем карточку из DOM
      column.querySelector('.cards').removeChild(card);
      
      const boardState = JSON.parse(localStorage.getItem('boardState')) || { column1: [], column2: [], column3: [] };
      const cardText = card.textContent.replace('delete-card', '').trim();// Убираем кнопку удаления из текста карточки
  
      // Удаляем карточку из массива в LocalStorage
      const columnCards = boardState[columnName];
      const cardIndex = columnCards.indexOf(cardText);
      if (cardIndex !== -1) {
        columnCards.splice(cardIndex, 1);
        localStorage.setItem('boardState', JSON.stringify(boardState));
      }
  
      renderBoard();
    }
}
  
// Инициализация доски
document.addEventListener('DOMContentLoaded', () => {
    renderBoard();
    document.getElementById('board').addEventListener('click', deleteCard);
});