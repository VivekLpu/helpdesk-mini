import React from 'react';
import { Navbar as BootstrapNavbar, Nav, Container, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <BootstrapNavbar bg="dark" variant="dark" expand="lg" className="mb-4">
      <Container>
        <BootstrapNavbar.Brand as={Link} to="/">
          <i className="bi bi-headset me-2"></i>
          HelpDesk Mini
        </BootstrapNavbar.Brand>
        <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          {isAuthenticated ? (
            <Nav className="ms-auto">
              <Nav.Link as={Link} to="/dashboard">
                <i className="bi bi-speedometer2 me-1"></i>
                Dashboard
              </Nav.Link>
              <Nav.Link as={Link} to="/tickets">
                <i className="bi bi-ticket-detailed me-1"></i>
                Tickets
              </Nav.Link>
              <Nav.Link as={Link} to="/tickets/new">
                <i className="bi bi-plus-circle me-1"></i>
                New Ticket
              </Nav.Link>
              <NavDropdown title={user?.firstName} id="user-dropdown">
                <NavDropdown.Item as={Link} to="/profile">
                  <i className="bi bi-person me-2"></i>
                  Profile
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right me-2"></i>
                  Logout
                </NavDropdown.Item>
              </NavDropdown>
            </Nav>
          ) : (
            <Nav className="ms-auto">
              <Nav.Link as={Link} to="/login">
                <i className="bi bi-box-arrow-in-right me-1"></i>
                Login
              </Nav.Link>
              <Nav.Link as={Link} to="/register">
                <i className="bi bi-person-plus me-1"></i>
                Register
              </Nav.Link>
            </Nav>
          )}
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar;