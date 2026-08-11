<?php
/**
 * Auth API — пароль только из .env на сервере (не в клиенте).
 * Совместимо с PHP 7.4+.
 *
 * POST action=login  { login, password }
 * POST action=logout
 * GET  action=status
 */

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function auth_starts_with($haystack, $needle)
{
    return $needle === '' || strpos($haystack, $needle) === 0;
}

function auth_ends_with($haystack, $needle)
{
    if ($needle === '') {
        return true;
    }
    $len = strlen($needle);
    return $len === 0 || substr($haystack, -$len) === $needle;
}

function auth_contains($haystack, $needle)
{
    return $needle === '' || strpos($haystack, $needle) !== false;
}

function load_env($path)
{
    if (!is_file($path) || !is_readable($path)) {
        return [];
    }
    $vars = [];
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) {
        return [];
    }
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || auth_starts_with($line, '#')) {
            continue;
        }
        if (!auth_contains($line, '=')) {
            continue;
        }
        $parts = explode('=', $line, 2);
        $k = trim($parts[0]);
        $v = isset($parts[1]) ? trim($parts[1]) : '';
        if (
            (auth_starts_with($v, '"') && auth_ends_with($v, '"')) ||
            (auth_starts_with($v, "'") && auth_ends_with($v, "'"))
        ) {
            $v = substr($v, 1, -1);
        }
        $vars[$k] = $v;
    }
    return $vars;
}

function env_path()
{
    // api = public_html/api → ../../.env = рядом с public_html
    $publicHtml = dirname(__DIR__);
    $siteRoot = dirname($publicHtml);
    $candidates = [
        $siteRoot . DIRECTORY_SEPARATOR . '.env',
        $publicHtml . DIRECTORY_SEPARATOR . '.env',
        __DIR__ . DIRECTORY_SEPARATOR . '.env',
    ];
    foreach ($candidates as $p) {
        if (is_file($p)) {
            return $p;
        }
    }
    return $candidates[0];
}

function attempts_path()
{
    $dir = dirname(env_path());
    return $dir . DIRECTORY_SEPARATOR . '.auth_attempts.json';
}

function read_attempts()
{
    $path = attempts_path();
    if (!is_file($path)) {
        return [];
    }
    $raw = file_get_contents($path);
    $data = json_decode($raw ? $raw : '[]', true);
    return is_array($data) ? $data : [];
}

function write_attempts($data)
{
    $path = attempts_path();
    $dir = dirname($path);
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }
    file_put_contents($path, json_encode($data, JSON_UNESCAPED_UNICODE), LOCK_EX);
    @chmod($path, 0600);
}

function client_ip()
{
    return isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : 'unknown';
}

