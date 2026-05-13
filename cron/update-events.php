<?php

declare(strict_types=1);

const TRIOCIO_ENTRY_URL = 'https://triocio.com/catacumbas-del-beaterio/';
const TRIOCIO_HOME_URL = 'https://triocio.com/';
const LOCAL_EVENT_IMAGE = 'img/1624829075563-1536x1149.jpg';
const MAX_EVENTS = 12;
const REQUEST_TIMEOUT = 45;

$projectRoot = dirname(__DIR__);
$dataDir = $projectRoot . DIRECTORY_SEPARATOR . 'data';
$dataFile = $dataDir . DIRECTORY_SEPARATOR . 'events.json';

libxml_use_internal_errors(true);

function normalizeWhitespace(string $value): string
{
    return trim((string) preg_replace('/\s+/u', ' ', $value));
}

function slugify(string $value): string
{
    $normalized = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value) ?: $value;
    $normalized = strtolower($normalized);
    $normalized = (string) preg_replace('/[^a-z0-9]+/', '-', $normalized);
    return trim($normalized, '-');
}

function parsePrice(string $value): string
{
    if (preg_match('/(\d+(?:[.,]\d{1,2})?)/', str_replace(' ', '', $value), $matches) === 1) {
        return str_replace(',', '.', $matches[1]);
    }

    return '';
}

function lowercaseSpanish(string $value): string
{
    return strtr(strtolower($value), [
        'Á' => 'á',
        'É' => 'é',
        'Í' => 'í',
        'Ó' => 'ó',
        'Ú' => 'ú',
        'Ñ' => 'ñ',
    ]);
}

function parseSpanishDate(string $dateText): ?string
{
    $normalized = lowercaseSpanish(normalizeWhitespace($dateText));
    $normalized = (string) preg_replace('/^(lun|mar|mi[eé]|jue|vie|s[aá]b|dom),?\s+/u', '', $normalized);

    if (preg_match('/(\d{1,2}) de ([[:alpha:]áéíóúñ]+) de (\d{4})(?:.*?(\d{1,2}):(\d{2}))?/iu', $normalized, $matches) !== 1) {
        return null;
    }

    $months = [
        'enero' => 1,
        'febrero' => 2,
        'marzo' => 3,
        'abril' => 4,
        'mayo' => 5,
        'junio' => 6,
        'julio' => 7,
        'agosto' => 8,
        'septiembre' => 9,
        'setiembre' => 9,
        'octubre' => 10,
        'noviembre' => 11,
        'diciembre' => 12,
    ];

    $day = (int) $matches[1];
    $monthName = $matches[2];
    $year = (int) $matches[3];
    $hour = isset($matches[4]) ? (int) $matches[4] : 0;
    $minute = isset($matches[5]) ? (int) $matches[5] : 0;

    if (!isset($months[$monthName])) {
        return null;
    }

    $timezone = new DateTimeZone('Europe/Madrid');
    $date = DateTimeImmutable::createFromFormat(
        'Y-n-j G:i',
        sprintf('%d-%d-%d %d:%d', $year, $months[$monthName], $day, $hour, $minute),
        $timezone
    );

    return $date ? $date->setTimezone(new DateTimeZone('UTC'))->format(DATE_ATOM) : null;
}

function formatSpanishDate(?string $isoDate): string
{
    if (!$isoDate) {
        return '';
    }

    try {
        $date = new DateTimeImmutable($isoDate, new DateTimeZone('UTC'));
        $date = $date->setTimezone(new DateTimeZone('Europe/Madrid'));
    } catch (Throwable $exception) {
        return '';
    }

    $weekdays = [
        'Mon' => 'lun',
        'Tue' => 'mar',
        'Wed' => 'mié',
        'Thu' => 'jue',
        'Fri' => 'vie',
        'Sat' => 'sáb',
        'Sun' => 'dom',
    ];
    $months = [
        'January' => 'enero',
        'February' => 'febrero',
        'March' => 'marzo',
        'April' => 'abril',
        'May' => 'mayo',
        'June' => 'junio',
        'July' => 'julio',
        'August' => 'agosto',
        'September' => 'septiembre',
        'October' => 'octubre',
        'November' => 'noviembre',
        'December' => 'diciembre',
    ];

    $weekday = $weekdays[$date->format('D')] ?? strtolower($date->format('D'));
    $month = $months[$date->format('F')] ?? strtolower($date->format('F'));

    return sprintf(
        '%s, %d de %s de %d, %s',
        $weekday,
        (int) $date->format('j'),
        $month,
        (int) $date->format('Y'),
        $date->format('H:i')
    );
}

