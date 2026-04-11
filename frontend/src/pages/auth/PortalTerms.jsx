import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Typography, Spin, message, Modal } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, EditOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Title, Text, Paragraph } = Typography;

const PortalTerms = () => {
  const [terms, setTerms] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTerms, setEditedTerms] = useState('');
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    fetchTerms();
    checkAdminRole();
  }, []);

  const checkAdminRole = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      setUserRole(response.data?.role);
    } catch (error) {
      console.error('Error checking role:', error);
    }
  };

  const fetchTerms = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/portal-terms');
      setTerms(response.data.terms || '');
      setEditedTerms(response.data.terms || '');
    } catch (error) {
      if (error.response?.status === 404) {
        setTerms('Welcome to Smart Campus Portal. Please read our terms and conditions.');
        setEditedTerms('Welcome to Smart Campus Portal. Please read our terms and conditions.');
      }
    } finally {
      setLoading(false);
    }
  };

  const saveTerms = async () => {
    if (!editedTerms.trim()) {
      message.error('Terms cannot be empty');
      return;
    }
    setSaving(true);
    try {
      await axios.post('/api/portal-terms', { terms: editedTerms });
      message.success('Terms updated successfully');
      setTerms(editedTerms);
      setIsEditing(false);
    } catch (error) {
      message.error('Failed to save terms');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  const isAdmin = userRole === 'ADMIN';

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f7f9fc', 
      padding: 24,
      fontFamily: "'Inter', -apple-system, sans-serif"
    }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate(-1)}
            style={{ borderRadius: 6 }}
          >
            Back
          </Button>
          {isAdmin && !isEditing && (
            <Button 
              type="primary" 
              icon={<EditOutlined />} 
              onClick={() => setIsEditing(true)}
              style={{ borderRadius: 6 }}
            >
              Edit Terms
            </Button>
          )}
        </div>

        <Card style={{ borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Title level={2} style={{ color: '#1a1a2e', marginBottom: 8 }}>
              Portal Terms of Use
            </Title>
            <Text type="secondary">Last updated: {new Date().toLocaleDateString()}</Text>
          </div>

          {isEditing ? (
            <div>
              <textarea
                value={editedTerms}
                onChange={(e) => setEditedTerms(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '400px',
                  padding: 16,
                  borderRadius: 8,
                  border: '1px solid #d9d9d9',
                  fontSize: 14,
                  fontFamily: "'Inter', -apple-system, sans-serif",
                  resize: 'vertical'
                }}
              />
              <div style={{ display: 'flex', gap: 12, marginTop: 16, justifyContent: 'flex-end' }}>
                <Button onClick={() => { setIsEditing(false); setEditedTerms(terms); }}>
                  Cancel
                </Button>
                <Button 
                  type="primary" 
                  icon={<SaveOutlined />} 
                  onClick={saveTerms}
                  loading={saving}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          ) : (
            <div style={{ lineHeight: 1.8 }}>
              <Paragraph style={{ fontSize: 15, whiteSpace: 'pre-wrap' }}>
                {terms || 'No terms and conditions have been set yet.'}
              </Paragraph>
            </div>
          )}
        </Card>

        <div style={{ textAlign: 'center', marginTop: 24, color: '#8896a4', fontSize: 13 }}>
          <Text type="secondary">© 2026 Smart Campus Univ. All rights reserved.</Text>
        </div>
      </div>
    </div>
  );
};

export default PortalTerms;
