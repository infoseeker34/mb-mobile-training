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
  },

  /**
   * Poll for new messages since a given timestamp
   */
  async pollMessages(since, teamIds) {
    try {
      const params = new URLSearchParams();
      params.append('since', since);
      params.append('teamIds', teamIds.join(','));
      const response = await apiClient.get(`/api/messages/poll?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error polling messages:', error);
      throw error;
    }
  },

  /**
   * Create a reply to a message
   */
  async createReply(messageId, content) {
    try {
      const response = await apiClient.post(`/api/messages/${messageId}/replies`, {
        content
      });
      return response.data;
    } catch (error) {
      console.error('Error creating reply:', error);
      throw error;
    }
  },

  /**
   * Get replies for a message
   */
  async getReplies(messageId) {
    try {
      const response = await apiClient.get(`/api/messages/${messageId}/replies`);
      return response.data;
    } catch (error) {
      console.error('Error fetching replies:', error);
      throw error;
    }
  }
};

export default messageApi;
