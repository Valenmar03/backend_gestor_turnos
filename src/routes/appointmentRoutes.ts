import { Router } from 'express';
import { AppointmentController } from '../controllers/AppointmentController';

const router = Router();

router.get('/', AppointmentController.getAllAppointments);
router.get('/:id', AppointmentController.getAppointmentById);
router.post('/', AppointmentController.createAppointment);
router.put('/:id', AppointmentController.updateAppointment);
router.delete('/:id', AppointmentController.deleteAppointment);
router.patch('/:id/cancel', AppointmentController.cancelAppointment);

export default router;
