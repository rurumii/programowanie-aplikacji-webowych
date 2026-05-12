import './style.css'
import { ProjectService } from './projectService'
import { UserService } from './userService';
import { StoryService } from './storyService';
import type { Project, Story, Priority, Status } from './types';

const service = new ProjectService();
const userService = new UserService();
const storyService = new StoryService();

// ! значит обещание что элемент точно есть в хтмл и не нулл
const form = document.querySelector<HTMLFormElement>('#project-form')!;
const listContainer = document.querySelector<HTMLFormElement>('#project-list')!;
const storyForm = document.querySelector<HTMLFormElement>('#story-form')!;
const storySection = document.querySelector<HTMLElement>('#stories-section')!;

// поля ввода
const idInput = document.querySelector<HTMLInputElement>('#project-id')!;
const nameInput = document.querySelector<HTMLInputElement>('#project-name')!;
const descInput = document.querySelector<HTMLInputElement>('#project-desc')!;
const gavno = "da";

// function init(){
function init() {
  renderUserInfo();
  renderProjects();
  renderStories(); // попробует отрисовать истории, если проект уже был выбран ранее
}

// функция отрисовки блоков с проектами
function renderProjects(){

  // массив проектов
  const projects = service.getAll();
  // берём айди активного проекта
  const activeId = storyService.getActiveProjectId();
  // чистим контейнер, чтобы не список не дублировался
  listContainer.innerHTML='';

   // проходимся по массиву проектов
  projects.forEach(p => {
    // если проект активный, добавим ему особый класс для CSS
    // const isActive = p.id === activeId ? 'active-project' : '';

    let isActive: string;
    if (p.id === activeId)
    {
      isActive = 'active-project'; // <= особый клас css
    } else 
    {
      isActive = '';
    }

    const card = document.createElement('div');
    card.className = 'project-card';
    card.innerHTML = `
      <h3>${p.name}</h3>
      <p>${p.description}</p>
      <button class="select-btn" data-id="${p.id}">Select</button>
      <button class="edit-btn" data-id="${p.id}">Edit</button>
      <button class="delete-btn" data-id="${p.id}">Delete</button>
    `;
    // ^   добавляем data-id чтобы знать по какой кнопке нажали
    // |   data-... - позволяет вешать свои свойства на хтмл элементы


    listContainer.appendChild(card); // card внутри блока listcontainer
  });
}

function renderUserInfo() {
  // используем <HTMLDivElement>, чтобы TS знал, что у это див и у него есть свойство innerText
  const userDisplay = document.querySelector<HTMLDivElement>('#user-display');

  const currentUser = userService.getCurrentUser();

  if (userDisplay)
  {
    userDisplay.innerText = `Logged as: ${currentUser.name} ${currentUser.surname}`;
  }
}

// кнопка сабмит для добавления/апдейта проекта
form.addEventListener('submit', (e) =>{
  e.preventDefault(); // чтобы страница не перезагружалась

  const projectData: Project = {
    // если в айдиинпут есть значение - берем, если нет создаём новый
    // если айдиинпут пусто
    id: idInput.value || crypto.randomUUID(),
    name: nameInput.value,
    description: descInput.value
  };

  service.save(projectData);
  form.reset(); // очистить поля
  idInput.value=''; // гарант что поле будет абсолютно пустым
  renderProjects(); // обновить список 
})


// логика работы кнопок на проектах
listContainer.addEventListener('click', (e) => {

  const target = e.target as HTMLElement; // <= точно хтмл элемент
  const id = target.getAttribute('data-id');

  if (!id) return; // если кликнули не по кнопке - выходим

  // выбор проекта
  if (target.classList.contains('select-btn')) {
    storyService.setActiveProject(id); // записываем id в localStorage
    renderProjects(); // перерисовываем список (чтобы кнопка сменила текст)
    renderStories();  // показываем задачи этого проекта
  }

  // удаление проекта
  if (target.classList.contains('delete-btn')) {
    service.delete(id);
    renderProjects();
  }

  if (target.classList.contains('edit-btn')){
    const project = service.getById(id);
    if (project) {
      // если проект нашелся - переписываем в инпуты данные проекта из объекта
      idInput.value = project.id;
      nameInput.value = project.name;
      descInput.value = project.description;
    }
  }
});

