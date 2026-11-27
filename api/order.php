<?php
/**
 * Серверный обработчик заявок «Твой Выбор» (vibiraiedu.ru) для Beget (PHP 7.4+).
 *
 * Поддерживаемые сценарии (поле type):
 *   - order          : обычный заказ рациона (5/7/14/30 дней Сургут; 8/14/30 Нефтеюганск)
 *   - trial          : пробные 2 дня -15% (цена по справочнику, подтверждается менеджером в 1С)
 *   - certificate    : подарочный сертификат
 *   - business_quote : запрос КП для партнёров и бизнеса (request_type=business_quote)
 *   - callback       : обратная связь / вопрос по питанию и доставке
 *
 * Каналы доставки в режиме production (из внешнего конфига вне Git):
 *   1) почта mail() (UTF-8, отдельная тема «Запрос КП с сайта» для business_quote)
 *   2) Telegram Bot API (HTML, экранирование всех полей)
 *   3) amoCRM через существующий amo-zayavka.php (tv_amo_zayavka('zakaz'|'perezvon'))
 *   4) журнал JSONL
 */

error_reporting(E_ERROR);
header('Content-Type: application/json; charset=UTF-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store, no-cache, must-revalidate');

function tv_json_response($statusCode, $payload)
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    tv_json_response(405, array(
        'ok' => false,
        'error' => 'Метод не поддерживается. Используйте POST.',
    ));
}

function tv_load_config()
{
    $defaults = array(
        'mode' => 'dry_run',
        'email_to' => '',
        'email_from' => 'no-reply@vibiraiedu.ru',
        'telegram_bot_token' => '',
        'telegram_chat_id' => '',
        'amo_zayavka_path' => '',
        'log_file' => '',
        'allowed_hosts' => array('vibiraiedu.ru', 'www.vibiraiedu.ru', '127.0.0.1', 'localhost'),
    );

    $candidates = array(
        dirname(__DIR__, 2) . '/tvoy-vibor-config.php',
        __DIR__ . '/config.local.php',
    );

    foreach ($candidates as $path) {
        if (is_file($path) && is_readable($path)) {
            $loaded = include $path;
            if (is_array($loaded)) {
                return array_merge($defaults, $loaded);
            }
        }
    }

    return $defaults;
}

function tv_read_input()
{
    $contentType = isset($_SERVER['CONTENT_TYPE']) ? strtolower($_SERVER['CONTENT_TYPE']) : '';
    if (strpos($contentType, 'application/json') !== false) {
        $raw = file_get_contents('php://input');
        if (is_string($raw) && $raw !== '') {
            $decoded = json_decode($raw, true);
            if (is_array($decoded)) {
                return $decoded;
            }
        }
        return array();
    }
    return $_POST;
}

function tv_str($arr, $key, $maxLen = 300)
{
    if (!isset($arr[$key]) || !is_scalar($arr[$key])) {
        return '';
    }
    $val = trim((string) $arr[$key]);
    $val = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $val);
    if (!is_string($val)) {
        $val = '';
    }
    if (function_exists('mb_substr')) {
        return mb_substr($val, 0, $maxLen, 'UTF-8');
    }
    return substr($val, 0, $maxLen);
}

function tv_normalize_phone($raw)
{
    $digits = preg_replace('/\D+/', '', $raw);
    if (strlen($digits) === 10 && $digits[0] === '9') {
        $digits = '7' . $digits;
    } elseif (strlen($digits) === 11 && $digits[0] === '8') {
        $digits = '7' . substr($digits, 1);
    }
    if (strlen($digits) !== 11 || $digits[0] !== '7') {
        return array('valid' => false, 'digits' => $digits, 'formatted' => $raw);
    }
    $formatted = sprintf(
        '+7 (%s) %s-%s-%s',
        substr($digits, 1, 3),
        substr($digits, 4, 3),
        substr($digits, 7, 2),
        substr($digits, 9, 2)
    );
    return array('valid' => true, 'digits' => $digits, 'formatted' => $formatted);
}

function tv_money($amount)
{
    return number_format((int) $amount, 0, '.', ' ') . ' ₽';
}

function tv_plural($n, $one, $few, $many)
{
    $m10 = $n % 10;
    $m100 = $n % 100;
    if ($m10 === 1 && $m100 !== 11) {
        return $one;
    }
    if ($m10 >= 2 && $m10 <= 4 && ($m100 < 10 || $m100 >= 20)) {
        return $few;
    }
    return $many;
}

