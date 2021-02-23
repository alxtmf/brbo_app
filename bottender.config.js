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
        telegram_1: {
            enabled: true,
            path: '/webhooks/telegramBOT_1',
            accessToken: process.env.TELEGRAM_ACCESS_TOKEN1,
        },
        telegram_2: {
            enabled: true,
            path: '/webhooks/telegramBOT_3',
            accessToken: process.env.TELEGRAM_ACCESS_TOKEN2,
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

