import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Badge, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../services/api';
import { format } from 'date-fns';

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comment, setComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [agents, setAgents] = useState([]);

  useEffect(() => {
    fetchTicket();
    if (user?.role === 'agent' || user?.role === 'admin') {
      fetchAgents();
    }
  }, [id]);

  const fetchTicket = async () => {
    try {
      setError(null);
      const response = await api.get(`/api/tickets/${id}`);
      setTicket(response.data.ticket);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load ticket');
      console.error('Ticket detail error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await api.get('/api/users/agents');
      setAgents(response.data.agents || []);
    } catch (err) {
      console.error('Failed to fetch agents:', err);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      await api.patch(`/api/tickets/${id}`, {
        status: newStatus,
        version: ticket.version
      });

      toast.success('Status updated successfully!');
      fetchTicket();
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error('Ticket was modified by another user. Please refresh.');
      } else {
        toast.error(err.response?.data?.error?.message || 'Failed to update status');
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAssigneeUpdate = async (assigneeId) => {
    try {
      await api.patch(`/api/tickets/${id}`, {
        assignee: assigneeId || null,
        version: ticket.version
      });

      toast.success('Ticket assigned successfully!');
      fetchTicket();
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error('Ticket was modified by another user. Please refresh.');
      } else {
        toast.error(err.response?.data?.error?.message || 'Failed to assign ticket');
      }
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setSubmittingComment(true);
    try {
      await api.post(`/api/tickets/${id}/comments`, {
        content: comment,
        isInternal
      });

      toast.success('Comment added successfully!');
      setComment('');
      setIsInternal(false);
      fetchTicket();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'success',
      medium: 'info',
      high: 'warning',
      urgent: 'danger'
    };
    return colors[priority] || 'secondary';
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'danger',
      in_progress: 'warning',
      resolved: 'success',
      closed: 'secondary'
    };
    return colors[status] || 'secondary';
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <Alert variant="danger">
        {error || 'Ticket not found'}
      </Alert>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Ticket #{ticket._id.slice(-6)}</h1>
        <Button variant="outline-secondary" onClick={() => navigate('/tickets')}>
          <i className="bi bi-arrow-left me-2"></i>
          Back to Tickets
        </Button>
      </div>

      <Row>
        <Col md={8}>
          {/* Ticket Details */}
          <Card className="mb-4">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">{ticket.title}</h5>
                <div>
                  <Badge bg={getStatusColor(ticket.status)} className="me-2">
                    {ticket.status.replace('_', ' ')}
                  </Badge>
                  <Badge bg={getPriorityColor(ticket.priority)}>
                    {ticket.priority}
                  </Badge>
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              <p className="mb-3">{ticket.description}</p>
              
              <div className="row text-muted">
                <div className="col-md-6">
                  <small><strong>Category:</strong> {ticket.category}</small>
                </div>
                <div className="col-md-6">
                  <small><strong>Created:</strong> {format(new Date(ticket.createdAt), 'MMM dd, yyyy HH:mm')}</small>
                </div>
                {ticket.resolvedAt && (
                  <div className="col-md-6 mt-2">
                    <small><strong>Resolved:</strong> {format(new Date(ticket.resolvedAt), 'MMM dd, yyyy HH:mm')}</small>
                  </div>
                )}
                {ticket.slaDeadline && (
                  <div className="col-md-6 mt-2">
                    <small>
                      <strong>SLA Deadline:</strong>{' '}
                      <span className={ticket.slaBreached ? 'text-danger' : ''}>
                        {format(new Date(ticket.slaDeadline), 'MMM dd, yyyy HH:mm')}
                        {ticket.slaBreached && ' (BREACHED)'}
                      </span>
                    </small>
                  </div>
                )}
              </div>

              {ticket.tags && ticket.tags.length > 0 && (
                <div className="mt-3">
                  {ticket.tags.map((tag, index) => (
                    <Badge key={index} bg="light" text="dark" className="me-1">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Comments */}
          <Card>
            <Card.Header>
              <h5 className="mb-0">Comments ({ticket.comments.length})</h5>
            </Card.Header>
            <Card.Body>
              {/* Add Comment Form */}
              {(user.role === 'agent' || user.role === 'admin' || ticket.requester._id === user._id) && (
                <Form onSubmit={handleCommentSubmit} className="mb-4">
                  <Form.Group>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add a comment..."
                    />
                  </Form.Group>
                  {(user.role === 'agent' || user.role === 'admin') && (
                    <Form.Check
                      type="checkbox"
                      label="Internal comment (only visible to agents)"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="mt-2"
                    />
                  )}
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="mt-2"
                    disabled={submittingComment || !comment.trim()}
                  >
                    {submittingComment ? 'Adding...' : 'Add Comment'}
                  </Button>
                </Form>
              )}

              {/* Comments List */}
              {ticket.comments.length > 0 ? (
                <div className="comments-list">
                  {ticket.comments.map((comment, index) => (
                    <div key={index} className="border-bottom pb-3 mb-3">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <strong>{comment.author?.firstName || 'Unknown'} {comment.author?.lastName || 'User'}</strong>
                          {comment.isInternal && (
                            <Badge bg="warning" className="ms-2">Internal</Badge>
                          )}
                          <br />
                          <small className="text-muted">
                            {format(new Date(comment.createdAt), 'MMM dd, yyyy HH:mm')}
                          </small>
                        </div>
                      </div>
                      <p className="mt-2 mb-0">{comment.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">No comments yet</p>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          {/* Actions */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Actions</h5>
            </Card.Header>
            <Card.Body>
              {/* Status Update */}
              {(user.role === 'agent' || user.role === 'admin') && (
                <div className="mb-3">
                  <label className="form-label">Update Status</label>
                  <div className="d-grid gap-2">
                    {ticket.status !== 'open' && (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleStatusUpdate('open')}
                        disabled={updatingStatus}
                      >
                        Reopen
                      </Button>
                    )}
                    {ticket.status === 'open' && (
                      <Button
                        variant="outline-warning"
                        size="sm"
                        onClick={() => handleStatusUpdate('in_progress')}
                        disabled={updatingStatus}
                      >
                        Start Progress
                      </Button>
                    )}
                    {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                      <Button
                        variant="outline-success"
                        size="sm"
                        onClick={() => handleStatusUpdate('resolved')}
                        disabled={updatingStatus}
                      >
                        Mark Resolved
                      </Button>
                    )}
                    {ticket.status !== 'closed' && (
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => handleStatusUpdate('closed')}
                        disabled={updatingStatus}
                      >
                        Close Ticket
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Assignee */}
              {(user.role === 'agent' || user.role === 'admin') && (
                <div className="mb-3">
                  <label className="form-label">Assign To</label>
                  <Form.Select
                    value={ticket.assignee?._id || ''}
                    onChange={(e) => handleAssigneeUpdate(e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {agents.map(agent => (
                      <option key={agent._id} value={agent._id}>
                        {agent.firstName || 'Unknown'} {agent.lastName || 'User'}
                      </option>
                    ))}
                  </Form.Select>
                </div>
              )}

              {/* Requester can close their own resolved tickets */}
              {user.role === 'user' && ticket.requester._id === user._id && ticket.status === 'resolved' && (
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="w-100"
                  onClick={() => handleStatusUpdate('closed')}
                  disabled={updatingStatus}
                >
                  Close Ticket
                </Button>
              )}
            </Card.Body>
          </Card>

          {/* People */}
          <Card>
            <Card.Header>
              <h5 className="mb-0">People</h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <label className="form-label">Requester</label>
                <div className="d-flex align-items-center">
                  <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: '40px', height: '40px' }}>
                    {ticket.requester?.firstName?.[0] || 'U'}{ticket.requester?.lastName?.[0] || 'U'}
                  </div>
                  <div>
                    <div className="fw-bold">
                      {ticket.requester?.firstName || 'Unknown'} {ticket.requester?.lastName || 'User'}
                    </div>
                    <small className="text-muted">{ticket.requester?.email || 'No email'}</small>
                  </div>
                </div>
              </div>

              {ticket.assignee && (
                <div>
                  <label className="form-label">Assignee</label>
                  <div className="d-flex align-items-center">
                    <div className="bg-success text-white rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: '40px', height: '40px' }}>
                      {ticket.assignee?.firstName?.[0] || 'A'}{ticket.assignee?.lastName?.[0] || 'A'}
                    </div>
                    <div>
                      <div className="fw-bold">
                        {ticket.assignee?.firstName || 'Unknown'} {ticket.assignee?.lastName || 'User'}
                      </div>
                      <small className="text-muted">{ticket.assignee?.email || 'No email'}</small>
                    </div>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default TicketDetail;