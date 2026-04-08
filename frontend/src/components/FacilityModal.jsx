import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, Switch, InputNumber, message } from 'antd';
import facilityService from '../services/facilityService';

const { TextArea } = Input;
const { Option } = Select;

const FacilityModal = ({ visible, facility, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  
  useEffect(() => {
    if (visible) {
      if (facility) {
        form.setFieldsValue({
          ...facility,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ available: true, capacity: 1 });
      }
    }
  }, [visible, facility, form]);

  const handleFinish = async (values) => {
    try {
      if (facility) {
        await facilityService.updateFacility(facility.id, values);
        message.success('Facility updated successfully');
      } else {
        await facilityService.createFacility(values);
        message.success('Facility created successfully');
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving facility:', error);
      message.error(facility ? 'Failed to update facility' : 'Failed to create facility');
    }
  };

  return (
    <Modal
      title={facility ? 'Edit Facility' : 'Add New Facility'}
      open={visible}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText={facility ? 'Update' : 'Create'}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
      >
        <Form.Item
          name="name"
          label="Name"
          rules={[{ required: true, message: 'Please enter facility name' }]}
        >
          <Input placeholder="E.g., Computer Lab 1" />
        </Form.Item>

        <Form.Item
          name="type"
          label="Type"
          rules={[{ required: true, message: 'Please select a facility type' }]}
        >
          <Select placeholder="Select type">
            <Option value="LAB">Laboratory</Option>
            <Option value="LECTURE_HALL">Lecture Hall</Option>
            <Option value="MEETING_ROOM">Meeting Room</Option>
            <Option value="CLASSROOM">Classroom</Option>
            <Option value="EQUIPMENT">Equipment</Option>
            <Option value="PC_ROOM">PC Room</Option>
            <Option value="SPORTS_GROUND">Sports Ground</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="capacity"
          label="Capacity"
          rules={[{ required: true, message: 'Please enter capacity' }]}
        >
          <InputNumber min={1} max={1000} className="w-full" placeholder="Number of people/items" style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="location"
          label="Location"
          rules={[{ required: true, message: 'Please enter location' }]}
        >
          <Input placeholder="E.g., Block B, Floor 2" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
        >
          <TextArea rows={3} placeholder="Additional details..." />
        </Form.Item>

        <Form.Item
          name="tags"
          label="Amenities (Tags)"
        >
          <Select mode="tags" placeholder="Add amenities: e.g. AC, Projector, WiFi" style={{ width: '100%' }}>
            <Option value="Projector">Projector</Option>
            <Option value="AC">AC</Option>
            <Option value="Whiteboard">Whiteboard</Option>
            <Option value="WiFi">WiFi</Option>
            <Option value="Video-Conf">Video-Conf</Option>
            <Option value="Smart-Board">Smart-Board</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="availabilityWindows"
          label="Availability Windows (Optional)"
        >
          <Input placeholder="E.g., 08:00 - 18:00 Mon-Fri" />
        </Form.Item>

        <Form.Item
          name="available"
          label="Status"
          valuePropName="checked"
          help="Toggle off to mark out of service."
        >
          <Switch checkedChildren="Active" unCheckedChildren="Out of Service" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default FacilityModal;