function tv_day_label($days)
{
    return $days . ' ' . tv_plural($days, 'день', 'дня', 'дней');
}

function tv_programs()
{
    return array(
        900  => array('name' => 'Экспресс фигуры',  'wp_name' => 'Экспресс фигура',   'kcal_label' => '900 ккал',   'meals' => 5),
        1200 => array('name' => 'Не хочу готовить', 'wp_name' => '3 разовое питание', 'kcal_label' => '1 200 ккал', 'meals' => 3),
        1400 => array('name' => 'Коррекция фигуры', 'wp_name' => 'Коррекция фигуры',  'kcal_label' => '1 400 ккал', 'meals' => 5),
        1800 => array('name' => 'Будь в форме',     'wp_name' => 'Будь в форме',      'kcal_label' => '1 800 ккал', 'meals' => 5),
        2200 => array('name' => 'Всегда в форме',   'wp_name' => 'Всегда в форме',    'kcal_label' => '2 200 ккал', 'meals' => 5),
        3000 => array('name' => 'Набор массы',      'wp_name' => 'Масса',             'kcal_label' => '3 000 ккал', 'meals' => 5),
    );
}

function tv_tariffs()
{
    return array(
        'Сургут' => array(
            900 => array(
                2  => array('price' => 2295,  'trial' => true),
                5  => array('price' => 6500,  'old' => 6750,  'discount' => 4),
                7  => array('price' => 9000,  'old' => 9450,  'discount' => 5),
                14 => array('price' => 17550, 'old' => 18900, 'discount' => 7, 'gift' => 2),
                30 => array('price' => 37300, 'old' => 40500, 'discount' => 8),
            ),
            1200 => array(
                2  => array('price' => 2125,  'trial' => true),
                5  => array('price' => 6000,  'old' => 6250,  'discount' => 4),
                7  => array('price' => 8350,  'old' => 8750,  'discount' => 5),
                14 => array('price' => 16300, 'old' => 17500, 'discount' => 7, 'gift' => 2),
                30 => array('price' => 34500, 'old' => 37500, 'discount' => 8),
            ),
            1400 => array(
                2  => array('price' => 2465,  'trial' => true),
                5  => array('price' => 6750,  'old' => 7000,  'discount' => 4),
                7  => array('price' => 9300,  'old' => 9800,  'discount' => 5),
                14 => array('price' => 18300, 'old' => 19600, 'discount' => 7, 'gift' => 2),
                30 => array('price' => 38650, 'old' => 42000, 'discount' => 8),
            ),
            1800 => array(
                2  => array('price' => 2720,  'trial' => true),
                5  => array('price' => 7000,  'old' => 7250,  'discount' => 4),
                7  => array('price' => 9650,  'old' => 10150, 'discount' => 5),
                14 => array('price' => 18900, 'old' => 20300, 'discount' => 7),
                30 => array('price' => 40000, 'old' => 43500, 'discount' => 8, 'gift' => 6),
            ),
            2200 => array(
                2  => array('price' => 3060,  'trial' => true),
                5  => array('price' => 7450,  'old' => 7750,  'discount' => 4),
                7  => array('price' => 10300, 'old' => 10850, 'discount' => 5),
                14 => array('price' => 20200, 'old' => 21700, 'discount' => 7),
                30 => array('price' => 42800, 'old' => 46500, 'discount' => 8, 'gift' => 6),
            ),
            3000 => array(
                2  => array('price' => 3400,  'trial' => true),
                5  => array('price' => 8900,  'old' => 9250,  'discount' => 4),
                7  => array('price' => 12300, 'old' => 12950, 'discount' => 5),
                14 => array('price' => 24100, 'old' => 25900, 'discount' => 7),
                30 => array('price' => 51000, 'old' => 55500, 'discount' => 8),
            ),
        ),
        'Нефтеюганск' => array(
            900 => array(
                2  => array('price' => 2465,  'trial' => true),
                8  => array('price' => 10750, 'old' => 11200, 'discount' => 5),
                14 => array('price' => 18300, 'old' => 19600, 'discount' => 7, 'gift' => 2),
                30 => array('price' => 38650, 'old' => 42000, 'discount' => 8),
            ),
            1200 => array(
                2  => array('price' => 2295,  'trial' => true),
                8  => array('price' => 10000, 'old' => 10400, 'discount' => 5),
                14 => array('price' => 17000, 'old' => 18200, 'discount' => 7, 'gift' => 2),
                30 => array('price' => 35900, 'old' => 39000, 'discount' => 8),
            ),
            1400 => array(
                2  => array('price' => 2635,  'trial' => true),
                8  => array('price' => 11200, 'old' => 11600, 'discount' => 5),
                14 => array('price' => 18900, 'old' => 20300, 'discount' => 7, 'gift' => 2),
                30 => array('price' => 40000, 'old' => 43500, 'discount' => 8, 'gift' => 6),
            ),
            1800 => array(
                2  => array('price' => 2890,  'trial' => true),
                8  => array('price' => 11900, 'old' => 12400, 'discount' => 5),
                14 => array('price' => 20200, 'old' => 21700, 'discount' => 7),
                30 => array('price' => 42800, 'old' => 46500, 'discount' => 8),
            ),
            2200 => array(
                2  => array('price' => 3230,  'trial' => true),
                8  => array('price' => 12300, 'old' => 12800, 'discount' => 5),
                14 => array('price' => 20900, 'old' => 22400, 'discount' => 7),
                30 => array('price' => 44150, 'old' => 48000, 'discount' => 8),
            ),
            3000 => array(
                2  => array('price' => 3655,  'trial' => true),
                8  => array('price' => 14600, 'old' => 15200, 'discount' => 5),
                14 => array('price' => 24700, 'old' => 26600, 'discount' => 7),
                30 => array('price' => 52400, 'old' => 57000, 'discount' => 8),
            ),
        ),
    );
}

