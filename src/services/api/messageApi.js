import apiClient from './apiClient';

export const messageApi = {
  /**
   * Get messages for a team
   */
  async getTeamMessages(teamId, limit = 50, offset = 0) {
    try {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      if (offset) params.append('offset', offset.toString());
      const queryString = params.toString();
      const endpoint = queryString 
        ? `/api/teams/${teamId}/messages?${queryString}` 
        : `/api/teams/${teamId}/messages`;
      
      const response = await apiClient.get(endpoint);
      return response.data;
    } catch (error) {
      console.error('messageApi - Error fetching team messages:', error);
      console.error('messageApi - Error response:', error.response?.data);
      throw error;
    }
  },

  /**
   * Send a message to a team
   */
  async sendTeamMessage(teamId, content, isAnnouncement = false) {
    try {
      const response = await apiClient.post(`/api/teams/${teamId}/messages`, {
        content,
        isAnnouncement
      });
      return response.data;
    } catch (error) {
      console.error('messageApi - Error sending team message:', error);
      console.error('messageApi - Error details:', error.response?.data);
      throw error;
    }
  },

  /**
   * Mark a message as read
   */
  async markMessageRead(messageId) {
    try {
      const response = await apiClient.post(`/api/messages/${messageId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  },

  /**
   * Update a message
   */
  async updateMessage(messageId, content) {
    try {
      const response = await apiClient.put(`/api/messages/${messageId}`, {
        content
      });
      return response.data;
    } catch (error) {
      console.error('Error updating message:', error);
      throw error;
    }
  },

  /**
   * Delete a message
   */
  async deleteMessage(messageId) {
    try {
      const response = await apiClient.delete(`/api/messages/${messageId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  },

  /**
   * Get unread message count
   */
  async getUnreadCount() {
    try {
      const response = await apiClient.get('/api/messages/unread/count');
      return response.data;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  }
};

export default messageApi;
