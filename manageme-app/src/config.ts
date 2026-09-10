/*и7 лаба - конфигурация
 * 
 * здесь реализован паттерн feature toggle (переключатель).
 * меняя 'firebase' на 'local', мы можем мгновенно переключить всё 
 * приложение обратно на локальное хранилище без переписывания логики.
 */
export const appConfig = {
    // изменить на 'local', чтобы вернуть localStorage
    storageSystem: 'firebase' as 'local' | 'firebase' 
};