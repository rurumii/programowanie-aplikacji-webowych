import type { User } from "./types";

export class UserService {
    // имитированный пользователь (мок/заглушка)
    private currentUser: User = {
        id: '123',
        name: 'Karinka',
        surname: 'Mandarinka'
    };
 
    // метод возвращающий данные залогиненного юзера
    getCurrentUser(): User{
        return this.currentUser;
    }
}