const fs = require('fs/promises');
const path = require('path');
const puppeteer = require('puppeteer');

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'events.json');
const TRI0CIO_ENTRY_URL = 'https://triocio.com/catacumbas-del-beaterio/';
const TRI0CIO_HOME_URL = 'https://triocio.com/';
const LOCAL_EVENT_IMAGE = 'img/1624829075563-1536x1149.jpg';
const MAX_EVENTS = 12;

const MONTH_INDEX = {
    enero: 0,
    febrero: 1,
    marzo: 2,
    abril: 3,
    mayo: 4,
    junio: 5,
    julio: 6,
    agosto: 7,
    septiembre: 8,
    setiembre: 8,
    octubre: 9,
    noviembre: 10,
    diciembre: 11
};

function normalizeWhitespace(value = '') {
    return value.replace(/\s+/g, ' ').trim();
}

function repairEncoding(value = '') {
    if (!/[Ãâ€]/.test(value)) {
        return value;
    }

    try {
        return Buffer.from(value, 'latin1').toString('utf8');
    } catch (error) {
        return value;
    }
}

function slugify(value = '') {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function parsePrice(value = '') {
    const normalized = value.replace(/\s/g, '');
    const match = normalized.match(/(\d+(?:[.,]\d{1,2})?)/);
    return match ? match[1].replace(',', '.') : '';
}

function parseSpanishDate(dateText = '') {
    const normalized = normalizeWhitespace(dateText)
        .toLowerCase()
        .replace(/^lun|^mar|^mi[eé]|^jue|^vie|^s[aá]b|^dom/g, (match) => match)
        .replace(/^[a-záéíóú]+ /, '');
    const match = normalized.match(/(\d{1,2}) de ([a-záéíóú]+) de (\d{4})(?:.*?(\d{1,2}):(\d{2}))?/i);

    if (!match) {
        return null;
    }

    const day = Number(match[1]);
    const month = MONTH_INDEX[match[2]];
    const year = Number(match[3]);
    const hour = match[4] ? Number(match[4]) : 0;
    const minute = match[5] ? Number(match[5]) : 0;

    if (Number.isNaN(day) || month === undefined || Number.isNaN(year)) {
        return null;
    }

    return new Date(year, month, day, hour, minute).toISOString();
}

function formatSpanishDate(isoDate = '') {
    if (!isoDate) {
        return '';
    }

    return new Intl.DateTimeFormat('es-ES', {
        weekday: 'short',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(isoDate));
}

function normalizeEventImage(imageUrl = '') {
    if (!imageUrl) {
        return LOCAL_EVENT_IMAGE;
    }

    try {
        const parsed = new URL(imageUrl);
        if (parsed.hostname.includes('triocio.com')) {
            return LOCAL_EVENT_IMAGE;
        }
        return imageUrl;
    } catch (error) {
        return LOCAL_EVENT_IMAGE;
    }
}

async function dismissConsent(page) {
    const labels = [
        'Aceptar',
        'ACEPTAR',
        'Aceptar todo',
        'Aceptar cookies',
        'Permitir todas'
    ];

    for (const label of labels) {
        try {
            const button = await page.$(`aria/${label}`);
            if (button) {
                await button.click();
                await page.waitForTimeout(500);
                return;
            }
        } catch (error) {
            // Ignore consent pop-up issues and continue scraping.
        }
    }
}

async function collectEventLinks(page, url) {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 });
    await dismissConsent(page);

    return page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a[href*="/Acontecimiento/"]'));
        return anchors
            .map((anchor) => {
                const href = anchor.href;
                const text = (anchor.textContent || '').replace(/\s+/g, ' ').trim();
                const card = anchor.closest('article, li, div, section');
                const context = (card ? card.textContent : anchor.parentElement?.textContent || '')
                    .replace(/\s+/g, ' ')
                    .trim();

                return {
                    href,
                    text,
                    context
                };
            })
            .filter((item) => /catacumbas del beaterio/i.test(`${item.text} ${item.context}`));
    });
}

