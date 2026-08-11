# Моя 100-дневка

Каждый день делает меня ближе к моей лучшей версии.

## Запуск

```bash
npm install
npm run dev
```

## Сборка

```bash
npm run build
npm run preview
```

## Сайт

http://e928145n.beget.tech/

Выгрузка на Beget: `python scripts/deploy_beget.py` (нужен `scripts/.beget_pw` или `BEGET_PASSWORD`).

## Вход (логин / пароль)

Пароль **не** попадает в клиентский код. Проверка идёт через `server/api/auth.php`, секрет — только в `.env` на сервере.

Локально скопируйте `server/.env.example` → `.env` в корне проекта и задайте `APP_LOGIN` / `APP_PASSWORD`.

На Beget после первого деплоя отредактируйте `.env` рядом с `public_html` (не внутри публичной папки, если возможно):

```
APP_LOGIN=ваш_логин
APP_PASSWORD=ваш_пароль
AUTH_MAX_ATTEMPTS=5
AUTH_LOCKOUT_SECONDS=900
```

Лимит попыток: после `AUTH_MAX_ATTEMPTS` неудач IP блокируется на `AUTH_LOCKOUT_SECONDS` секунд.
