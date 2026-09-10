import './style.css'
import { ProjectService } from './projectService'
import { UserService } from './userService';
import { StoryService } from './storyService';
import type { Project, Story, Priority, Status, Task } from './types';
import { TaskService } from './taskService';
import { NotificationService } from './notificationService';

const service = new ProjectService();
const userService = new UserService();
const storyService = new StoryService();
const taskService = new TaskService();
const notificationService = new NotificationService();

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

// DOM элементы для уведомлений
const notifBell = document.querySelector<HTMLButtonElement>('#notification-bell')!;
const notifCount = document.querySelector<HTMLSpanElement>('#notification-count')!;
const allNotifModal = document.querySelector<HTMLDialogElement>('#all-notif-modal')!;
const closeNotifModalBtn = document.querySelector<HTMLButtonElement>('#close-notif-modal-btn')!;
const notifList = document.querySelector<HTMLDivElement>('#notif-list')!;

const liveAlertModal = document.querySelector<HTMLDialogElement>('#live-alert-modal')!;
const closeLiveAlertBtn = document.querySelector<HTMLButtonElement>('#close-live-alert-btn')!;

async function init() {
  await renderUserInfo();
  await renderProjects();
  await renderStories(); 
  
  // Инициализация уведомлений при загрузке страницы
  await renderNotifications();
  setupLiveAlerts();
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

form.addEventListener('submit', async (e) =>{
  e.preventDefault(); 
  const projectData: Project = {
    id: idInput.value || crypto.randomUUID(),
    name: nameInput.value,
    description: descInput.value
  };

  await service.save(projectData);
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
    await service.delete(id);
    renderProjects();
    renderStories(); 
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

  await storyService.save(newStory);
  storyForm.reset();
  renderStories(); 
  (document.querySelector('#story-id') as HTMLInputElement).value='';
  document.querySelector('#save-story-btn')!.textContent = 'Add Story';
});

async function renderStories(){
  const activeId = storyService.getActiveProjectId();
  const section = document.querySelector<HTMLElement>('#stories-section')!;

  const projectExists = activeId ? await service.getById(activeId) : null;

  if (!activeId || !projectExists){
    section.style.display = 'none';
    if (!projectExists && activeId) {
      storyService.setActiveProject(''); 
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
  await taskService.assignUser(currentlyOpenTaskId, assignSelect.value);
  
  modal.close();
  renderTasks();
  renderStories(); 
});

markDoneBtn.addEventListener('click', async () => {
  if (!currentlyOpenTaskId) return;
  await taskService.markAsDone(currentlyOpenTaskId);
  
  modal.close();
  renderTasks();
  renderStories(); 
});


/*
 * ui уведомления
 * 1. rendernotifications():
 * берет текущего пользователя, запрашивает все ЕГО письма.
 * считает непрочитанные (filter isread == false) и обновляет красный счетчик на колокольчике.
 * затем генерирует карточки писем внутри большой модалки.
 * 
 * 2. setuplivealerts() (подписка):
 * мы передаем эту функцию внутрь notificationservice.
 * каждый раз, когда кто-то создает уведомление 'high' или 'medium',
 * сервис автоматически вызывает эту функцию. она берет текст письма
 * и сразу показывает всплывающее окно в правом нижнем углу.
 */
async function renderNotifications() {
  const user = await userService.getCurrentUser();
  const notifs = await notificationService.getForUser(user.id);

  const unread = notifs.filter(n => !n.isRead);
  if (unread.length > 0) {
      notifCount.textContent = unread.length.toString();
      notifCount.classList.remove('hidden');
  } else {
      notifCount.classList.add('hidden');
  }

  notifList.innerHTML = notifs.map(n => `
      <div class="p-4 border rounded-lg ${n.isRead ? 'bg-white/20 dark:bg-storm-800/30 opacity-70' : 'bg-white/80 dark:bg-storm-700/80 font-medium'} dark:border-storm-600 flex justify-between items-center transition-all">
          <div>
              <span class="text-xs text-storm-500 uppercase tracking-wide font-bold">${n.priority} Priority • ${new Date(n.date).toLocaleDateString()}</span>
              <h4 class="text-md mt-1 text-storm-900 dark:text-storm-100">${n.title}</h4>
              <p class="text-sm mt-1 text-storm-700 dark:text-storm-400">${n.message}</p>
          </div>
          ${!n.isRead ? `<button class="mark-read-btn ml-4 px-3 py-1.5 bg-storm-100 border border-storm-300 dark:bg-storm-600 dark:border-storm-500 dark:text-storm-100 text-storm-800 rounded-lg text-xs font-medium hover:bg-storm-300 transition-colors shadow-sm whitespace-nowrap" data-id="${n.id}">Mark Read</button>` : ''}
      </div>
  `).join('');
}

// открытие списка уведомлений
notifBell.addEventListener('click', () => {
  allNotifModal.showModal();
});

// закрытие списка уведомлений
closeNotifModalBtn.addEventListener('click', () => {
  allNotifModal.close();
});

// клик по кнопке "Mark Read" внутри списка уведомлений
notifList.addEventListener('click', async (e) => {
  const target = e.target as HTMLElement;
  if (target.classList.contains('mark-read-btn')) {
      const id = target.getAttribute('data-id');
      if (id) {
          await notificationService.markAsRead(id);
          await renderNotifications();
      }
  }
});

// настройка подписки на срочные всплывающие окна
function setupLiveAlerts() {
  notificationService.subscribe(async (n) => {
      document.getElementById('live-alert-title')!.textContent = n.title;
      document.getElementById('live-alert-desc')!.textContent = n.message;
      liveAlertModal.showModal();
      await renderNotifications(); // обновляем красный счетчик на колокольчике
  });
}

closeLiveAlertBtn.addEventListener('click', () => {
  liveAlertModal.close();
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