function tv_guard_rate_and_dedup($ip, $phoneDigits, $type)
{
    $dir = rtrim(sys_get_temp_dir(), '/\\') . '/tv_order_guards';
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }

    $now = time();

    // Антидубль по телефону + типу заявки (60 секунд)
    $dupFile = $dir . '/dup_' . md5($phoneDigits . '|' . $type) . '.txt';
    if (is_file($dupFile)) {
        $last = (int) @file_get_contents($dupFile);
        if ($last > 0 && ($now - $last) < 60) {
            return 'duplicate';
        }
    }

    // Ограничение частоты по IP (не более 10 заявок за 10 минут)
    $ipFile = $dir . '/ip_' . md5($ip) . '.json';
    $stamps = array();
    if (is_file($ipFile)) {
        $decoded = json_decode((string) @file_get_contents($ipFile), true);
        if (is_array($decoded)) {
            foreach ($decoded as $ts) {
                if (is_int($ts) && ($now - $ts) < 600) {
                    $stamps[] = $ts;
                }
            }
        }
    }
    if (count($stamps) >= 10) {
        return 'rate_limit';
    }

    $stamps[] = $now;
    @file_put_contents($ipFile, json_encode($stamps), LOCK_EX);
    @file_put_contents($dupFile, (string) $now, LOCK_EX);
    return 'ok';
}

function tv_append_log($logFile, $entry)
{
    if (!is_string($logFile) || $logFile === '') {
        return;
    }
    $dir = dirname($logFile);
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }
    $line = json_encode($entry, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n";
    @file_put_contents($logFile, $line, FILE_APPEND | LOCK_EX);
}

$config = tv_load_config();
$input = tv_read_input();

// Проверка Origin / Referer, если заголовок передан
$originHeader = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
if ($originHeader !== '' && !empty($config['allowed_hosts'])) {
    $originHost = strtolower((string) parse_url($originHeader, PHP_URL_HOST));
    if ($originHost !== '' && !in_array($originHost, $config['allowed_hosts'], true)) {
        tv_json_response(403, array(
            'ok' => false,
            'error' => 'Запрос с недопустимого источника.',
        ));
    }
}

// Honeypot-ловушка для ботов: тихо возвращаем успех без отправки
$honeypot = tv_str($input, 'website', 100);
if ($honeypot !== '') {
    tv_json_response(200, array(
        'ok' => true,
        'orderId' => 'TV-' . date('YmdHis'),
        'message' => 'Заявка принята. Менеджер свяжется с вами в рабочее время с 9:00 до 23:00.',
    ));
}

