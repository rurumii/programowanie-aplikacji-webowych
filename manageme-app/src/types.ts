// чертёж объекта
export interface Project {
    id: string;
    name: string;
    description: string;
}

// наши кастомные типы (union types)
export type Priority = 'low' | 'medium' | 'high';
export type Status = 'todo' | 'doing' | 'done';
export type Role = 'admin' | 'devops' | 'developer';

export interface User {
    id: string;
    name: string;
    surname: string;
    role: Role;
}

// описание конкретной функции или задачи которую нужно реализовать в проекте
// "задачи"
export interface Story {
    id: string;
    name: string;
    desc: string;
    priority: Priority;
    status: Status;
    projectId: string; // связь с проектом
    ownerId: string; // связь с юзером
    createdAt: string; // ISO data
}

export interface Task {
    id:string;
    name:string;
    desc:string;
    priority: Priority;
    status: Status;
    storyId:string;
    estimatedTime: number; // в часах
    createdAt: string;
    startDate?: string; // может не быть
    endDate?: string; // только для done
    assigneeId?: string; // айди девопса/дева
    
}

export type ISOString = string;
export type UserID = string;
/*
 * почему добавили id, которого нет в задании
 * потому что мой класс apiclient имеет жесткое ограничение: 
 * метод save принимает только те объекты, у которых есть id (<t extends {id: string}>). 
 * без поля id typescript просто не позволил бы сохранить уведомление в базу.
 */
export type Notification = {
    id: string; 
    title: string;
    message: string;
    date: ISOString;
    priority: Priority; // В методичке опечатка 'prority', используем наш тип Priority
    isRead: boolean;
    recipientId: UserID;
}