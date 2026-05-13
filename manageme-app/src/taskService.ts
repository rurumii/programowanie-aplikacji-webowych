import type { Task, Status, Priority } from "./types";
import { StoryService } from "./storyService";

export class TaskService {
    private storageKey = 'tasks_data';
    private storyService = new StoryService();


// crud

getAllTasks(): Task[]{
    const data = localStorage.getItem(this.storageKey);
    return data? JSON.parse(data) : [];
}

getTasksByStory(storyId:string): Task[]
{
    return this.getAllTasks().filter(t=>t.storyId===storyId);
}

getTaskById(id:string): Task | undefined
{
    return this.getAllTasks().find(t=>t.id===id);
}
// create/update (upsert)

save(task: Task): void{
    const tasks = this.getAllTasks();
    const index = tasks.findIndex(t=>t.id===task.id);
    if (index > -1)
    {
        // если вернулась цифра н.п.2 значит такая задача существует
        tasks[index] = task; // <= переписываем старую задачу актуальными данными
    } else // создаем новую задачу 
    {
        tasks.push(task);
    }
    localStorage.setItem(this.storageKey, JSON.stringify(tasks))
}

// delete
delete(id:string): void{
    const tasks = this.getAllTasks();
    const updatedTasks = tasks.filter(t=>t.id!== id);
    localStorage.setItem(this.storageKey, JSON.stringify(updatedTasks));
}

// бизнес логика
// 1. назначить человека на задачу
assignUser(taskId:string,userId:string): void
{
    const task=this.getTaskById(taskId);
    
    if(!task) return;

    // автоматиечски меняем статус и начинаем дату старта
    task.assigneeId=userId;
    task.status='doing';
    task.startDate=new Date().toISOString();

    this.save(task); // сохраняем измененную задачу

    // Jeśli historyjka miała stan 'todo' - zmieniamy na 'doing'
    const story = this.storyService.getStoryById(task.storyId);
    if (story && story.status === 'todo')
    {
        story.status='doing';
        this.storyService.save(story);
    }
}
// 2. завершение задачи
markAsDone(taskId:string):void
{
    const task = this.getTaskById(taskId);
    if (!task) return;

    //
    task.status='done';
    task.endDate=new Date().toISOString();
    this.save(task);

    // Jeśli wszystkie zadania są zakończone - zmieniamy na 'done'
    
    this.checkAndUpdateStoryStatus(task.storyId); // <= вспомогательный метод
}
    private checkAndUpdateStoryStatus(storyId:string):void{
        const allStoryTasks = this.getTasksByStory(storyId);

        // проверяем есть ли таски; у них статус done?
        const allAreDone = allStoryTasks.length>0&&allStoryTasks.every(t=>t.status==='done');
        if(allAreDone)
        {
            const story = this.storyService.getStoryById(storyId);
            if (story&&story.status!=='done') // <=проверка есть ли стори и имеет ли статус дан (если нет - меняем)
            {
                story.status='done';
                this.storyService.save(story);
            }
        }
}
}