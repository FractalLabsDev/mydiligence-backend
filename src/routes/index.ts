import { Router } from 'express';

// Routes
import authRoute from './auth.route';

const router = Router();

router.use("/auth", authRoute);

export default router;
