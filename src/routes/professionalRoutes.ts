import { Router } from 'express';
import { ProfessionalController } from '../controllers/ProfessionalController';

const router = Router();

router.get('/', ProfessionalController.getAllProfessionals);
router.get('/:id', ProfessionalController.getProfessionalById);
router.post('/', ProfessionalController.createProfessional);
router.put('/:id', ProfessionalController.updateProfessional);
router.delete('/:id', ProfessionalController.deleteProfessional);

// vacaciones / licencias
router.post('/:id/timeoff', ProfessionalController.addTimeOff);
// añadir servicio
router.post('/:id/add-service', ProfessionalController.addService);


export default router;
