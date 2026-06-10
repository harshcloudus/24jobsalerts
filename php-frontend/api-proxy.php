<?php
/**
 * api-proxy.php — same-origin proxy to the FastAPI backend for the CSR pages.
 * The browser calls /api-proxy.php?path=/api/jobs&... and this forwards the GET
 * to API_BASE server-side, so there are no CORS issues and the backend URL
 * stays private. Only whitelisted read endpoints are allowed.
 *
 * Routes accepted (path param):
 *   /api/jobs            (+ page,page_size,search,job_type,qualification,category,only_recent)
 *   /api/jobs/{id}
 *   /api/filters
 */
declare(strict_types=1);
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/api.php';

header('Content-Type: application/json; charset=utf-8');

$path = isset($_GET['path']) ? (string) $_GET['path'] : '';

// allow: /api/jobs, /api/jobs/{int}, /api/filters
$allowed = $path === '/api/jobs'
    || $path === '/api/filters'
    || preg_match('#^/api/jobs/\d+$#', $path) === 1;

if (!$allowed) {
    http_response_code(404);
    echo json_encode(['error' => 'Not found']);
    return;
}

// forward documented query params (drop our own "path")
$params = $_GET;
unset($params['path']);
$query = $params ? '?' . http_build_query($params) : '';

// short browser cache; backend TTL handled in api_get
$data = api_get($path . $query, 60);
if ($data === null) {
    http_response_code(502);
    echo json_encode(['error' => 'Upstream unavailable']);
    return;
}
echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
