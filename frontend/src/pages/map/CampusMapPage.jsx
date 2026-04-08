import { Card, Tag, Button, Empty } from 'antd';
import { EnvironmentOutlined, InfoCircleOutlined, SearchOutlined, SafetyOutlined, BuildOutlined } from '@ant-design/icons';

const CampusMapPage = () => {
    const locations = [
        { id: 1, name: 'Main Auditorium', type: 'Academic', floors: 3, capacity: 500, active: true },
        { id: 2, name: 'Central Sports Hall', type: 'Recreation', floors: 2, capacity: 200, active: true },
        { id: 3, name: 'Engineering Lab Complex', type: 'Lab', floors: 4, capacity: 300, active: true },
        { id: 4, name: 'Student Dining Hall', type: 'Dining', floors: 1, capacity: 400, active: true },
        { id: 5, name: 'Innovation Hub', type: 'Administrative', floors: 2, capacity: 100, active: true },
    ];

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
                <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#f5a623', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
                        Campus Navigation
                    </div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Interactive Campus Map</h1>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <Button icon={<SearchOutlined />}>Explore All</Button>
                    <Button type="primary" icon={<SafetyOutlined />}>Emergency Points</Button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 24 }}>
                {/* Map Container */}
                <Card style={{
                    height: 550,
                    borderRadius: 12,
                    background: '#f0f4f8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                }}>
                    <div style={{ textAlign: 'center', color: '#8896a4' }}>
                        <EnvironmentOutlined style={{ fontSize: 64, marginBottom: 16 }} />
                        <div style={{ fontSize: 18, fontWeight: 700 }}>Map Rendering...</div>
                        <div style={{ fontSize: 13, marginTop: 4 }}>Integrating high-resolution layout</div>
                    </div>

                    {/* Mock Markers */}
                    {[
                        { top: '30%', left: '40%', name: 'Eng Lab' },
                        { top: '50%', left: '20%', name: 'Sports Hall' },
                        { top: '70%', left: '60%', name: 'Auditorium' }
                    ].map((m, i) => (
                        <div key={i} style={{
                            position: 'absolute', top: m.top, left: m.left,
                            width: 12, height: 12, borderRadius: '50%', background: '#e94560',
                            boxShadow: '0 0 10px #e9456088', cursor: 'pointer'
                        }}>
                            <div style={{
                                position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)',
                                background: '#1a1a2e', color: '#fff', padding: '2px 8px', borderRadius: 4,
                                fontSize: 10, whiteSpace: 'nowrap', fontWeight: 600
                            }}>{m.name}</div>
                        </div>
                    ))}
                </Card>

                {/* Directory Sidebar */}
                <Card title="Building Directory" style={{ borderRadius: 12 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {locations.map(loc => (
                            <div key={loc.id} style={{
                                padding: '12px', border: '1px solid #f0f0f0', borderRadius: 8,
                                transition: 'all 0.2s', cursor: 'pointer'
                            }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = '#0f3460'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = '#f0f0f0'}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                                    <div style={{ fontWeight: 700, fontSize: 13, color: '#1a1a2e' }}>{loc.name}</div>
                                    <Tag color={loc.active ? 'green' : 'orange'} style={{ fontSize: 9, padding: '0 4px', margin: 0 }}>{loc.type}</Tag>
                                </div>
                                <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#999' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><BuildOutlined /> {loc.floors} Floors</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><UserOutlined /> {loc.capacity} Max</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Divider style={{ margin: '16px 0' }} />
                    <Button block type="dashed" icon={<InfoCircleOutlined />}>Need Help Navigating?</Button>
                </Card>
            </div>
        </div>
    );
};

const Divider = ({ style }) => <div style={{ height: 1, background: '#f0f0f0', ...style }} />;
const UserOutlined = () => <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>;

export default CampusMapPage;
