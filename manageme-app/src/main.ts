import './style.css'
import { ProjectService } from './projectService'
import { UserService } from './userService';
import { StoryService } from './storyService';
import type { Project, Story, Priority, Status, Task } from './types';
import { TaskService } from './taskService';

const service = new ProjectService();
const userService = new UserService();
const storyService = new StoryService();
const taskService = new TaskService();

const form = document.querySelector<HTMLFormElement>('#project-form')!;
const listContainer = document.querySelector<HTMLFormElement>('#project-list')!;
const storyForm = document.querySelector<HTMLFormElement>('#story-form')!;
const storySection = document.querySelector<HTMLElement>('#stories-section')!;

let activeStoryId:string | null = null;
let currentlyOpenTaskId: string | null = null;

const idInput = document.querySelector<HTMLInputElement>('#project-id')!;
const nameInput = document.querySelector<HTMLInputElement>('#project-name')!;
const descInput = document.querySelector<HTMLInputElement>('#project-desc')!;

const tasksSection = document.querySelector<HTMLElement>('#tasks-section')!;
const taskForm = document.querySelector<HTMLFormElement>('#task-form')!;
const backToStoriesBtn = document.querySelector<HTMLButtonElement>('#back-to-stories-btn')!;
const activeStoryNameDisplay = document.querySelector<HTMLSpanElement>('#active-story-name')!;

const modal = document.querySelector<HTMLDialogElement>('#task-details-modal')!;
const closeModalBtn = document.querySelector<HTMLButtonElement>('#close-modal-btn')!;
const assignSelect = document.querySelector<HTMLSelectElement>('#assign-user-select')!;
const assignBtn = document.querySelector<HTMLButtonElement>('#assign-user-btn')!;
const markDoneBtn = document.querySelector<HTMLButtonElement>('#mark-done-btn')!;

async function init() {
  await renderUserInfo();
  await renderProjects();
  await renderStories(); 
}

async function renderProjects(){
  const projects = await service.getAll();
  const activeId = storyService.getActiveProjectId();
  listContainer.innerHTML='';

  projects.forEach(p => {
    let isActive = p.id === activeId ? "ring-2 ring-storm-500 bg-white/70 dark:bg-storm-900/80" : "";

    const card = document.createElement('div');
    const baseClasses = "bg-white/50 dark:bg-storm-800/60 backdrop-blur-md border border-white/60 dark:border-storm-700 rounded-xl p-5 shadow-lg transition-all duration-300 flex flex-col";
    card.className = `${baseClasses} ${isActive}`;

    card.innerHTML = `
      <h3 class="text-lg font-semibold text-storm-900 dark:text-storm-300 mb-2">${p.name}</h3>
      <p class="text-sm text-storm-700 dark:text-storm-500 mb-4 flex-grow">${p.description}</p>
      <div class="flex flex-wrap gap-2 mt-auto">
        <button class="select-btn px-3 py-1.5 text-sm font-medium rounded-lg bg-white/50 border border-white/50 text-storm-800 hover:bg-white/80 dark:bg-storm-700 dark:border-storm-500 dark:text-storm-300 dark:hover:bg-storm-500 transition-colors shadow-sm" data-id="${p.id}">Select</button>
        <button class="edit-btn px-3 py-1.5 text-sm font-medium rounded-lg bg-white/50 border border-white/50 text-storm-800 hover:bg-white/80 dark:bg-storm-700 dark:border-storm-500 dark:text-storm-300 dark:hover:bg-storm-500 transition-colors shadow-sm" data-id="${p.id}">Edit</button>
        <button class="delete-btn px-3 py-1.5 text-sm font-medium rounded-lg bg-white/50 border border-white/50 text-storm-800 hover:bg-red-100/80 hover:text-red-700 dark:bg-storm-700 dark:border-storm-500 dark:text-storm-300 dark:hover:bg-red-900/50 dark:hover:text-red-300 transition-colors shadow-sm" data-id="${p.id}">Delete</button>
      </div>
    `;

    listContainer.appendChild(card);
  });
}

async function renderUserInfo() {
  const userDisplay = document.querySelector<HTMLDivElement>('#user-display');
  const currentUser = await userService.getCurrentUser();
  if (userDisplay) {
    userDisplay.innerText = `Logged as: ${currentUser.name} ${currentUser.surname}`;
  }
}

