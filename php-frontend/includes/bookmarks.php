<?php
/**
 * bookmarks.php — server-side read of the SAME cookie the Next.js frontend uses
 * (doc §5.3 gotcha): `saved_job_ids`, a JSON array of integer ids, path=/,
 * 30-day max-age. PHP only READS it for server rendering; add/remove toggling
 * is done client-side in assets/js/bookmarks.js so the cookie format stays
 * byte-identical and interoperable with the Next frontend on the same domain.
 */

declare(strict_types=1);

require_once __DIR__ . '/config.php';

/** Read saved job ids from the cookie. Returns int[] (deduped, numeric only). */
function saved_job_ids(): array
{
    $raw = $_COOKIE[BOOKMARK_COOKIE] ?? '';
    if ($raw === '') {
        return [];
    }
    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        return [];
    }
    $ids = [];
    foreach ($decoded as $v) {
        if (is_int($v) || (is_string($v) && preg_match('/^\d+$/', $v)) || is_float($v)) {
            $ids[(int) $v] = true;
        }
    }
    return array_keys($ids);
}

function is_bookmarked(int $id): bool
{
    return in_array($id, saved_job_ids(), true);
}
