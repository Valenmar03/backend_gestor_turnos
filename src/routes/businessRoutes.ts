import { Router } from 'express'
import { BusinessController } from '../controllers/BusinessController'

const router = Router()

router.get('/', BusinessController.getAllBusiness);
router.get('/:id', BusinessController.getBusinessById);
router.post('/', BusinessController.createBusiness);
router.put('/:id', BusinessController.updateBusiness);
router.delete('/:id', BusinessController.deleteBusiness);

export default router