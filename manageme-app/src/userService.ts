import type { User } from "./types";
import { ApiClient} from "./apiService";


export class UserService {
    private api = new ApiClient();
    private readonly storageKey = 'manageme_users';

    // имитированный пользователь (мок/заглушка)
    private readonly defaultUsers: User[] = [
        {
        id: 'admin-1',
        name: 'Karinka',
        surname: 'Mandarinka',
        role: "admin"
        },
        {
        id: 'devops-1',
        name: 'Kitty',
        surname: 'Catty',
        role: "devops"
        },
        {
        id: 'dev-1',
        name: 'Musya',
        surname: 'Musyatovna',
        role: "developer"
        }];
 
    // метод возвращающий данные залогиненного юзера
    async getCurrentUser(): Promise<User>{
        const users = await this.getAllUsers();
        const admin = users.find(u=>u.role==='admin');
        return admin || users[0]; //<= на всякий случай возвращаем хотя бы первого
    }
    async getAllUsers(): Promise<User[]>{
        let usersFromDb = await this.api.get<User>(this.storageKey);
        // seeding
        if (usersFromDb.length === 0) {
            for (const user of this.defaultUsers)
            {
                await this.api.save(this.storageKey, user);
            }
            usersFromDb = this.defaultUsers;
        }
        return usersFromDb;
    }
    async getAssignableUsers(): Promise<User[]>
    {
        const users = await this.getAllUsers();
        return users.filter(u=>u.role!=='admin');
    }
}