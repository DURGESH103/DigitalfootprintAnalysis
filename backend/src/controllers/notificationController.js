const Notification = require('../models/Notification');
const { success } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.findByUser(req.user.id);
  const unread = await Notification.unreadCount(req.user.id);
  return success(res, { notifications, unread });
});

const markRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (id === 'all') {
    await Notification.markAllRead(req.user.id);
  } else {
    await Notification.markRead(req.user.id, parseInt(id));
  }
  return success(res, {}, 'Marked as read');
});

module.exports = { getNotifications, markRead };
