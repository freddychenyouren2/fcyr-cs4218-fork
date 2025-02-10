//Backend test. Create a unit test to test if an nvalid email that does not contain an @ symbol will return an error message
// look at authCOntroller.js. create authController.test.js and mock all dependency, mock userModel.js, use beforeEach() and create request body and result (status: and send:).
// It should not save into the database.
// 'use mockedREsolvedValue(null)'. userModel.prototype.save something something
import { registerController } from './authController';
import userModel from '../models/userModel';

// registerController takes in req and res and is an async function
// Must provide req.body with name, email, password, phone, address, and answer before testing
// Must provide res with mocked status and send function

// Must mock userModel.js
jest.mock('./../models/userModel');
// We want to test if an invalid email that does not contain an @ symbol will return an error message

describe('Register Controller', () => {
    let req, res;
    beforeEach(() => {
        jest.clearAllMocks();
        //define the req and res
        req = {
            body: {
                name: 'John Doe',
                email: 'invalidEmailExample.com',
                phone: '1234567890',
                address: '1234 Example St 53',
                password: 'hashedpassword123',
                answer: 'example',
            }
        }
        res = {
            status: jest.fn().mockReturnThis(),
            send: jest.fn()
        }
    });

    it('should not register a new user if email is invalid', async () => {
        // UserModel.findOne should return null
        userModel.findOne.mockResolvedValueOnce(null);
        userModel.prototype.save = jest.fn();

        // Call the registerController function with the req and res
        await registerController(req, res);

        // Expect that save is not called
        expect(userModel.prototype.save).not.toHaveBeenCalled();

    });
});