function json_out($payload, $code = 200)
{
    http_response_code($code);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

$env = load_env(env_path());
$appLogin = isset($env['APP_LOGIN']) ? $env['APP_LOGIN'] : '';
$appPassword = isset($env['APP_PASSWORD']) ? $env['APP_PASSWORD'] : '';
$maxAttempts = max(1, (int)(isset($env['AUTH_MAX_ATTEMPTS']) ? $env['AUTH_MAX_ATTEMPTS'] : 5));
$lockoutSeconds = max(60, (int)(isset($env['AUTH_LOCKOUT_SECONDS']) ? $env['AUTH_LOCKOUT_SECONDS'] : 900));

if ($appLogin === '' || $appPassword === '') {
    json_out([
        'ok' => false,
        'error' => 'auth_not_configured',
        'message' => 'На сервере не настроен .env (APP_LOGIN / APP_PASSWORD).',
    ], 503);
}

$secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || ((isset($_SERVER['SERVER_PORT']) ? $_SERVER['SERVER_PORT'] : null) == 443)
    || ((isset($_SERVER['HTTP_X_FORWARDED_PROTO']) ? $_SERVER['HTTP_X_FORWARDED_PROTO'] : '') === 'https');

if (PHP_VERSION_ID >= 70300) {
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => $secure,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
} else {
    session_set_cookie_params(0, '/; samesite=Lax', '', $secure, true);
}
session_start();

$action = '';
if (isset($_GET['action'])) {
    $action = $_GET['action'];
} elseif (isset($_POST['action'])) {
    $action = $_POST['action'];
}
if ($action === '' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = 'status';
}

$body = [];
$contentType = '';
if (isset($_SERVER['CONTENT_TYPE'])) {
    $contentType = $_SERVER['CONTENT_TYPE'];
} elseif (isset($_SERVER['HTTP_CONTENT_TYPE'])) {
    $contentType = $_SERVER['HTTP_CONTENT_TYPE'];
}
if (auth_contains($contentType, 'application/json')) {
    $raw = file_get_contents('php://input');
    $raw = $raw ? $raw : '';
    $decoded = json_decode($raw, true);
    if (is_array($decoded)) {
        $body = $decoded;
        if ($action === '' && isset($body['action'])) {
            $action = (string)$body['action'];
        }
    }
}

if ($action === 'status') {
    $authed = !empty($_SESSION['authed']) && ($_SESSION['authed'] === true);
    json_out([
        'ok' => true,
        'authenticated' => $authed,
        'login' => $authed ? (isset($_SESSION['login']) ? $_SESSION['login'] : null) : null,
    ]);
}

if ($action === 'logout') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        json_out(['ok' => false, 'error' => 'method_not_allowed'], 405);
    }
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        $domain = isset($p['domain']) ? $p['domain'] : '';
        setcookie(session_name(), '', time() - 42000, $p['path'], $domain, !empty($p['secure']), !empty($p['httponly']));
    }
    session_destroy();
    json_out(['ok' => true, 'authenticated' => false]);
}

if ($action === 'login') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        json_out(['ok' => false, 'error' => 'method_not_allowed'], 405);
    }

    $ip = client_ip();
    $now = time();
    $attempts = read_attempts();
    $record = isset($attempts[$ip])
        ? $attempts[$ip]
        : ['count' => 0, 'first' => $now, 'locked_until' => 0];

    if (!empty($record['locked_until']) && $record['locked_until'] > $now) {
        $retry = $record['locked_until'] - $now;
        json_out([
            'ok' => false,
            'error' => 'locked',
            'message' => 'Слишком много попыток. Попробуйте позже.',
            'retryAfter' => $retry,
            'remainingAttempts' => 0,
        ], 429);
    }

    if (!empty($record['locked_until']) && $record['locked_until'] <= $now) {
        $record = ['count' => 0, 'first' => $now, 'locked_until' => 0];
    }

    $login = trim((string)(isset($body['login']) ? $body['login'] : (isset($_POST['login']) ? $_POST['login'] : '')));
    $password = (string)(isset($body['password']) ? $body['password'] : (isset($_POST['password']) ? $_POST['password'] : ''));

    $ok = hash_equals($appLogin, $login) && hash_equals($appPassword, $password);

    if (!$ok) {
        $record['count'] = (int)$record['count'] + 1;
        $remaining = max(0, $maxAttempts - $record['count']);
        if ($record['count'] >= $maxAttempts) {
            $record['locked_until'] = $now + $lockoutSeconds;
            $remaining = 0;
        }
        $attempts[$ip] = $record;
        write_attempts($attempts);

        $payload = [
            'ok' => false,
            'error' => $record['locked_until'] > $now ? 'locked' : 'invalid_credentials',
            'message' => $record['locked_until'] > $now
                ? 'Слишком много попыток. Попробуйте позже.'
                : 'Неверный логин или пароль.',
            'remainingAttempts' => $remaining,
        ];
        if ($record['locked_until'] > $now) {
            $payload['retryAfter'] = $record['locked_until'] - $now;
            json_out($payload, 429);
        }
        json_out($payload, 401);
    }

    unset($attempts[$ip]);
    write_attempts($attempts);

    session_regenerate_id(true);
    $_SESSION['authed'] = true;
    $_SESSION['login'] = $login;
    $_SESSION['authed_at'] = $now;

    json_out([
        'ok' => true,
        'authenticated' => true,
        'login' => $login,
    ]);
}

json_out(['ok' => false, 'error' => 'unknown_action', 'message' => 'Неизвестное действие.'], 400);