function normalizeEventImage(string $imageUrl): string
{
    if ($imageUrl === '') {
        return LOCAL_EVENT_IMAGE;
    }

    $host = parse_url($imageUrl, PHP_URL_HOST);
    if (is_string($host) && str_contains($host, 'triocio.com')) {
        return LOCAL_EVENT_IMAGE;
    }

    return $imageUrl;
}

function fetchUrl(string $url): string
{
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'timeout' => REQUEST_TIMEOUT,
            'ignore_errors' => true,
            'header' => implode("\r\n", [
                'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0 Safari/537.36',
                'Accept-Language: es-ES,es;q=0.9,en;q=0.8',
                'Cache-Control: no-cache',
            ]),
        ],
        'ssl' => [
            'verify_peer' => true,
            'verify_peer_name' => true,
        ],
    ]);

    $contents = @file_get_contents($url, false, $context);
    if ($contents === false) {
        throw new RuntimeException('No se pudo descargar ' . $url);
    }

    return $contents;
}

function createXPathFromHtml(string $html): DOMXPath
{
    $document = new DOMDocument('1.0', 'UTF-8');
    $document->loadHTML('<?xml encoding="utf-8" ?>' . $html, LIBXML_NOWARNING | LIBXML_NOERROR);
    return new DOMXPath($document);
}

function collectEventLinks(string $url): array
{
    $html = fetchUrl($url);
    $xpath = createXPathFromHtml($html);
    $nodes = $xpath->query('//a[contains(@href, "/Acontecimiento/")]');

    if (!$nodes instanceof DOMNodeList) {
        return [];
    }

    $links = [];
    foreach ($nodes as $node) {
        if (!$node instanceof DOMElement) {
            continue;
        }

        $href = $node->getAttribute('href');
        if ($href === '') {
            continue;
        }

        $absoluteHref = str_starts_with($href, 'http') ? $href : 'https://triocio.com' . $href;
        $text = normalizeWhitespace($node->textContent);
        $context = normalizeWhitespace($node->parentNode?->textContent ?? '');

        if (!preg_match('/catacumbas del beaterio/i', $text . ' ' . $context)) {
            continue;
        }

        $links[] = $absoluteHref;
    }

    return array_values(array_unique($links));
}

function textFromXPath(DOMXPath $xpath, array $queries): string
{
    foreach ($queries as $query) {
        $nodes = $xpath->query($query);
        if (!$nodes instanceof DOMNodeList || $nodes->length === 0) {
            continue;
        }

        $value = normalizeWhitespace($nodes->item(0)?->textContent ?? '');
        if ($value !== '') {
            return $value;
        }
    }

    return '';
}

function attributeFromXPath(DOMXPath $xpath, array $queries, string $attribute): string
{
    foreach ($queries as $query) {
        $nodes = $xpath->query($query);
        if (!$nodes instanceof DOMNodeList || $nodes->length === 0) {
            continue;
        }

        $node = $nodes->item(0);
        if ($node instanceof DOMElement) {
            $value = trim($node->getAttribute($attribute));
            if ($value !== '') {
                return $value;
            }
        }
    }

    return '';
}

function extractEventFromDetail(string $url): array
{
    $html = fetchUrl($url);
    $xpath = createXPathFromHtml($html);
    $pageText = normalizeWhitespace(strip_tags($html));

    preg_match('/[[:alpha:]áéíóúñ]{3,9}\s+\d{1,2}\s+de\s+[[:alpha:]áéíóúñ]+\s+de\s+\d{4}(?:\s+\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2})?/iu', $pageText, $dateMatch);
    preg_match('/(\d+(?:[.,]\d{1,2})?\s*€)/u', $pageText, $priceMatch);
    preg_match('/\bCádiz\b|\bCadiz\b/u', $pageText, $locationMatch);

    $title = textFromXPath($xpath, [
        '//h1',
        '//*[contains(@class, "product_title")]',
        '//*[contains(@class, "entry-title")]',
        '//h2',
    ]);
    $image = attributeFromXPath($xpath, [
        '//meta[@property="og:image"]',
        '//*[contains(@class, "woocommerce-product-gallery__image")]//img',
        '//img',
    ], 'content');

    if ($image === '') {
        $image = attributeFromXPath($xpath, [
            '//*[contains(@class, "woocommerce-product-gallery__image")]//img',
            '//img',
        ], 'src');
    }

    $rawDateText = normalizeWhitespace($dateMatch[0] ?? '');
    $startsAt = parseSpanishDate($rawDateText);
    $dateText = $startsAt ? formatSpanishDate($startsAt) : $rawDateText;

    return [
        'id' => slugify(($title !== '' ? $title : 'evento') . '-' . ($dateText !== '' ? $dateText : $url)),
        'title' => $title,
        'dateText' => $dateText,
        'startsAt' => $startsAt,
        'price' => parsePrice($priceMatch[1] ?? ''),
        'location' => !empty($locationMatch) ? 'Cadiz' : '',
        'image' => normalizeEventImage($image),
        'url' => $url,
    ];
}

