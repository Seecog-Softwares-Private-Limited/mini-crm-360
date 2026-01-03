// src/controllers/unifiedTemplates.controller.js
// Unified Templates Controller - Combines Email and WhatsApp Templates

export const renderUnifiedTemplatesPage = async (req, res, next) => {
    try {
        const user = {
            firstName: req.user.firstName || '',
            lastName: req.user.lastName || '',
            avatar: req.user.avatar || req.user.avatarUrl || null,
            plan: req.user.plan || null,
        };
        res.render('unifiedTemplates', {
            user,
            title: 'Templates',
            activePage: 'templates',
        });
    } catch (err) {
        next(err);
    }
};


