import type { Story } from "./types";
import { ApiClient } from "./apiService";

export class StoryService {
    private readonly activeProjectKey = 'manageme_active_proj'
    private readonly storageKey = 'manageme_stories'; // ключ для всех задач
    private api = new ApiClient();

    //
    setActiveProject(projectId: string) : void {
        // setitem - сохранить
        localStorage.setItem(this.activeProjectKey, projectId);
    }
    getActiveProjectId(): string | null {
        return localStorage.getItem(this.activeProjectKey);
    }
    //

    // work w/db
    async getAllStories(): Promise<Story[]> {
        return await this.api.get<Story>(this.storageKey);
    }
    async getStoryById(id: string): Promise<Story|undefined>
    {
        return await this.api.getById<Story>(this.storageKey,id);
    }
    async getStoriesByProject(projectId: string): Promise<Story[]> {
        const allStories=await this.getAllStories();
        return allStories.filter(s => s.projectId === projectId); 
    }
    async deleteStory(id:string): Promise<void>
    {
        await this.api.delete(this.storageKey,id);
    }
    async save(story: Story): Promise<void> { //save+update
        await this.api.save<Story>(this.storageKey,story);
    }
}