import type { Task, Status, Priority } from "./types";
import { StoryService } from "./storyService";
import { ApiClient } from "./apiService";

export class TaskService {
    private storageKey = 'tasks_data';
    private storyService = new StoryService();
    private api = new ApiClient();



async getAllTasks(): Promise<Task[]>{
    return await this.api.get<Task>(this.storageKey);
}
async getTaskById(id:string):Promise<Task | undefined>
{
    return await this.api.getById<Task>(this.storageKey,id);
}
async getTasksByStory(storyId:string): Promise<Task[]>
{
    const allTasks = await this.getAllTasks();
    return allTasks.filter(t=>t.storyId===storyId);
}
async save(task: Task): Promise<void>{
    await this.api.save<Task>(this.storageKey, task);
}
async delete(id:string): Promise<void>{
    await this.api.delete(this.storageKey,id);
}

// бизнес логика
// 1. назначить человека на задачу
async assignUser(taskId:string,userId:string): Promise<void>
{
    const task= await this.getTaskById(taskId);
    
    if(!task) return;

    // автоматиечски меняем статус и начинаем дату старта
    task.assigneeId=userId;
    task.status='doing';
    task.startDate=new Date().toISOString();

    await this.save(task); // сохраняем измененную задачу

    // Jeśli historyjka miała stan 'todo' - zmieniamy na 'doing'
    const story = await this.storyService.getStoryById(task.storyId);
    if (story && story.status === 'todo')
    {
        story.status='doing';
        await this.storyService.save(story);
    }
}
// 2. завершение задачи
async markAsDone(taskId:string):Promise<void>
{
    const task = await this.getTaskById(taskId);
    if (!task) return;

    task.status='done';
    task.endDate=new Date().toISOString();
    await this.save(task);

    // Jeśli wszystkie zadania są zakończone - zmieniamy na 'done'
    await this.checkAndUpdateStoryStatus(task.storyId); // <= вспомогательный метод
}
private async checkAndUpdateStoryStatus(storyId:string):Promise<void>{
        const allStoryTasks = await this.getTasksByStory(storyId);

        // проверяем есть ли таски; у них статус done?
        const allAreDone = allStoryTasks.length>0&&allStoryTasks.every(t=>t.status==='done');
        if(allAreDone)
        {
            const story = await this.storyService.getStoryById(storyId);
            if (story&&story.status!=='done') // <=проверка есть ли стори и имеет ли статус дан (если нет - меняем)
            {
                story.status='done';
                await this.storyService.save(story);
            }
        }
}
}