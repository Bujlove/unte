# Workflow разработки Unte

## 🌿 Структура веток

### `main` - Продакшн ветка
- ✅ **Только стабильный код**
- ✅ **Всегда работает**
- ✅ **Автоматический деплой на Vercel Production**
- ✅ **Защищена от прямых коммитов**

### `develop` - Ветка разработки
- 🔧 **Все новые функции**
- 🔧 **Эксперименты и тесты**
- 🔧 **Автоматический деплой на Vercel Preview**
- 🔧 **Можно коммитить напрямую**

### `backup-stable-v1.0.0` - Резервная копия
- 💾 **Сохраненная стабильная версия**
- 💾 **Для экстренного отката**

## 🚀 Процесс разработки

### 1. Разработка новых функций
```bash
# Переключиться на ветку разработки
git checkout develop

# Создать новую ветку для функции
git checkout -b feature/new-feature

# Разработать функцию
# ... код ...

# Закоммитить изменения
git add .
git commit -m "feat: добавить новую функцию"

# Отправить в develop
git push origin feature/new-feature
```

### 2. Тестирование на Preview
- Каждый push в `develop` автоматически создает Preview на Vercel
- URL: `https://unte-git-develop-bujlove.vercel.app`
- Тестируйте все функции перед слиянием в main

### 3. Слияние в продакшн
```bash
# Через GitHub Actions (рекомендуется)
# 1. Перейти в Actions
# 2. Выбрать "Merge to Main"
# 3. Ввести версию (например, v1.1.0)
# 4. Запустить workflow

# Или вручную через Pull Request
# 1. Создать PR: develop → main
# 2. Проверить все изменения
# 3. Слить PR
```

## 🔧 Настройка Vercel

### Production (main)
- **URL**: `https://unte.vercel.app`
- **Автоматический деплой**: при push в main
- **Environment**: Production

### Preview (develop)
- **URL**: `https://unte-git-develop-bujlove.vercel.app`
- **Автоматический деплой**: при push в develop
- **Environment**: Preview

## 📋 Чек-лист перед релизом

- [ ] Все функции протестированы на Preview
- [ ] Нет ошибок ESLint/TypeScript
- [ ] Все тесты проходят
- [ ] Документация обновлена
- [ ] Версия указана в VERSION_HISTORY.md
- [ ] Создан тег версии

## 🆘 Экстренный откат

### Быстрый откат через Vercel
1. Зайти в Vercel Dashboard
2. Выбрать проект
3. Перейти в "Deployments"
4. Найти стабильную версию
5. Нажать "Promote to Production"

### Откат через Git
```bash
# Откатиться к стабильной версии
git checkout v1.0.0

# Или к резервной ветке
git checkout backup-stable-v1.0.0

# Принудительно обновить main
git push origin v1.0.0:main --force
```

## 🏷️ Управление версиями

### Создание новой версии
```bash
# Создать тег
git tag -a v1.1.0 -m "Release v1.1.0: новые функции"

# Отправить тег
git push origin v1.1.0
```

### Просмотр истории версий
```bash
# Все теги
git tag -l

# История коммитов
git log --oneline

# Различия между версиями
git diff v1.0.0..v1.1.0
```

## 📝 Полезные команды

```bash
# Переключиться на develop
git checkout develop

# Обновить develop из main
git checkout develop
git merge main

# Создать ветку для функции
git checkout -b feature/function-name

# Посмотреть все ветки
git branch -a

# Удалить локальную ветку
git branch -d feature-name

# Удалить удаленную ветку
git push origin --delete feature-name
```
