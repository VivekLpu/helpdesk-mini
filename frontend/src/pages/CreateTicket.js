import React, { useState } from 'react';
import { Card, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ticketService } from '../services/ticketService';

const CreateTicket = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: '',
    tags: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const { title, description, priority, category, tags } = formData;

  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const ticketData = {
        title,
        description,
        priority,
        category,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      console.log('Submitting ticket data:', ticketData);

      const response = await ticketService.createTicket(ticketData);
      console.log('Ticket creation response:', response);
      
      toast.success('Ticket created successfully!');
      navigate('/tickets');
    } catch (err) {
      console.error('Ticket creation error:', err);
      console.error('Error response:', err.response?.data);
      
      // Extract detailed error message
      let errorMessage = 'Failed to create ticket';
      
      if (err.response?.data?.error) {
        if (typeof err.response.data.error === 'string') {
          errorMessage = err.response.data.error;
        } else if (err.response.data.error.message) {
          errorMessage = err.response.data.error.message;
          if (err.response.data.error?.details && Array.isArray(err.response.data.error.details)) {
            errorMessage += ': ' + err.response.data.error.details.join(', ');
          }
        } else {
          errorMessage = JSON.stringify(err.response.data.error);
        }
      } else if (err.response?.data) {
        errorMessage = JSON.stringify(err.response.data, null, 2);
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="mb-4">Create New Ticket</h1>

      <Card>
        <Card.Body>
          {error && (
            <Alert variant="danger">
              <Alert.Heading>Error</Alert.Heading>
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {error}
              </pre>
            </Alert>
          )}
          
          <Form onSubmit={onSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Title *</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={title}
                onChange={onChange}
                placeholder="Enter ticket title"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description *</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                name="description"
                value={description}
                onChange={onChange}
                placeholder="Describe your issue in detail"
                required
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Priority *</Form.Label>
                  <Form.Select name="priority" value={priority} onChange={onChange}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Category *</Form.Label>
                  <Form.Control
                    type="text"
                    name="category"
                    value={category}
                    onChange={onChange}
                    placeholder="e.g., Technical, Billing, Support"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-4">
              <Form.Label>Tags</Form.Label>
              <Form.Control
                type="text"
                name="tags"
                value={tags}
                onChange={onChange}
                placeholder="Enter tags separated by commas"
              />
              <Form.Text className="text-muted">
                Separate multiple tags with commas (e.g., bug, urgent, frontend)
              </Form.Text>
            </Form.Group>

            <div className="d-flex gap-2">
              <Button
                variant="primary"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Ticket'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate('/tickets')}
              >
                Cancel
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
};

export default CreateTicket;