storyForm.addEventListener('submit', (e) =>
{
  e.preventDefault();

  const activeProjectId = storyService.getActiveProjectId();
  // на всякий случай проверка на наличие активного проекта
  if (!activeProjectId) {
    alert ('Choose project first');
    return;
  }

  const newStory: Story = {
    id: (document.querySelector('#story-id') as HTMLInputElement).value || crypto.randomUUID(),
    name: (document.querySelector('#story-name') as HTMLInputElement).value,
    desc: (document.querySelector('#story-desc') as HTMLTextAreaElement).value,
    priority: (document.querySelector('#story-priority') as HTMLSelectElement).value as Priority,
    status: (document.querySelector('#story-status') as HTMLSelectElement).value as Status,
    
    // привязка айди проекта/овнера
    projectId: activeProjectId, 
    ownerId: userService.getCurrentUser().id,
    
    createdAt: new Date().toISOString()
  };

  storyService.save(newStory);
  storyForm.reset();
  renderStories(); // update desk
  (document.querySelector('#story-id') as HTMLInputElement).value='';
    document.querySelector('#save-story-btn')!.textContent = 'Add Task';
});

function renderStories(){
  const activeId = storyService.getActiveProjectId();

  const section = document.querySelector<HTMLElement>('#stories-section')!;

  // проверка на наличие активного проекта
  if (!activeId){
    section.style.display = 'none';
    return;
  }

  section.style.display = 'block';

  const stories = storyService.getStoriesByProject(activeId);

  const columns = {
    // точка - поиск по классу; решетка - по айди
    todo: document.querySelector('#col-todo .story-list')!,
    doing: document.querySelector('#col-doing .story-list')!,
    done: document.querySelector('#col-done .story-list')!
  }
  // очистка чтоб не появлялись дубликаты при рендере
  // поскольку колумнс это объект мы не можем просто прогнать его через форич
  // мы достаем только значения - валюес и для каждой очищаем содержимое
  Object.values(columns).forEach(col => col.innerHTML = '');

  // Раскладываем истории по колонкам
  stories.forEach(story => {
    const storyCard = document.createElement('div');
    // добавляем класс приоритета
    storyCard.className = `story-card priority-${story.priority}`;
    storyCard.innerHTML = `
      <h4>${story.name}</h4>
      <p>${story.desc}</p>
      <button class="edit-story-btn" data-id="${story.id}"=>Edit</button>
      <button class="delete-story-btn" data-id="${story.id}"=>Del</button>
    `;
    // используем status ('todo' | 'doing' | 'done') как ключ для выбора колонки
    columns[story.status].appendChild(storyCard);
  });
}
// логика кнопок едит/дел сторисов
storySection.addEventListener('click', (e)=>
{
  const target = e.target as HTMLElement;
  const id = target.getAttribute('data-id');
  if (!id) return;

  // edit
  if (target.classList.contains('edit-story-btn'))
  {
    const story = storyService.getStoryById(id);

    if (story)
    {
      (document.querySelector('#story-id') as HTMLInputElement).value = story.id;
      (document.querySelector('#story-name') as HTMLInputElement).value = story.name;
      (document.querySelector('#story-desc') as HTMLTextAreaElement).value = story.desc;
      (document.querySelector('#story-priority') as HTMLSelectElement).value = story.priority;
      (document.querySelector('#story-status') as HTMLSelectElement).value = story.status;
      // меняем название кнопки
      document.querySelector('#save-story-btn')!.textContent="Update task";
    }
  }

  // delete
  if (target.classList.contains('delete-story-btn'))
  {
    storyService.deleteStory(id);
    renderStories();
  }
})

init();
