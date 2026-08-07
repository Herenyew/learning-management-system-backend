// lms-backend/src/modules/internal/index.ts
import { Router } from 'express';
import { validateUserFromEMS } from './validate.controller.js';

const router = Router();

// Internal endpoint for EMS to validate/sync users
// This is NOT exposed to the public – only called by EMS with an API key
router.post('/users/validate', validateUserFromEMS);

export default router;