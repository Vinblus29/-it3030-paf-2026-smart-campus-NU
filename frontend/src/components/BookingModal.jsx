import { useState } from 'react';
import { Modal, Form, DatePicker, Input, InputNumber, message, Button } from 'antd';
import bookingService from '../services/bookingService'; 
import dayjs from 'dayjs'; 

const { RangePicker } = DatePicker;

const BookingModal = ({ visible, facility, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      const [start, end] = values.range;
      
      const payload = {
        facilityId: facility.id,
        startTime: start.format('YYYY-MM-DDTHH:mm:ss'),
        endTime: end.format('YYYY-MM-DDTHH:mm:ss'),
        purpose: values.purpose,
        numberOfPeople: values.numberOfPeople || 1
      };

      await bookingService.createBooking(payload);
      message.success('Booking request submitted successfully');
      form.resetFields();
      onSuccess();
    } catch (error) {
      console.error('Error creating booking:', error);
      const errorMsg = error.response?.data?.message || 'Failed to submit booking request. The time slot might be already taken.';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={`Book ${facility?.name}`}
      open={visible}
      onCancel={onCancel}
      footer={null}
      destroyOnClose
    >
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
            showTime 
            format="YYYY-MM-DD HH:mm" 
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
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            Submit Request
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default BookingModal;
