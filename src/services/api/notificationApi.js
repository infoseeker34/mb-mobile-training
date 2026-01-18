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
      console.log('notificationApi - getNotifications called with params:', params);
      
      const queryParams = new URLSearchParams();
      
      // Default to unread only unless explicitly requesting all
      if (params.unreadOnly === false) {
        queryParams.append('unreadOnly', 'false');
      }
      
      const url = `/api/notifications${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      console.log('notificationApi - Full URL:', url);
      
      const response = await apiClient.get(url);
      console.log('notificationApi - Response status:', response.status);
      console.log('notificationApi - Response data:', response.data);
      
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
      console.log('notificationApi - getUnreadCount called');
      
      const response = await apiClient.get('/api/notifications/unread-count');
      console.log('notificationApi - Unread count response:', response.data);
      
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
      console.log('notificationApi - markAsRead called for:', notificationId);
      
      const response = await apiClient.put(`/api/notifications/${notificationId}/read`);
      console.log('notificationApi - Mark as read response:', response.data);
      
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
      console.log('notificationApi - markAllAsRead called');
      
      const response = await apiClient.put('/api/notifications/mark-all-read');
      console.log('notificationApi - Mark all as read response:', response.data);
      
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
      console.log('notificationApi - deleteNotification called for:', notificationId);
      
      const response = await apiClient.delete(`/api/notifications/${notificationId}`);
      console.log('notificationApi - Delete response:', response.data);
      
      if (response.data.status !== 'success') {
        throw new Error(response.data.message || 'Failed to delete notification');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },
};

export default notificationApi;
