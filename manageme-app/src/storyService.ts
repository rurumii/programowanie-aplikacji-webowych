import type { Story } from "./types";

export class StoryService {
    private readonly activeProjectKey = 'manageme_active_proj'
    private readonly storageKey = 'manageme_stories'; // ключ для всех задач

    //
    setActiveProject(projectId: string) : void {
        // setitem - сохранить
        localStorage.setItem(this.activeProjectKey, projectId);
    }

    //
    getActiveProjectId(): string | null {
        return localStorage.getItem(this.activeProjectKey);
    }
    // Получить ВООБЩЕ ВСЕ задачи из базы
    getAllStories(): Story[] {
        const data = localStorage.getItem(this.storageKey);
        // return data ? JSON.parse(data) : [];
        if (data)
        {
            const parsedData = JSON.parse(data) as Story[];
            return parsedData;
        } else {
            return [];
        }
       
    }

    // получить задачи только для конкретного проекта (фильтрация)
    getStoriesByProject(projectId: string): Story[] {
        return this.getAllStories().filter(s => s.projectId === projectId);
    }

    getStoryById(id: string): Story | undefined
    {
        const allStories = this.getAllStories();
        return allStories.find(s=>s.id===id);
    }

    deleteStory(id:string): void
    {
        const stories = this.getAllStories();
        const updatedStories = stories.filter(s=>s.id!==id);

        localStorage.setItem(this.storageKey, JSON.stringify(updatedStories));
    }


    // сохранить или обновить задачу
    save(story: Story): void {
        const allStories = this.getAllStories();
        const index = allStories.findIndex(s => s.id === story.id);
        
        if (index > -1) {
            allStories[index] = story; // обновляем старую
        } else {
            allStories.push(story); // добавляем новую
        }
        localStorage.setItem(this.storageKey, JSON.stringify(allStories));
    }
}
// остановилась на том что разобрала типы/стори/юзер(мок)/проджект сервисы
// далее мейн тс