form.addEventListener('submit', (e) =>{
  e.preventDefault(); 
  const projectData: Project = {
    id: idInput.value || crypto.randomUUID(),
    name: nameInput.value,
    description: descInput.value
  };

  service.save(projectData);
  form.reset(); 
  idInput.value=''; 
  renderProjects();  
})

listContainer.addEventListener('click', async (e) => {
  const target = e.target as HTMLElement; 
  const id = target.getAttribute('data-id');
  if (!id) return; 

  if (target.classList.contains('select-btn')) {
    storyService.setActiveProject(id); 
    renderProjects(); 
    renderStories();  
  }

  if (target.classList.contains('delete-btn')) {
    service.delete(id);
    renderProjects();
    renderStories(); // обновляем истории при удалении проекта
  }

  if (target.classList.contains('edit-btn')){
    const project = await service.getById(id);
    if (project) {
      idInput.value = project.id;
      nameInput.value = project.name;
      descInput.value = project.description;
    }
  }
});

storyForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const activeProjectId = storyService.getActiveProjectId();
  
  if (!activeProjectId) {
    alert ('Please select a project first before adding a story.');
    return;
  }

  const currentUser = await userService.getCurrentUser();
  const newStory: Story = {
    id: (document.querySelector('#story-id') as HTMLInputElement).value || crypto.randomUUID(),
    name: (document.querySelector('#story-name') as HTMLInputElement).value,
    desc: (document.querySelector('#story-desc') as HTMLTextAreaElement).value,
    priority: (document.querySelector('#story-priority') as HTMLSelectElement).value as Priority,
    status: (document.querySelector('#story-status') as HTMLSelectElement).value as Status,
    projectId: activeProjectId, 
    ownerId: currentUser.id,
    createdAt: new Date().toISOString()
  };

  storyService.save(newStory);
  storyForm.reset();
  renderStories(); 
  (document.querySelector('#story-id') as HTMLInputElement).value='';
  document.querySelector('#save-story-btn')!.textContent = 'Add Story';
});

async function renderStories(){
  const activeId = storyService.getActiveProjectId();
  const section = document.querySelector<HTMLElement>('#stories-section')!;

  // проверяем, существует ли проект в базе
  const projectExists = activeId ? await service.getById(activeId) : null;

  if (!activeId || !projectExists){
    section.style.display = 'none';
    if (!projectExists && activeId) {
      storyService.setActiveProject(''); // очищаем битый ID из localStorage
    }
    return;
  }

  section.style.display = 'block';
  
  const projectNameDisplay = document.getElementById('active-project-name');
  if (projectNameDisplay) {
    projectNameDisplay.textContent = projectExists.name;
  }

  const stories = await storyService.getStoriesByProject(activeId);

  const columns: Record<string, HTMLElement> = {
    todo: document.querySelector('#col-todo .story-list')!,
    doing: document.querySelector('#col-doing .story-list')!,
    done: document.querySelector('#col-done .story-list')!
  }
  Object.values(columns).forEach(col => col.innerHTML = '');

  stories.forEach(story => {
    const priorityBorder: Record<string, string> = {
      low: 'border-l-4 border-l-prio-low',
      medium: 'border-l-4 border-l-prio-medium',
      high: 'border-l-4 border-l-prio-high'
    };

    const storyCard = document.createElement('div');
    storyCard.className = `bg-white/60 dark:bg-storm-800/60 backdrop-blur-md border border-white/60 dark:border-storm-700 rounded-lg p-4 shadow-sm mb-3 ${priorityBorder[story.priority]}`;
    
    storyCard.innerHTML = `
      <h4 class="text-md font-semibold text-storm-900 dark:text-storm-300 mb-1">${story.name}</h4>
      <p class="text-xs text-storm-700 dark:text-storm-500 mb-3">${story.desc}</p>
      <div class="flex flex-wrap gap-2 pt-3 border-t border-white/50 border-dashed dark:border-storm-700">
        <button class="view-tasks-btn px-2 py-1 text-xs font-medium rounded-lg bg-white/50 border border-white/50 text-storm-800 hover:bg-white/80 dark:bg-storm-700 dark:border-storm-500 dark:text-storm-300 dark:hover:bg-storm-500 transition-colors" data-id="${story.id}">View Tasks</button>
        <button class="edit-story-btn px-2 py-1 text-xs font-medium rounded-lg bg-white/50 border border-white/50 text-storm-800 hover:bg-white/80 dark:bg-storm-700 dark:border-storm-500 dark:text-storm-300 dark:hover:bg-storm-500 transition-colors" data-id="${story.id}">Edit</button>
        <button class="delete-story-btn px-2 py-1 text-xs font-medium rounded-lg bg-white/50 border border-white/50 text-storm-800 hover:bg-red-100/80 hover:text-red-700 dark:bg-storm-700 dark:border-storm-500 dark:text-storm-300 dark:hover:bg-red-900/50 dark:hover:text-red-300 transition-colors" data-id="${story.id}">Del</button>
      </div>
    `;

    columns[story.status as keyof typeof columns].appendChild(storyCard);
  });
}

