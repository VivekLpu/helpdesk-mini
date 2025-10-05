import api from './api';
import { v4 as uuidv4 } from 'uuid';

export const ticketService = {
  // Get all tickets with filters
  getTickets: async (params) => {
    try {
      const response = await api.get('/api/tickets', { params });
      return response;
    } catch (error) {
      console.error('Error in getTickets:', error);
      throw error;
    }
  },
  
  // Get single ticket
  getTicket: async (id) => {
    try {
      const response = await api.get(`/api/tickets/${id}`);
      return response;
    } catch (error) {
      console.error('Error in getTicket:', error);
      throw error;
    }
  },
  
  // Create ticket
  createTicket: async (data) => {
    try {
      const config = {
        headers: {
          'Idempotency-Key': uuidv4()
        }
      };
      const response = await api.post('/api/tickets', data, config);
      return response;
    } catch (error) {
      console.error('Error in createTicket:', error);
      throw error;
    }
  },
  
  // Update ticket
  updateTicket: async (id, data) => {
    try {
      const response = await api.patch(`/api/tickets/${id}`, data);
      return response;
    } catch (error) {
      console.error('Error in updateTicket:', error);
      throw error;
    }
  },
  
  // Add comment
  addComment: async (id, data) => {
    try {
      const response = await api.post(`/api/tickets/${id}/comments`, data);
      return response;
    } catch (error) {
      console.error('Error in addComment:', error);
      throw error;
    }
  },
  
  // Get agents
  getAgents: async () => {
    try {
      const response = await api.get('/api/users/agents');
      return response;
    } catch (error) {
      console.error('Error in getAgents:', error);
      throw error;
    }
  },
  
  // Get user profile
  getProfile: async () => {
    try {
      const response = await api.get('/api/users/profile');
      return response;
    } catch (error) {
      console.error('Error in getProfile:', error);
      throw error;
    }
  }
};