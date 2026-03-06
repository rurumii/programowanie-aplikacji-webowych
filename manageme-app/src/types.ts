// чертёж объекта
export interface Project {
    id: string;
    name: string;
    description: string;
}

// наши кастомные типы (union types)
export type Priority = 'low' | 'medium' | 'high';
export type Status = 'todo' | 'doing' | 'done';

export interface User {
    id: string;
    name: string;
    surname: string;
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