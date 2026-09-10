import { test, expect } from '@playwright/test';

/*
 * шпаргалка для защиты (e2e тесты и мокинг):
 * 
 * jak my obhodim google avtorizaciju v e2e testah?
 * my ispolzuem nash feature toggle iz 7 laby (perekljuchaem na 'local').
 * v bloke test.beforeeach my vnedrjaem (mocking) naprjamuju v localstorage 
 * fejkovogo admina i razrabotchika. blagodarja etomu test srazu popadaet 
 * v interfejs prilozhenija, minuja okno logina.
 */

test.describe('manageme app e2e tests', () => {
  test.beforeEach(async ({ page }) => {
    // внедряем фейковых пользователей в браузер, чтобы пропустить экран входа
    await page.addInitScript(() => {
      const users = [
        { id: 'admin-id', name: 'Test', surname: 'Admin', email: 'admin@test.com', role: 'admin', isBlocked: false },
        { id: 'dev-id', name: 'Test', surname: 'Dev', email: 'dev@test.com', role: 'developer', isBlocked: false }
      ];
      localStorage.setItem('manageme_users', JSON.stringify(users));
      localStorage.setItem('manageme_active_user_id', 'admin-id');
    });
    
    // переходим на локальный сервер
    await page.goto('http://localhost:5173');
  });

  test('pełny cykl życia: projekt, historyjka i zadanie', async ({ page }) => {
    // 1. tworzenie projektu
    await page.fill('#project-name', 'Projekt E2E');
    await page.fill('#project-desc', 'Opis projektu do testów');
    await page.click('#submit-btn');
    await expect(page.locator('#project-list')).toContainText('Projekt E2E');

    // 2. edycja projektu
    await page.click('.edit-btn');
    await page.fill('#project-name', 'Zaktualizowany Projekt E2E');
    await page.click('#submit-btn');
    await expect(page.locator('#project-list')).toContainText('Zaktualizowany Projekt E2E');

    // otwarcie projektu
    await page.click('.select-btn');
    await expect(page.locator('#stories-section')).toBeVisible();

    // 3. tworzenie historyjki
    await page.fill('#story-name', 'Historyjka E2E');
    await page.fill('#story-desc', 'Opis historyjki');
    await page.click('#save-story-btn');
    // ищем конкретно в колонке to do
    await expect(page.locator('#col-todo')).toContainText('Historyjka E2E');

    // 4. edycja historyjki
    await page.click('.edit-story-btn');
    await page.fill('#story-name', 'Zaktualizowana Historyjka');
    await page.click('#save-story-btn');
    await expect(page.locator('#col-todo')).toContainText('Zaktualizowana Historyjka');

    // otwarcie historyjki
    await page.click('.view-tasks-btn');
    await expect(page.locator('#tasks-section')).toBeVisible();

    // 5. tworzenie zadania
    await page.fill('#task-name', 'Zadanie E2E');
    await page.fill('#task-estimated-time', '5');
    await page.click('#save-task-btn');
    await expect(page.locator('#task-col-todo')).toContainText('Zadanie E2E');

    // 6. zmiana statusu zadania (przypisanie -> status 'doing')
    await page.click('.details-task-btn');
    await page.click('#assign-user-btn'); 
    await expect(page.locator('#task-col-doing')).toContainText('Zadanie E2E');

    // zmiana statusu zadania (zrobione -> status 'done')
    await page.click('.details-task-btn');
    await page.click('#mark-done-btn');
    await expect(page.locator('#task-col-done')).toContainText('Zadanie E2E');

    // 7. usuwanie zadania
    await page.click('.delete-task-btn');
    await expect(page.locator('#task-col-done')).not.toContainText('Zadanie E2E');

    // powrót do historyjek
    await page.click('#back-to-stories-btn');

    // 8. usuwanie historyjki
    await page.click('.delete-story-btn');
    // проверяем всю секцию историй, что она оттуда исчезла
    await expect(page.locator('#stories-section')).not.toContainText('Zaktualizowana Historyjka');

    // 9. usuwanie projektu
    await page.click('.delete-btn');
    await expect(page.locator('#project-list')).not.toContainText('Zaktualizowany Projekt E2E');
  });
});