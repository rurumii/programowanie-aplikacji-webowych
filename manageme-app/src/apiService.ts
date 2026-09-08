export class ApiClient{
    // мок задержки для имитации работы сети
    private emulateNetworkDelay(): Promise<void>{
        return new Promise(resolve=> setTimeout(resolve,300));
    }

    //getall
    // T - generic
    async get<T>(endpointKey: string): Promise<T[]>{
        await this.emulateNetworkDelay(); // ждём имитируя сеть

        const data = localStorage.getItem(endpointKey);
        return data ? JSON.parse(data): [];
    }

    //getbyid
    async getById<T extends {id:string}>(endpointKey:string, id:string):Promise<T | undefined>{
        await this.emulateNetworkDelay();

        const data = localStorage.getItem(endpointKey);
        if (!data) return undefined;

        const items:T[] = JSON.parse(data);
        return items.find((item:T)=> item.id===id);
    }


    // save/update
    // мы требуем чтобы у сохраняемого объекта было поле айди
    async save<T extends {id: string}>(endpointKey: string,item: T): Promise<void> {
        await this.emulateNetworkDelay();

        // получаем текущие данные
        const data = localStorage.getItem(endpointKey);
        const items: T[] = data ? JSON.parse(data): [];

        // ищем есть ли уже такой элемент
        const index = items.findIndex(i=>i.id === item.id);
        if (index > -1){
            items[index] = item; // update
        } else {
            items.push(item); // add new
        }

        localStorage.setItem(endpointKey, JSON.stringify(items));
    }

    //delete
    async delete(endpointKey:string,id: string): Promise<void>{
        await this.emulateNetworkDelay();

        const data = localStorage.getItem(endpointKey);
        if (!data) return;

        const items = JSON.parse(data);
        // filter
        const filteredItems = items.filter((item:any)=>item.id!== id);

        localStorage.setItem(endpointKey, JSON.stringify(filteredItems));
    }
}