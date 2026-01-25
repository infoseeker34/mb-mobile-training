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
  async pollMessages(since, teamIds = [], orgIds = []) {
    try {
      const params = new URLSearchParams();
      params.append('since', since);
      if (teamIds.length > 0) {
        params.append('teamIds', teamIds.join(','));
      }
      if (orgIds.length > 0) {
        params.append('orgIds', orgIds.join(','));
      }
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
  },

  /**
   * Send an organization message
   */
  async sendOrgMessage(orgId, content, isAnnouncement = false) {
    try {
      const response = await apiClient.post(`/api/organizations/${orgId}/messages`, {
        content,
        isAnnouncement
      });
      return response.data;
    } catch (error) {
      console.error('Error sending org message:', error);
      throw error;
    }
  },

  /**
   * Get organization messages
   */
  async getOrgMessages(orgId, limit = 50, offset = 0) {
    try {
      const response = await apiClient.get(`/api/organizations/${orgId}/messages?limit=${limit}&offset=${offset}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching org messages:', error);
      throw error;
    }
  },

  /**
   * Send a direct message
   */
  async sendDirectMessage(recipientId, content) {
    try {
      const response = await apiClient.post(`/api/direct/${recipientId}/messages`, {
        content
      });
      return response.data;
    } catch (error) {
      console.error('Error sending direct message:', error);
      throw error;
    }
  },

  /**
   * Get direct messages with a specific user
   */
  async getDirectMessages(recipientId, limit = 50, offset = 0) {
    try {
      const response = await apiClient.get(`/api/direct/${recipientId}/messages?limit=${limit}&offset=${offset}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching direct messages:', error);
      throw error;
    }
  },

  /**
   * Get available recipients for direct messages
   */
  async getAvailableRecipients() {
    try {
      const response = await apiClient.get('/api/direct/recipients');
      return response.data;
    } catch (error) {
      // Don't log 404 errors - expected for users without teams/orgs
      if (!error.response || error.response.status !== 404) {
        console.error('messageApi - Error fetching recipients:', error);
      }
      throw error;
    }
  },

  /**
   * Get all conversations for the user
   */
  async getConversations() {
    try {
      const response = await apiClient.get('/api/conversations');
      return response.data;
    } catch (error) {
      console.error('messageApi - Error fetching conversations:', error);
      throw error;
    }
  },

  /**
   * Get messages for a specific conversation
   */
  async getConversationMessages(contextType, contextId, limit = 50, offset = 0) {
    try {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      if (offset) params.append('offset', offset.toString());
      const queryString = params.toString();
      const endpoint = queryString 
        ? `/api/conversations/${contextType}/${contextId}/messages?${queryString}` 
        : `/api/conversations/${contextType}/${contextId}/messages`;
      
      const response = await apiClient.get(endpoint);
      return response.data;
    } catch (error) {
      console.error('messageApi - Error fetching conversation messages:', error);
      throw error;
    }
  },

  /**
   * Get pending invitations for current user
   */
  async getPendingInvitations() {
    try {
      const response = await apiClient.get('/api/invitations/pending');
      return response.data;
    } catch (error) {
      console.error('messageApi - Error fetching pending invitations:', error);
      throw error;
    }
  },

  /**
   * Accept an invitation
   */
  async acceptInvitation(token) {
    try {
      const response = await apiClient.post(`/api/invitations/${token}/accept`);
      return response.data;
    } catch (error) {
      console.error('messageApi - Error accepting invitation:', error);
      throw error;
    }
  },

  /**
   * Decline an invitation
   */
  async declineInvitation(token) {
    try {
      const response = await apiClient.post(`/api/invitations/${token}/decline`);
      return response.data;
    } catch (error) {
      console.error('messageApi - Error declining invitation:', error);
      throw error;
    }
  },
};

export default messageApi;
