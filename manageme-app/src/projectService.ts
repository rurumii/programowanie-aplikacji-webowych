// слой логики
import type { Project } from "./types";

export class ProjectService {
    // ключ по которому будут искаться данные в браузере
    private readonly storageKey = "projects";

    // метод для получения всех проектов
    getAll(): Project[] {
        const data = localStorage.getItem(this.storageKey);
        // если данных нет (первый запуск) возвращаем пустой массив
        return data ? JSON.parse(data) : [];
    }

    // сохранение (криейт/апдейт)
    save(project: Project) : void {
        // получение всех
        const projects = this.getAll();
        const index = projects.findIndex(p => p.id === project.id);

        if (index !== -1){
            // если проект с таким айди существует => заменяем (апдейт)
            projects[index] = project;
        } else {
            projects.push(project);
        }

        // сохранение в лс в виде строки
        localStorage.setItem(this.storageKey, JSON.stringify(projects));
    }

    // удаление (оставляем в массиве всё кроме проекта с указанным айди)
    delete(id: string) : void {
        // фильтр переписывает массив оставляя все массивы кроме того что в id
        const projects = this.getAll().filter(p=> p.id !== id);
        localStorage.setItem(this.storageKey, JSON.stringify(projects));
    }

    // поиск
    getById(id: string): Project | undefined {
        return this.getAll().find(p=> p.id === id);
    }
}