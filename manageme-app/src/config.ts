/*и7 лаба - конфигурация
 * 
 * здесь реализован паттерн feature toggle (переключатель).
 * меняя 'firebase' на 'local', мы можем мгновенно переключить всё 
 * приложение обратно на локальное хранилище без переписывания логики.
 */
export const appConfig = {
    storageSystem: 'firebase' as 'local' | 'firebase' 
    // storageSystem: 'local' as 'local' | 'firebase' 
};