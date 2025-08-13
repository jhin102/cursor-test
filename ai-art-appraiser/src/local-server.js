require('dotenv').config();
const app = require('./app');
const database = require('./utils/database');

const PORT = process.env.PORT || 3000;

async function startLocalServer() {
    try {
        await database.connect();
        await database.init();
        app.listen(PORT, () => {
            console.log(`🚀 Local server running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Local server start failed:', error);
        process.exit(1);
    }
}

startLocalServer();

