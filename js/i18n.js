/**
 * js/i18n.js
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 国际化 (i18n) 模块 | Internationalization Module
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * 功能 | Primary Function:
 *   初始化 i18next 库，加载多语言资源文件
 *   与 main.js 配合实现动态语言切换
 *   Initialize i18next library and load language resources
 *
 * 支持语言 | Supported Languages:
 *   • ca - Catalan (加泰罗尼亚语)
 *   • es - Spanish (西班牙语)
 *   • en - English (英文)
 *
 * 资源位置 | Resource Files:
 *   • locales/ca.json - 加泰罗尼亚语翻译
 *   • locales/es.json - 西班牙语翻译
 *   • locales/en.json - 英文翻译
 *
 * 依赖 | Dependencies:
 *   • i18next (库文件在 index.html 中引入)
 *   • 全局变量 currentLang (在 main.js 中定义)
 */

/**
 * initI18n() | 初始化国际化系统
 * ─────────────────────────────────────────────────
 * 执行流程 | Execution Flow:
 *
 *   1. 定义支持的语言列表
 *      Define: ['ca', 'es', 'en']
 *
 *   2. 异步加载每个语言的 JSON 文件
 *      For each language:
 *        a. Fetch locales/{lang}.json
 *        b. Parse JSON content
 *        c. Store in resources[lang] = { translation: data }
 *        d. 若失败: 记录警告，使用空对象 {}
 *
 *   3. 初始化 i18next 实例
 *      Parameters:
 *        • lng: currentLang (当前活跃语言)
 *        • debug: false (生产环境禁用调试)
 *        • resources: 包含所有语言数据的对象
 *
 *   4. 返回 Promise 以支持 async/await
 *      Resolves when initialization completes
 *      Rejects if initialization fails
 *
 * 返回值 | Return Value:
 *   {Promise<void>}
 *   • resolve () - 初始化成功 | Success
 *   • reject (err) - 初始化失败 | Failure
 *
 * 错误处理 | Error Handling:
 *   • 单个语言文件加载失败: 使用空翻译对象 {}（不中断）
 *   • i18next 初始化失败: Promise reject (终止应用）
 *
 * 调用时机 | Called When:
 *   • 应用启动时，在 initMap() 前 (Before initMap)
 *   见于 main.js 的 init() 函数
 */
async function initI18n() {
    // ─────────────────────────────────────────────────
    // 定义支持的语言 | Define supported languages
    // ─────────────────────────────────────────────────
    
    const languages = ['ca', 'es', 'en'];
    
    /** 最终的资源对象，格式: { lang: { translation: { key: "value" } } } */
    const resources = {};

    // ─────────────────────────────────────────────────
    // 异步加载所有语言文件 | Load all language files
    // ─────────────────────────────────────────────────
    
    for (const lang of languages) {
        try {
            // 构建文件路径 | Build file path
            const resp = await fetch(`locales/${lang}.json`);
            
            // 解析 JSON 内容 | Parse JSON
            const data = await resp.json();
            
            // 按照 i18next 格式存储 | Store in i18next format
            // { translation: { ... } } 是 i18next 的标准结构
            resources[lang] = { translation: data };
            
        } catch (err) {
            // 加载失败时的容错处理 | Error handling on load failure
            console.warn(`无法加载语言文件 locales/${lang}.json | Failed to load locales/${lang}.json`, err);
            
            // 使用空翻译对象作为后备 | Use empty object as fallback
            // 这防止整个应用因为缺少一个语言文件而崩溃
            resources[lang] = { translation: {} };
        }
    }

    // ─────────────────────────────────────────────────
    // 初始化 i18next 实例 | Initialize i18next instance
    // ─────────────────────────────────────────────────
    
    return new Promise((resolve, reject) => {
        i18next.init({
            // 当前活跃语言 | Current active language
            lng: currentLang,
            
            // 禁用调试模式以减少控制台输出 | Disable debug mode for cleaner console
            debug: false,
            
            // 所有语言的翻译数据 | Translation data for all languages
            resources: resources
            
        }, (err) => {
            // 初始化完成的回调 | Initialization callback
            
            if (err) {
                // 初始化失败 | Initialization failed
                console.error('i18next 初始化失败 | i18next initialization failed', err);
                reject(err);
            } else {
                // 初始化成功 | Initialization successful
                resolve();
            }
        });
    });
}
