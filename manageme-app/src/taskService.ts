import type { Task, Status, Priority } from "./types";
import { StoryService } from "./storyService";
import { ApiClient } from "./apiService";
import { NotificationService } from "./notificationService";

export class TaskService {
    private storageKey = 'tasks_data';
    private storyService = new StoryService();
    private api = new ApiClient();
    private notificationService = new NotificationService();

    async getAllTasks(): Promise<Task[]>{
        return await this.api.get<Task>(this.storageKey);
    }
    
    async getTaskById(id:string):Promise<Task | undefined> {
        return await this.api.getById<Task>(this.storageKey,id);
    }
    
    async getTasksByStory(storyId:string): Promise<Task[]> {
        const allTasks = await this.getAllTasks();
        return allTasks.filter(t=>t.storyId===storyId);
    }

    /*(save - создание задачи):
     * 1. как и в проектах, мы проверяем isnew.
     * 2. системный момент: в самой задаче (task) нет поля "кто владелец". 
     * там есть только storyid. поэтому, чтобы узнать, кому слать письмо, 
     * мы сначала идем в storyservice, просим дать нам историю по id, 
     * и уже из нее вытаскиваем ownerid.
     */
    async save(task: Task): Promise<void>{
        const existingTask = await this.getTaskById(task.id);
        const isNew = !existingTask;

        await this.api.save<Task>(this.storageKey, task);

        if (isNew) {
            const story = await this.storyService.getStoryById(task.storyId);
            if (story) {
                await this.notificationService.create(
                    'New Task Added',
                    `Dodano nowe zadanie: ${task.name}`,
                    'medium',
                    story.ownerId // шлем уведомление владельцу истории
                );
            }
        }
    }

    /*
     * (delete - удаление)
     * почему мы сначала получаем задачу (gettaskbyid), а только потом удаляем?
     * если мы сначала удалим ее из базы, мы потеряем её данные (имя и storyid).
     * а без storyid мы не сможем найти историю и понять, кому отправлять уведомление.
     */
    async delete(id:string): Promise<void>{
        const task = await this.getTaskById(id);
        
        if (task) {
            const story = await this.storyService.getStoryById(task.storyId);
            await this.api.delete(this.storageKey, id); // физическое удаление
            
            if (story) {
                await this.notificationService.create(
                    'Task Removed',
                    `Usunięto zadanie: ${task.name}`,
                    'medium',
                    story.ownerId
                );
            }
        } else {
            await this.api.delete(this.storageKey, id); // на случай если задачи уже не было
        }
    }

    /*
     * (смена статуса на doing)
     * тут срабатывают сразу 2 уведомления:
     * 1. исполнителю (recipient: userid) - priority high (ты назначен на задачу)
     * 2. владельцу истории (recipient: ownerid) - priority low (задачу начали делать)
     */
    async assignUser(taskId:string, userId:string): Promise<void> {
        const task = await this.getTaskById(taskId);
        if(!task) return;

        task.assigneeId = userId;
        task.status = 'doing';
        task.startDate = new Date().toISOString();

        await this.save(task); 

        // 1. уведомление назначенному юзеру
        await this.notificationService.create(
            'New Task Assignment',
            `You have been assigned to task: ${task.name}`,
            'high',
            userId 
        );

        // 2. уведомление владельцу истории (статус -> doing)
        const story = await this.storyService.getStoryById(task.storyId);
        if (story) {
            await this.notificationService.create(
                'Task Status Changed',
                `Status zadania ${task.name} zmieniony na doing`,
                'low',
                story.ownerId
            );

            if (story.status === 'todo') {
                story.status = 'doing';
                await this.storyService.save(story);
            }
        }
    }

    /*
     * (смена статуса на done):
     * алгоритм такой же, как при assignuser.
     * только тут статус становится 'done', а значит по заданию 
     * приоритет уведомления для владельца истории меняется на 'medium'.
     */
    async markAsDone(taskId:string): Promise<void> {
        const task = await this.getTaskById(taskId);
        if (!task) return;

        task.status = 'done';
        task.endDate = new Date().toISOString();
        await this.save(task);

        // уведомление владельцу истории (статус -> done)
        const story = await this.storyService.getStoryById(task.storyId);
        if (story) {
            await this.notificationService.create(
                'Task Status Changed',
                `Status zadania ${task.name} zmieniony na done`,
                'medium',
                story.ownerId
            );
        }

        await this.checkAndUpdateStoryStatus(task.storyId); 
    }

    private async checkAndUpdateStoryStatus(storyId:string): Promise<void> {
        const allStoryTasks = await this.getTasksByStory(storyId);
        const allAreDone = allStoryTasks.length > 0 && allStoryTasks.every(t => t.status === 'done');
        
        if(allAreDone) {
            const story = await this.storyService.getStoryById(storyId);
            if (story && story.status !== 'done') {
                story.status = 'done';
                await this.storyService.save(story);
            }
        }
    }
}