const express = require('express');
const path = require('path');
const cron = require('node-cron');
const { DATA_FILE, refreshEvents } = require('./triocio-scraper');

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const CRON_EXPRESSION = process.env.EVENTS_CRON || '0 */6 * * *';

app.use(express.static(__dirname));

app.get('/api/events', async (_req, res) => {
    try {
        res.sendFile(DATA_FILE);
    } catch (error) {
        res.status(500).json({
            updatedAt: null,
            source: '',
            events: [],
            error: 'No se pudo leer el archivo de eventos.'
        });
    }
});

app.post('/api/events/refresh', async (_req, res) => {
    try {
        const snapshot = await refreshEvents();
        res.json(snapshot);
    } catch (error) {
        res.status(500).json({
            error: 'No se pudieron refrescar los eventos.'
        });
    }
});

app.get('/', (_req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

async function boot() {
    try {
        const snapshot = await refreshEvents();
        console.log(`Eventos cargados al iniciar: ${snapshot.events.length}`);
    } catch (error) {
        console.error('No se pudieron obtener los eventos al iniciar.');
        console.error(error);
    }

    cron.schedule(CRON_EXPRESSION, async () => {
        console.log(`[cron] Refrescando eventos: ${new Date().toISOString()}`);

        try {
            const snapshot = await refreshEvents();
            console.log(`[cron] Eventos disponibles: ${snapshot.events.length}`);
        } catch (error) {
            console.error('[cron] Error al refrescar eventos');
            console.error(error);
        }
    });

    app.listen(PORT, () => {
        console.log(`Servidor disponible en http://localhost:${PORT}`);
        console.log(`Cron de eventos activo: ${CRON_EXPRESSION}`);
    });
}

boot();
