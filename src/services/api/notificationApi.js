/**
 * Notification API
 * 
 * API calls for notifications and alerts.
 */

import apiClient from './apiClient';

const notificationApi = {
  /**
   * Get all notifications for the authenticated user
   * @param {object} params - Query parameters
   * @param {boolean} params.unreadOnly - Only return unread notifications (default: true)
   * @returns {Promise<object>} Notifications data with unread count
   */
  async getNotifications(params = {}) {
    try {
      
      const queryParams = new URLSearchParams();
      
      // Default to unread only unless explicitly requesting all
      if (params.unreadOnly === false) {
        queryParams.append('unreadOnly', 'false');
      }
      
      const url = `/api/notifications${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await apiClient.get(url);
      
      if (response.data.status === 'success') {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  /**
   * Get unread notification count
   * @returns {Promise<number>} Unread count
   */
  async getUnreadCount() {
    try {
      
      const response = await apiClient.get('/api/notifications/unread-count');
      
      if (response.data.status === 'success') {
        return response.data.data.unreadCount;
      } else {
        throw new Error(response.data.message || 'Failed to fetch unread count');
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  },

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @returns {Promise<object>} Updated notification
   */
  async markAsRead(notificationId) {
    try {
      
      const response = await apiClient.put(`/api/notifications/${notificationId}/read`);
      
      if (response.data.status === 'success') {
        return response.data.data.notification;
      } else {
        throw new Error(response.data.message || 'Failed to mark notification as read');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  /**
   * Mark all notifications as read
   * @returns {Promise<number>} Number of notifications marked as read
   */
  async markAllAsRead() {
    try {
      
      const response = await apiClient.put('/api/notifications/mark-all-read');
      
      if (response.data.status === 'success') {
        return response.data.data.updatedCount;
      } else {
        throw new Error(response.data.message || 'Failed to mark all notifications as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  /**
   * Delete notification
   * @param {string} notificationId - Notification ID
   * @returns {Promise<void>}
   */
  async deleteNotification(notificationId) {
    try {
      
      const response = await apiClient.delete(`/api/notifications/${notificationId}`);
      
      if (response.data.status !== 'success') {
        throw new Error(response.data.message || 'Failed to delete notification');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },

  /**
   * Register (or refresh) this device's Expo push token so server-sent push
   * notifications can reach it (EPIC-006).
   * @param {string} token - Expo push token (ExponentPushToken[...])
   * @param {string} platform - 'ios' | 'android' | 'web'
   * @returns {Promise<void>}
   */
  async registerDeviceToken(token, platform) {
    try {
      const response = await apiClient.post('/api/notifications/device-tokens', { token, platform });
      if (response.data.status !== 'success') {
        throw new Error(response.data.message || 'Failed to register device token');
      }
    } catch (error) {
      console.error('Error registering device token:', error);
      throw error;
    }
  },

  /**
   * Unregister this device's push token (sign-out / permission revoked).
   * @param {string} token - Expo push token to remove
   * @returns {Promise<void>}
   */
  async unregisterDeviceToken(token) {
    try {
      // axios DELETE carries the body under `data`.
      const response = await apiClient.delete('/api/notifications/device-tokens', { data: { token } });
      if (response.data.status !== 'success') {
        throw new Error(response.data.message || 'Failed to unregister device token');
      }
    } catch (error) {
      console.error('Error unregistering device token:', error);
      throw error;
    }
  },
};

export default notificationApi;
