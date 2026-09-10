import type { Project } from "./types";
import { ApiClient } from './apiService';
import { NotificationService } from './notificationService';
import { UserService } from './userService';


/*
     * 1. внедрение зависимостей (dependency injection): 
     * сам projectservice умеет только сохранять данные. чтобы рассылать уведомления, 
     * мы передали ему "помощников": userservice (чтобы найти всех админов) 
     * и notificationservice (чтобы отправить им готовый текст).
     * 
     * 2. зачем нужна переменная isnew:
     * кнопка "save" и метод save() универсальны: они делают и create (создание), 
     * и update (редактирование). если не проверить старую базу (isnew = !existingproject), 
     * то при каждом редактировании текста проекта админам летел бы спам 
     * "создан новый проект!". уведомление уходит только если проекта раньше не было.
*/
export class ProjectService {
    private api = new ApiClient();
    private readonly endpoint = 'manageme-projects';
    
    // создаем экземпляры сервисов, чтобы к ним обращаться
    private notificationService = new NotificationService();
    private userService = new UserService();

    async getAll(): Promise<Project[]> {
        return await this.api.get<Project>(this.endpoint);
    }

    async save(project: Project) : Promise<void> {
        // проверяем, существует ли проект в базе до сохранения
        const existingProject = await this.getById(project.id);
        const isNew = !existingProject;

        // сохраняем проект (эта строка уже была)
        await this.api.save<Project>(this.endpoint, project);

        // ТРИГГЕР УВЕДОМЛЕНИЯ: срабатывает только если проект новый
        if (isNew) {
            // берем всех юзеров и фильтруем только админов
            const allUsers = await this.userService.getAllUsers();
            const admins = allUsers.filter(u => u.role === 'admin');

            // рассылаем каждому админу уведомление (High priority)
            for (const admin of admins) {
                await this.notificationService.create(
                    'New Project Created',
                    `Utworzono nowy projekt: ${project.name}`,
                    'high',
                    admin.id
                );
            }
        }
    }

    async delete(id: string) : Promise<void> {
        await this.api.delete(this.endpoint, id);
    }

    async getById(id: string): Promise<Project | undefined>{
        return await this.api.getById<Project>(this.endpoint, id);
    }
}