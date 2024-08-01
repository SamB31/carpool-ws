const { sequelize } = require('../config/database');

async function setupAdminJS(app) {
    const AdminJS = (await import('adminjs')).default;
    const AdminJSExpress = await import('@adminjs/express');
    const AdminJSSequelize = await import('@adminjs/sequelize');

    AdminJS.registerAdapter(AdminJSSequelize);

    const adminJs = new AdminJS({
        databases: [sequelize],
        rootPath: '/admin',
    });

    const adminRouter = AdminJSExpress.buildRouter(adminJs);
    app.use(adminJs.options.rootPath, adminRouter);
}

module.exports = setupAdminJS;