import type { User, Role } from "./types";
import { ApiClient } from "./apiService";
import { auth, googleProvider } from "./firebaseSetup";
import { signInWithPopup, signOut } from "firebase/auth";

export class UserService {
    private api = new ApiClient();
    private readonly storageKey = 'manageme_users';
    
    private readonly SUPER_ADMIN_EMAIL = 'rurumiowo@gmail.com'; 

    async loginWithGoogle(): Promise<{user: User, isNew: boolean} | null> {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const googleUser = result.user;
            
            const email = googleUser.email || '';
            const name = googleUser.displayName?.split(' ')[0] || 'Unknown';
            const surname = googleUser.displayName?.split(' ').slice(1).join(' ') || '';

            const users = await this.getAllUsers();
            let user = users.find(u => u.email === email);
            let isNew = false;

            if (!user) {
                isNew = true;
                user = {
                    id: googleUser.uid, 
                    email,
                    name,
                    surname,
                    role: email === this.SUPER_ADMIN_EMAIL ? 'admin' : 'guest',
                    isBlocked: false
                };
                await this.api.save(this.storageKey, user);
            }

            localStorage.setItem('manageme_active_user_id', user.id);
            return { user, isNew };
        } catch (error) {
            console.error("Błąd logowania Google:", error);
            return null;
        }
    }

    async getCurrentUser(): Promise<User | null> {
        const activeId = localStorage.getItem('manageme_active_user_id');
        if (!activeId) return null;
        const users = await this.getAllUsers();
        return users.find(u => u.id === activeId) || null;
    }

    async getAllUsers(): Promise<User[]> {
        return await this.api.get<User>(this.storageKey);
    }

    async changeUserRole(userId: string, newRole: Role): Promise<void> {
        const users = await this.getAllUsers();
        const user = users.find(u => u.id === userId);
        if (user) {
            user.role = newRole;
            await this.api.save(this.storageKey, user);
        }
    }

    async toggleUserBlock(userId: string, block: boolean): Promise<void> {
        const users = await this.getAllUsers();
        const user = users.find(u => u.id === userId);
        if (user) {
            user.isBlocked = block;
            await this.api.save(this.storageKey, user);
        }
    }

    async logout(): Promise<void> {
        await signOut(auth); // выходим из google сессии
        localStorage.removeItem('manageme_active_user_id');
    }
}