// Проверка минимального времени заполнения формы (защита от мгновенных ботов)
$startedAt = isset($input['form_started_at']) ? (int) $input['form_started_at'] : 0;
if ($startedAt > 0) {
    $elapsedMs = (int) round(microtime(true) * 1000) - $startedAt;
    if ($elapsedMs >= 0 && $elapsedMs < 1500) {
        tv_json_response(429, array(
            'ok' => false,
            'error' => 'Подождите пару секунд и отправьте форму еще раз.',
        ));
    }
}

$rawType = tv_str($input, 'type', 32);
$requestType = tv_str($input, 'request_type', 32);
if ($requestType === 'business_quote') {
    $rawType = 'business_quote';
}
$allowedTypes = array('order', 'trial', 'certificate', 'business_quote', 'callback');
if (!in_array($rawType, $allowedTypes, true)) {
    tv_json_response(422, array(
        'ok' => false,
        'error' => 'Неизвестный тип заявки.',
        'fields' => array('type' => 'Недопустимый тип заявки'),
    ));
}

$city = tv_str($input, 'city', 40);
$name = tv_str($input, 'name', 120);
$phoneRaw = tv_str($input, 'phone', 40);
$contactMethod = tv_str($input, 'contact_method', 32);
$address = tv_str($input, 'address', 240);
$promocode = tv_str($input, 'promocode', 64);
$comment = tv_str($input, 'comment', 400);
$consentRaw = isset($input['consent']) ? $input['consent'] : false;
$consent = ($consentRaw === true || $consentRaw === 'true' || $consentRaw === '1' || $consentRaw === 1 || $consentRaw === 'on');

$allowedCities = array('Сургут', 'Нефтеюганск');
$allowedContacts = array('Telegram', 'MAX', 'Max', 'Звонок', '');

$fieldErrors = array();

if (!in_array($city, $allowedCities, true)) {
    $fieldErrors['city'] = 'Выберите Сургут или Нефтеюганск';
}
if (mb_strlen($name, 'UTF-8') < 2) {
    $fieldErrors['name'] = 'Укажите ваше имя';
}
$phoneInfo = tv_normalize_phone($phoneRaw);
if (!$phoneInfo['valid']) {
    $fieldErrors['phone'] = 'Укажите корректный российский номер телефона';
}
if (!in_array($contactMethod, $allowedContacts, true)) {
    $contactMethod = 'Звонок';
}
if ($contactMethod === '') {
    $contactMethod = 'Звонок';
}
if (!$consent) {
    $fieldErrors['consent'] = 'Нужно согласие на обработку персональных данных';
}

$isOrderFlow = ($rawType === 'order' || $rawType === 'trial');
$programInfo = null;
$tariffInfo = null;
$kcal = 0;
$days = 0;

if ($isOrderFlow) {
    if (mb_strlen($address, 'UTF-8') < 5) {
        $fieldErrors['address'] = 'Укажите адрес доставки';
    }
    $kcal = isset($input['kcal']) ? (int) $input['kcal'] : 0;
    $days = isset($input['days']) ? (int) $input['days'] : 0;
    $programs = tv_programs();
    $tariffs = tv_tariffs();

    if (!isset($programs[$kcal])) {
        $fieldErrors['kcal'] = 'Выберите программу питания';
    } elseif (!isset($tariffs[$city][$kcal][$days])) {
        $fieldErrors['days'] = 'Недопустимая длительность для выбранного города';
    } else {
        $programInfo = $programs[$kcal];
        $tariffInfo = $tariffs[$city][$kcal][$days];
        if (!empty($tariffInfo['trial'])) {
            $rawType = 'trial';
        } elseif ($rawType === 'trial') {
            $fieldErrors['days'] = 'Пробный заказ доступен только на 2 дня';
        }
    }
}

if (!empty($fieldErrors)) {
    tv_json_response(422, array(
        'ok' => false,
        'error' => 'Проверьте заполнение отмеченных полей.',
        'fields' => $fieldErrors,
    ));
}

$ip = isset($_SERVER['REMOTE_ADDR']) ? (string) $_SERVER['REMOTE_ADDR'] : '0.0.0.0';
$guard = tv_guard_rate_and_dedup($ip, $phoneInfo['digits'], $rawType);
if ($guard === 'duplicate') {
    tv_json_response(429, array(
        'ok' => false,
        'error' => 'Эта заявка уже отправлена. Подождите минуту или позвоните 8 (902) 690-91-92.',
    ));
}
if ($guard === 'rate_limit') {
    tv_json_response(429, array(
        'ok' => false,
        'error' => 'Слишком много запросов. Попробуйте через несколько минут или напишите в мессенджер.',
    ));
}

