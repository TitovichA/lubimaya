<?php
/**
 * Auth API — пароль только из .env на сервере (не в клиенте).
 *
 * POST action=login  { login, password }
 * POST action=logout
 * GET  action=status
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function load_env(string $path): array
{
    if (!is_file($path) || !is_readable($path)) {
        return [];
    }
    $vars = [];
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }
        if (!str_contains($line, '=')) {
            continue;
        }
        [$k, $v] = explode('=', $line, 2);
        $k = trim($k);
        $v = trim($v);
        if (
            (str_starts_with($v, '"') && str_ends_with($v, '"')) ||
            (str_starts_with($v, "'") && str_ends_with($v, "'"))
        ) {
            $v = substr($v, 1, -1);
        }
        $vars[$k] = $v;
    }
    return $vars;
}

function env_path(): string
{
    // Предпочтительно вне public_html: ../.env от api/ → public_html/.env? нет:
    // api = public_html/api → ../../.env = рядом с public_html
    $candidates = [
        dirname(__DIR__, 2) . DIRECTORY_SEPARATOR . '.env', // site_root/.env
        dirname(__DIR__) . DIRECTORY_SEPARATOR . '.env',    // public_html/.env
        __DIR__ . DIRECTORY_SEPARATOR . '.env',
    ];
    foreach ($candidates as $p) {
        if (is_file($p)) {
            return $p;
        }
    }
    return $candidates[0];
}

function attempts_path(): string
{
    $dir = dirname(env_path());
    return $dir . DIRECTORY_SEPARATOR . '.auth_attempts.json';
}

function read_attempts(): array
{
    $path = attempts_path();
    if (!is_file($path)) {
        return [];
    }
    $raw = file_get_contents($path);
    $data = json_decode($raw ?: '[]', true);
    return is_array($data) ? $data : [];
}

function write_attempts(array $data): void
{
    $path = attempts_path();
    $dir = dirname($path);
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }
    file_put_contents($path, json_encode($data, JSON_UNESCAPED_UNICODE), LOCK_EX);
    @chmod($path, 0600);
}

function client_ip(): string
{
    return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

function json_out(array $payload, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

$env = load_env(env_path());
$appLogin = $env['APP_LOGIN'] ?? '';
$appPassword = $env['APP_PASSWORD'] ?? '';
$maxAttempts = max(1, (int)($env['AUTH_MAX_ATTEMPTS'] ?? 5));
$lockoutSeconds = max(60, (int)($env['AUTH_LOCKOUT_SECONDS'] ?? 900));

if ($appLogin === '' || $appPassword === '') {
    json_out([
        'ok' => false,
        'error' => 'auth_not_configured',
        'message' => 'На сервере не настроен .env (APP_LOGIN / APP_PASSWORD).',
    ], 503);
}

$secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || (($_SERVER['SERVER_PORT'] ?? null) == 443)
    || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'secure' => $secure,
    'httponly' => true,
    'samesite' => 'Lax',
]);
session_start();

$action = $_GET['action'] ?? $_POST['action'] ?? '';
if ($action === '' && $_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = 'status';
}

$body = [];
$contentType = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '';
if (str_contains($contentType, 'application/json')) {
    $raw = file_get_contents('php://input') ?: '';
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
        'login' => $authed ? ($_SESSION['login'] ?? null) : null,
    ]);
}

if ($action === 'logout') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        json_out(['ok' => false, 'error' => 'method_not_allowed'], 405);
    }
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'] ?? '', (bool)$p['secure'], (bool)$p['httponly']);
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
    $record = $attempts[$ip] ?? ['count' => 0, 'first' => $now, 'locked_until' => 0];

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

    // сброс окна, если lockout прошёл
    if (!empty($record['locked_until']) && $record['locked_until'] <= $now) {
        $record = ['count' => 0, 'first' => $now, 'locked_until' => 0];
    }

    $login = trim((string)($body['login'] ?? $_POST['login'] ?? ''));
    $password = (string)($body['password'] ?? $_POST['password'] ?? '');

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
