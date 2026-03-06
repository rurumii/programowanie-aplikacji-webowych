import './style.css'
import { ProjectService } from './projectService'
import type { Project } from './types'

const service = new ProjectService();

const form = document.querySelector<HTMLFormElement>('#project-form')!;
const listContainer = document.querySelector<HTMLFormElement>('#project-list')!;

// поля ввода
const idInput = document.querySelector<HTMLInputElement>('#project-id')!;
const nameInput = document.querySelector<HTMLInputElement>('#project-name')!;
const descInput = document.querySelector<HTMLInputElement>('#project-desc')!;

// function init(){

// }

// функция отрисовки (рендер)
function render(){
  const projects = service.getAll();

  //
  listContainer.innerHTML='';

  projects.forEach(project => {
    const card = document.createElement('div');
    card.className = 'project-card';
    card.innerHTML = `
      <h3>${project.name}</h3>
      <p>${project.description}</p>
      <button class="edit-btn" data-id="${project.id}">Edit</button>
      <button class="delete-btn" data-id="${project.id}">Delete</button>
    `;
    listContainer.appendChild(card);
  });
}

render();
form.addEventListener('submit', (e) =>{
  e.preventDefault(); // чтобы страница не перезагружалась

  const projectData: Project = {
    // если в айдиинпут есть значение - берем, если нет создаём новый
    id: idInput.value || crypto.randomUUID(),
    name: nameInput.value,
    description: descInput.value
  };

  service.save(projectData);
  form.reset(); // очистить поля
  idInput.value='';
  render(); // обновить список 
})

listContainer.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  const id = target.getAttribute('data-id');

  if (!id) return; // если кликнули не по кнопке - выходим

  if (target.classList.contains('delete-btn')) {
    service.delete(id);
    render();
  }

  if (target.classList.contains('edit-btn')){
    const project = service.getById(id);
    if (project) {
      //
      idInput.value = project.id;
      nameInput.value = project.name;
      descInput.value = project.description;
    }
  }
});