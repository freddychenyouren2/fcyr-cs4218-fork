import request from 'supertest';
import { orderStatusController } from './authController';
import orderModel from '../models/orderModel';

jest.mock('../models/orderModel');

describe('orderStatusController', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      params: { orderId: '12345' },
      body: { status: 'shipped' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };
    next = jest.fn();
  });

  it('should update order status and return 200', async () => {
    const updatedOrder = { _id: '12345', status: 'shipped' };
    orderModel.findByIdAndUpdate.mockResolvedValue(updatedOrder);

    await orderStatusController(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Order status updated successfully',
      order: updatedOrder,
    });
  });

  it('should return 404 if order is not found', async () => {
    orderModel.findByIdAndUpdate.mockResolvedValue(null);

    await orderStatusController(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: 'Order not found',
    });
  });

  it('should return 500 if an error occurs', async () => {
    orderModel.findByIdAndUpdate.mockRejectedValue(new Error('Database error'));

    await orderStatusController(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      success: false,
      message: 'Error while updating order status',
      error: expect.any(Object),
    });
  });
});
