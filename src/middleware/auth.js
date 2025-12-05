/**
 * 認證中介軟體
 * 檢查使用者是否已登入
 */

/**
 * 確保使用者已通過認證
 * @param {Object} req - Express request 物件
 * @param {Object} res - Express response 物件
 * @param {Function} next - Express next 函數
 */
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).json({ error: '未授權，請先登入' });
}

module.exports = {
    ensureAuthenticated
};
