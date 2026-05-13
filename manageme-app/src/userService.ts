import type { User } from "./types";

export class UserService {
    // имитированный пользователь (мок/заглушка)
    private users: User[] = [
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
    getCurrentUser(): User{
        const admin = this.users.find(u=>u.role==='admin');
        return admin || this.users[0]; //<= на всякий случай возвращаем хотя бы первого
    }

    getAllUsers(): User[]{
        return this.users;
    }

    getAssignableUsers(): User[]
    {
        return this.users.filter(u=>u.role!=='admin');
    }
}