storySection.addEventListener('click', async (e)=> {
  const target = e.target as HTMLElement;
  const id = target.getAttribute('data-id');
  if (!id) return;

  if (target.classList.contains('edit-story-btn')) {
    const story = await storyService.getStoryById(id);
    if (story) {
      (document.querySelector('#story-id') as HTMLInputElement).value = story.id;
      (document.querySelector('#story-name') as HTMLInputElement).value = story.name;
      (document.querySelector('#story-desc') as HTMLTextAreaElement).value = story.desc;
      (document.querySelector('#story-priority') as HTMLSelectElement).value = story.priority;
      (document.querySelector('#story-status') as HTMLSelectElement).value = story.status;
      document.querySelector('#save-story-btn')!.textContent="Update Story";
    }
  }

  if (target.classList.contains('delete-story-btn')) {
    await storyService.deleteStory(id);
    renderStories();
  }

  if (target.classList.contains('view-tasks-btn')) {
    const story = await storyService.getStoryById(id);
    if (story) {
      activeStoryId=story.id;
      storySection.style.display = 'none';
      tasksSection.style.display = 'block';
      activeStoryNameDisplay.textContent= story.name;
      renderTasks();
    }
  }
})

async function renderTasks() {
  if (!activeStoryId) return;

  const tasks = await taskService.getTasksByStory(activeStoryId);
  const allUsers = await userService.getAllUsers(); 

  const columns: Record<string, HTMLElement> = {
    todo: document.querySelector('#task-col-todo .task-list')!,
    doing: document.querySelector('#task-col-doing .task-list')!,
    done: document.querySelector('#task-col-done .task-list')!,
  };

  Object.values(columns).forEach(c=>c.innerHTML = '');

  tasks.forEach(task =>{
    const priorityBorder: Record<string, string> = {
      low: 'border-l-4 border-l-prio-low',
      medium: 'border-l-4 border-l-prio-medium',
      high: 'border-l-4 border-l-prio-high'
    };

    const card = document.createElement('div');
    card.className = `bg-white/60 dark:bg-storm-800/60 backdrop-blur-md border border-white/60 dark:border-storm-700 rounded-lg p-4 shadow-sm mb-3 ${priorityBorder[task.priority]}`;  
    
    let assigneeName = 'Unassigned';
    if (task.assigneeId) {
      const user = allUsers.find(u => u.id === task.assigneeId);
      if (user) assigneeName = `${user.name} ${user.surname}`;
    }

    card.innerHTML = `
      <h4 class="text-md font-semibold text-storm-900 dark:text-storm-300 mb-1">${task.name}</h4>
      <p class="text-xs text-storm-700 dark:text-storm-500 mb-3">Est: ${task.estimatedTime}h | ${assigneeName}</p>
      <div class="flex flex-wrap gap-2 pt-3 border-t border-white/50 border-dashed dark:border-storm-700">
        <button class="details-task-btn px-2 py-1 text-xs font-medium rounded-lg bg-white/50 border border-white/50 text-storm-800 hover:bg-white/80 dark:bg-storm-700 dark:border-storm-500 dark:text-storm-300 dark:hover:bg-storm-500 transition-colors" data-id="${task.id}">Details</button>
        <button class="delete-task-btn px-2 py-1 text-xs font-medium rounded-lg bg-white/50 border border-white/50 text-storm-800 hover:bg-red-100/80 hover:text-red-700 dark:bg-storm-700 dark:border-storm-500 dark:text-storm-300 dark:hover:bg-red-900/50 dark:hover:text-red-300 transition-colors" data-id="${task.id}">Del</button>
      </div>
    `;

    columns[task.status as keyof typeof columns].appendChild(card);
  })
}

taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!activeStoryId) return;

  const newTask: Task = {
    id: (document.querySelector('#task-id') as HTMLInputElement).value || crypto.randomUUID(),
    name: (document.querySelector('#task-name') as HTMLInputElement).value,
    desc: (document.querySelector('#task-desc') as HTMLTextAreaElement).value,
    priority: (document.querySelector('#task-priority') as HTMLSelectElement).value as Priority,
    status: 'todo',
    storyId: activeStoryId,
    estimatedTime: Number((document.querySelector('#task-estimated-time') as HTMLInputElement).value),
    createdAt: new Date().toISOString()
  };

  await taskService.save(newTask);
  taskForm.reset();
  (document.querySelector('#task-id') as HTMLInputElement).value = '';
  document.querySelector('#save-task-btn')!.textContent = 'Add Task';
  renderTasks();
});

backToStoriesBtn.addEventListener("click", () => {
  tasksSection.style.display='none';
  storySection.style.display='block';
  activeStoryId=null;
})

tasksSection.addEventListener('click', async (e) => {
  const target = e.target as HTMLElement;
  const id = target.getAttribute('data-id');
  if (!id) return;

  if (target.classList.contains('details-task-btn')) {
    currentlyOpenTaskId = id;
    
    const task = await taskService.getTaskById(id); 
    
    if (task) {
      document.getElementById('modal-task-name')!.textContent = task.name;
      document.getElementById('modal-task-desc')!.textContent = task.desc || 'No description';
      document.getElementById('modal-task-status')!.textContent = task.status;
      document.getElementById('modal-task-est')!.textContent = task.estimatedTime.toString();
      
      const users = await userService.getAllUsers();
      assignSelect.innerHTML = users
        .filter(u => u.role === 'devops' || u.role === 'developer')
        .map(u => `<option value="${u.id}">${u.name} ${u.surname} (${u.role})</option>`)
        .join('');
      
      const assignSection = document.getElementById('assign-section')!;
      const doneSection = document.getElementById('done-section')!;
      
      if (task.status === 'todo') {
        assignSection.style.display = 'flex';
        doneSection.style.display = 'none';
      } else if (task.status === 'doing') {
        assignSection.style.display = 'none';
        doneSection.style.display = 'block';
      } else {
        assignSection.style.display = 'none';
        doneSection.style.display = 'none';
      }

      modal.showModal();
    }
  }

  if (target.classList.contains('delete-task-btn')) {
    await taskService.delete(id); 
    renderTasks();
  }
});

closeModalBtn.addEventListener('click', () => {
  modal.close();
  currentlyOpenTaskId = null;
});

assignBtn.addEventListener('click', async () => {
  if (!currentlyOpenTaskId) return;
  
  const task = await taskService.getTaskById(currentlyOpenTaskId);
  if (task) {
    task.assigneeId = assignSelect.value;
    task.status = 'doing';
    task.startDate = new Date().toISOString();
    
    await taskService.save(task); 
    
    if (activeStoryId) {
      const story = await storyService.getStoryById(activeStoryId);
      if (story && story.status === 'todo') {
        story.status = 'doing';
        await storyService.save(story); 
      }
    }
  }
  
  modal.close();
  renderTasks();
  renderStories(); 
});

markDoneBtn.addEventListener('click', async () => {
  if (!currentlyOpenTaskId) return;
  
  const task = await taskService.getTaskById(currentlyOpenTaskId);
  if (task) {
    task.status = 'done';
    task.endDate = new Date().toISOString();
    await taskService.save(task); 
    
    if (activeStoryId) {
      const allTasks = await taskService.getTasksByStory(activeStoryId);
      const allDone = allTasks.every(t => t.status === 'done');
      
      if (allDone) {
        const story = await storyService.getStoryById(activeStoryId);
        if (story) {
          story.status = 'done';
          await storyService.save(story);
        }
      }
    }
  }
  
  modal.close();
  renderTasks();
  renderStories(); 
});

function setupThemeToggle() {
  const toggleBtn = document.getElementById('theme-toggle');
  const htmlElement = document.documentElement;

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    htmlElement.classList.add('dark');
  }

  toggleBtn?.addEventListener('click', () => {
    htmlElement.classList.toggle('dark');
    const isDark = htmlElement.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });
}
setupThemeToggle();

init();