import type { Story } from "./types";

export class StoryService {
    private readonly activeProjectKey = 'manageme_active_proj'

    //
    setActiveProject(projectId: string) : void {
        localStorage.setItem(this.activeProjectKey, projectId);
    }

    //
    getActiveProjectId(): string | null {
        return localStorage.getItem(this.activeProjectKey);
    }
}