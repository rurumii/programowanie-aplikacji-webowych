import type { Notification, Priority } from './types';
import { ApiClient } from './apiService';

// 1. записать письмо в базу (save)
// 2. отдать список писем для конкретного юзера (getForUser)

export class NotificationService {
    private api = new ApiClient();
    private readonly storageKey = 'manageme_notifications';
    
    // это нужно, чтобы интерфейс мог мгновенно реагировать на новые важные уведомления
    private onNewHighPriority: ((n: Notification) => void) | null = null;

    subscribe(callback: (n: Notification) => void) {
        this.onNewHighPriority = callback;
    }

    // создание и сохранение уведомления
    async create(title: string, message: string, priority: Priority, recipientId: string): Promise<void> {
        const newNotif: Notification = {
            id: crypto.randomUUID(),
            title,
            message,
            date: new Date().toISOString(),
            priority,
            isRead: false,
            recipientId
        };
        
        await this.api.save<Notification>(this.storageKey, newNotif);

        // если приоритет medium или high — дергаем функцию, которая покажет модалку на экране
        if ((priority === 'medium' || priority === 'high') && this.onNewHighPriority) {
            this.onNewHighPriority(newNotif);
        }
    }

    // получение уведомлений для конкретного человека
    async getForUser(userId: string): Promise<Notification[]> {
        const all = await this.api.get<Notification>(this.storageKey);
        // фильтруем по ID юзера и сортируем: самые новые сверху
        return all.filter(n => n.recipientId === userId)
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }

    // пометить как прочитанное
    async markAsRead(id: string): Promise<void> {
        const notif = await this.api.getById<Notification>(this.storageKey, id);
        if (notif) {
            notif.isRead = true;
            await this.api.save(this.storageKey, notif);
        }
    }
}