import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Form, Row, Col, Pagination } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { format } from 'date-fns';

const TicketList = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    limit: 10,
    offset: 0,
    total: 0,
    hasMore: false
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchTickets();
  }, [filters, pagination.offset]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        limit: pagination.limit,
        offset: pagination.offset
      };

      // Add filters if they have values
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.category) params.category = filters.category;
      if (filters.search) params.q = filters.search;

      const response = await api.get('/api/tickets', { params });
      setTickets(response.data.items || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0,
        hasMore: response.data.has_more || false,
        next_offset: response.data.next_offset || null
      }));
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load tickets');
      console.error('Ticket list error:', err);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination(prev => ({ ...prev, offset: 0 }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, offset: 0 }));
    fetchTickets();
  };

  const handlePageChange = (newOffset) => {
    setPagination(prev => ({ ...prev, offset: newOffset }));
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

  const totalPages = Math.ceil(pagination.total / pagination.limit);
  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>
          <i className="bi bi-ticket-detailed me-2"></i>
          Tickets
        </h1>
        <Link to="/tickets/new" className="btn btn-primary">
          <i className="bi bi-plus-circle me-2"></i>
          New Ticket
        </Link>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <Card.Body>
          <Form onSubmit={handleSearch}>
            <Row>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Search</Form.Label>
                  <Form.Control
                    type="text"
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                    placeholder="Search tickets..."
                  />
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select name="status" value={filters.status} onChange={handleFilterChange}>
                    <option value="">All</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={2}>
                <Form.Group className="mb-3">
                  <Form.Label>Priority</Form.Label>
                  <Form.Select name="priority" value={filters.priority} onChange={handleFilterChange}>
                    <option value="">All</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Control
                    type="text"
                    name="category"
                    value={filters.category}
                    onChange={handleFilterChange}
                    placeholder="Category..."
                  />
                </Form.Group>
              </Col>
              <Col md={2} className="d-flex align-items-end">
                <Button type="submit" variant="primary" className="w-100 mb-3">
                  Search
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {/* Tickets Table */}
      <Card>
        <Card.Body>
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : tickets.length > 0 ? (
            <>
              <div className="table-responsive">
                <Table hover>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Title</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th>Category</th>
                      <th>Requester</th>
                      <th>Created</th>
                      <th>SLA</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map(ticket => (
                      <tr key={ticket._id}>
                        <td>#{ticket._id.slice(-6)}</td>
                        <td>
                          <Link to={`/tickets/${ticket._id}`}>
                            {ticket.title}
                          </Link>
                        </td>
                        <td>
                          <Badge bg={getStatusColor(ticket.status)}>
                            {ticket.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td>
                          <Badge bg={getPriorityColor(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                        </td>
                        <td>{ticket.category}</td>
                        <td>{ticket.requester?.firstName} {ticket.requester?.lastName}</td>
                        <td>{format(new Date(ticket.createdAt), 'MMM dd, yyyy')}</td>
                        <td>
                          {ticket.slaBreached ? (
                            <Badge bg="danger">Breached</Badge>
                          ) : ticket.slaDeadline ? (
                            <small className={new Date(ticket.slaDeadline) < new Date() ? 'text-danger' : 'text-muted'}>
                              {format(new Date(ticket.slaDeadline), 'MMM dd, HH:mm')}
                            </small>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td>
                          <Link to={`/tickets/${ticket._id}`} className="btn btn-sm btn-outline-primary">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <span className="text-muted">
                    Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} tickets
                  </span>
                  <Pagination>
                    <Pagination.Prev
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange((currentPage - 2) * pagination.limit)}
                    />
                    {[...Array(totalPages)].map((_, index) => (
                      <Pagination.Item
                        key={index + 1}
                        active={index + 1 === currentPage}
                        onClick={() => handlePageChange(index * pagination.limit)}
                      >
                        {index + 1}
                      </Pagination.Item>
                    ))}
                    <Pagination.Next
                      disabled={currentPage === totalPages}
                      onClick={() => handlePageChange(currentPage * pagination.limit)}
                    />
                  </Pagination>
                </div>
              )}
            </>
          ) : (
            <p className="text-muted text-center py-4">No tickets found</p>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default TicketList;