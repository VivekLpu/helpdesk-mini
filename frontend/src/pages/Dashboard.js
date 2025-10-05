import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ticketService } from '../services/ticketService';
import { format } from 'date-fns';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
    breached: 0
  });
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // Only fetch data if user is authenticated
    if (isAuthenticated) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch stats
      const statsPromises = [
        ticketService.getTickets({ limit: 1 }).catch(err => {
          console.error('Error fetching total tickets:', err);
          return { data: { total: 0 } };
        }),
        ticketService.getTickets({ status: 'open', limit: 1 }).catch(err => {
          console.error('Error fetching open tickets:', err);
          return { data: { total: 0 } };
        }),
        ticketService.getTickets({ status: 'in_progress', limit: 1 }).catch(err => {
          console.error('Error fetching in-progress tickets:', err);
          return { data: { total: 0 } };
        }),
        ticketService.getTickets({ status: 'resolved', limit: 1 }).catch(err => {
          console.error('Error fetching resolved tickets:', err);
          return { data: { total: 0 } };
        }),
        ticketService.getTickets({ slaBreached: 'true', limit: 1 }).catch(err => {
          console.error('Error fetching breached tickets:', err);
          return { data: { total: 0 } };
        })
      ];

      const [
        totalRes,
        openRes,
        inProgressRes,
        resolvedRes,
        breachedRes
      ] = await Promise.all(statsPromises);

      setStats({
        total: totalRes.data.total || 0,
        open: openRes.data.total || 0,
        inProgress: inProgressRes.data.total || 0,
        resolved: resolvedRes.data.total || 0,
        breached: breachedRes.data.total || 0
      });

      // Fetch recent tickets
      try {
        const recentRes = await ticketService.getTickets({ limit: 5 });
        setRecentTickets(recentRes.data.items || []);
      } catch (err) {
        console.error('Error fetching recent tickets:', err);
        setRecentTickets([]);
      }
      
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
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

  if (!isAuthenticated) {
    return (
      <Alert variant="info">
        Please <Link to="/login">log in</Link> to view the dashboard.
      </Alert>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Dashboard</h1>
        <div>
          <span className="me-2">Welcome, {user?.firstName}!</span>
          <Badge bg={user?.role === 'admin' ? 'danger' : user?.role === 'agent' ? 'warning' : 'info'}>
            {user?.role?.toUpperCase()}
          </Badge>
        </div>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
          <Button variant="outline-danger" size="sm" className="ms-2" onClick={fetchDashboardData}>
            Retry
          </Button>
        </Alert>
      )}

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h2 className="text-primary">{stats.total}</h2>
              <p className="mb-0">Total Tickets</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h2 className="text-danger">{stats.open}</h2>
              <p className="mb-0">Open</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h2 className="text-warning">{stats.inProgress}</h2>
              <p className="mb-0">In Progress</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center">
            <Card.Body>
              <h2 className="text-success">{stats.resolved}</h2>
              <p className="mb-0">Resolved</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {stats.breached > 0 && (
        <Alert variant="danger" className="mb-4">
          <i className="bi bi-exclamation-triangle me-2"></i>
          <strong>{stats.breached}</strong> tickets have breached their SLA!
        </Alert>
      )}

      {/* Recent Tickets */}
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Recent Tickets</h5>
          <Link to="/tickets" className="btn btn-sm btn-outline-primary">
            View All
          </Link>
        </Card.Header>
        <Card.Body>
          {recentTickets.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Created</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTickets.map(ticket => (
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
                      <td>{format(new Date(ticket.createdAt), 'MMM dd, yyyy')}</td>
                      <td>
                        <Link to={`/tickets/${ticket._id}`} className="btn btn-sm btn-outline-primary">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted mb-3">No tickets found</p>
              <Link to="/tickets/new" className="btn btn-primary">
                Create Your First Ticket
              </Link>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default Dashboard;