// Собираем UTM-метки и источник
$utm = array();
foreach (array('utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'yclid', 'gclid', 'source_url') as $k) {
    $v = tv_str($input, $k, 200);
    if ($v !== '') {
        $utm[$k] = $v;
    }
}

$orderId = 'TV-' . date('Ymd-His') . '-' . substr(md5($phoneInfo['digits'] . microtime(true)), 0, 4);
$dateStr = date('Y-m-d H:i:s');
$phonePlain = str_replace(array('(', ')'), '', $phoneInfo['formatted']);

// Сборка данных под формат писем, Telegram и amoCRM (совместимость с действующим WordPress)
$mailLines = array();
$tgPairs = array();
$subject = 'Оформление заказа с сайта vibiraiedu.ru';
$amoFormType = 'perezvon';
$summaryText = '';
$daysText = '';
$priceText = '';
$programWpName = '';

if ($isOrderFlow) {
    $amoFormType = 'zakaz';
    $programWpName = $programInfo['wp_name'];
    $isTrial = ($rawType === 'trial');
    $giftSuffix = !empty($tariffInfo['gift']) ? ' (+' . tv_day_label((int) $tariffInfo['gift']) . ' в подарок)' : '';
    $daysText = $isTrial
        ? '2 дня (пробный заказ, цена после проверки в 1С)'
        : tv_day_label($days) . $giftSuffix;
    $priceText = tv_money($tariffInfo['price']);
    $summaryText = sprintf(
        '%s, %s (%s), %s, %s',
        $city,
        $programInfo['name'],
        $programInfo['kcal_label'],
        $isTrial ? 'Пробные 2 дня -15%' : tv_day_label($days) . $giftSuffix,
        $priceText
    );

    $tgPairs = array(
        'Номер заявки:' => $orderId,
        'Имя:' => $name,
        'Телефон:' => $phonePlain,
        'Способ связи:' => $contactMethod,
        'Город:' => $city,
        'Адрес:' => $address,
        'Дата:' => $dateStr,
        'Программа:' => $programInfo['name'] . ' (' . $programInfo['kcal_label'] . ')',
        'Количество дней:' => $daysText,
        'Итоговая сумма:' => $priceText,
    );
    if ($promocode !== '') {
        $tgPairs[$isTrial ? 'Промокод клиента:' : 'Промокод:'] = $promocode;
    }
} else {
    $amoFormType = 'perezvon';
    if ($rawType === 'business_quote') {
        $subject = 'Запрос КП с сайта';
        $tgPairs['Тема:'] = 'Запрос коммерческого предложения';
        $summaryText = $city . ', Запрос коммерческого предложения';
    } elseif ($rawType === 'certificate') {
        $subject = 'Подарочный сертификат с сайта vibiraiedu.ru';
        $tgPairs['Тема:'] = 'Подарочный сертификат';
        $summaryText = $city . ', Подарочный сертификат';
    } else {
        $subject = 'Обратная связь с сайта vibiraiedu.ru';
        $tgPairs['Тема:'] = 'Обратная связь / вопрос';
        $summaryText = $city . ', Обратная связь';
    }

    $tgPairs['Номер заявки:'] = $orderId;
    $tgPairs['Имя:'] = $name;
    $tgPairs['Телефон:'] = $phonePlain;
    $tgPairs['Способ связи:'] = $contactMethod;
    $tgPairs['Город:'] = $city;
    if ($comment !== '') {
        $tgPairs['Комментарий:'] = $comment;
    }
    $tgPairs['Дата:'] = $dateStr;
}

foreach ($tgPairs as $label => $value) {
    $mailLines[] = $label . ' ' . $value;
}
if (!empty($utm)) {
    $mailLines[] = 'Источник: ' . json_encode($utm, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}
$mailBody = implode("\r\n", $mailLines);

$tgLines = array();
foreach ($tgPairs as $label => $value) {
    $tgLines[] = '<b>' . htmlspecialchars($label, ENT_QUOTES, 'UTF-8') . '</b> ' . htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}
$tgText = implode("\n", $tgLines);

$isProd = ($config['mode'] === 'production');
$delivery = array(
    'mode' => $isProd ? 'production' : 'dry_run',
    'email' => 'skipped',
    'telegram' => 'skipped',
    'amocrm' => 'skipped',
);

if ($isProd) {
    // 1. Почта
    if ($config['email_to'] !== '') {
        $safeFrom = preg_replace('/[\r\n]+/', '', $config['email_from']);
        $encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
        $headers = "MIME-Version: 1.0\r\n"
            . "Content-Type: text/plain; charset=UTF-8\r\n"
            . "From: {$safeFrom}\r\n";
        $mailOk = @mail($config['email_to'], $encodedSubject, $mailBody, $headers);
        $delivery['email'] = $mailOk ? 'sent' : 'error';
    }

    // 2. Telegram
    if ($config['telegram_bot_token'] !== '' && $config['telegram_chat_id'] !== '' && function_exists('curl_init')) {
        $curl = curl_init();
        curl_setopt($curl, CURLOPT_URL, 'https://api.telegram.org/bot' . $config['telegram_bot_token'] . '/sendMessage');
        curl_setopt($curl, CURLOPT_POST, true);
        curl_setopt($curl, CURLOPT_CONNECTTIMEOUT, 5);
        curl_setopt($curl, CURLOPT_TIMEOUT, 10);
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_POSTFIELDS, array(
            'chat_id' => $config['telegram_chat_id'],
            'text' => $tgText,
            'parse_mode' => 'HTML',
        ));
        $tgResp = curl_exec($curl);
        $tgHttp = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
        curl_close($curl);
        $delivery['telegram'] = ($tgResp !== false && $tgHttp >= 200 && $tgHttp < 300) ? 'sent' : 'error';
    }

    // 3. amoCRM (используем существующий amo-zayavka.php на Beget, сбой не влияет на ответ клиенту)
    $amoPath = $config['amo_zayavka_path'];
    if (is_string($amoPath) && $amoPath !== '' && is_file($amoPath)) {
        $_POST['Name'] = $name;
        $_POST['Phone'] = $phonePlain;
        $_POST['sp'] = $contactMethod;
        $_POST['PromoCode'] = ($rawType === 'trial') ? '' : $promocode;
        $_POST['city'] = $city;
        $_POST['Address'] = $address;
        $_POST['programm'] = $programWpName;
        $_POST['days'] = $daysText;
        $_POST['sum'] = $isOrderFlow ? (string) $tariffInfo['price'] : '';
        $_POST['vs'] = $comment;
        try {
            include_once $amoPath;
            if (function_exists('tv_amo_zayavka')) {
                tv_amo_zayavka($amoFormType);
                $delivery['amocrm'] = 'called';
            }
        } catch (Exception $e) {
            $delivery['amocrm'] = 'error';
        } catch (Throwable $e) {
            $delivery['amocrm'] = 'error';
        }
    }

    // Если оба основных канала (почта и Telegram) настроены и оба упали — сообщить клиенту об ошибке
    if ($delivery['email'] === 'error' && $delivery['telegram'] === 'error') {
        tv_append_log($config['log_file'], array(
            'ts' => $dateStr,
            'orderId' => $orderId,
            'type' => $rawType,
            'city' => $city,
            'status' => 'delivery_failed',
            'delivery' => $delivery,
        ));
        tv_json_response(502, array(
            'ok' => false,
            'error' => 'Не удалось передать заявку. Попробуйте еще раз или напишите нам в Telegram / WhatsApp / MAX.',
        ));
    }
}

tv_append_log($config['log_file'], array(
    'ts' => $dateStr,
    'orderId' => $orderId,
    'type' => $rawType,
    'city' => $city,
    'summary' => $summaryText,
    'delivery' => $delivery,
    'utm' => $utm,
));

$userMessage = $isOrderFlow
    ? 'Заявка на заказ принята. Менеджер свяжется с вами в течение 60 минут (ежедневно с 9:00 до 23:00).'
    : 'Запрос принят. Менеджер свяжется с вами в рабочее время с 9:00 до 23:00.';

tv_json_response(200, array(
    'ok' => true,
    'mode' => $delivery['mode'],
    'orderId' => $orderId,
    'type' => $rawType,
    'summary' => $summaryText,
    'price' => $isOrderFlow ? $tariffInfo['price'] : null,
    'message' => $userMessage,
));
