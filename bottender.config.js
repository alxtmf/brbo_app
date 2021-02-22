module.exports = {
    session: {
        driver: 'memory',
        stores: {
            memory: {
                maxSize: 500,
            }
        },
    },
    initialState: {},
    channels: {
        telegram: {
            enabled: true,
            path: '/webhooks/telegram',
            accessToken: process.env.TELEGRAM_ACCESS_TOKEN,
        },
        viber: {
            enabled: true,
            path: '/webhooks/viber',
            accessToken: process.env.VIBER_ACCESS_TOKEN,
            sender: {
                name: 'broker bot',
            },
        },
    },
};

