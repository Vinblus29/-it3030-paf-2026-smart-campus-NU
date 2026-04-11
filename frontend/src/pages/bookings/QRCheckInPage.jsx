import { useState, useEffect, useRef } from 'react';
import { Card, Button, message, Space, Result, Spin, Typography, Divider } from 'antd';
import { ScanOutlined, ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import bookingService from '../../services/bookingService';

const { Title, Text } = Typography;

const QRCheckInPage = () => {
  const navigate = useNavigate();
  const [scannedResult, setScannedResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, scanning, success, error
  const statusRef = useRef(status);
  statusRef.current = status;

  const handleCheckIn = async (token) => {
    try {
      setLoading(true);
      // Bug #7 Fix: Use token-based check-in (UUID) instead of ID-based for security
      const data = await bookingService.checkInByToken(token);
      setBookingData(data);
      setStatus('success');
      message.success('Check-in successful!');
    } catch (error) {
      console.error('Check-in error:', error);
      setStatus('error');
      message.error(error.response?.data?.message || 'Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setScannedResult(null);
    setBookingData(null);
    setStatus('scanning');
  };

  const onScanSuccess = async (decodedText) => {
    if (statusRef.current !== 'scanning') return;
    
    if (decodedText.startsWith('CHECKIN:')) {
      const token = decodedText.split(':')[1];
      setStatus('processing');
      await handleCheckIn(token);
    } else {
      message.error('Invalid QR code format');
    }
  };

  const onScanFailure = (error) => {
    // console.warn(`Code scan error = ${error}`);
  };

  useEffect(() => {
    let scanner = null;

    if (status === 'scanning') {
      scanner = new Html5QrcodeScanner('reader', {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      });

      scanner.render(onScanSuccess, onScanFailure);
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(err => console.error('Failed to clear scanner', err));
      }
    };
  }, [status]);

  const startScanning = () => {
    setStatus('scanning');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(-1)}
          type="text"
        />
        <Title level={3} style={{ margin: 0 }}>QR Check-in Portal</Title>
      </div>

      <Card className="shadow-lg border-0 overflow-hidden rounded-2xl">
        {status === 'idle' && (
          <Result
            icon={<ScanOutlined className="text-blue-500 text-6xl" />}
            title="Ready to scan"
            subTitle="Click the button below to start the camera and scan a booking QR code."
            extra={
              <Button type="primary" size="large" onClick={startScanning} icon={<ScanOutlined />}>
                Start Scanner
              </Button>
            }
          />
        )}

        {status === 'scanning' && (
          <div className="p-4 text-center">
            <div id="reader" className="overflow-hidden rounded-xl border-2 border-blue-50"></div>
            <div className="mt-6 flex justify-center">
              <Button onClick={() => setStatus('idle')} danger ghost>
                Cancel Scanning
              </Button>
            </div>
            <p className="mt-4 text-gray-500">Center the QR code in the scanning box</p>
          </div>
        )}

        {status === 'processing' && (
          <div className="py-20 text-center space-y-4">
            <Spin size="large" />
            <p className="text-lg text-blue-600 font-medium animate-pulse">Processing Check-in...</p>
          </div>
        )}

        {status === 'success' && bookingData && (
          <Result
            status="success"
            title="Check-in Successful"
            subTitle={`Booking #${bookingData.id} for ${bookingData.userName} has been verified.`}
            extra={[
              <Button type="primary" key="next" onClick={resetScanner}>
                Scan Next
              </Button>,
              <Button key="dashboard" onClick={() => navigate('/bookings')}>
                Back to Bookings
              </Button>,
            ]}
          >
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-left">
              <Title level={5}>Booking Details</Title>
              <Divider className="my-3" />
              <div className="grid grid-cols-2 gap-y-4">
                <div>
                  <Text type="secondary" className="block text-xs uppercase font-bold">Facility</Text>
                  <Text strong className="text-lg">{bookingData.facilityName}</Text>
                </div>
                <div>
                  <Text type="secondary" className="block text-xs uppercase font-bold">Scheduled Time</Text>
                  <Text>{new Date(bookingData.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(bookingData.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
                </div>
                <div>
                  <Text type="secondary" className="block text-xs uppercase font-bold">Attendee(s)</Text>
                  <Text>{bookingData.numberOfPeople || 1} Person(s)</Text>
                </div>
                <div>
                  <Text type="secondary" className="block text-xs uppercase font-bold">Verified At</Text>
                  <Text className="text-green-600 font-medium">{new Date().toLocaleTimeString()}</Text>
                </div>
              </div>
            </div>
          </Result>
        )}

        {status === 'error' && (
          <Result
            status="error"
            title="Check-in Failed"
            subTitle="The QR code could not be verified or the booking is invalid for check-in."
            extra={[
              <Button type="primary" key="retry" onClick={resetScanner}>
                Try Again
              </Button>,
              <Button key="close" onClick={() => setStatus('idle')}>
                Back
              </Button>,
            ]}
          />
        )}
      </Card>

      <Card className="bg-blue-50 border-blue-100 rounded-xl">
        <Space direction="vertical">
          <Text strong><CheckCircleOutlined className="text-green-500 mr-2" /> Admin/Staff Verification</Text>
          <Text type="secondary" size="small">
            This tool allows you to verify approved bookings and record arrival times for campus facilities. 
            Ensure the user's QR code matches the booking record before granting access.
          </Text>
        </Space>
      </Card>
    </div>
  );
};

export default QRCheckInPage;