function readExistingSnapshot(string $dataFile): array
{
    if (!is_file($dataFile)) {
        return [
            'updatedAt' => null,
            'source' => TRIOCIO_ENTRY_URL,
            'events' => [],
        ];
    }

    $raw = file_get_contents($dataFile);
    if ($raw === false) {
        return [
            'updatedAt' => null,
            'source' => TRIOCIO_ENTRY_URL,
            'events' => [],
        ];
    }

    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [
        'updatedAt' => null,
        'source' => TRIOCIO_ENTRY_URL,
        'events' => [],
    ];
}

function saveSnapshot(string $dataDir, string $dataFile, array $snapshot): void
{
    if (!is_dir($dataDir) && !mkdir($dataDir, 0775, true) && !is_dir($dataDir)) {
        throw new RuntimeException('No se pudo crear la carpeta de datos.');
    }

    $json = json_encode($snapshot, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    if ($json === false) {
        throw new RuntimeException('No se pudo convertir el snapshot a JSON.');
    }

    if (file_put_contents($dataFile, $json . PHP_EOL, LOCK_EX) === false) {
        throw new RuntimeException('No se pudo guardar el archivo de eventos.');
    }
}

function scrapeTriocioEvents(): array
{
    $links = collectEventLinks(TRIOCIO_ENTRY_URL);
    if (count($links) === 0) {
        $links = collectEventLinks(TRIOCIO_HOME_URL);
    }

    $links = array_slice(array_values(array_unique($links)), 0, MAX_EVENTS);
    $events = [];

    foreach ($links as $url) {
        $event = extractEventFromDetail($url);
        if (($event['title'] ?? '') !== '' && ($event['url'] ?? '') !== '') {
            $events[] = $event;
        }
    }

    $events = array_values(array_filter($events, static function (array $event): bool {
        return isset($event['title']) && preg_match('/catacumbas del beaterio/i', $event['title']) === 1;
    }));

    usort($events, static function (array $left, array $right): int {
        if (empty($left['startsAt']) && empty($right['startsAt'])) {
            return strcmp((string) ($left['title'] ?? ''), (string) ($right['title'] ?? ''));
        }

        if (empty($left['startsAt'])) {
            return 1;
        }

        if (empty($right['startsAt'])) {
            return -1;
        }

        return strcmp((string) $left['startsAt'], (string) $right['startsAt']);
    });

    return [
        'updatedAt' => gmdate('c'),
        'source' => TRIOCIO_ENTRY_URL,
        'events' => $events,
    ];
}

$previousSnapshot = readExistingSnapshot($dataFile);

try {
    $snapshot = scrapeTriocioEvents();
    if (count($snapshot['events']) === 0 && !empty($previousSnapshot['events'])) {
        $snapshot = $previousSnapshot;
    } else {
        saveSnapshot($dataDir, $dataFile, $snapshot);
    }

    echo 'Eventos disponibles: ' . count($snapshot['events']) . PHP_EOL;
    echo 'Actualizado: ' . ($snapshot['updatedAt'] ?? 'sin fecha') . PHP_EOL;
    exit(0);
} catch (Throwable $exception) {
    if (!empty($previousSnapshot['events'])) {
        echo 'Fallo al actualizar Triocio. Se conserva el ultimo JSON valido.' . PHP_EOL;
        echo 'Eventos disponibles: ' . count($previousSnapshot['events']) . PHP_EOL;
        exit(0);
    }

    fwrite(STDERR, 'No se pudieron actualizar los eventos.' . PHP_EOL);
    fwrite(STDERR, $exception->getMessage() . PHP_EOL);
    exit(1);
}
