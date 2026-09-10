import { appConfig } from './config';
import { db } from './firebaseSetup';
import { collection, doc, getDocs, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

/*
 * api service и базы данных
 * 
 * 1. паттерн feature toggle: мы читаем настройку из config.ts. 
 * если там 'firebase', вызываем методы firestore (getdocs, setdoc). 
 * если 'local', работаем с localstorage.
 * 
 * 2. почему json.parse(json.stringify(item)) при сохранении в firebase?
 * firestore падает с ошибкой, если попытаться сохранить объект, в котором 
 * есть поля со значением undefined. эта конструкция быстро очищает объект 
 * от пустых полей, превращая его в чистый json.
 */
export class ApiClient {
    async save<T extends {id: string}>(endpointKey: string, item: T): Promise<void> {
        if (appConfig.storageSystem === 'firebase') {
            // firestore не любит поля undefined, поэтому очищаем объект через JSON
            const cleanItem = JSON.parse(JSON.stringify(item));
            await setDoc(doc(db, endpointKey, item.id), cleanItem);
        } else {
            const data = await this.get<T>(endpointKey);
            const index = data.findIndex(i => i.id === item.id);
            if (index >= 0) data[index] = item;
            else data.push(item);
            localStorage.setItem(endpointKey, JSON.stringify(data));
        }
    }

    async get<T>(endpointKey: string): Promise<T[]> {
        if (appConfig.storageSystem === 'firebase') {
            const querySnapshot = await getDocs(collection(db, endpointKey));
            return querySnapshot.docs.map(doc => doc.data() as T);
        } else {
            const data = localStorage.getItem(endpointKey);
            return data ? JSON.parse(data) : [];
        }
    }

    async getById<T extends {id: string}>(endpointKey: string, id: string): Promise<T | undefined> {
        if (appConfig.storageSystem === 'firebase') {
            const docSnap = await getDoc(doc(db, endpointKey, id));
            return docSnap.exists() ? docSnap.data() as T : undefined;
        } else {
            const data = await this.get<T>(endpointKey);
            return data.find(i => i.id === id);
        }
    }

    async delete(endpointKey: string, id: string): Promise<void> {
        if (appConfig.storageSystem === 'firebase') {
            await deleteDoc(doc(db, endpointKey, id));
        } else {
            const data = await this.get<{id: string}>(endpointKey);
            const filtered = data.filter(i => i.id !== id);
            localStorage.setItem(endpointKey, JSON.stringify(filtered));
        }
    }
}