<?php
/**
 * Шаблон конфигурации серверного обработчика заявок «Твой Выбор» (Beget).
 *
 * Рабочий файл с реальными секретами размещать ВНЕ Git:
 *   1) предпочтительно выше public_html: dirname(__DIR__, 2) . '/tvoy-vibor-config.php'
 *   2) либо рядом как api/config.local.php (закрыт в .gitignore и api/.htaccess)
 *
 * По умолчанию (без рабочего файла или при mode !== 'production') обработчик
 * работает в режиме 'dry_run' и НЕ отправляет письма, Telegram и amoCRM.
 */

return array(
    'mode' => 'dry_run', // 'dry_run' | 'production'

    // Почта менеджеров
    'email_to' => '',
    'email_from' => 'no-reply@vibiraiedu.ru',

    // Telegram-бот и ID рабочей группы менеджеров
    'telegram_bot_token' => '',
    'telegram_chat_id' => '',

    // Путь к существующему файлу интеграции amoCRM на Beget (без копирования секретов в Git)
    // Например: '/home/i/italymuh/site.vibiraiedu.com/public_html/wp-content/themes/vibiraiedu/inc/amo-zayavka.php'
    'amo_zayavka_path' => '',

    // Журнал заявок (JSONL) вне public_html
    'log_file' => '',

    // Разрешённые Origin-домены для защиты от кросс-доменного спама
    'allowed_hosts' => array('vibiraiedu.ru', 'www.vibiraiedu.ru', '127.0.0.1', 'localhost'),
);