async function extractEventFromDetail(page, url) {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 });
    await dismissConsent(page);

    const data = await page.evaluate(() => {
        const textFrom = (selectorList) => {
            for (const selector of selectorList) {
                const element = document.querySelector(selector);
                const value = (element?.textContent || '').replace(/\s+/g, ' ').trim();
                if (value) {
                    return value;
                }
            }

            return '';
        };

        const pageText = (document.body?.innerText || '').replace(/\s+/g, ' ').trim();
        const image = document.querySelector('meta[property="og:image"]')?.content
            || document.querySelector('.woocommerce-product-gallery__image img, img')?.src
            || '';

        return {
            title: textFrom(['h1', '.product_title', '.entry-title', 'h2']),
            subtitle: textFrom(['h2', 'h3']),
            image,
            pageText
        };
    });

    const dateMatch = data.pageText.match(/[A-ZÁÉÍÓÚÑa-záéíóúñ]{3,9}\s+\d{1,2}\s+de\s+[A-ZÁÉÍÓÚÑa-záéíóúñ]+\s+de\s+\d{4}(?:\s+\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2})?/);
    const priceMatch = data.pageText.match(/(\d+(?:[.,]\d{1,2})?\s*€)/);
    const locationMatch = data.pageText.match(/\bC[aá]diz\b|\bCádiz\b/i);

    const rawDateText = repairEncoding(normalizeWhitespace(dateMatch ? dateMatch[0] : ''));
    const parsedDate = parseSpanishDate(rawDateText);
    const dateText = parsedDate ? formatSpanishDate(parsedDate) : rawDateText;
    const title = repairEncoding(normalizeWhitespace(data.title || data.subtitle));

    return {
        id: slugify(`${title}-${dateText || url}`),
        title,
        dateText,
        startsAt: parsedDate,
        price: repairEncoding(parsePrice(priceMatch ? priceMatch[1] : '')),
        location: locationMatch ? 'Cadiz' : '',
        image: normalizeEventImage(data.image),
        url
    };
}

async function ensureDataDir() {
    await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readExistingSnapshot() {
    try {
        const raw = await fs.readFile(DATA_FILE, 'utf8');
        return JSON.parse(raw);
    } catch (error) {
        return {
            updatedAt: null,
            source: TRI0CIO_ENTRY_URL,
            events: []
        };
    }
}

async function scrapeTriocioEvents() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1440, height: 1200 });

        const entryLinks = await collectEventLinks(page, TRI0CIO_ENTRY_URL);
        const homeLinks = entryLinks.length === 0 ? await collectEventLinks(page, TRI0CIO_HOME_URL) : [];
        const uniqueUrls = [...new Set([...entryLinks, ...homeLinks].map((item) => item.href))].slice(0, MAX_EVENTS);

        const events = [];
        for (const url of uniqueUrls) {
            const event = await extractEventFromDetail(page, url);
            if (event.title && event.url) {
                events.push(event);
            }
        }

        const filteredEvents = events
            .filter((event) => /catacumbas del beaterio/i.test(event.title))
            .sort((a, b) => {
                if (!a.startsAt && !b.startsAt) return a.title.localeCompare(b.title, 'es');
                if (!a.startsAt) return 1;
                if (!b.startsAt) return -1;
                return new Date(a.startsAt) - new Date(b.startsAt);
            });

        const snapshot = {
            updatedAt: new Date().toISOString(),
            source: TRI0CIO_ENTRY_URL,
            events: filteredEvents
        };

        await ensureDataDir();
        await fs.writeFile(DATA_FILE, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
        return snapshot;
    } finally {
        await browser.close();
    }
}

async function refreshEvents() {
    const previous = await readExistingSnapshot();

    try {
        const snapshot = await scrapeTriocioEvents();
        if (snapshot.events.length === 0 && previous.events.length > 0) {
            return previous;
        }

        return snapshot;
    } catch (error) {
        if (previous.events.length > 0) {
            return previous;
        }

        throw error;
    }
}

if (require.main === module) {
    refreshEvents()
        .then((snapshot) => {
            console.log(`Eventos disponibles: ${snapshot.events.length}`);
            console.log(`Actualizado: ${snapshot.updatedAt || 'sin fecha'}`);
        })
        .catch((error) => {
            console.error('No se pudieron actualizar los eventos de Triocio.');
            console.error(error);
            process.exitCode = 1;
        });
}

module.exports = {
    DATA_FILE,
    TRI0CIO_ENTRY_URL,
    refreshEvents
};
