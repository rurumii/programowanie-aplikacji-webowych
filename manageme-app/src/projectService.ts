import type { Project } from "./types";
import { ApiClient } from './apiService';

export class ProjectService {
    private api = new ApiClient();
    private readonly endpoint = 'manageme-projects';

    // ключ по которому будут искаться данные в браузере
    // private readonly storageKey = "projects";

    // метод для получения всех проектов
    async getAll(): Promise<Project[]> {
        return await this.api.get<Project>(this.endpoint);
    }

    // сохранение (криейт/апдейт)
    async save(project: Project) : Promise<void> {
        await this.api.save<Project>(this.endpoint,project);
        // // получение всех
        // const projects = this.getAll();
        // // ищем айди параметра в массиве всех проектов
        // const index = projects.findIndex(p => p.id === project.id);

        // if (index !== -1){
        //     // если проект с таким айди существует => заменяем (апдейт);
        //     // если нет - добавляем в массив
        //     projects[index] = project;
        // } else {
        //     projects.push(project);
        // }

        // // сохранение в лс в виде строки
        // localStorage.setItem(this.storageKey, JSON.stringify(projects));
    }

    // удаление (оставляем в массиве всё кроме проекта с указанным айди)
    async delete(id: string) : Promise<void> {
        await this.api.delete(this.endpoint,id);
        // // фильтр переписывает, создаёт новый массив оставляя все элементы которые не равны айди в парамертеп
        // const projects = this.getAll().filter(p=> p.id !== id);
        // localStorage.setItem(this.storageKey, JSON.stringify(projects));
    }

    // поиск; достаточно только айди в параметре 
    async getById(id: string): Promise<Project | undefined>{
        return await this.api.getById<Project>(this.endpoint,id);
    }
}