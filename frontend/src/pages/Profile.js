import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Alert, Row, Col, Spinner, Modal } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../services/api';
import { FaEdit, FaSave, FaTimes, FaKey, FaUser } from 'react-icons/fa';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const { user } = useAuth();

  // Form data for profile editing
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    avatar: ''
  });

  // Password change form
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/api/users/profile');
      setProfile(response.data.user);
      setFormData({
        firstName: response.data.user.firstName,
        lastName: response.data.user.lastName,
        email: response.data.user.email,
        avatar: response.data.user.avatar || ''
      });
    } catch (err) {
      setError('Failed to load profile');
      console.error('Profile error:', err);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - reset form data
      setFormData({
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        avatar: profile.avatar || ''
      });
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await api.put('/api/users/profile', formData);
      setProfile(response.data.user);
      setIsEditing(false);
      toast.success('Profile updated successfully!');

      // Reload the page to update the navbar and other components
      window.location.reload();
    } catch (err) {
      console.error('Update profile error:', err);
      const errorMessage = err.response?.data?.error?.message || 'Failed to update profile';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSaving(true);

    try {
      await api.put('/api/users/profile/password', passwordData);
      toast.success('Password changed successfully!');
      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      console.error('Change password error:', err);
      const errorMessage = err.response?.data?.error?.message || 'Failed to change password';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
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

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1><FaUser className="me-2" />My Profile</h1>
        <div>
          <Button
            variant="outline-primary"
            className="me-2"
            onClick={() => setShowPasswordModal(true)}
          >
            <FaKey className="me-2" />
            Change Password
          </Button>
          {!isEditing ? (
            <Button variant="primary" onClick={handleEditToggle}>
              <FaEdit className="me-2" />
              Edit Profile
            </Button>
          ) : (
            <Button variant="secondary" onClick={handleEditToggle}>
              <FaTimes className="me-2" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      <Row>
        <Col lg={4} className="mb-4">
          <Card>
            <Card.Body className="text-center">
              <div
                className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                style={{ width: '120px', height: '120px', fontSize: '48px', fontWeight: 'bold' }}
              >
                {profile?.firstName?.[0]?.toUpperCase()}{profile?.lastName?.[0]?.toUpperCase()}
              </div>
              <h3>{profile?.firstName} {profile?.lastName}</h3>
              <p className="text-muted mb-2">@{profile?.username}</p>
              <span className={`badge bg-${profile?.role === 'admin' ? 'danger' : profile?.role === 'agent' ? 'warning' : 'info'} mb-3`}>
                {profile?.role?.toUpperCase()}
              </span>
              <hr />
              <div className="text-start">
                <p className="mb-2">
                  <strong>Member Since:</strong><br />
                  {new Date(profile?.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <p className="mb-0">
                  <strong>Last Login:</strong><br />
                  {profile?.lastLogin ? new Date(profile.lastLogin).toLocaleString() : 'N/A'}
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={8}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Account Information</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSaveProfile}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>First Name *</Form.Label>
                      <Form.Control
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Last Name *</Form.Label>
                      <Form.Control
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        required
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Email Address *</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    required
                  />
                  <Form.Text className="text-muted">
                    Your email address is used for login and notifications.
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Username</Form.Label>
                  <Form.Control
                    type="text"
                    value={profile?.username || ''}
                    disabled
                  />
                  <Form.Text className="text-muted">
                    Username cannot be changed.
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Role</Form.Label>
                  <Form.Control
                    type="text"
                    value={profile?.role || ''}
                    disabled
                  />
                  <Form.Text className="text-muted">
                    Role is assigned by administrators.
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Avatar URL (Optional)</Form.Label>
                  <Form.Control
                    type="text"
                    name="avatar"
                    value={formData.avatar}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="https://example.com/avatar.jpg"
                  />
                  <Form.Text className="text-muted">
                    Enter a URL to your profile picture.
                  </Form.Text>
                </Form.Group>

                {isEditing && (
                  <div className="d-flex gap-2">
                    <Button
                      variant="success"
                      type="submit"
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Spinner animation="border" size="sm" className="me-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <FaSave className="me-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={handleEditToggle}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Password Change Modal */}
      <Modal show={showPasswordModal} onHide={() => setShowPasswordModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaKey className="me-2" />
            Change Password
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleChangePassword}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Current Password *</Form.Label>
              <Form.Control
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                required
                placeholder="Enter your current password"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>New Password *</Form.Label>
              <Form.Control
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                required
                minLength={6}
                placeholder="Enter new password (min 6 characters)"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Confirm New Password *</Form.Label>
              <Form.Control
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                required
                placeholder="Confirm new password"
              />
            </Form.Group>

            <Alert variant="info" className="mb-0">
              <small>
                <strong>Password Requirements:</strong>
                <ul className="mb-0 mt-2">
                  <li>Minimum 6 characters</li>
                  <li>Make sure to remember your new password</li>
                </ul>
              </small>
            </Alert>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowPasswordModal(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={saving}
            >
              {saving ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Changing...
                </>
              ) : (
                'Change Password'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default Profile;