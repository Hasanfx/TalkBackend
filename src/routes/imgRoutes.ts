import express from 'express';
import { getImg } from '../controllers/ImageController'; // adjust the path as needed

const router = express.Router();

// Route: GET /api/image/profile/29
router.get('/:type/:id', getImg);

export default router;
