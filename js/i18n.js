// js/i18n.js
// i18next 初始化与语言资源加载

async function initI18n() {
    const languages = ['ca', 'es', 'en'];
    const resources = {};

    for (const lang of languages) {
        try {
            const resp = await fetch(`locales/${lang}.json`);
            const data = await resp.json();
            resources[lang] = { translation: data };
        } catch (err) {
            console.warn(`无法加载语言文件 locales/${lang}.json`, err);
            resources[lang] = { translation: {} };
        }
    }

    return new Promise((resolve, reject) => {
        i18next.init({
            lng: currentLang,
            debug: false,
            resources: resources
        }, (err) => {
            if (err) {
                console.error('i18next 初始化失败', err);
                reject(err);
            } else {
                resolve();
            }
        });
    });
}
