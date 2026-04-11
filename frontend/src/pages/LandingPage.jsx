import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Button, Row, Col, Typography, Input, message, Spin, Calendar, Badge, Avatar, Carousel, Form } from 'antd';
import {
  ArrowRightOutlined,
  LeftOutlined,
  RightOutlined,
  CalendarOutlined,
  TeamOutlined,
  BookOutlined,
  NotificationOutlined,
  CheckCircleOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  FacebookOutlined,
  TwitterOutlined,
  InstagramOutlined,
  LinkedinOutlined,
  ClockCircleOutlined,
  StarFilled,
  PlayCircleOutlined,
  PauseCircleOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

const LandingPage = () => {
  const navigate = useNavigate();
  const carouselRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [facilities, setFacilities] = useState([]);
  const [carouselImages, setCarouselImages] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [news, setNews] = useState([]);
  const [events, setEvents] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    fetchData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [facilitiesRes, carouselRes, testimonialsRes, newsRes, eventsRes] = await Promise.allSettled([
        axios.get('/api/facilities'),
        axios.get('/api/marketing/carousel'),
        axios.get('/api/marketing/testimonials'),
        axios.get('/api/marketing/news'),
        axios.get('/api/marketing/events')
      ]);

      if (facilitiesRes.status === 'fulfilled') {
        const data = facilitiesRes.value.data;
        setFacilities(Array.isArray(data) ? data.slice(0, 6) : []);
      }
      if (carouselRes.status === 'fulfilled') {
        const data = carouselRes.value.data;
        setCarouselImages(Array.isArray(data) ? data : defaultCarouselImages);
      } else {
        setCarouselImages(defaultCarouselImages);
      }
      if (testimonialsRes.status === 'fulfilled') {
        const data = testimonialsRes.value.data;
        setTestimonials(Array.isArray(data) ? data : defaultTestimonials);
      } else {
        setTestimonials(defaultTestimonials);
      }
      if (newsRes.status === 'fulfilled') {
        const data = newsRes.value.data;
        setNews(Array.isArray(data) ? data : defaultNews);
      } else {
        setNews(defaultNews);
      }
      if (eventsRes.status === 'fulfilled') {
        const data = eventsRes.value.data;
        setEvents(Array.isArray(data) ? data : defaultEvents);
      } else {
        setEvents(defaultEvents);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setCarouselImages(defaultCarouselImages);
      setTestimonials(defaultTestimonials);
      setNews(defaultNews);
      setEvents(defaultEvents);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!newsletterEmail) {
      message.warning('Please enter your email address');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newsletterEmail)) {
      message.error('Please enter a valid email address');
      return;
    }
    setSubscribing(true);
    try {
      await axios.post('/api/marketing/newsletter', { email: newsletterEmail });
      message.success('Successfully subscribed to our newsletter!');
      setNewsletterEmail('');
    } catch (error) {
      message.error('Failed to subscribe. Please try again.');
    } finally {
      setSubscribing(false);
    }
  };

  const getEventsForDate = (date) => {
    const dateStr = dayjs(date).format('YYYY-MM-DD');
    const eventsList = Array.isArray(events) ? events : [];
    return eventsList.filter(e => e.date === dateStr);
  };

  const cellRender = (date) => {
    const dateEvents = getEventsForDate(date);
    if (dateEvents.length === 0) return null;
    return (
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {dateEvents.slice(0, 2).map((event, idx) => (
          <li key={idx}>
            <Badge status={event.type === 'urgent' ? 'error' : 'success'} text={<span style={{ fontSize: 10 }}>{event.title}</span>} />
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div style={{ background: '#0a0a1a', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: 'rgba(10, 10, 26, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{
          maxWidth: 1400,
          margin: '0 auto',
          padding: '0 24px',
          height: 70,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img 
              src="/southwestern-campus-logo.png" 
              alt="Southwestern Campus Logo" 
              style={{
                height: 45,
                objectFit: 'contain'
              }}
            />
          </Link>

          <nav style={{ display: 'flex', alignItems: 'center', gap: 32 }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Button
              type="text"
              onClick={() => navigate('/login')}
              style={{ color: '#fff', fontWeight: 600 }}
            >
              Log In
            </Button>
            <Button
              type="primary"
              onClick={() => navigate('/register')}
              style={{
                background: 'linear-gradient(135deg, #f5a623, #e8920e)',
                border: 'none',
                fontWeight: 700,
                borderRadius: 8
              }}
            >
              Get Started
            </Button>
          </div>
          </nav>
        </div>
      </header>

      {/* Hero Section with Carousel */}
      <section id="home" style={{ position: 'relative', paddingTop: 70 }}>
        <Carousel
          ref={carouselRef}
          autoplay={autoPlay}
          autoplaySpeed={5000}
          effect="fade"
          beforeChange={(from, to) => setCurrentSlide(to)}
          afterChange={setCurrentSlide}
          arrows
          prevArrow={<LeftArrow />}
          nextArrow={<RightArrow />}
        >
          {carouselImages.map((slide, index) => (
            <div key={index}>
              <div style={{
                height: '85vh',
                background: `linear-gradient(rgba(10,10,26,0.7), rgba(10,10,26,0.5)), url(${slide.image}) center/cover no-repeat`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  textAlign: 'center',
                  maxWidth: 800,
                  padding: '0 24px'
                }}>
                  <Title level={1} style={{
                    color: '#fff',
                    fontSize: 'clamp(32px, 6vw, 64px)',
                    fontWeight: 800,
                    marginBottom: 16,
                    textShadow: '0 4px 20px rgba(0,0,0,0.5)'
                  }}>
                    {slide.title}
                  </Title>
                  <Paragraph style={{
                    color: 'rgba(255,255,255,0.9)',
                    fontSize: 'clamp(16px, 2vw, 20px)',
                    marginBottom: 32
                  }}>
                    {slide.subtitle}
                  </Paragraph>
                  <Button
                    type="primary"
                    size="large"
                    onClick={() => navigate(slide.ctaLink || '/register')}
                    style={{
                      background: 'linear-gradient(135deg, #f5a623, #e8920e)',
                      border: 'none',
                      height: 56,
                      paddingInline: 40,
                      fontSize: 18,
                      fontWeight: 700,
                      borderRadius: 12,
                      boxShadow: '0 8px 32px rgba(245,166,35,0.4)'
                    }}
                  >
                    {slide.ctaText || 'Get Started'} <ArrowRightOutlined />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </Carousel>

        {/* Carousel Indicators */}
        <div style={{
          position: 'absolute',
          bottom: 100,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 8,
          zIndex: 10
        }}>
          {carouselImages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => carouselRef.current?.goTo(idx)}
              style={{
                width: currentSlide === idx ? 40 : 12,
                height: 12,
                borderRadius: 6,
                border: 'none',
                background: currentSlide === idx ? '#f5a623' : 'rgba(255,255,255,0.4)',
                transition: 'all 0.3s',
                cursor: 'pointer'
              }}
            />
          ))}
        </div>

        {/* Auto-play Toggle */}
        <button
          onClick={() => setAutoPlay(!autoPlay)}
          style={{
            position: 'absolute',
            bottom: 100,
            right: 24,
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 8,
            padding: '8px 12px',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            zIndex: 10
          }}
        >
          {autoPlay ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
          {autoPlay ? 'Pause' : 'Play'}
        </button>
</section>

      {/* Workflow Section */}
      <section id="workflow" style={{ padding: '80px 24px', background: '#0a0a1a' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          {/* Section Title */}
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <Title level={2} style={{
              color: '#fff',
              fontSize: 42,
              fontWeight: 800,
              marginBottom: 12
            }}>
              Complete Campus Workflow
            </Title>
            <Paragraph style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: 16,
              maxWidth: 600,
              margin: '0 auto'
            }}>
              From registration to ticket resolution, manage everything on Smart Campus with ease
            </Paragraph>
          </div>

          {/* Main Workflow Diagram */}
          <div style={{ marginBottom: 80 }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(245,166,35,0.1), rgba(232,146,14,0.05))',
              border: '1px solid rgba(245,166,35,0.2)',
              borderRadius: 16,
              padding: 40,
              position: 'relative'
            }}>
              {/* Workflow Steps */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
                {/* Step 1: Register */}
                <div style={{ flex: 1, minWidth: 200, textAlign: 'center' }}>
                  <div style={{
                    width: 80,
                    height: 80,
                    background: 'linear-gradient(135deg, #f5a623, #e8920e)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    boxShadow: '0 8px 24px rgba(245,166,35,0.3)'
                  }}>
                    <TeamOutlined style={{ fontSize: 40, color: '#fff' }} />
                  </div>
                  <Title level={4} style={{ color: '#fff', marginBottom: 8 }}>Register</Title>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                    Create your account with university email and set up your profile
                  </Text>
                </div>

                {/* Arrow */}
                <div style={{ display: 'flex', alignItems: 'center', fontSize: 32, color: '#f5a623', fontWeight: 'bold', minWidth: 40, justifyContent: 'center' }}>→</div>

                {/* Step 2: Login */}
                <div style={{ flex: 1, minWidth: 200, textAlign: 'center' }}>
                  <div style={{
                    width: 80,
                    height: 80,
                    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    boxShadow: '0 8px 24px rgba(37,99,235,0.3)'
                  }}>
                    <MailOutlined style={{ fontSize: 40, color: '#fff' }} />
                  </div>
                  <Title level={4} style={{ color: '#fff', marginBottom: 8 }}>Login</Title>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                    Access your dashboard and personalized campus portal
                  </Text>
                </div>

                {/* Arrow */}
                <div style={{ display: 'flex', alignItems: 'center', fontSize: 32, color: '#f5a623', fontWeight: 'bold', minWidth: 40, justifyContent: 'center' }}>→</div>

                {/* Step 3: Browse & Book */}
                <div style={{ flex: 1, minWidth: 200, textAlign: 'center' }}>
                  <div style={{
                    width: 80,
                    height: 80,
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    boxShadow: '0 8px 24px rgba(16,185,129,0.3)'
                  }}>
                    <CalendarOutlined style={{ fontSize: 40, color: '#fff' }} />
                  </div>
                  <Title level={4} style={{ color: '#fff', marginBottom: 8 }}>Browse & Book</Title>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                    Explore facilities and reserve spaces in real-time
                  </Text>
                </div>
              </div>

              {/* Second Row */}
              <div style={{ marginTop: 60, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
                {/* Step 4: Create Tickets */}
                <div style={{ flex: 1, minWidth: 200, textAlign: 'center' }}>
                  <div style={{
                    width: 80,
                    height: 80,
                    background: 'linear-gradient(135deg, #ec4899, #db2777)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    boxShadow: '0 8px 24px rgba(236,72,153,0.3)'
                  }}>
                    <BookOutlined style={{ fontSize: 40, color: '#fff' }} />
                  </div>
                  <Title level={4} style={{ color: '#fff', marginBottom: 8 }}>Create Tickets</Title>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                    Report issues or request support for facilities and services
                  </Text>
                </div>

                {/* Arrow */}
                <div style={{ display: 'flex', alignItems: 'center', fontSize: 32, color: '#f5a623', fontWeight: 'bold', minWidth: 40, justifyContent: 'center' }}>→</div>

                {/* Step 5: Admin Review */}
                <div style={{ flex: 1, minWidth: 200, textAlign: 'center' }}>
                  <div style={{
                    width: 80,
                    height: 80,
                    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    boxShadow: '0 8px 24px rgba(139,92,246,0.3)'
                  }}>
                    <CheckCircleOutlined style={{ fontSize: 40, color: '#fff' }} />
                  </div>
                  <Title level={4} style={{ color: '#fff', marginBottom: 8 }}>Admin Review</Title>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                    Admins prioritize and assign tickets to appropriate teams
                  </Text>
                </div>

                {/* Arrow */}
                <div style={{ display: 'flex', alignItems: 'center', fontSize: 32, color: '#f5a623', fontWeight: 'bold', minWidth: 40, justifyContent: 'center' }}>→</div>

                {/* Step 6: Technician Action */}
                <div style={{ flex: 1, minWidth: 200, textAlign: 'center' }}>
                  <div style={{
                    width: 80,
                    height: 80,
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    boxShadow: '0 8px 24px rgba(245,158,11,0.3)'
                  }}>
                    <NotificationOutlined style={{ fontSize: 40, color: '#fff' }} />
                  </div>
                  <Title level={4} style={{ color: '#fff', marginBottom: 8 }}>Technician Work</Title>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                    Technicians resolve issues and update ticket status in real-time
                  </Text>
                </div>
              </div>

              {/* Third Row - Communication */}
              <div style={{ marginTop: 60, display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 200, textAlign: 'center' }}>
                  <div style={{
                    width: 80,
                    height: 80,
                    background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    boxShadow: '0 8px 24px rgba(6,182,212,0.3)'
                  }}>
                    <GlobalOutlined style={{ fontSize: 40, color: '#fff' }} />
                  </div>
                  <Title level={4} style={{ color: '#fff', marginBottom: 8 }}>Real-time Chat</Title>
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                    Connect with other students, technicians, and support staff instantly
                  </Text>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Cards Grid */}
          <div style={{ marginTop: 80 }}>
            <Title level={3} style={{
              color: '#fff',
              fontSize: 32,
              fontWeight: 700,
              marginBottom: 40,
              textAlign: 'center'
            }}>
              Key Features in Every Step
            </Title>
            
            <Row gutter={[24, 24]}>
              {/* Registration Features */}
              <Col xs={24} sm={12} lg={8}>
                <Card style={{
                  background: 'linear-gradient(135deg, rgba(37,99,235,0.1), rgba(29,78,216,0.05))',
                  border: '1px solid rgba(37,99,235,0.2)',
                  borderRadius: 12
                }}>
                  <div style={{ marginBottom: 16 }}>
                    <TeamOutlined style={{ fontSize: 32, color: '#2563eb', marginBottom: 12 }} />
                    <Title level={4} style={{ color: '#fff', marginBottom: 0 }}>Student Registration</Title>
                  </div>
                  <ul style={{ color: 'rgba(255,255,255,0.7)', paddingLeft: 20, lineHeight: 1.8 }}>
                    <li>University email verification</li>
                    <li>Profile setup and customization</li>
                    <li>Notification preferences</li>
                    <li>Two-factor authentication</li>
                  </ul>
                </Card>
              </Col>

              {/* Booking Features */}
              <Col xs={24} sm={12} lg={8}>
                <Card style={{
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.05))',
                  border: '1px solid rgba(16,185,129,0.2)',
                  borderRadius: 12
                }}>
                  <div style={{ marginBottom: 16 }}>
                    <CalendarOutlined style={{ fontSize: 32, color: '#10b981', marginBottom: 12 }} />
                    <Title level={4} style={{ color: '#fff', marginBottom: 0 }}>Facility Booking</Title>
                  </div>
                  <ul style={{ color: 'rgba(255,255,255,0.7)', paddingLeft: 20, lineHeight: 1.8 }}>
                    <li>Real-time availability checking</li>
                    <li>Easy time slot selection</li>
                    <li>Instant confirmation</li>
                    <li>Calendar integration</li>
                  </ul>
                </Card>
              </Col>

              {/* Ticket Management Features */}
              <Col xs={24} sm={12} lg={8}>
                <Card style={{
                  background: 'linear-gradient(135deg, rgba(236,72,153,0.1), rgba(219,39,119,0.05))',
                  border: '1px solid rgba(236,72,153,0.2)',
                  borderRadius: 12
                }}>
                  <div style={{ marginBottom: 16 }}>
                    <BookOutlined style={{ fontSize: 32, color: '#ec4899', marginBottom: 12 }} />
                    <Title level={4} style={{ color: '#fff', marginBottom: 0 }}>Ticket Management</Title>
                  </div>
                  <ul style={{ color: 'rgba(255,255,255,0.7)', paddingLeft: 20, lineHeight: 1.8 }}>
                    <li>Multiple issue categories</li>
                    <li>Priority assignment</li>
                    <li>Attachment support</li>
                    <li>Status tracking</li>
                  </ul>
                </Card>
              </Col>

              {/* Admin Dashboard */}
              <Col xs={24} sm={12} lg={8}>
                <Card style={{
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(124,58,237,0.05))',
                  border: '1px solid rgba(139,92,246,0.2)',
                  borderRadius: 12
                }}>
                  <div style={{ marginBottom: 16 }}>
                    <CheckCircleOutlined style={{ fontSize: 32, color: '#8b5cf6', marginBottom: 12 }} />
                    <Title level={4} style={{ color: '#fff', marginBottom: 0 }}>Admin Controls</Title>
                  </div>
                  <ul style={{ color: 'rgba(255,255,255,0.7)', paddingLeft: 20, lineHeight: 1.8 }}>
                    <li>Ticket prioritization</li>
                    <li>Team assignment</li>
                    <li>Performance analytics</li>
                    <li>User management</li>
                  </ul>
                </Card>
              </Col>

              {/* Technician Tools */}
              <Col xs={24} sm={12} lg={8}>
                <Card style={{
                  background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(217,119,6,0.05))',
                  border: '1px solid rgba(245,158,11,0.2)',
                  borderRadius: 12
                }}>
                  <div style={{ marginBottom: 16 }}>
                    <NotificationOutlined style={{ fontSize: 32, color: '#f59e0b', marginBottom: 12 }} />
                    <Title level={4} style={{ color: '#fff', marginBottom: 0 }}>Technician Tools</Title>
                  </div>
                  <ul style={{ color: 'rgba(255,255,255,0.7)', paddingLeft: 20, lineHeight: 1.8 }}>
                    <li>Workload assignment</li>
                    <li>Status updates</li>
                    <li>QR check-in system</li>
                    <li>Time tracking</li>
                  </ul>
                </Card>
              </Col>

              {/* Communication */}
              <Col xs={24} sm={12} lg={8}>
                <Card style={{
                  background: 'linear-gradient(135deg, rgba(6,182,212,0.1), rgba(8,145,178,0.05))',
                  border: '1px solid rgba(6,182,212,0.2)',
                  borderRadius: 12
                }}>
                  <div style={{ marginBottom: 16 }}>
                    <GlobalOutlined style={{ fontSize: 32, color: '#06b6d4', marginBottom: 12 }} />
                    <Title level={4} style={{ color: '#fff', marginBottom: 0 }}>Chat & Support</Title>
                  </div>
                  <ul style={{ color: 'rgba(255,255,255,0.7)', paddingLeft: 20, lineHeight: 1.8 }}>
                    <li>Real-time messaging</li>
                    <li>Group conversations</li>
                    <li>Direct support chat</li>
                    <li>Notification system</li>
                  </ul>
                </Card>
              </Col>
            </Row>
          </div>

          {/* CTA Section */}
          <div style={{
            marginTop: 80,
            textAlign: 'center',
            padding: '60px 40px',
            background: 'linear-gradient(135deg, rgba(245,166,35,0.15), rgba(232,146,14,0.08))',
            borderRadius: 16,
            border: '1px solid rgba(245,166,35,0.3)'
          }}>
            <Title level={2} style={{ color: '#fff', marginBottom: 16 }}>Ready to Transform Your Campus Experience?</Title>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, display: 'block', marginBottom: 32 }}>
              Join thousands of students and staff managing campus resources efficiently
            </Text>
            <Button
              type="primary"
              size="large"
              onClick={() => navigate('/register')}
              style={{
                background: 'linear-gradient(135deg, #f5a623, #e8920e)',
                border: 'none',
                height: 56,
                paddingInline: 48,
                fontSize: 16,
                fontWeight: 700,
                borderRadius: 12,
                boxShadow: '0 8px 32px rgba(245,166,35,0.4)'
              }}
            >
              Start Your Free Account Now <ArrowRightOutlined />
            </Button>
          </div>
        </div>
      </section>

      <section style={{ background: '#0a0a1a' }}>
      </section>
      </div>
    );
  };

const navLinkStyle = {
  color: 'rgba(255,255,255,0.8)',
  textDecoration: 'none',
  fontSize: 14,
  fontWeight: 500,
  transition: 'color 0.3s'
};

const LeftArrow = ({ onClick }) => (
  <button
    onClick={onClick}
    style={{
      position: 'absolute',
      left: 24,
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: 10,
      width: 48,
      height: 48,
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.1)',
      border: '1px solid rgba(255,255,255,0.2)',
      color: '#fff',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}
  >
    <LeftOutlined />
  </button>
);

const RightArrow = ({ onClick }) => (
  <button
    onClick={onClick}
    style={{
      position: 'absolute',
      right: 24,
      top: '50%',
      transform: 'translateY(-50%)',
      zIndex: 10,
      width: 48,
      height: 48,
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.1)',
      border: '1px solid rgba(255,255,255,0.2)',
      color: '#fff',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}
  >
    <RightOutlined />
  </button>
);

const defaultCarouselImages = [
  {
    image: 'https://images.unsplash.com/photo-1562774053-701939374585?w=1920&q=80',
    title: 'Welcome to Smart Campus',
    subtitle: 'Your all-in-one platform for campus facility management, booking, and collaboration.',
    ctaText: 'Get Started',
    ctaLink: '/register'
  },
  {
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80',
    title: 'Book Facilities Instantly',
    subtitle: 'Reserve study rooms, meeting spaces, and event halls with real-time availability.',
    ctaText: 'Explore Facilities',
    ctaLink: '/facilities'
  },
  {
       image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1920&q=80',
    title: 'Stay Connected',
    subtitle: 'Get instant notifications about bookings, campus events, and important announcements.',
    ctaText: 'Learn More',
    ctaLink: '/login'
  }
];

const defaultTestimonials = [
  {
    content: 'Smart Campus has made booking study rooms so much easier! I can now plan my day efficiently and never worry about finding a space.',
    name: 'Sarah Johnson',
    role: 'Computer Science Student',
    avatar: null
  },
  {
    content: 'As a faculty member, the platform has streamlined our department\'s resource booking significantly. The admin dashboard is intuitive and powerful.',
    name: 'Dr. Michael Chen',
    role: 'Professor of Engineering',
    avatar: null
  },
  {
    content: 'The QR check-in feature saved us countless hours. Our facility utilization has increased dramatically since implementing Smart Campus.',
    name: 'Emily Rodriguez',
    role: 'Campus Operations Manager',
    avatar: null
  }
];

const defaultNews = [
  {
    title: 'New Library Hours for Finals Week',
    content: 'The main library will extend its hours during finals week to 24/7 operation starting next Monday.',
    date: 'April 10, 2024'
  },
  {
    title: 'Maintenance: Sports Center Closure',
    content: 'The sports center will be closed for maintenance on April 15th. Please plan accordingly.',
    date: 'April 8, 2024'
  },
  {
    title: 'New Study Rooms Available',
    content: 'Five new group study rooms are now available for booking on the third floor.',
    date: 'April 5, 2024'
  }
];

const defaultEvents = [
  { title: 'Campus Tour', date: '2024-04-15', time: '09:00 AM', type: 'event' },
  { title: 'Workshop: Research Methods', date: '2024-04-16', time: '02:00 PM', type: 'event' },
  { title: 'Career Fair', date: '2024-04-18', time: '10:00 AM', type: 'urgent' },
  { title: 'Student Mixer', date: '2024-04-20', time: '06:00 PM', type: 'event' },
  { title: 'Library Extended Hours', date: '2024-04-22', time: '12:00 AM', type: 'event' }
];

export default LandingPage;