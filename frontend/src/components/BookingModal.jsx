import { useState, useEffect } from 'react';
import { Modal, Form, DatePicker, Input, InputNumber, Button, Alert } from 'antd';
import { CheckCircleOutlined, CalendarOutlined, EditOutlined } from '@ant-design/icons';
import bookingService from '../services/bookingService'; 
import dayjs from 'dayjs'; 

const { RangePicker } = DatePicker;

const BookingModal = ({ visible, facility, onCancel, onSuccess, editingBooking = null }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState(null);
  const isEdit = !!editingBooking;

  useEffect(() => {
    if (visible && editingBooking) {
      form.setFieldsValue({
        range: [dayjs(editingBooking.startTime), dayjs(editingBooking.endTime)],
        purpose: editingBooking.purpose,
        numberOfPeople: editingBooking.numberOfPeople || 1
      });
    } else if (visible) {
      form.resetFields();
    }
  }, [visible, editingBooking, form]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      setAlertInfo(null);

      const [start, end] = values.range;

      const payload = {
        facilityId: facility.id,
        startTime: start.format('YYYY-MM-DDTHH:mm:ss'),
        endTime: end.format('YYYY-MM-DDTHH:mm:ss'),
        purpose: values.purpose,
        numberOfPeople: values.numberOfPeople || 1
      };

      if (isEdit) {
        await bookingService.updateBooking(editingBooking.id, payload);
        setAlertInfo({
          type: 'success',
          message: 'Booking Updated!',
          description: 'Your booking has been successfully updated.',
        });
      } else {
        await bookingService.createBooking(payload);
        setAlertInfo({
          type: 'success',
          message: 'Booking Submitted!',
          description: 'Your booking request has been received and is pending approval.',
        });
      }

      form.resetFields();

      // Close modal after a short delay so user sees the success message
      setTimeout(() => {
        setAlertInfo(null);
        onSuccess();
      }, 1800);

    } catch (error) {
      console.error('Error creating booking:', error);
      const errorMsg =
        error.response?.data?.message ||
        'Failed to submit booking request. The time slot might already be taken.';
      
      const isWaitlist = errorMsg.toLowerCase().includes('waitlist');
      
      setAlertInfo({
        type: isWaitlist ? 'warning' : 'error',
        message: isWaitlist ? 'Added to Waitlist' : 'Booking Failed',
        description: isWaitlist 
          ? errorMsg 
          : errorMsg,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setAlertInfo(null);
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <CalendarOutlined className="text-indigo-500" />
          <span>{isEdit ? `Edit Booking` : `Book ${facility?.name}`}</span>
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      destroyOnClose
    >
      {/* Inline Alert — shown instead of floating toast */}
      {alertInfo && (
        <Alert
          type={alertInfo.type}
          message={alertInfo.message}
          description={alertInfo.description}
          showIcon
          closable
          onClose={() => setAlertInfo(null)}
          className="mb-4 rounded-lg"
          icon={alertInfo.type === 'success' ? <CheckCircleOutlined /> : undefined}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ numberOfPeople: 1 }}
      >
        <Form.Item
          name="range"
          label="Date & Time Range"
          rules={[{ required: true, message: 'Please select date and time range' }]}
        >
          <RangePicker 
            showTime={{
              format: 'hh:mm A',
              use12Hours: true,
            }}
            format="YYYY-MM-DD hh:mm A" 
            className="w-full"
            disabledDate={(current) => current && current < dayjs().startOf('day')}
          />
        </Form.Item>

        <Form.Item
          name="purpose"
          label="Purpose"
          rules={[{ required: true, message: 'Please provide a purpose' }]}
        >
          <Input.TextArea rows={3} placeholder="Provide a brief purpose for the booking..." />
        </Form.Item>

        <Form.Item
          name="numberOfPeople"
          label="Expected Attendees"
        >
          <InputNumber min={1} className="w-full" />
        </Form.Item>

        <Form.Item className="mb-0 flex justify-end gap-2">
          <Button onClick={handleCancel}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={loading} disabled={alertInfo?.type === 'success'}>
            {isEdit ? 'Update Booking' : 'Submit Request'}
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default BookingModal;
